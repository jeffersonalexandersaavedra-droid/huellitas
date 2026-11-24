"use client";

import { useState } from "react";
import { BellRing, Info, Mail, MessageCircle, Send } from "lucide-react";
import AvisoVacio from "@/components/AvisoVacio";
import { pedir } from "@/lib/peticiones";
import { detalleRecordatorio, mensajeRecordatorio } from "@/lib/recordatorios";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { cantidad, coincide, controlClass } from "@/lib/ui";

const FILTROS = [
  ["atrasados", "Con pensiones atrasadas"],
  ["por-vencer", "Pensión por vencer"],
  ["todos", "Todos"],
];

const esAtrasada = (familia) => familia.situacion.vencidas.length > 0;
const botonClass =
  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50";

function resumenEnvio({ correo, whatsapp, sinContacto }) {
  const partes = [];
  if (correo) partes.push(cantidad(correo, "correo enviado", "correos enviados"));
  if (whatsapp) partes.push(cantidad(whatsapp, "WhatsApp enviado", "WhatsApp enviados"));
  if (sinContacto.length) partes.push(`${cantidad(sinContacto.length, "familia")} sin correo ni celular`);
  return partes.join(" · ") || "No se envió ningún mensaje.";
}

// Aviso de que el envío automático ya está programado y solo falta activarlo.
function ListoParaActivar() {
  return (
    <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
      <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
      <p>
        El botón <b>WhatsApp</b> es gratis: abre WhatsApp con el mensaje ya escrito y solo presionas Enviar. El{" "}
        <b>envío automático</b> por correo y WhatsApp Business (días 5 y 25 de cada mes) ya está programado y se
        activa cuando el colegio configure esos servicios. El administrador lo ve en Configuración › Servicios
        opcionales.
      </p>
    </div>
  );
}

function TarjetaFamilia({ familia, horario, puedeCorreo, enviando, onCorreo }) {
  const atrasada = esAtrasada(familia);
  const whatsapp = enlaceWhatsApp(familia.telefono, mensajeRecordatorio({ ...familia, horario }));
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-huellitas-ink">
          {familia.estudiante} <span className="text-xs font-normal text-stone-500">· {familia.aula}</span>
        </p>
        <p className="text-xs text-stone-500">
          {familia.apoderado
            ? `${familia.apoderado}${familia.parentesco ? ` (${familia.parentesco})` : ""}`
            : "Sin apoderado registrado"}
        </p>
        <p className={`mt-1 text-sm ${atrasada ? "text-rose-700" : "text-amber-700"}`}>
          {atrasada ? "Debe" : "Por pagar:"} {detalleRecordatorio(familia.situacion)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`${botonClass} bg-emerald-600 text-white hover:bg-emerald-700`}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            WhatsApp
          </a>
        ) : (
          <span className="text-xs text-stone-400">Sin celular registrado</span>
        )}
        {puedeCorreo &&
          (familia.email ? (
            <button
              type="button"
              disabled={Boolean(enviando)}
              onClick={onCorreo}
              className={`${botonClass} border border-stone-300 text-stone-700 hover:bg-stone-50`}
            >
              <Mail className="h-4 w-4" strokeWidth={2} />
              {enviando === familia.matriculaId ? "Enviando..." : "Correo"}
            </button>
          ) : (
            <span className="text-xs text-stone-400">Sin correo</span>
          ))}
      </div>
    </li>
  );
}

// Pagos › Recordatorios: familias con pensiones atrasadas o por vencer.
// WhatsApp "clic para chatear" (gratis) siempre; correo y WhatsApp
// automático solo si el colegio los activó (`canales`).
export default function RecordatoriosPago({ familias, horario, canales }) {
  const [filtro, setFiltro] = useState("atrasados");
  const [busqueda, setBusqueda] = useState("");
  const [enviando, setEnviando] = useState(null);
  const [aviso, setAviso] = useState(null);

  const atrasadas = familias.filter(esAtrasada).length;
  const visibles = familias.filter(
    (f) =>
      (filtro === "todos" || (filtro === "atrasados") === esAtrasada(f)) &&
      coincide(busqueda, f.estudiante, f.apoderado, f.aula)
  );

  async function enviar(canal, matriculaIds, clave) {
    if (enviando) return;
    setEnviando(clave);
    setAviso(null);
    const r = await pedir("/api/recordatorios", { metodo: "POST", cuerpo: { canal, matriculaIds } });
    setEnviando(null);
    setAviso(r.error ? { error: true, texto: r.error } : { texto: resumenEnvio(r) });
  }

  if (familias.length === 0) {
    return <AvisoVacio icono={BellRing}>Ninguna familia tiene pensiones atrasadas ni por vencer en los próximos días.</AvisoVacio>;
  }

  const idsVisibles = visibles.map((f) => f.matriculaId);
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        {cantidad(atrasadas, "familia")} con pensiones atrasadas · {cantidad(familias.length - atrasadas, "familia")} con
        pensión por vencer en los próximos días.
      </p>

      {!canales.correo && !canales.whatsapp && <ListoParaActivar />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={filtro === valor}
              onClick={() => setFiltro(valor)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                filtro === valor
                  ? "border-huellitas-primary bg-huellitas-primary text-white"
                  : "border-stone-300 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar estudiante o apoderado"
          aria-label="Buscar estudiante o apoderado"
          className={`${controlClass} sm:w-64`}
        />
      </div>

      {(canales.correo || canales.whatsapp) && idsVisibles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {canales.correo && (
            <button
              type="button"
              disabled={Boolean(enviando)}
              onClick={() => enviar("correo", idsVisibles, "lista-correo")}
              className={`${botonClass} bg-huellitas-primary text-white hover:bg-huellitas-primary-dark`}
            >
              <Send className="h-4 w-4" strokeWidth={2} />
              {enviando === "lista-correo" ? "Enviando..." : `Enviar correo a las ${idsVisibles.length} de la lista`}
            </button>
          )}
          {canales.whatsapp && (
            <button
              type="button"
              disabled={Boolean(enviando)}
              onClick={() => enviar("whatsapp", idsVisibles, "lista-whatsapp")}
              className={`${botonClass} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              <Send className="h-4 w-4" strokeWidth={2} />
              {enviando === "lista-whatsapp" ? "Enviando..." : `WhatsApp automático a las ${idsVisibles.length}`}
            </button>
          )}
        </div>
      )}

      {aviso && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${aviso.error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}
        >
          {aviso.texto}
        </p>
      )}

      {visibles.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-400">No hay familias con este filtro.</p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((f) => (
            <TarjetaFamilia
              key={f.matriculaId}
              familia={f}
              horario={horario}
              puedeCorreo={canales.correo}
              enviando={enviando}
              onCorreo={() => enviar("correo", [f.matriculaId], f.matriculaId)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
