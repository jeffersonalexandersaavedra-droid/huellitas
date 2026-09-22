"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus, Trash2, ShieldCheck } from "lucide-react";
import { formatFecha } from "@/lib/fecha";

export default function AdminsManager({ administradores }) {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function crear(event) {
    event.preventDefault();
    setError("");
    setOk("");
    setCreando(true);
    try {
      const res = await fetch("/api/admin/administradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo crear el administrador.");
      } else {
        setOk(`Administrador ${data.email} creado.`);
        setForm({ nombre: "", email: "", password: "" });
        router.refresh();
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setCreando(false);
    }
  }

  async function eliminar(userId, email) {
    if (!confirm(`¿Eliminar al administrador ${email}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError("");
    setOk("");
    const res = await fetch("/api/admin/administradores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo eliminar.");
    } else {
      setOk("Administrador eliminado.");
      router.refresh();
    }
  }

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
          <ShieldPlus className="h-5 w-5" strokeWidth={2} />
          Nuevo administrador
        </h2>

        <form onSubmit={crear} className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">Nombre</span>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">
              Correo <span className="text-rose-500">*</span>
            </span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">
              Contraseña <span className="text-rose-500">*</span>
            </span>
            <input
              type="text"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <div className="sm:col-span-3">
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
              {creando ? "Creando..." : "Crear administrador"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Administradores ({administradores.length})
        </h2>
        <div className="mt-4 space-y-2">
          {administradores.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-medium text-huellitas-ink">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-huellitas-primary" strokeWidth={2} />
                  {a.nombre || a.email}
                  {a.esYo && (
                    <span className="rounded-full bg-huellitas-primary-light px-2 py-0.5 text-xs text-huellitas-primary">
                      Tú
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {a.email} · desde {formatFecha(a.creado)}
                </p>
              </div>
              {!a.esYo && (
                <button
                  type="button"
                  onClick={() => eliminar(a.id, a.email)}
                  aria-label="Eliminar administrador"
                  className="shrink-0 text-stone-400 transition-colors hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
