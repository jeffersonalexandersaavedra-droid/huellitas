"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ResetPasswordButton from "@/components/ResetPasswordButton";

const FORM_VACIO = {
  nombres: "",
  apellidos: "",
  dni: "",
  email: "",
  telefono: "",
  password: "",
};

export default function DocentesManager({
  docentes,
  aulas,
  asignaciones,
  cursos = [],
  anioActivoId,
}) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState(FORM_VACIO);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const [credenciales, setCredenciales] = useState(null);
  const [expandido, setExpandido] = useState(null);

  function actualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function crearDocente(event) {
    event.preventDefault();
    setError("");
    setCredenciales(null);
    setCreando(true);

    try {
      const res = await fetch("/api/admin/registrar-docente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docente: form }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo registrar al docente.");
      } else {
        setCredenciales({ dni: data.dni, email: data.email, password: data.password });
        setForm(FORM_VACIO);
        setExpandido(data.docente_id);
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* FORM: nuevo docente */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
          <UserPlus className="h-5 w-5" strokeWidth={2} />
          Registrar nuevo docente
        </h2>

        <form onSubmit={crearDocente} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo label="Nombres" required>
            <input type="text" required value={form.nombres}
              onChange={(e) => actualizar("nombres", e.target.value)} className={inputClass} />
          </Campo>
          <Campo label="Apellidos" required>
            <input type="text" required value={form.apellidos}
              onChange={(e) => actualizar("apellidos", e.target.value)} className={inputClass} />
          </Campo>
          <Campo label="DNI" required>
            <input type="text" inputMode="numeric" maxLength={8} required value={form.dni}
              onChange={(e) => actualizar("dni", e.target.value.replace(/\D/g, ""))}
              className={inputClass} placeholder="8 dígitos" />
          </Campo>
          <Campo label="Teléfono">
            <input type="text" value={form.telefono}
              onChange={(e) => actualizar("telefono", e.target.value)} className={inputClass} />
          </Campo>
          <Campo label="Correo (opcional)">
            <input type="email" value={form.email}
              onChange={(e) => actualizar("email", e.target.value)} className={inputClass}
              placeholder="Si lo dejas vacío se genera uno interno" />
          </Campo>
          <Campo label="Contraseña temporal" required>
            <input type="text" required minLength={6} value={form.password}
              onChange={(e) => actualizar("password", e.target.value)} className={inputClass}
              placeholder="Mínimo 6 caracteres" />
          </Campo>

          <div className="sm:col-span-2">
            {error && (
              <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}
            {credenciales && (
              <div className="mb-3 rounded-lg border border-huellitas-accent/40 bg-huellitas-accent/10 p-3 text-sm text-huellitas-ink">
                <p className="flex items-center gap-2 font-medium text-huellitas-primary">
                  <KeyRound className="h-4 w-4" strokeWidth={2} />
                  Docente creado. Entrega estos datos de acceso:
                </p>
                <p className="mt-1">DNI: <b>{credenciales.dni}</b></p>
                <p>Correo: <b>{credenciales.email}</b></p>
                <p>Contraseña: <b>{credenciales.password}</b></p>
                <p className="mt-1 text-xs text-huellitas-ink/60">Puede ingresar con su DNI o su correo.</p>
              </div>
            )}
            <button type="submit" disabled={creando}
              className="rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
              {creando ? "Registrando..." : "Registrar docente"}
            </button>
          </div>
        </form>
      </div>

      {/* LISTA de docentes */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Docentes registrados
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Haz clic en un docente para asignarle aulas y cursos, o restablecer su
          contraseña.
        </p>

        {docentes.length === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-stone-400">
            Aún no hay docentes registrados.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {docentes.map((d) => (
              <DocenteRow
                key={d.id}
                docente={d}
                aulas={aulas}
                cursos={cursos}
                asignaciones={asignaciones.filter((a) => a.docente_id === d.id)}
                anioActivoId={anioActivoId}
                expandido={expandido === d.id}
                onToggle={() => setExpandido(expandido === d.id ? null : d.id)}
                supabase={supabase}
                onCambio={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocenteRow({
  docente,
  aulas,
  cursos,
  asignaciones,
  anioActivoId,
  expandido,
  onToggle,
  supabase,
  onCambio,
}) {
  const [aulaId, setAulaId] = useState("");
  const [cursosSel, setCursosSel] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [errorAsig, setErrorAsig] = useState("");

  const aulaSel = aulas.find((a) => a.id === aulaId);
  const cursosAsignadosAula = asignaciones
    .filter((a) => a.aula_id === aulaId)
    .map((a) => a.curso);
  // Cursos activos del catálogo para el nivel del aula, quitando los ya puestos
  const cursosDisponibles = aulaSel
    ? (cursos || [])
        .filter((c) => c.nivel === aulaSel.nivel && c.activo)
        .map((c) => c.nombre)
        .filter((c) => !cursosAsignadosAula.includes(c))
    : [];

  function cambiarAula(id) {
    setAulaId(id);
    setCursosSel([]);
    setErrorAsig("");
  }

  function toggleCurso(c) {
    setCursosSel((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function toggleTodos() {
    setCursosSel((prev) =>
      prev.length === cursosDisponibles.length ? [] : [...cursosDisponibles]
    );
  }

  async function agregarAsignaciones() {
    if (!aulaId || !cursosSel.length || !anioActivoId) return;
    setErrorAsig("");
    setGuardando(true);
    const rows = cursosSel.map((curso) => ({
      docente_id: docente.id,
      aula_id: aulaId,
      curso,
      anio_escolar_id: anioActivoId,
    }));
    const { error } = await supabase.from("docente_asignaciones").insert(rows);
    setGuardando(false);
    if (error) {
      setErrorAsig(error.message);
    } else {
      setAulaId("");
      setCursosSel([]);
      onCambio();
    }
  }

  async function quitarAsignacion(id) {
    const { error } = await supabase
      .from("docente_asignaciones")
      .delete()
      .eq("id", id);
    if (!error) onCambio();
  }

  return (
    <div className="rounded-lg border border-stone-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-huellitas-ink">
            {docente.apellidos} {docente.nombres}
          </p>
          <p className="truncate text-xs text-stone-500">
            DNI {docente.dni} · {asignaciones.length} curso(s) asignado(s)
          </p>
        </div>
        {expandido ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-stone-400" strokeWidth={2} />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-stone-400" strokeWidth={2} />
        )}
      </button>

      {expandido && (
        <div className="border-t border-stone-100 px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-huellitas-primary">
              Aulas y cursos asignados
            </p>
            <ResetPasswordButton tipo="docente" id={docente.id} />
          </div>

          {/* Asignaciones actuales */}
          {asignaciones.length === 0 ? (
            <p className="text-sm text-stone-400">Sin cursos asignados todavía.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {asignaciones.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-full bg-huellitas-primary-light px-3 py-1 text-xs text-huellitas-primary"
                >
                  <span>
                    <b>{a.curso}</b> · {a.aulas?.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarAsignacion(a.id)}
                    aria-label="Quitar"
                    className="text-huellitas-primary/60 transition-colors hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Agregar: aula + selección múltiple de cursos */}
          <div className="mt-4 rounded-lg bg-huellitas-cream p-4">
            <p className="text-sm font-medium text-huellitas-ink">
              Agregar cursos
            </p>

            <select
              value={aulaId}
              onChange={(e) => cambiarAula(e.target.value)}
              className={`mt-2 ${inputClass}`}
            >
              <option value="">Selecciona un aula...</option>
              {aulas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>

            {aulaId && (
              <>
                {cursosDisponibles.length === 0 ? (
                  <p className="mt-3 text-sm text-stone-400">
                    Ya están asignados todos los cursos de esta aula.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                        Marca los cursos que dicta
                      </p>
                      <button
                        type="button"
                        onClick={toggleTodos}
                        className="text-xs font-medium text-huellitas-primary hover:underline"
                      >
                        {cursosSel.length === cursosDisponibles.length
                          ? "Quitar todos"
                          : "Seleccionar todos"}
                      </button>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {cursosDisponibles.map((c) => (
                        <label
                          key={c}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            cursosSel.includes(c)
                              ? "border-huellitas-primary bg-huellitas-primary-light text-huellitas-primary"
                              : "border-stone-200 bg-white text-stone-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={cursosSel.includes(c)}
                            onChange={() => toggleCurso(c)}
                            className="accent-huellitas-primary"
                          />
                          {c}
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={agregarAsignaciones}
                      disabled={!cursosSel.length || guardando}
                      className="mt-3 flex items-center gap-1 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      {guardando
                        ? "Guardando..."
                        : `Agregar ${cursosSel.length || ""} curso(s)`}
                    </button>
                  </>
                )}
              </>
            )}

            {errorAsig && <p className="mt-2 text-sm text-rose-600">{errorAsig}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";
