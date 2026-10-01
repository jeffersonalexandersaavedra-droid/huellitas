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

export default function AulasManager({ anios, anioSel, aulas }) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [nueva, setNueva] = useState({ nivel: "primaria", grado: GRADOS.primaria[0], seccion: "A" });
  const [nuevoAnio, setNuevoAnio] = useState("");

  // Ejecuta una acción sobre la base y refresca la página; muestra el error si falla.
  async function ejecutar(accion) {
    setError("");
    setOcupado(true);
    try {
      await accion();
      router.refresh();
    } catch (e) {
      setError(
        e.code === "23505"
          ? "Esa sección ya existe en este grado."
          : e.message || "No se pudo completar la acción."
      );
    } finally {
      setOcupado(false);
    }
  }

  const sinError = ({ error: err }) => {
    if (err) throw err;
  };

  // El nombre visible (ej. "3° Primaria A") lo arma la base con grado + sección.
  const insertarAula = async (grado, seccion, nivel) =>
    sinError(
      await supabase
        .from("aulas")
        .insert({ grado, seccion: seccion || null, nivel, anio_escolar_id: anioSel.id })
    );

  function crearAula(event) {
    event.preventDefault();
    if (!anioSel) return;
    const delGrado = aulas.filter((a) => a.grado === nueva.grado);
    if (!nueva.seccion && delGrado.length) {
      setError(`${nueva.grado} ya tiene secciones. Usa "Agregar sección" en ese grado.`);
      return;
    }
    if (nueva.seccion && delGrado.some((a) => !a.seccion)) {
      setError(`${nueva.grado} está como sección única. Usa "Agregar sección" en ese grado para dividirlo.`);
      return;
    }
    ejecutar(() => insertarAula(nueva.grado, nueva.seccion, nueva.nivel));
  }

  function cambiarNivel(nivel) {
    setNueva((n) => ({ ...n, nivel, grado: GRADOS[nivel][0] }));
  }

  // Agrega la siguiente sección a un grado. Si el grado era de sección
  // única, esa aula pasa a ser la "A" y la nueva la "B".
  function agregarSeccion(grupo) {
    const unica = grupo.aulas.find((a) => !a.seccion);
    const usadas = grupo.aulas.map((a) => a.seccion).filter(Boolean);
    if (unica) usadas.push("A");
    const letra = siguienteSeccion(usadas);
    if (!letra) {
      setError("Este grado ya tiene el máximo de secciones.");
      return;
    }
    if (unica && !confirm(`${grupo.grado} pasará a ser ${grupo.grado} A y se creará ${grupo.grado} ${letra}. ¿Continuar?`)) {
      return;
    }
    ejecutar(async () => {
      if (unica) sinError(await supabase.from("aulas").update({ seccion: "A" }).eq("id", unica.id));
      await insertarAula(grupo.grado, letra, grupo.nivel);
    });
  }

  // Abre un año escolar nuevo copiando los descuentos del año activo.
  function crearAnio(event) {
    event.preventDefault();
    const anio = Number(nuevoAnio);
    if (!anio || anios.some((a) => a.anio === anio)) {
      setError("Escribe un año válido que aún no exista.");
      return;
    }
    ejecutar(async () => {
      const { data: creado, error: err } = await supabase
        .from("anios_escolares")
        .insert({ anio, activo: false })
        .select("id")
        .single();
      if (err) throw err;

      const activo = anios.find((a) => a.activo);
      if (activo) {
        const { data: descuentos } = await supabase
          .from("descuentos")
          .select("tipo, monto, activo")
          .eq("anio_escolar_id", activo.id);
        if (descuentos?.length) {
          sinError(
            await supabase
              .from("descuentos")
              .insert(descuentos.map((d) => ({ ...d, anio_escolar_id: creado.id })))
          );
        }
      }
      setNuevoAnio("");
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
  const anioAnterior = anios
    .filter((a) => anioSel && a.anio < anioSel.anio)
    .sort((a, b) => b.anio - a.anio)[0];

  function copiarAulas() {
    ejecutar(async () => {
      const { data: previas, error: err } = await supabase
        .from("aulas")
        .select("grado, seccion, nivel")
        .eq("anio_escolar_id", anioAnterior.id);
      if (err) throw err;
      if (!previas?.length) throw new Error(`El año ${anioAnterior.anio} no tiene aulas.`);
      sinError(
        await supabase
          .from("aulas")
          .insert(previas.map((a) => ({ ...a, anio_escolar_id: anioSel.id })))
      );
    });
  }

  // Grupos por nivel → grado → secciones.
  const grupos = Object.values(
    aulas.reduce((acc, aula) => {
      acc[aula.grado] ??= { grado: aula.grado, nivel: aula.nivel, aulas: [] };
      acc[aula.grado].aulas.push(aula);
      return acc;
    }, {})
  )
    .map((g) => ({
      ...g,
      aulas: g.aulas.sort((a, b) => (a.seccion ?? "").localeCompare(b.seccion ?? "")),
    }))
    .sort((a, b) => ordenGrado(a.grado) - ordenGrado(b.grado) || a.grado.localeCompare(b.grado));

  return (
    <div className="space-y-6">
      {/* AÑO ESCOLAR */}
      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <Campo label="Año escolar">
            <select
              value={anioSel?.id ?? ""}
              onChange={(e) => router.push(`/admin/aulas?anio=${e.target.value}`)}
              className={inputClass}
            >
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
              onClick={activarAnio}
              disabled={ocupado}
              className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-3 py-2 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              Marcar como año activo
            </button>
          )}
        </div>

        <form onSubmit={crearAnio} className="flex items-end gap-2">
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

      {/* NUEVO GRADO / SECCIÓN */}
      {anioSel && (
        <form onSubmit={crearAula} className="rounded-xl bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-semibold text-huellitas-primary">
            Agregar grado o sección {anioSel.anio}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Cada sección es un aula: 3° Primaria A, 3° Primaria B, 3° Primaria C… Elige “Sección
            única” si el grado no se divide.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <Campo label="Nivel">
              <select value={nueva.nivel} onChange={(e) => cambiarNivel(e.target.value)} className={inputClass}>
                {Object.entries(NIVELES).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Grado">
              <select
                value={nueva.grado}
                onChange={(e) => setNueva((n) => ({ ...n, grado: e.target.value }))}
                className={inputClass}
              >
                {GRADOS[nueva.nivel].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Sección">
              <select
                value={nueva.seccion}
                onChange={(e) => setNueva((n) => ({ ...n, seccion: e.target.value }))}
                className={inputClass}
              >
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
      )}

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* GRADOS → SECCIONES */}
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
            <section key={grupo.grado} className="rounded-xl bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-huellitas-ink">{grupo.grado}</h2>
                  <p className="text-xs text-stone-500">
                    {NIVELES[grupo.nivel]} ·{" "}
                    {grupo.aulas.some((a) => a.seccion)
                      ? cantidad(grupo.aulas.length, "sección", "secciones")
                      : "Sección única"}{" "}
                    · {cantidad(grupo.aulas.reduce((s, a) => s + a.estudiantes.length, 0), "estudiante")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => agregarSeccion(grupo)}
                  disabled={ocupado}
                  className="flex items-center gap-1 rounded-lg border border-dashed border-huellitas-primary px-3 py-1.5 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Agregar sección
                </button>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {grupo.aulas.map((aula) => (
                  <AulaCaja
                    key={aula.id}
                    aula={aula}
                    letrasUsadas={grupo.aulas.map((a) => a.seccion).filter(Boolean)}
                    unicaEnGrado={grupo.aulas.length === 1}
                    supabase={supabase}
                    ocupado={ocupado}
                    ejecutar={ejecutar}
                    sinError={sinError}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function AulaCaja({ aula, letrasUsadas, unicaEnGrado, supabase, ocupado, ejecutar, sinError }) {
  const [abierta, setAbierta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [seccion, setSeccion] = useState(aula.seccion ?? SIN_SECCION);

  const opcionesSeccion = SECCIONES.filter((s) => s === aula.seccion || !letrasUsadas.includes(s));

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

  function subirLista(file) {
    if (!file) return;
    ejecutar(async () => {
      const url = await subirDocumento(supabase, "utiles", file);
      sinError(await supabase.from("aulas").update({ lista_utiles_url: url }).eq("id", aula.id));
    });
  }

  function quitarLista() {
    if (!confirm("¿Quitar la lista de útiles de esta aula?")) return;
    ejecutar(async () =>
      sinError(await supabase.from("aulas").update({ lista_utiles_url: null }).eq("id", aula.id))
    );
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        abierta ? "border-huellitas-primary bg-huellitas-primary-light/30" : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-display font-semibold ${
              aula.seccion
                ? "bg-huellitas-primary text-2xl text-white"
                : "bg-huellitas-primary-light text-xs text-huellitas-primary"
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
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-huellitas-primary transition-transform ${abierta ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {abierta && (
        <div className="space-y-4 border-t border-stone-200 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {editando ? (
              <form onSubmit={cambiarSeccion} className="flex flex-wrap items-center gap-2">
                <select value={seccion} onChange={(e) => setSeccion(e.target.value)} className={`${inputClass} w-40`}>
                  {opcionesSeccion.map((s) => (
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
            ) : (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-stone-600 hover:bg-white"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                Cambiar sección
              </button>
            )}
            {aula.totalMatriculas === 0 && !editando && (
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

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Docentes</p>
            {aula.docentes.length === 0 ? (
              <p className="mt-1 text-stone-400">
                Sin docentes.{" "}
                <Link href="/admin/docentes" className="text-huellitas-primary hover:underline">
                  Asignar en Docentes
                </Link>
              </p>
            ) : (
              <ul className="mt-1 space-y-1">
                {aula.docentes.map((d) => (
                  <li key={d.id} className="text-huellitas-ink">
                    {d.nombre}
                    <span className="text-xs text-stone-500"> · {[...d.cursos].sort().join(", ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Estudiantes</p>
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

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Lista de útiles</p>
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
                  <button
                    type="button"
                    onClick={quitarLista}
                    className="rounded-lg px-2 py-1.5 text-xs text-stone-400 hover:text-rose-600"
                  >
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
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="hidden"
                  onChange={(e) => subirLista(e.target.files?.[0])}
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-stone-400">
              PDF, Word o imagen. Los padres de esta sección la descargan desde su portal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
