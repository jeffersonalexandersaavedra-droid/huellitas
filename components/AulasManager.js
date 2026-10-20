"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  GraduationCap,
  FileDown,
  Upload,
  Trash2,
  Pencil,
  Copy,
  CalendarPlus,
  CheckCircle2,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subirDocumento } from "@/lib/archivos";
import { NIVELES, GRADOS, SECCIONES, ordenGrado, siguienteSeccion } from "@/lib/grados";
import { inputClass, cantidad } from "@/lib/ui";
import Campo from "@/components/Campo";

const SIN_SECCION = "";

const sinError = ({ error }) => {
  if (error) throw error;
};

// Grupos por grado (ordenados como en el colegio) con sus secciones.
function agruparPorGrado(aulas) {
  const grupos = {};
  for (const aula of aulas) {
    grupos[aula.grado] ??= { grado: aula.grado, nivel: aula.nivel, aulas: [] };
    grupos[aula.grado].aulas.push(aula);
  }
  return Object.values(grupos)
    .map((g) => ({ ...g, aulas: g.aulas.sort((a, b) => (a.seccion ?? "").localeCompare(b.seccion ?? "")) }))
    .sort((a, b) => ordenGrado(a.grado) - ordenGrado(b.grado) || a.grado.localeCompare(b.grado));
}

// Por qué no se puede crear esa aula (o null si se puede).
function errorNuevaAula(nueva, aulas) {
  const delGrado = aulas.filter((a) => a.grado === nueva.grado);
  if (!nueva.seccion && delGrado.length) return `${nueva.grado} ya tiene secciones. Usa "Agregar sección" en ese grado.`;
  if (nueva.seccion && delGrado.some((a) => !a.seccion)) {
    return `${nueva.grado} está como sección única. Usa "Agregar sección" en ese grado para dividirlo.`;
  }
  return null;
}

// Grados, secciones y años escolares. Cada acción escribe en la base y
// refresca la página; si falla, muestra el error arriba de las aulas.
export default function AulasManager({ anios, anioSel, aulas }) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function ejecutar(accion) {
    setError("");
    setOcupado(true);
    try {
      await accion();
      router.refresh();
    } catch (e) {
      setError(e.code === "23505" ? "Esa sección ya existe en este grado." : e.message || "No se pudo completar la acción.");
    } finally {
      setOcupado(false);
    }
  }

  // El nombre visible (ej. "3° Primaria A") lo arma la base con grado + sección.
  const insertarAula = async (grado, seccion, nivel) =>
    sinError(await supabase.from("aulas").insert({ grado, seccion: seccion || null, nivel, anio_escolar_id: anioSel.id }));

  function crearAula(nueva) {
    const problema = errorNuevaAula(nueva, aulas);
    if (problema) return setError(problema);
    ejecutar(() => insertarAula(nueva.grado, nueva.seccion, nueva.nivel));
  }

  // Agrega la siguiente sección a un grado. Si el grado era de sección
  // única, esa aula pasa a ser la "A" y la nueva la "B".
  function agregarSeccion(grupo) {
    const unica = grupo.aulas.find((a) => !a.seccion);
    const usadas = grupo.aulas.map((a) => a.seccion).filter(Boolean);
    if (unica) usadas.push("A");
    const letra = siguienteSeccion(usadas);
    if (!letra) return setError("Este grado ya tiene el máximo de secciones.");
    if (unica && !confirm(`${grupo.grado} pasará a ser ${grupo.grado} A y se creará ${grupo.grado} ${letra}. ¿Continuar?`)) return;
    ejecutar(async () => {
      if (unica) sinError(await supabase.from("aulas").update({ seccion: "A" }).eq("id", unica.id));
      await insertarAula(grupo.grado, letra, grupo.nivel);
    });
  }

  // Abre un año escolar nuevo copiando los descuentos del año activo.
  // Devuelve false si el año no es válido (el campo conserva lo escrito).
  function crearAnio(anio) {
    if (!anio || anios.some((a) => a.anio === anio)) {
      setError("Escribe un año válido que aún no exista.");
      return false;
    }
    ejecutar(async () => {
      const { data: creado, error: err } = await supabase
        .from("anios_escolares")
        .insert({ anio, activo: false })
        .select("id")
        .single();
      if (err) throw err;
      const activo = anios.find((a) => a.activo);
      const { data: descuentos } = activo
        ? await supabase.from("descuentos").select("tipo, monto, activo").eq("anio_escolar_id", activo.id)
        : { data: [] };
      if (descuentos?.length) {
        sinError(await supabase.from("descuentos").insert(descuentos.map((d) => ({ ...d, anio_escolar_id: creado.id }))));
      }
      router.push(`/admin/aulas?anio=${creado.id}`);
    });
  }

  function activarAnio() {
    if (!confirm(`¿Marcar ${anioSel.anio} como año escolar activo? Las matrículas, notas y pagos pasarán a trabajar con este año.`)) return;
    ejecutar(async () => {
      sinError(await supabase.from("anios_escolares").update({ activo: false }).neq("id", anioSel.id));
      sinError(await supabase.from("anios_escolares").update({ activo: true }).eq("id", anioSel.id));
    });
  }

  // Año anterior, para copiar sus grados y secciones al abrir un año nuevo.
  const anioAnterior = anios.filter((a) => anioSel && a.anio < anioSel.anio).sort((a, b) => b.anio - a.anio)[0];

  function copiarAulas() {
    ejecutar(async () => {
      const { data: previas, error: err } = await supabase
        .from("aulas")
        .select("grado, seccion, nivel")
        .eq("anio_escolar_id", anioAnterior.id);
      if (err) throw err;
      if (!previas?.length) throw new Error(`El año ${anioAnterior.anio} no tiene aulas.`);
      sinError(await supabase.from("aulas").insert(previas.map((a) => ({ ...a, anio_escolar_id: anioSel.id }))));
    });
  }

  const grupos = agruparPorGrado(aulas);
  const acciones = { supabase, ocupado, ejecutar };

  return (
    <div className="space-y-6">
      <AnioEscolar anios={anios} anioSel={anioSel} ocupado={ocupado} onActivar={activarAnio} onCrear={crearAnio} />
      {anioSel && <NuevaAula anio={anioSel.anio} ocupado={ocupado} onCrear={crearAula} />}
      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {grupos.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-stone-500">Este año todavía no tiene aulas.</p>
          {anioAnterior && (
            <button
              type="button"
              onClick={copiarAulas}
              disabled={ocupado}
              className="mx-auto mt-3 flex items-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:opacity-50"
            >
              <Copy className="h-4 w-4" strokeWidth={2} />
              Copiar grados y secciones de {anioAnterior.anio}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <GrupoGrado key={grupo.grado} grupo={grupo} onAgregarSeccion={() => agregarSeccion(grupo)} acciones={acciones} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnioEscolar({ anios, anioSel, ocupado, onActivar, onCrear }) {
  const router = useRouter();
  const [nuevoAnio, setNuevoAnio] = useState("");

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-wrap items-end gap-3">
        <Campo label="Año escolar">
          <select value={anioSel?.id ?? ""} onChange={(e) => router.push(`/admin/aulas?anio=${e.target.value}`)} className={inputClass}>
            {anios.map((a) => (
              <option key={a.id} value={a.id}>
                {a.anio} {a.activo ? "(activo)" : ""}
              </option>
            ))}
          </select>
        </Campo>
        {anioSel && !anioSel.activo && (
          <button
            type="button"
            onClick={onActivar}
            disabled={ocupado}
            className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-3 py-2 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            Marcar como año activo
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onCrear(Number(nuevoAnio)) !== false) setNuevoAnio("");
        }}
        className="flex items-end gap-2"
      >
        <Campo label="Abrir nuevo año">
          <input
            type="number"
            min={2020}
            max={2100}
            value={nuevoAnio}
            onChange={(e) => setNuevoAnio(e.target.value)}
            placeholder={String((anios[0]?.anio ?? new Date().getFullYear()) + 1)}
            className={`${inputClass} w-28`}
          />
        </Campo>
        <button
          type="submit"
          disabled={ocupado || !nuevoAnio}
          className="flex items-center gap-2 rounded-lg bg-huellitas-primary px-3 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
        >
          <CalendarPlus className="h-4 w-4" strokeWidth={2} />
          Crear
        </button>
      </form>
    </div>
  );
}

function NuevaAula({ anio, ocupado, onCrear }) {
  const [nueva, setNueva] = useState({ nivel: "primaria", grado: GRADOS.primaria[0], seccion: "A" });
  const cambiar = (campo) => (e) =>
    setNueva((n) => (campo === "nivel" ? { ...n, nivel: e.target.value, grado: GRADOS[e.target.value][0] } : { ...n, [campo]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCrear(nueva);
      }}
      className="rounded-xl bg-white p-5 shadow-sm"
    >
      <p className="font-display text-lg font-semibold text-huellitas-primary">Agregar grado o sección {anio}</p>
      <p className="mt-1 text-sm text-stone-500">
        Cada sección es un aula: 3° Primaria A, 3° Primaria B, 3° Primaria C… Elige “Sección única” si el grado no se
        divide.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Campo label="Nivel">
          <select value={nueva.nivel} onChange={cambiar("nivel")} className={inputClass}>
            {Object.entries(NIVELES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Grado">
          <select value={nueva.grado} onChange={cambiar("grado")} className={inputClass}>
            {GRADOS[nueva.nivel].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Sección">
          <select value={nueva.seccion} onChange={cambiar("seccion")} className={inputClass}>
            {SECCIONES.map((s) => (
              <option key={s} value={s}>
                Sección {s}
              </option>
            ))}
            <option value={SIN_SECCION}>Sección única</option>
          </select>
        </Campo>
        <button
          type="submit"
          disabled={ocupado}
          className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Crear {nueva.grado} {nueva.seccion}
        </button>
      </div>
    </form>
  );
}

function GrupoGrado({ grupo, onAgregarSeccion, acciones }) {
  const letrasUsadas = grupo.aulas.map((a) => a.seccion).filter(Boolean);
  const estudiantes = grupo.aulas.reduce((s, a) => s + a.estudiantes.length, 0);
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-huellitas-ink">{grupo.grado}</h2>
          <p className="text-xs text-stone-500">
            {NIVELES[grupo.nivel]} ·{" "}
            {letrasUsadas.length ? cantidad(grupo.aulas.length, "sección", "secciones") : "Sección única"} ·{" "}
            {cantidad(estudiantes, "estudiante")}
          </p>
        </div>
        <button
          type="button"
          onClick={onAgregarSeccion}
          disabled={acciones.ocupado}
          className="flex items-center gap-1 rounded-lg border border-dashed border-huellitas-primary px-3 py-1.5 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Agregar sección
        </button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {grupo.aulas.map((aula) => (
          <AulaCaja key={aula.id} aula={aula} letrasUsadas={letrasUsadas} unicaEnGrado={grupo.aulas.length === 1} acciones={acciones} />
        ))}
      </div>
    </section>
  );
}

function AulaCaja({ aula, letrasUsadas, unicaEnGrado, acciones }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div
      className={`rounded-xl border transition-colors ${
        abierta ? "border-huellitas-primary bg-huellitas-primary-light/30" : "border-stone-200 bg-white"
      }`}
    >
      <ResumenAula aula={aula} abierta={abierta} onAlternar={() => setAbierta((v) => !v)} />
      {abierta && (
        <div className="space-y-4 border-t border-stone-200 p-4 text-sm">
          <AccionesAula aula={aula} letrasUsadas={letrasUsadas} unicaEnGrado={unicaEnGrado} acciones={acciones} />
          <DocentesAula docentes={aula.docentes} />
          <EstudiantesAula aula={aula} />
          <ListaUtiles aula={aula} acciones={acciones} />
        </div>
      )}
    </div>
  );
}

function ResumenAula({ aula, abierta, onAlternar }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <button type="button" onClick={onAlternar} aria-expanded={abierta} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-display font-semibold ${
            aula.seccion ? "bg-huellitas-primary text-2xl text-white" : "bg-huellitas-primary-light text-xs text-huellitas-primary"
          }`}
        >
          {aula.seccion ?? "Única"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-huellitas-ink">
            {aula.seccion ? `Sección ${aula.seccion}` : "Sección única"}
          </span>
          <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              {cantidad(aula.estudiantes.length, "estudiante")}
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" strokeWidth={2} />
              {cantidad(aula.docentes.length, "docente")}
            </span>
            <span className={aula.listaUtilesUrl ? "text-emerald-600" : "text-stone-400"}>
              {aula.listaUtilesUrl ? "Lista de útiles ✓" : "Sin lista de útiles"}
            </span>
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-huellitas-primary transition-transform ${abierta ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>
    </div>
  );
}

function AccionesAula({ aula, letrasUsadas, unicaEnGrado, acciones: { supabase, ocupado, ejecutar } }) {
  const [editando, setEditando] = useState(false);
  const [seccion, setSeccion] = useState(aula.seccion ?? SIN_SECCION);
  const opciones = SECCIONES.filter((s) => s === aula.seccion || !letrasUsadas.includes(s));

  function cambiarSeccion(event) {
    event.preventDefault();
    ejecutar(async () => {
      sinError(await supabase.from("aulas").update({ seccion: seccion || null }).eq("id", aula.id));
      setEditando(false);
    });
  }

  function eliminar() {
    if (!confirm(`¿Eliminar el aula ${aula.nombre}?`)) return;
    ejecutar(async () => sinError(await supabase.from("aulas").delete().eq("id", aula.id)));
  }

  if (editando) {
    return (
      <form onSubmit={cambiarSeccion} className="flex flex-wrap items-center gap-2">
        <select aria-label="Nueva sección" value={seccion} onChange={(e) => setSeccion(e.target.value)} className={`${inputClass} w-40`}>
          {opciones.map((s) => (
            <option key={s} value={s}>
              Sección {s}
            </option>
          ))}
          {unicaEnGrado && <option value={SIN_SECCION}>Sección única</option>}
        </select>
        <button type="submit" disabled={ocupado} className="rounded-lg bg-huellitas-primary px-3 py-2 text-white disabled:opacity-50">
          Guardar
        </button>
        <button type="button" onClick={() => setEditando(false)} className="px-2 py-2 text-stone-500">
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-stone-600 hover:bg-white"
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
        Cambiar sección
      </button>
      {aula.totalMatriculas === 0 && (
        <button
          type="button"
          onClick={eliminar}
          className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-stone-600 hover:border-rose-300 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Eliminar aula
        </button>
      )}
    </div>
  );
}

const subtitulo = "text-xs font-semibold uppercase tracking-wide text-stone-400";

function DocentesAula({ docentes }) {
  return (
    <div>
      <p className={subtitulo}>Docentes</p>
      {docentes.length === 0 ? (
        <p className="mt-1 text-stone-400">
          Sin docentes.{" "}
          <Link href="/admin/docentes" className="text-huellitas-primary hover:underline">
            Asignar en Docentes
          </Link>
        </p>
      ) : (
        <ul className="mt-1 space-y-1">
          {docentes.map((d) => (
            <li key={d.id} className="text-huellitas-ink">
              {d.nombre}
              <span className="text-xs text-stone-500"> · {[...d.cursos].sort().join(", ")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EstudiantesAula({ aula }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className={subtitulo}>Estudiantes</p>
        <Link
          href={`/admin/estudiantes/nuevo?aula=${aula.id}`}
          className="flex items-center gap-1 text-xs font-medium text-huellitas-primary hover:underline"
        >
          <UserPlus className="h-3.5 w-3.5" strokeWidth={2} />
          Matricular en {aula.nombre}
        </Link>
      </div>
      {aula.estudiantes.length === 0 ? (
        <p className="mt-1 text-stone-400">Sin estudiantes matriculados.</p>
      ) : (
        <ol className="mt-1 max-h-56 list-decimal space-y-0.5 overflow-y-auto pl-5">
          {aula.estudiantes.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/estudiantes/${e.id}`} className="text-huellitas-ink hover:text-huellitas-primary hover:underline">
                {e.nombre}
              </Link>
              <span className="text-xs text-stone-400"> · {e.dni}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ListaUtiles({ aula, acciones: { supabase, ocupado, ejecutar } }) {
  const guardarUrl = async (url) =>
    sinError(await supabase.from("aulas").update({ lista_utiles_url: url }).eq("id", aula.id));

  function subir(file) {
    if (file) ejecutar(async () => guardarUrl(await subirDocumento(supabase, "utiles", file)));
  }

  function quitar() {
    if (confirm("¿Quitar la lista de útiles de esta aula?")) ejecutar(() => guardarUrl(null));
  }

  return (
    <div>
      <p className={subtitulo}>Lista de útiles</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {aula.listaUtilesUrl && (
          <>
            <a
              href={aula.listaUtilesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-stone-600 hover:bg-white"
            >
              <FileDown className="h-4 w-4" strokeWidth={2} />
              Ver lista
            </a>
            <button type="button" onClick={quitar} className="rounded-lg px-2 py-1.5 text-xs text-stone-400 hover:text-rose-600">
              Quitar
            </button>
          </>
        )}
        <label
          className={`flex cursor-pointer items-center gap-1 rounded-lg bg-huellitas-primary px-3 py-1.5 font-medium text-white hover:bg-huellitas-primary-dark ${
            ocupado ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Upload className="h-4 w-4" strokeWidth={2} />
          {aula.listaUtilesUrl ? "Reemplazar" : "Subir lista"}
          <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />
        </label>
      </div>
      <p className="mt-1 text-xs text-stone-400">PDF, Word o imagen. Los padres de esta sección la descargan desde su portal.</p>
    </div>
  );
}
