"use client";

import { useState } from "react";
import NotaBadge from "@/components/NotaBadge";
import { BIMESTRES, LEYENDA_ESCALA, claveNota } from "@/lib/cursos";
import { bimestreActualPorMes } from "@/lib/bimestres";

// Notas del año por bimestre y competencia (los bimestres que aún no
// empiezan se ven deshabilitados). No dependen de los pagos: ver
// lib/bimestres.js. areas: [{ nombre, competencias }] del nivel.
export default function NotasPadre({ anio, areas, notas, observaciones }) {
  const [bimestreActual] = useState(() => bimestreActualPorMes(new Date().getMonth() + 1));
  const [activo, setActivo] = useState(bimestreActual);

  const delBimestre = Object.fromEntries(
    notas.filter((n) => n.bimestre === activo).map((n) => [claveNota(n.curso, n.competencia), n])
  );
  const areasConNotas = areas.filter((a) => a.competencias.some((_, i) => delBimestre[claveNota(a.nombre, i + 1)]));
  const comentarios = observaciones.filter((o) => o.bimestre === activo);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-semibold text-huellitas-primary">Notas académicas {anio}</h2>
      <p className="mt-1 text-sm text-stone-500">{LEYENDA_ESCALA}.</p>

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

      {areasConNotas.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-400">
          Las notas del bimestre {activo} aún no están disponibles.
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          {areasConNotas.map((area) => (
            <div key={area.nombre}>
              <h3 className="text-sm font-semibold text-huellitas-ink">{area.nombre}</h3>
              <ul className="mt-1 divide-y divide-stone-100">
                {area.competencias.map((texto, i) => {
                  const registro = delBimestre[claveNota(area.nombre, i + 1)];
                  return (
                    <li key={i} className="py-2">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 text-sm text-stone-600">{texto}</span>
                        <NotaBadge nota={registro?.nota} className="shrink-0" />
                      </div>
                      {registro?.conclusion && (
                        <p className="mt-1 text-sm text-huellitas-ink/70">{registro.conclusion}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {comentarios.length > 0 && (
        <div className="mt-5 rounded-lg bg-huellitas-primary-light/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-huellitas-primary">Comentario general</p>
          <ul className="mt-2 space-y-1">
            {comentarios.map((o) => (
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
