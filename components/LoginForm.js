"use client";

import { useState } from "react";
import { login } from "@/app/login/actions";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("identifier", identifier);
    formData.set("password", password);

    const result = await login(formData);

    // Si login() tuvo éxito, ya redirigió y esta línea no se alcanza.
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <label
          htmlFor="identifier"
          className="mb-1 block text-sm font-medium text-stone-700"
        >
          Usuario o correo
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          placeholder="DNI del estudiante o correo del administrador"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-stone-700"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
        />
      </div>

      <div className="text-right">
        <button
          type="button"
          className="text-xs font-medium text-huellitas-accent-dark hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-huellitas-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
