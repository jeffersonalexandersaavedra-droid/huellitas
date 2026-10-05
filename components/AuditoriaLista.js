"use client";

import { useState } from "react";
import { controlClass } from "@/lib/ui";

const TABLAS = {
  pagos: "Pagos",
  cuotas: "Pensiones",
  notas_curso: "Notas",
  observaciones_estudiante: "Observaciones",
  matriculas: "Matrículas",
  estudiantes: "Estudiantes",
  apoderados: "Apoderados",
  estudiante_apoderado: "Vínculos apoderado",
  docentes: "Docentes",
  asistencias: "Asistencia",
  comprobantes: "Comprobantes",
  comprobante_series: "Series",
  reclamaciones: "Reclamaciones",
};
const OPERACIONES = { INSERT: "Creó", UPDATE: "Cambió", DELETE: "Borró" };
const IGNORAR = new Set(["updated_at", "created_at", "id"]);

// Qué cambió en una modificación: "estado: pendiente → pagado".
function cambios(r) {
  if (r.operacion !== "UPDATE") return "";
  return Object.keys(r.despues ?? {})
    .filter((k) => !IGNORAR.has(k) && JSON.stringify(r.antes?.[k]) !== JSON.stringify(r.despues[k]))
    .map((k) => `${k}: ${valor(r.antes?.[k])} → ${valor(r.despues[k])}`)
    .join(" · ");
}
const valor = (v) => {
  const texto = v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return texto.length > 40 ? `${texto.slice(0, 40)}…` : texto;
};

// Últimos cambios registrados por la auditoría (solo lectura).
export default function AuditoriaLista({ registros }) {
  const [tabla, setTabla] = useState("");
  const visibles = tabla ? registros.filter((r) => r.tabla === tabla) : registros;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-huellitas-primary">Auditoría</h2>
          <p className="text-sm text-stone-500">Quién creó, cambió o borró información (últimos registros).</p>
        </div>
        <select value={tabla} onChange={(e) => setTabla(e.target.value)} className={controlClass}>
          <option value="">Todo</option>
          {Object.entries(TABLAS).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      </div>

      {visibles.length === 0 ? (
        <p className="mt-4 text-sm text-stone-400">Sin registros.</p>
      ) : (
        <ul className="mt-4 max-h-[28rem] divide-y divide-stone-100 overflow-y-auto text-sm">
          {visibles.map((r) => (
            <li key={r.id} className="py-2">
              <p className="text-huellitas-ink">
                <b>{r.autor}</b> {OPERACIONES[r.operacion]?.toLowerCase()} en {TABLAS[r.tabla] ?? r.tabla}
                <span className="ml-2 text-xs text-stone-400">
                  {new Date(r.creado_en).toLocaleString("es-PE", { timeZone: "America/Lima" })}
                </span>
              </p>
              {cambios(r) && <p className="break-words text-xs text-stone-500">{cambios(r)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
