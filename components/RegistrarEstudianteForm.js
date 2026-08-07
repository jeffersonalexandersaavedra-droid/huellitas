"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

function generarPassword() {
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `hue-${numero}`;
}

function apoderadoVacio(esPrincipal) {
  return {
    nombres: "",
    apellidos: "",
    dni: "",
    parentesco: "padre",
    telefono: "",
    email: "",
    esPrincipal,
  };
}

function estudianteVacio() {
  return { dni: "", nombres: "", apellidos: "", fechaNacimiento: "", password: "" };
}

export default function RegistrarEstudianteForm({ aulas, docentes }) {
  const router = useRouter();

  const [estudiante, setEstudiante] = useState(estudianteVacio());
  const [aulaId, setAulaId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [apoderados, setApoderados] = useState([apoderadoVacio(true)]);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  function actualizarApoderado(index, campo, valor) {
    setApoderados((prev) =>
      prev.map((a, i) => {
        if (i !== index) {
          return campo === "esPrincipal" && valor ? { ...a, esPrincipal: false } : a;
        }
        return { ...a, [campo]: valor };
      })
    );
  }

  function agregarApoderado() {
    if (apoderados.length >= 2) return;
    setApoderados((prev) => [...prev, apoderadoVacio(false)]);
  }

  function quitarApoderado(index) {
    setApoderados((prev) => {
      const restante = prev.filter((_, i) => i !== index);
      if (restante.length && !restante.some((a) => a.esPrincipal)) {
        restante[0].esPrincipal = true;
      }
      return restante;
    });
  }

  function resetFormulario() {
    setEstudiante(estudianteVacio());
    setAulaId("");
    setDocenteId("");
    setApoderados([apoderadoVacio(true)]);
    setMostrarPassword(false);
    setError("");
    setResultado(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/registrar-estudiante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudiante,
          matricula: { aulaId, docenteId: docenteId || null },
          apoderados,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo registrar al estudiante.");
        setLoading(false);
        return;
      }

      setResultado(data);
      setLoading(false);
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  function handleCopiar() {
    const texto = `Usuario (DNI): ${resultado.dni}\nContraseña: ${resultado.password}`;
    navigator.clipboard?.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (resultado) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" strokeWidth={2} />
        </div>

        <h1 className="mt-5 font-display text-2xl font-semibold text-huellitas-primary">
          Estudiante registrado
        </h1>

        <div className="mt-5 rounded-xl bg-huellitas-cream p-4 text-left">
          <p className="text-sm text-huellitas-ink/60">Usuario (DNI)</p>
          <p className="font-display text-lg font-semibold text-huellitas-ink">
            {resultado.dni}
          </p>
          <p className="mt-3 text-sm text-huellitas-ink/60">Contraseña</p>
          <p className="font-display text-lg font-semibold text-huellitas-ink">
            {resultado.password}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopiar}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-huellitas-accent px-4 py-2 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
        >
          {copiado ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={2} />}
          {copiado ? "Copiado" : "Copiar credenciales"}
        </button>

        <p className="mt-4 text-sm text-huellitas-ink/70">
          Entrega estas credenciales al apoderado principal.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push(`/admin/estudiantes/${resultado.estudiante_id}`)}
            className="rounded-lg bg-huellitas-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
          >
            Ver ficha del estudiante
          </button>
          <button
            type="button"
            onClick={resetFormulario}
            className="rounded-lg border border-huellitas-primary px-4 py-2.5 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
          >
            Registrar otro estudiante
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/estudiantes")}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
          >
            Volver a lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Datos del estudiante
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo label="DNI">
            <input
              type="text"
              required
              maxLength={8}
              pattern="\d{8}"
              value={estudiante.dni}
              onChange={(e) =>
                setEstudiante((s) => ({ ...s, dni: e.target.value.replace(/\D/g, "") }))
              }
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
              placeholder="76543210"
            />
          </Campo>

          <Campo label="Fecha de nacimiento">
            <input
              type="date"
              value={estudiante.fechaNacimiento}
              onChange={(e) => setEstudiante((s) => ({ ...s, fechaNacimiento: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            />
          </Campo>

          <Campo label="Nombres">
            <input
              type="text"
              required
              value={estudiante.nombres}
              onChange={(e) => setEstudiante((s) => ({ ...s, nombres: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            />
          </Campo>

          <Campo label="Apellidos">
            <input
              type="text"
              required
              value={estudiante.apellidos}
              onChange={(e) => setEstudiante((s) => ({ ...s, apellidos: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            />
          </Campo>

          <Campo label="Contraseña inicial" className="sm:col-span-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={estudiante.password}
                  onChange={(e) => setEstudiante((s) => ({ ...s, password: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 pr-10 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {mostrarPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEstudiante((s) => ({ ...s, password: generarPassword() }));
                  setMostrarPassword(true);
                }}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-huellitas-primary px-3 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2} />
                Generar
              </button>
            </div>
          </Campo>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Matrícula
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo label="Aula">
            <select
              required
              value={aulaId}
              onChange={(e) => setAulaId(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            >
              <option value="">Selecciona un aula</option>
              {aulas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} ({a.nivel})
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Docente asignada (opcional)">
            {docentes.length === 0 ? (
              <p className="flex h-[42px] items-center text-sm text-stone-400">
                Sin docentes registrados
              </p>
            ) : (
              <select
                value={docenteId}
                onChange={(e) => setDocenteId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
              >
                <option value="">Sin asignar</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombres} {d.apellidos}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-huellitas-primary">
            Apoderados
          </h2>
          {apoderados.length < 2 && (
            <button
              type="button"
              onClick={agregarApoderado}
              className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Agregar segundo apoderado
            </button>
          )}
        </div>

        <div className="mt-4 space-y-6">
          {apoderados.map((a, index) => (
            <div key={index} className="rounded-lg border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-huellitas-ink">
                  Apoderado {index + 1}
                </p>
                {apoderados.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarApoderado(index)}
                    className="text-stone-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                )}
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Campo label="Nombres">
                  <input
                    type="text"
                    required
                    value={a.nombres}
                    onChange={(e) => actualizarApoderado(index, "nombres", e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                  />
                </Campo>
                <Campo label="Apellidos">
                  <input
                    type="text"
                    required
                    value={a.apellidos}
                    onChange={(e) => actualizarApoderado(index, "apellidos", e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                  />
                </Campo>
                <Campo label="DNI (opcional)">
                  <input
                    type="text"
                    maxLength={8}
                    value={a.dni}
                    onChange={(e) =>
                      actualizarApoderado(index, "dni", e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                  />
                </Campo>
                <Campo label="Parentesco">
                  <select
                    value={a.parentesco}
                    onChange={(e) => actualizarApoderado(index, "parentesco", e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                  >
                    <option value="padre">Padre</option>
                    <option value="madre">Madre</option>
                    <option value="tutor">Tutor</option>
                  </select>
                </Campo>
                <Campo label="Teléfono">
                  <input
                    type="tel"
                    value={a.telefono}
                    onChange={(e) => actualizarApoderado(index, "telefono", e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                  />
                </Campo>
                <Campo label="Email">
                  <input
                    type="email"
                    value={a.email}
                    onChange={(e) => actualizarApoderado(index, "email", e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                  />
                </Campo>
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={a.esPrincipal}
                  onChange={(e) => actualizarApoderado(index, "esPrincipal", e.target.checked)}
                  className="accent-huellitas-primary"
                />
                Apoderado principal
              </label>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/estudiantes")}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Registrando..." : "Registrar estudiante"}
        </button>
      </div>
    </form>
  );
}

function Campo({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
      {children}
    </div>
  );
}
