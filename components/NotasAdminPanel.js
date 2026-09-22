"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BIMESTRES } from "@/lib/cursos";
import ExportarCSVButton from "@/components/ExportarCSVButton";

export default function NotasAdminPanel({ aulas }) {
  const supabase = createClient();
  const [aulaId, setAulaId] = useState(aulas[0]?.id ?? "");
  const [bimestre, setBimestre] = useState(1);
  const [filas, setFilas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!aulaId) return;
    let cancelado = false;

    async function cargar() {
      setCargando(true);

      const { data: matriculas } = await supabase
        .from("matriculas")
        .select("id, estudiantes(dni, nombres, apellidos)")
        .eq("aula_id", aulaId)
        .eq("estado", "activa");

      const ids = (matriculas ?? []).map((m) => m.id);

      const [{ data: notas }, { data: observaciones }] = await Promise.all([
        ids.length
          ? supabase
              .from("notas_curso")
              .select("matricula_id, curso, nota")
              .eq("bimestre", bimestre)
              .in("matricula_id", ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase
              .from("observaciones_estudiante")
              .select("matricula_id, texto")
              .eq("bimestre", bimestre)
              .in("matricula_id", ids)
          : Promise.resolve({ data: [] }),
      ]);

      const cursosSet = new Set();
      const notasPorMat = new Map();
      for (const n of notas ?? []) {
        cursosSet.add(n.curso);
        if (!notasPorMat.has(n.matricula_id)) notasPorMat.set(n.matricula_id, {});
        notasPorMat.get(n.matricula_id)[n.curso] = n.nota;
      }

      const obsPorMat = new Map();
      for (const o of observaciones ?? []) {
        obsPorMat.set(
          o.matricula_id,
          [obsPorMat.get(o.matricula_id), o.texto].filter(Boolean).join(" · ")
        );
      }

      const nuevasFilas = (matriculas ?? [])
        .filter((m) => m.estudiantes)
        .map((m) => ({
          nombre: `${m.estudiantes.apellidos} ${m.estudiantes.nombres}`,
          dni: m.estudiantes.dni,
          notas: notasPorMat.get(m.id) ?? {},
          observacion: obsPorMat.get(m.id) ?? "",
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      if (!cancelado) {
        setCursos([...cursosSet].sort());
        setFilas(nuevasFilas);
        setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, bimestre]);

  const aulaNombre = aulas.find((a) => a.id === aulaId)?.nombre ?? "aula";

  const csv = useMemo(() => {
    const columns = ["Apellidos y Nombres", "DNI", ...cursos, "Observaciones"];
    const rows = filas.map((f) => [
      f.nombre,
      f.dni,
      ...cursos.map((c) => f.notas[c] ?? ""),
      f.observacion,
    ]);
    return { columns, rows };
  }, [filas, cursos]);

  const selectClass =
    "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={aulaId} onChange={(e) => setAulaId(e.target.value)} className={selectClass}>
          {aulas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <select
          value={bimestre}
          onChange={(e) => setBimestre(Number(e.target.value))}
          className={selectClass}
        >
          {BIMESTRES.map((b) => (
            <option key={b} value={b}>
              Bimestre {b}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <ExportarCSVButton
            filename={`notas_${aulaNombre.replace(/\s+/g, "-")}_bim${bimestre}`}
            columns={csv.columns}
            rows={csv.rows}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        {cargando ? (
          <p className="py-10 text-center text-sm text-stone-400">Cargando...</p>
        ) : filas.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone-400">
            No hay estudiantes en esta aula.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <th className="px-4 py-3 font-medium">Estudiante</th>
                {cursos.map((c) => (
                  <th key={c} className="px-3 py-3 font-medium">
                    {c}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i} className="border-b border-stone-50 last:border-0">
                  <td className="px-4 py-3 text-huellitas-ink">
                    {f.nombre}
                    <span className="ml-1 text-xs text-stone-400">({f.dni})</span>
                  </td>
                  {cursos.map((c) => (
                    <td key={c} className="px-3 py-3 font-medium text-huellitas-primary">
                      {f.notas[c] ?? "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-stone-500">{f.observacion || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!cargando && filas.length > 0 && cursos.length === 0 && (
          <p className="px-4 pb-4 text-sm text-stone-400">
            Aún no hay notas registradas para este bimestre.
          </p>
        )}
      </div>
    </div>
  );
}
