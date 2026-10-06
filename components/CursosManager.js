"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Trash2, Eye, EyeOff, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NIVELES } from "@/lib/grados";
import { numeroCompetencia } from "@/lib/cursos";
import { inputClass, cantidad } from "@/lib/ui";

// Catálogo de cursos (áreas) por nivel con sus competencias del Currículo
// Nacional: se asignan a los docentes, se califican por competencia y salen
// en el registro auxiliar y en la boleta preventiva.
export default function CursosManager({ cursos }) {
  const router = useRouter();
  const supabase = createClient();

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("primaria");
  const [editando, setEditando] = useState(null); // { id, texto }
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function ejecutar(operacion) {
    setError("");
    setGuardando(true);
    const { error } = await operacion;
    setGuardando(false);
    if (error) {
      setError(error.code === "23505" ? "Ese curso ya existe en ese nivel." : error.message);
      return false;
    }
    router.refresh();
    return true;
  }

  async function agregar(event) {
    event.preventDefault();
    if (!nombre.trim()) return;
    if (await ejecutar(supabase.from("cursos").insert({ nombre: nombre.trim(), nivel }))) setNombre("");
  }

  async function guardarCompetencias() {
    const competencias = editando.texto
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    if (await ejecutar(supabase.from("cursos").update({ competencias }).eq("id", editando.id))) setEditando(null);
  }

  function eliminar(curso) {
    if (!confirm(`¿Eliminar el curso "${curso.nombre}" (${NIVELES[curso.nivel]})?`)) return;
    ejecutar(supabase.from("cursos").delete().eq("id", curso.id));
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
        <BookOpen className="h-5 w-5" strokeWidth={2} />
        Cursos / áreas y competencias
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Se asignan a los docentes y se califican por competencia, igual que en el SIAGIE. Un curso
        sin competencias (por ejemplo Tutoría) no lleva notas.
      </p>

      <form onSubmit={agregar} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del curso"
          className={inputClass}
        />
        <select value={nivel} onChange={(e) => setNivel(e.target.value)} className={inputClass}>
          {Object.entries(NIVELES).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Object.entries(NIVELES).map(([valor, etiqueta]) => {
          const delNivel = cursos.filter((c) => c.nivel === valor);
          return (
            <div key={valor}>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{etiqueta}</p>
              <ul className="mt-2 space-y-1">
                {delNivel.length === 0 && <li className="text-sm text-stone-400">Sin cursos.</li>}
                {delNivel.map((c) => (
                  <li
                    key={c.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      c.activo ? "border-stone-200" : "border-stone-100 bg-stone-50 text-stone-400"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        {c.nombre}
                        <span className="ml-2 text-xs text-stone-400">
                          {c.competencias.length ? cantidad(c.competencias.length, "competencia") : "sin notas"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditando(editando?.id === c.id ? null : { id: c.id, texto: c.competencias.join("\n") })
                          }
                          title="Competencias"
                          className="text-stone-400 hover:text-huellitas-primary"
                        >
                          <ListChecks className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => ejecutar(supabase.from("cursos").update({ activo: !c.activo }).eq("id", c.id))}
                          title={c.activo ? "Desactivar" : "Activar"}
                          className="text-stone-400 hover:text-huellitas-primary"
                        >
                          {c.activo ? <Eye className="h-4 w-4" strokeWidth={2} /> : <EyeOff className="h-4 w-4" strokeWidth={2} />}
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
                    </div>

                    {editando?.id === c.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          rows={Math.max(4, c.competencias.length * 2 + 1)}
                          value={editando.texto}
                          onChange={(e) => setEditando({ ...editando, texto: e.target.value })}
                          placeholder="Una competencia por línea, en el orden del SIAGIE"
                          className={`${inputClass} text-sm`}
                        />
                        <p className="text-xs text-stone-500">
                          Una por línea. Las notas se guardan por número (01, 02…): si cambias el orden,
                          las notas ya registradas pasan a la competencia que quede en ese número.
                        </p>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditando(null)}
                            className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={guardarCompetencias}
                            disabled={guardando}
                            className="rounded-lg bg-huellitas-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
                          >
                            Guardar competencias
                          </button>
                        </div>
                      </div>
                    ) : (
                      c.competencias.length > 0 && (
                        <ol className="mt-1.5 space-y-0.5 text-xs text-stone-500">
                          {c.competencias.map((texto, i) => (
                            <li key={i}>
                              <b className="text-huellitas-primary/80">{numeroCompetencia(i + 1)}</b> {texto}
                            </li>
                          ))}
                        </ol>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
