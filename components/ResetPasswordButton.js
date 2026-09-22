"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UserPlus, RefreshCw, Check, Copy, X } from "lucide-react";

function generarPassword() {
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `hue-${numero}`;
}

// Botón para que el admin gestione la contraseña de un estudiante o docente.
// - tipo: "estudiante" | "docente"
// - tieneAcceso: si es false, en vez de "cambiar" la contraseña se CREA la
//   cuenta de acceso (para alumnos registrados sin usuario, user_id null).
export default function ResetPasswordButton({ tipo, id, tieneAcceso = true }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const modoActivar = !tieneAcceso;

  async function guardar() {
    if (password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const url = modoActivar
        ? "/api/admin/activar-acceso"
        : "/api/admin/cambiar-password";
      const payload = modoActivar
        ? { estudianteId: id, password: password.trim() }
        : { tipo, id, password: password.trim() };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo completar la operación.");
      } else {
        setOk(true);
        if (modoActivar) router.refresh();
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  function copiar() {
    navigator.clipboard?.writeText(password);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function cerrar() {
    setAbierto(false);
    setPassword("");
    setError("");
    setOk(false);
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          modoActivar
            ? "bg-huellitas-primary text-white hover:bg-huellitas-primary-dark"
            : "border border-huellitas-primary text-huellitas-primary hover:bg-huellitas-primary-light"
        }`}
      >
        {modoActivar ? (
          <UserPlus className="h-4 w-4" strokeWidth={2} />
        ) : (
          <KeyRound className="h-4 w-4" strokeWidth={2} />
        )}
        {modoActivar ? "Activar acceso al portal" : "Restablecer contraseña"}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-huellitas-primary/30 bg-huellitas-cream p-4 sm:w-auto sm:min-w-[20rem]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-huellitas-primary">
          {modoActivar ? "Crear acceso al portal" : "Nueva contraseña"}
        </p>
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="text-stone-400 hover:text-stone-600"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {ok ? (
        <div className="mt-3 text-sm text-huellitas-ink">
          <p className="text-emerald-700">
            {modoActivar ? "Acceso creado correctamente." : "Contraseña actualizada."}
          </p>
          <p className="mt-2">
            {modoActivar ? "Contraseña" : "Nueva contraseña"}: <b>{password}</b>
          </p>
          <button
            type="button"
            onClick={copiar}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-huellitas-primary hover:underline"
          >
            {copiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
          <p className="mt-2 text-xs text-stone-500">
            El estudiante ingresa con su DNI y esta contraseña. Podrá cambiarla luego.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            />
            <button
              type="button"
              onClick={() => setPassword(generarPassword())}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-huellitas-primary px-2 text-xs font-medium text-huellitas-primary hover:bg-huellitas-primary-light"
            >
              <RefreshCw className="h-3 w-3" strokeWidth={2} />
              Generar
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={guardar}
            disabled={loading}
            className="mt-3 w-full rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:opacity-60"
          >
            {loading
              ? "Guardando..."
              : modoActivar
                ? "Crear acceso"
                : "Guardar contraseña"}
          </button>
        </>
      )}
    </div>
  );
}
