"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatSoles } from "@/lib/cuentas";
import { inputClass } from "@/lib/ui";
import Campo from "@/components/Campo";

const TIPOS = {
  hermano: "Hermanos en el colegio",
  rendimiento: "Buenas notas",
  otro: "Otro motivo",
};
const VACIO = { tipo: "", monto: "", motivo: "" };

// Descuentos que la dirección da a un estudiante para este año (uno por
// tipo). La base de datos los resta de cada pensión que aún no se pagó;
// las ya pagadas no cambian. La secretaria solo los ve.
export default function DescuentosEstudiante({ matriculaId, descuentos, puedeEditar }) {
  const router = useRouter();
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const libres = Object.keys(TIPOS).filter((t) => !descuentos.some((d) => d.tipo === t));
  const tipo = libres.includes(form.tipo) ? form.tipo : libres[0];
  const actualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function guardar(accion) {
    if (guardando) return;
    setGuardando(true);
    setError("");
    const { error: fallo } = await accion;
    setGuardando(false);
    if (fallo) return setError(fallo.message);
    setForm(VACIO);
    router.refresh();
  }

  function agregar(event) {
    event.preventDefault();
    guardar(
      createClient()
        .from("descuentos_estudiante")
        .insert({
          matricula_id: matriculaId,
          tipo,
          monto: Number(form.monto),
          motivo: form.motivo.trim() || null,
        })
    );
  }

  const quitar = (id) => guardar(createClient().from("descuentos_estudiante").delete().eq("id", id));

  return (
    <div className="mt-2">
      <p className="text-sm text-stone-500">
        Se restan de cada pensión que aún no se ha pagado. Las ya pagadas no cambian.
      </p>

      {descuentos.length === 0 ? (
        <p className="mt-3 text-sm text-stone-400">No tiene descuentos.</p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {descuentos.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-huellitas-ink">{TIPOS[d.tipo]}</p>
                {d.motivo && <p className="text-xs text-stone-500">{d.motivo}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold text-emerald-700">− {formatSoles(d.monto)} al mes</span>
                {puedeEditar && (
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => quitar(d.id)}
                    className="flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Quitar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {puedeEditar && libres.length > 0 && (
        <form onSubmit={agregar} className="mt-4 grid gap-4 rounded-lg border border-stone-200 p-4 sm:grid-cols-3">
          <Campo label="Descuento por" required>
            <select value={tipo} onChange={(e) => actualizar("tipo", e.target.value)} className={inputClass}>
              {libres.map((t) => (
                <option key={t} value={t}>
                  {TIPOS[t]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Monto al mes (S/)" required>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.monto}
              onChange={(e) => actualizar("monto", e.target.value)}
              className={inputClass}
            />
          </Campo>
          <Campo label={tipo === "otro" ? "Motivo" : "Motivo (opcional)"} required={tipo === "otro"}>
            <input
              type="text"
              required={tipo === "otro"}
              minLength={3}
              maxLength={200}
              value={form.motivo}
              onChange={(e) => actualizar("motivo", e.target.value)}
              className={inputClass}
            />
          </Campo>
          <div className="flex justify-end sm:col-span-3">
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-60"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {guardando ? "Guardando..." : "Dar descuento"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
