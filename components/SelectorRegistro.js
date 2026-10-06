"use client";

import { BIMESTRES } from "@/lib/cursos";
import { inputClass } from "@/lib/ui";

const etiqueta = "mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400";

// Aula, bimestre y área del registro de notas (docente y admin).
export default function SelectorRegistro({ aulas, aulaId, onAula, bimestre, onBimestre, areas, area, onArea }) {
  return (
    <div className="space-y-3 rounded-xl bg-white p-3 shadow-sm sm:p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={etiqueta}>Aula</span>
          <select value={aulaId} onChange={(e) => onAula(e.target.value)} className={inputClass}>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={etiqueta}>Bimestre</span>
          <select value={bimestre} onChange={(e) => onBimestre(Number(e.target.value))} className={inputClass}>
            {BIMESTRES.map((b) => (
              <option key={b} value={b}>
                Bimestre {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      {areas.length > 0 && (
        <div>
          <span className={etiqueta}>Área</span>
          <div className="flex flex-wrap gap-1.5">
            {areas.map((a) => (
              <button
                key={a.nombre}
                type="button"
                onClick={() => onArea(a.nombre)}
                aria-pressed={a.nombre === area?.nombre}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  a.nombre === area?.nombre
                    ? "border-huellitas-primary bg-huellitas-primary text-white"
                    : "border-stone-200 text-stone-600 hover:border-huellitas-primary hover:text-huellitas-primary"
                }`}
              >
                {a.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
