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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subirDocumento } from "@/lib/archivos";
import { inputClass } from "@/lib/ui";
import Campo from "@/components/Campo";

const NIVELES = { inicial: "Inicial", primaria: "Primaria" };

export default function AulasManager({ anios, anioSel, aulas }) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [nueva, setNueva] = useState({ nombre: "", nivel: "primaria" });
  const [nuevoAnio, setNuevoAnio] = useState("");

  // Ejecuta una acción sobre la base y refresca la página; muestra el error si falla.
  async function ejecutar(accion) {
    setError("");
    setOcupado(true);
    try {
      await accion();
      router.refresh();
    } catch (e) {
      setError(e.message || "No se pudo completar la acción.");
    } finally {
      setOcupado(false);
    }
  }

  const sinError = ({ error: err }) => {
    if (err) throw err;
  };

  function crearAula(event) {
    event.preventDefault();
    if (!nueva.nombre.trim() || !anioSel) return;
    ejecutar(async () => {
      sinError(
        await supabase
          .from("aulas")
          .insert({ nombre: nueva.nombre.trim(), nivel: nueva.nivel, anio_escolar_id: anioSel.id })
      );
      setNueva((n) => ({ ...n, nombre: "" }));
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

  // Año anterior con aulas, para copiarlas al abrir un año nuevo.
  const anioAnterior = anios
    .filter((a) => anioSel && a.anio < anioSel.anio)
    .sort((a, b) => b.anio - a.anio)[0];

  function copiarAulas() {
    ejecutar(async () => {
      const { data: previas, error: err } = await supabase
        .from("aulas")
        .select("nombre, nivel")
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

      {/* NUEVA AULA */}
      {anioSel && (
        <form
          onSubmit={crearAula}
          className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto_auto] sm:items-end"
        >
          <Campo label={`Nueva aula ${anioSel.anio}`}>
            <input
              type="text"
              value={nueva.nombre}
              onChange={(e) => setNueva((n) => ({ ...n, nombre: e.target.value }))}
              placeholder="Ej. 3° Primaria A"
              className={inputClass}
            />
          </Campo>
          <Campo label="Nivel">
            <select
              value={nueva.nivel}
              onChange={(e) => setNueva((n) => ({ ...n, nivel: e.target.value }))}
              className={inputClass}
            >
              <option value="inicial">Inicial</option>
              <option value="primaria">Primaria</option>
            </select>
          </Campo>
          <button
            type="submit"
            disabled={ocupado || !nueva.nombre.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Crear aula
          </button>
        </form>
      )}

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* CAJAS */}
      {aulas.length === 0 ? (
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
              Copiar las aulas de {anioAnterior.anio}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {aulas.map((aula) => (
            <AulaCaja
              key={aula.id}
              aula={aula}
              supabase={supabase}
              ocupado={ocupado}
              ejecutar={ejecutar}
              sinError={sinError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AulaCaja({ aula, supabase, ocupado, ejecutar, sinError }) {
  const [abierta, setAbierta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(aula.nombre);

  function renombrar(event) {
    event.preventDefault();
    if (!nombre.trim()) return;
    ejecutar(async () => {
      sinError(await supabase.from("aulas").update({ nombre: nombre.trim() }).eq("id", aula.id));
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
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-4">
        {editando ? (
          <form onSubmit={renombrar} className="flex flex-1 gap-2">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
            <button type="submit" className="rounded-lg bg-huellitas-primary px-3 text-sm text-white">
              Guardar
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setAbierta((v) => !v)} className="min-w-0 flex-1 text-left">
            <p className="truncate font-display text-lg font-semibold text-huellitas-primary">
              {aula.nombre}
            </p>
            <p className="mt-1 flex flex-wrap gap-3 text-xs text-stone-500">
              <span className="rounded-full bg-huellitas-primary-light px-2 py-0.5 text-huellitas-primary">
                {NIVELES[aula.nivel]}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" strokeWidth={2} />
                {aula.estudiantes.length} estudiantes
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" strokeWidth={2} />
                {aula.docentes.length} docentes
              </span>
              <span className={aula.listaUtilesUrl ? "text-emerald-600" : "text-stone-400"}>
                {aula.listaUtilesUrl ? "Lista de útiles ✓" : "Sin lista de útiles"}
              </span>
            </p>
          </button>
        )}

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            aria-label="Renombrar aula"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-huellitas-primary"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
          {aula.totalMatriculas === 0 && (
            <button
              type="button"
              onClick={eliminar}
              aria-label="Eliminar aula"
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {abierta && (
        <div className="space-y-4 border-t border-stone-100 p-4 text-sm">
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
                Matricular aquí
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
                    className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-stone-600 hover:bg-stone-50"
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
              PDF, Word o imagen. Los padres la descargan desde su portal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
