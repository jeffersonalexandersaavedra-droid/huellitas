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
  FileDown,
} from "lucide-react";
import { inputClass } from "@/lib/ui";
import { PASSWORD_MIN, generarPassword } from "@/lib/validacion";
import { pedir } from "@/lib/peticiones";
import Campo from "@/components/Campo";

// La clave solo identifica la tarjeta en pantalla; la API no la usa.
let siguienteClave = 0;

function apoderadoVacio(esPrincipal) {
  siguienteClave += 1;
  return {
    clave: siguienteClave,
    nombres: "",
    apellidos: "",
    dni: "",
    parentesco: "padre",
    telefono: "",
    email: "",
    direccion: "",
    esPrincipal,
  };
}

function estudianteVacio() {
  return { dni: "", nombres: "", apellidos: "", fechaNacimiento: "", password: "" };
}

const titulo = "font-display text-lg font-semibold text-huellitas-primary";

function RegistroExitoso({ resultado, onOtro }) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    navigator.clipboard?.writeText(`Usuario (DNI): ${resultado.dni}\nContraseña: ${resultado.password}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-9 w-9" strokeWidth={2} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-semibold text-huellitas-primary">Estudiante registrado</h1>

      <div className="mt-5 rounded-xl bg-huellitas-cream p-4 text-left">
        <p className="text-sm text-huellitas-ink/60">Usuario (DNI)</p>
        <p className="font-display text-lg font-semibold text-huellitas-ink">{resultado.dni}</p>
        <p className="mt-3 text-sm text-huellitas-ink/60">Contraseña</p>
        <p className="font-display text-lg font-semibold text-huellitas-ink">{resultado.password}</p>
      </div>

      <button
        type="button"
        onClick={copiar}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-huellitas-accent px-4 py-2 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
      >
        {copiado ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={2} />}
        {copiado ? "Copiado" : "Copiar credenciales"}
      </button>
      <p className="mt-4 text-sm text-huellitas-ink/70">Entrega estas credenciales al apoderado principal.</p>

      <div className="mt-6 flex flex-col gap-2">
        <a
          href={`/api/contrato/${resultado.estudiante_id}`}
          className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-accent px-4 py-2.5 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
        >
          <FileDown className="h-4 w-4" strokeWidth={2} />
          Descargar contrato
        </a>
        <button
          type="button"
          onClick={() => router.push(`/admin/estudiantes/${resultado.estudiante_id}`)}
          className="rounded-lg bg-huellitas-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
        >
          Ver ficha del estudiante
        </button>
        <button
          type="button"
          onClick={onOtro}
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

function DatosEstudiante({ estudiante, setEstudiante }) {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const cambiar = (campo, limpiar = (v) => v) => (e) => setEstudiante((s) => ({ ...s, [campo]: limpiar(e.target.value) }));

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className={titulo}>Datos del estudiante</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="DNI" ayuda="8 dígitos, sin espacios.">
          <input
            type="text"
            required
            maxLength={8}
            pattern="\d{8}"
            value={estudiante.dni}
            onChange={cambiar("dni", (v) => v.replace(/\D/g, ""))}
            className={inputClass}
          />
        </Campo>
        <Campo label="Fecha de nacimiento">
          <input type="date" value={estudiante.fechaNacimiento} onChange={cambiar("fechaNacimiento")} className={inputClass} />
        </Campo>
        <Campo label="Nombres">
          <input type="text" required value={estudiante.nombres} onChange={cambiar("nombres")} className={inputClass} />
        </Campo>
        <Campo label="Apellidos">
          <input type="text" required value={estudiante.apellidos} onChange={cambiar("apellidos")} className={inputClass} />
        </Campo>

        <Campo label="Contraseña inicial" className="sm:col-span-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={mostrarPassword ? "text" : "password"}
                required
                minLength={PASSWORD_MIN}
                value={estudiante.password}
                onChange={cambiar("password")}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {mostrarPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
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
  );
}

function DatosMatricula({ aulas, docentes, aulaId, setAulaId, docenteId, setDocenteId }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className={titulo}>Matrícula</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="Aula">
          <select required value={aulaId} onChange={(e) => setAulaId(e.target.value)} className={inputClass}>
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
            <p className="flex h-[42px] items-center text-sm text-stone-400">Sin docentes registrados</p>
          ) : (
            <select value={docenteId} onChange={(e) => setDocenteId(e.target.value)} className={inputClass}>
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
  );
}

const CAMPOS_APODERADO = [
  { campo: "nombres", label: "Nombres", required: true },
  { campo: "apellidos", label: "Apellidos", required: true },
  { campo: "dni", label: "DNI (opcional)", maxLength: 8, limpiar: (v) => v.replace(/\D/g, "") },
  { campo: "parentesco", label: "Parentesco" },
  { campo: "telefono", label: "Teléfono", type: "tel" },
  { campo: "email", label: "Email", type: "email" },
  { campo: "direccion", label: "Domicilio", className: "sm:col-span-2", ayuda: "Se usa en el contrato de servicio educativo." },
];

function FichaApoderado({ apoderado, numero, puedeQuitar, onCambiar, onQuitar }) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-huellitas-ink">Apoderado {numero}</p>
        {puedeQuitar && (
          <button type="button" onClick={onQuitar} aria-label={`Quitar apoderado ${numero}`} className="text-stone-400 hover:text-rose-600">
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {CAMPOS_APODERADO.map(({ campo, label, required, maxLength, type = "text", limpiar = (v) => v, className, ayuda }) => (
          <Campo key={campo} label={label} className={className} ayuda={ayuda}>
            {campo === "parentesco" ? (
              <select value={apoderado.parentesco} onChange={(e) => onCambiar("parentesco", e.target.value)} className={inputClass}>
                <option value="padre">Padre</option>
                <option value="madre">Madre</option>
                <option value="tutor">Tutor</option>
              </select>
            ) : (
              <input
                type={type}
                required={required}
                maxLength={maxLength}
                value={apoderado[campo]}
                onChange={(e) => onCambiar(campo, limpiar(e.target.value))}
                className={inputClass}
              />
            )}
          </Campo>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={apoderado.esPrincipal}
          onChange={(e) => onCambiar("esPrincipal", e.target.checked)}
          className="accent-huellitas-primary"
        />
        Apoderado principal
      </label>
    </div>
  );
}

// Matrícula de un estudiante nuevo: sus datos, aula y apoderados. Al
// terminar muestra las credenciales del portal y el contrato.
export default function RegistrarEstudianteForm({ aulas, docentes, aulaInicial = "" }) {
  const router = useRouter();
  const [estudiante, setEstudiante] = useState(estudianteVacio);
  const [aulaId, setAulaId] = useState(aulaInicial);
  const [docenteId, setDocenteId] = useState("");
  const [apoderados, setApoderados] = useState(() => [apoderadoVacio(true)]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Solo puede haber un apoderado principal.
  function actualizarApoderado(index, campo, valor) {
    setApoderados((prev) =>
      prev.map((a, i) => {
        if (i !== index) return campo === "esPrincipal" && valor ? { ...a, esPrincipal: false } : a;
        return { ...a, [campo]: valor };
      })
    );
  }

  function quitarApoderado(index) {
    setApoderados((prev) => {
      const restante = prev.filter((_, i) => i !== index);
      return restante.some((a) => a.esPrincipal)
        ? restante
        : restante.map((a, i) => (i === 0 ? { ...a, esPrincipal: true } : a));
    });
  }

  function resetFormulario() {
    setEstudiante(estudianteVacio());
    setAulaId("");
    setDocenteId("");
    setApoderados([apoderadoVacio(true)]);
    setError("");
    setResultado(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    const data = await pedir("/api/admin/registrar-estudiante", {
      metodo: "POST",
      cuerpo: { estudiante, matricula: { aulaId, docenteId: docenteId || null }, apoderados },
    });
    setLoading(false);
    if (data.error) return setError(data.error);
    setResultado(data);
  }

  if (resultado) return <RegistroExitoso resultado={resultado} onOtro={resetFormulario} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DatosEstudiante estudiante={estudiante} setEstudiante={setEstudiante} />
      <DatosMatricula
        aulas={aulas}
        docentes={docentes}
        aulaId={aulaId}
        setAulaId={setAulaId}
        docenteId={docenteId}
        setDocenteId={setDocenteId}
      />

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className={titulo}>Apoderados</h2>
          {apoderados.length < 2 && (
            <button
              type="button"
              onClick={() => setApoderados((prev) => [...prev, apoderadoVacio(false)])}
              className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Agregar segundo apoderado
            </button>
          )}
        </div>
        <div className="mt-4 space-y-6">
          {apoderados.map((a, index) => (
            <FichaApoderado
              key={a.clave}
              apoderado={a}
              numero={index + 1}
              puedeQuitar={apoderados.length > 1}
              onCambiar={(campo, valor) => actualizarApoderado(index, campo, valor)}
              onQuitar={() => quitarApoderado(index)}
            />
          ))}
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

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
