"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, ShieldCheck, Wallet } from "lucide-react";
import { formatFecha } from "@/lib/fecha";
import { ROLES } from "@/lib/roles";
import { inputClass } from "@/lib/ui";
import { PASSWORD_MIN } from "@/lib/validacion";
import Campo from "@/components/Campo";

const FORM_VACIO = { nombre: "", email: "", password: "", rol: "secretaria" };

const DESCRIPCION_ROL = {
  admin: "Acceso total al sistema.",
  secretaria: "Matrícula, pagos, facturación y reportes.",
};

// Cuentas del personal: administradores y secretarias.
export default function UsuariosManager({ usuarios }) {
  const router = useRouter();
  const [form, setForm] = useState(FORM_VACIO);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const actualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function enviar(method, payload) {
    setError("");
    setOk("");
    const res = await fetch("/api/admin/usuarios", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) ?? {};
    if (!res?.ok) {
      setError(data.error || "No se pudo completar la operación.");
      return null;
    }
    router.refresh();
    return data;
  }

  async function crear(event) {
    event.preventDefault();
    setCreando(true);
    const data = await enviar("POST", form);
    setCreando(false);
    if (data) {
      setOk(`${ROLES[form.rol]} ${data.email} creada(o). Ya puede ingresar con ese correo.`);
      setForm(FORM_VACIO);
    }
  }

  async function eliminar(usuario) {
    if (!confirm(`¿Eliminar la cuenta de ${usuario.email}? Esta acción no se puede deshacer.`)) return;
    if (await enviar("DELETE", { userId: usuario.id })) setOk("Cuenta eliminada.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
          <UserPlus className="h-5 w-5" strokeWidth={2} />
          Nueva cuenta del personal
        </h2>

        <form onSubmit={crear} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo label="Rol" required>
            <select
              value={form.rol}
              onChange={(e) => actualizar("rol", e.target.value)}
              className={inputClass}
            >
              <option value="secretaria">{ROLES.secretaria}</option>
              <option value="admin">{ROLES.admin}</option>
            </select>
            <span className="mt-1 block text-xs text-stone-500">{DESCRIPCION_ROL[form.rol]}</span>
          </Campo>
          <Campo label="Nombre">
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => actualizar("nombre", e.target.value)}
              className={inputClass}
            />
          </Campo>
          <Campo label="Correo" required>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => actualizar("email", e.target.value)}
              className={inputClass}
            />
          </Campo>
          <Campo label="Contraseña" required>
            <input
              type="text"
              required
              minLength={PASSWORD_MIN}
              value={form.password}
              onChange={(e) => actualizar("password", e.target.value)}
              className={inputClass}
              placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
            />
          </Campo>

          <div className="sm:col-span-2">
            {error && (
              <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}
            {ok && (
              <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>
            )}
            <button
              type="submit"
              disabled={creando}
              className="rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:opacity-60"
            >
              {creando ? "Creando..." : "Crear cuenta"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Personal con acceso ({usuarios.length})
        </h2>
        <div className="mt-4 space-y-2">
          {usuarios.map((u) => {
            const Icono = u.rol === "admin" ? ShieldCheck : Wallet;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium text-huellitas-ink">
                    <Icono className="h-4 w-4 shrink-0 text-huellitas-primary" strokeWidth={2} />
                    {u.nombre || u.email}
                    <span className="rounded-full bg-huellitas-primary-light px-2 py-0.5 text-xs text-huellitas-primary">
                      {ROLES[u.rol]}
                    </span>
                    {u.esYo && (
                      <span className="rounded-full bg-huellitas-accent/30 px-2 py-0.5 text-xs text-huellitas-ink">
                        Tú
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    {u.email} · desde {formatFecha(u.creado)}
                  </p>
                </div>
                {!u.esYo && (
                  <button
                    type="button"
                    onClick={() => eliminar(u)}
                    aria-label="Eliminar cuenta"
                    className="shrink-0 text-stone-400 transition-colors hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
