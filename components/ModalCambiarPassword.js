"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_MIN, MENSAJE_PASSWORD, passwordValida } from "@/lib/validacion";
import { inputClass } from "@/lib/ui";
import Campo from "@/components/Campo";
import Modal from "@/components/Modal";

// Fuerza orientativa de la nueva contraseña.
function fuerza(password) {
  if (!password) return null;
  const puntos = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (puntos <= 1) return { texto: "Débil", barra: "w-1/3 bg-rose-500" };
  if (puntos <= 3) return { texto: "Media", barra: "w-2/3 bg-huellitas-accent" };
  return { texto: "Fuerte", barra: "w-full bg-emerald-500" };
}

// El padre cambia la contraseña de la cuenta del estudiante (pide la actual).
export default function ModalCambiarPassword({ open, onClose, onSuccess }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!open) return null;

  const nivel = fuerza(nueva);

  function cerrar() {
    setActual("");
    setNueva("");
    setConfirmacion("");
    setError("");
    onClose();
  }

  async function guardar(event) {
    event.preventDefault();
    setError("");
    if (!passwordValida(nueva)) return setError(MENSAJE_PASSWORD);
    if (nueva !== confirmacion) return setError("Las contraseñas no coinciden.");

    setGuardando(true);
    const supabase = createClient();
    const fallar = (mensaje) => {
      setError(mensaje);
      setGuardando(false);
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return fallar("Tu sesión expiró. Vuelve a iniciar sesión.");

    // Se confirma la contraseña actual antes de cambiarla.
    const { error: errorActual } = await supabase.auth.signInWithPassword({ email: user.email, password: actual });
    if (errorActual) return fallar("La contraseña actual no es correcta.");

    const { error: errorNueva } = await supabase.auth.updateUser({ password: nueva });
    if (errorNueva) return fallar("No se pudo actualizar la contraseña. Intenta de nuevo.");

    await supabase.from("estudiantes").update({ password_cambiado: true }).eq("user_id", user.id);
    setGuardando(false);
    cerrar();
    onSuccess?.();
  }

  return (
    <Modal titulo="Cambiar contraseña" onCerrar={cerrar} ancho="sm:max-w-sm">
      <form onSubmit={guardar} className="space-y-4">
        <Campo label="Contraseña actual">
          <input type="password" required value={actual} onChange={(e) => setActual(e.target.value)} className={inputClass} />
        </Campo>
        <Campo label="Nueva contraseña">
          <input
            type="password"
            required
            minLength={PASSWORD_MIN}
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            className={inputClass}
          />
          {nivel && (
            <span className="mt-2 block">
              <span className="block h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <span className={`block h-full rounded-full transition-all ${nivel.barra}`} />
              </span>
              <span className="mt-1 block text-xs text-stone-500">{nivel.texto}</span>
            </span>
          )}
        </Campo>
        <Campo label="Confirmar nueva contraseña">
          <input
            type="password"
            required
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className={inputClass}
          />
        </Campo>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-lg bg-huellitas-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}
