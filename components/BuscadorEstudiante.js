"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Campo from "@/components/Campo";
import { inputClass, coincide } from "@/lib/ui";

// Buscador por nombre o DNI entre los estudiantes matriculados (caja y
// facturación). estudiantes: [{ matriculaId, nombre, dni, aula }]
export default function BuscadorEstudiante({ estudiantes, onElegir, label = "Buscar estudiante (nombre o DNI)" }) {
  const [busqueda, setBusqueda] = useState("");

  const coincidencias = useMemo(
    () =>
      busqueda.trim().length < 2
        ? []
        : estudiantes.filter((e) => coincide(busqueda, e.nombre, e.dni)).slice(0, 8),
    [busqueda, estudiantes]
  );

  return (
    <div>
      <Campo label={label}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            strokeWidth={2}
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. Saavedra o 73113177"
            className={`${inputClass} pl-9`}
          />
        </div>
      </Campo>

      {coincidencias.length > 0 && (
        <ul className="mt-2 divide-y divide-stone-100 rounded-lg border border-stone-200">
          {coincidencias.map((e) => (
            <li key={e.matriculaId}>
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  onElegir(e);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-huellitas-cream"
              >
                <span className="text-huellitas-ink">{e.nombre}</span>
                <span className="shrink-0 text-xs text-stone-500">
                  {e.dni} · {e.aula}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
