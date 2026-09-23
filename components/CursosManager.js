"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// CRUD del catálogo de cursos (áreas) que luego se asignan a docentes y se
// usan al registrar notas. Administrable por el admin.
export default function CursosManager({ cursos }) {
  const router = useRouter();
  const supabase = createClient();

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("primaria");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function agregar(event) {
    event.preventDefault();
    if (!nombre.trim()) return;
    setError("");
    setGuardando(true);
    const { error } = await supabase
      .from("cursos")
      .insert({ nombre: nombre.trim(), nivel });
    setGuardando(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "Ese curso ya existe en ese nivel."
          : error.message
      );
    } else {
      setNombre("");
      router.refresh();
    }
  }

  async function toggleActivo(curso) {
    await supabase
      .from("cursos")
      .update({ activo: !curso.activo })
      .eq("id", curso.id);
    router.refresh();
  }

  async function eliminar(curso) {
    if (!confirm(`¿Eliminar el curso "${curso.nombre}" (${curso.nivel})?`)) return;
    await supabase.from("cursos").delete().eq("id", curso.id);
    router.refresh();
  }

  const porNivel = (n) => cursos.filter((c) => c.nivel === n);

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
        <BookOpen className="h-5 w-5" strokeWidth={2} />
        Cursos / áreas
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Estos cursos son los que aparecen al asignar docentes y registrar notas.
      </p>

      {/* Agregar */}
      <form onSubmit={agregar} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del curso"
          className={inputClass}
        />
        <select value={nivel} onChange={(e) => setNivel(e.target.value)} className={inputClass}>
          <option value="primaria">Primaria</option>
          <option value="inicial">Inicial</option>
        </select>
        <button
          type="submit"
          disabled={guardando || !nombre.trim()}
          className="flex items-center justify-center gap-1 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Agregar
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      {/* Listas por nivel */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {[
          { nivel: "primaria", label: "Primaria" },
          { nivel: "inicial", label: "Inicial" },
        ].map(({ nivel: n, label }) => (
          <div key={n}>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {label}
            </p>
            <ul className="mt-2 space-y-1">
              {porNivel(n).length === 0 && (
                <li className="text-sm text-stone-400">Sin cursos.</li>
              )}
              {porNivel(n).map((c) => (
                <li
                  key={c.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    c.activo ? "border-stone-200" : "border-stone-100 bg-stone-50 text-stone-400"
                  }`}
                >
                  <span>{c.nombre}</span>
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActivo(c)}
                      title={c.activo ? "Desactivar" : "Activar"}
                      className="text-stone-400 hover:text-huellitas-primary"
                    >
                      {c.activo ? (
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <EyeOff className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(c)}
                      title="Eliminar"
                      className="text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
