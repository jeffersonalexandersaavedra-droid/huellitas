"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function getStrength(password) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Débil", barClassName: "w-1/3 bg-rose-500" };
  if (score <= 3) return { label: "Media", barClassName: "w-2/3 bg-huellitas-accent" };
  return { label: "Fuerte", barClassName: "w-full bg-emerald-500" };
}

export default function ModalCambiarPassword({ open, onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const strength = getStrength(newPassword);

  function resetAndClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (reauthError) {
      setError("La contraseña actual no es correcta.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    await supabase
      .from("apoderados")
      .update({ password_cambiado: true })
      .eq("user_id", user.id);

    setLoading(false);
    resetAndClose();
    onSuccess?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-huellitas-ink/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-huellitas-primary">
            Cambiar contraseña
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Contraseña actual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Nueva contraseña
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            />
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div className={`h-full rounded-full transition-all ${strength.barClassName}`} />
                </div>
                <p className="mt-1 text-xs text-stone-500">{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-huellitas-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
