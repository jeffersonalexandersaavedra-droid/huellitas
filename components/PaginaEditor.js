"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputClass } from "@/lib/ui";
import CampoBase from "@/components/Campo";

function Campo({ label, value, onChange, area = false }) {
  const Control = area ? "textarea" : "input";
  return (
    <CampoBase label={label}>
      <Control
        {...(area ? { rows: 3 } : { type: "text" })}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </CampoBase>
  );
}

// Tarjetas fijas de la página (siempre las mismas y en el mismo orden): la
// posición es su identidad. Una clave sacada del texto haría que el campo
// pierda el foco con cada letra que se escribe.
function Posiciones({ items, children }) {
  return items.map((item, i) => (
    // react-doctor-disable-next-line no-array-index-as-key
    <Fragment key={i}>{children(item, i)}</Fragment>
  ));
}

function Seccion({ titulo, children }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-huellitas-primary">{titulo}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </div>
  );
}

// Aplica los cambios ({ "hero.titulo": "…", "stats.0.valor": "…" }) sobre
// una copia del contenido guardado.
function conCambios(contenido, cambios) {
  const copia = structuredClone(contenido);
  for (const [ruta, valor] of Object.entries(cambios)) {
    const partes = ruta.split(".");
    const campo = partes.pop();
    partes.reduce((obj, parte) => obj[parte], copia)[campo] = valor;
  }
  return copia;
}

// Solo guarda en estado lo que el usuario cambió: lo demás se lee del
// contenido que llega del servidor, así nunca se muestra una copia vieja.
export default function PaginaEditor({ inicial }) {
  const supabase = createClient();
  const router = useRouter();
  const [cambios, setCambios] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const [, iniciarTransicion] = useTransition();
  const c = conCambios(inicial, cambios);
  const pendientes = Object.keys(cambios).length > 0;

  const upd = (sec, key, value) => setCambios((p) => ({ ...p, [`${sec}.${key}`]: value }));
  const updArr = (sec, idx, key, value) => setCambios((p) => ({ ...p, [`${sec}.${idx}.${key}`]: value }));

  async function guardar() {
    if (guardando || !pendientes) return;
    setGuardando(true);
    setMsg("");
    const { error } = await supabase
      .from("sitio_config")
      .update({ contenido: c, updated_at: new Date().toISOString() })
      .eq("id", "landing");
    setGuardando(false);
    if (error) return setMsg("Error al guardar: " + error.message);
    setMsg("Cambios guardados. Abre la página principal para verlos.");
    // Se limpian los cambios junto con el contenido nuevo del servidor.
    iniciarTransicion(() => {
      setCambios({});
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Seccion titulo="Encabezado (Hero)">
        <Campo label="Título" value={c.hero.titulo} onChange={(v) => upd("hero", "titulo", v)} />
        <Campo label="Palabra destacada (dorado)" value={c.hero.tituloAccent} onChange={(v) => upd("hero", "tituloAccent", v)} />
        <Campo label="Subtítulo" value={c.hero.subtitulo} onChange={(v) => upd("hero", "subtitulo", v)} />
        <Campo label="Texto de años" value={c.hero.aniosTexto} onChange={(v) => upd("hero", "aniosTexto", v)} />
      </Seccion>

      <Seccion titulo="Niveles">
        <Campo label="Inicial — descripción" area value={c.niveles.inicialDesc} onChange={(v) => upd("niveles", "inicialDesc", v)} />
        <Campo label="Inicial — edades" value={c.niveles.inicialEdades} onChange={(v) => upd("niveles", "inicialEdades", v)} />
        <Campo label="Primaria — descripción" area value={c.niveles.primariaDesc} onChange={(v) => upd("niveles", "primariaDesc", v)} />
        <Campo label="Primaria — grados" value={c.niveles.primariaGrados} onChange={(v) => upd("niveles", "primariaGrados", v)} />
      </Seccion>

      <Seccion titulo="Nosotros">
        <Campo label="Párrafo 1" area value={c.nosotros.parrafo1} onChange={(v) => upd("nosotros", "parrafo1", v)} />
        <Campo label="Párrafo 2" area value={c.nosotros.parrafo2} onChange={(v) => upd("nosotros", "parrafo2", v)} />
      </Seccion>

      <Seccion titulo="Cifras destacadas">
        <Posiciones items={c.stats}>
          {(s, i) => (
            <div className="grid grid-cols-2 gap-3">
              <Campo label={`Valor ${i + 1}`} value={s.valor} onChange={(v) => updArr("stats", i, "valor", v)} />
              <Campo label={`Etiqueta ${i + 1}`} value={s.label} onChange={(v) => updArr("stats", i, "label", v)} />
            </div>
          )}
        </Posiciones>
      </Seccion>

      <Seccion titulo="Propuesta educativa (6 tarjetas)">
        <Posiciones items={c.propuesta}>
          {(p, i) => (
            <div className="rounded-lg border border-stone-200 p-3">
              <Campo label={`Título ${i + 1}`} value={p.titulo} onChange={(v) => updArr("propuesta", i, "titulo", v)} />
              <div className="mt-2">
                <Campo label="Descripción" value={p.desc} onChange={(v) => updArr("propuesta", i, "desc", v)} />
              </div>
            </div>
          )}
        </Posiciones>
      </Seccion>

      <Seccion titulo="Contacto">
        <Campo label="Ubicación" value={c.contacto.ubicacion} onChange={(v) => upd("contacto", "ubicacion", v)} />
        <Campo label="Horario" value={c.contacto.horario} onChange={(v) => upd("contacto", "horario", v)} />
        <Campo label="Facebook — texto" value={c.contacto.facebookLabel} onChange={(v) => upd("contacto", "facebookLabel", v)} />
        <Campo label="Facebook — enlace" value={c.contacto.facebookUrl} onChange={(v) => upd("contacto", "facebookUrl", v)} />
      </Seccion>

      <Seccion titulo="Directivos (contacto WhatsApp)">
        <Posiciones items={c.directivos}>
          {(d, i) => (
            <div className="rounded-lg border border-stone-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Nombre" value={d.nombre} onChange={(v) => updArr("directivos", i, "nombre", v)} />
                <Campo label="Cargo" value={d.cargo} onChange={(v) => updArr("directivos", i, "cargo", v)} />
                <Campo label="Teléfono (WhatsApp)" value={d.telefono} onChange={(v) => updArr("directivos", i, "telefono", v)} />
                <Campo label="Email" value={d.email} onChange={(v) => updArr("directivos", i, "email", v)} />
              </div>
            </div>
          )}
        </Posiciones>
      </Seccion>

      {/* Barra de guardar */}
      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <p className={`text-sm ${msg.startsWith("Error") ? "text-rose-600" : pendientes ? "text-amber-700" : "text-emerald-700"}`}>
          {pendientes && !msg.startsWith("Error") ? "Tienes cambios sin guardar." : msg}
        </p>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || !pendientes}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-huellitas-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:opacity-60"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
