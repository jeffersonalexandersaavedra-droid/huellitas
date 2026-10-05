"use client";

import { useState } from "react";
import NotaBadge from "@/components/NotaBadge";
import { BIMESTRES } from "@/lib/cursos";
import { bimestreActualPorMes } from "@/lib/bimestres";

// Notas del año por bimestre (los bimestres que aún no empiezan se ven
// deshabilitados). No dependen de los pagos: ver lib/bimestres.js.
export default function NotasPadre({ anio, notas, observaciones }) {
  const bimestreActual = bimestreActualPorMes(new Date().getMonth() + 1);
  const [activo, setActivo] = useState(bimestreActual);

  const notasActivas = notas.filter((n) => n.bimestre === activo);
  const obsActivas = observaciones.filter((o) => o.bimestre === activo);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-semibold text-huellitas-primary">
        Notas académicas {anio}
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Para consultar años anteriores acércate a administración.
      </p>

      <div className="mt-4 grid grid-cols-4 border-b border-stone-100">
        {BIMESTRES.map((b) => {
          const futuro = b > bimestreActual;
          return (
            <button
              key={b}
              type="button"
              disabled={futuro}
              onClick={() => setActivo(b)}
              className={`flex items-center justify-center gap-1 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                futuro
                  ? "cursor-not-allowed border-transparent text-stone-300"
                  : activo === b
                    ? "border-huellitas-primary text-huellitas-primary"
                    : "border-transparent text-stone-500 hover:text-huellitas-primary"
              }`}
            >
              <span className="sm:hidden">Bim. {b}</span>
              <span className="hidden sm:inline">Bimestre {b}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {notasActivas.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-400">
            Las notas del bimestre {activo} aún no están disponibles.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {notasActivas.map((n) => (
              <li key={n.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 text-huellitas-ink">{n.curso}</span>
                  <NotaBadge nota={n.nota} />
                </div>
                {n.comentario && <p className="mt-1 text-sm text-stone-500">{n.comentario}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {obsActivas.length > 0 && (
        <div className="mt-4 rounded-lg bg-huellitas-primary-light/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-huellitas-primary">
            Observaciones del docente
          </p>
          <ul className="mt-2 space-y-1">
            {obsActivas.map((o) => (
              <li key={o.id} className="text-sm text-huellitas-ink/80">
                {o.texto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
