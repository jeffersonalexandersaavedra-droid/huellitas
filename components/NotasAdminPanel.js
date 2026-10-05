"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BIMESTRES } from "@/lib/cursos";
import { registroDelAula } from "@/lib/consultas";
import ExportarExcelButton from "@/components/ExportarExcelButton";
import { controlClass } from "@/lib/ui";
import { hojaDeNotas } from "@/lib/excel";

export default function NotasAdminPanel({ aulas, anio }) {
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
      const registro = await registroDelAula(supabase, { aulaId, bimestre });
      if (cancelado) return;
      setCursos(registro.cursos);
      setFilas(
        registro.estudiantes.map((e) => ({
          nombre: e.nombre,
          dni: e.dni,
          notas: registro.notas[e.matriculaId] ?? {},
          observacion: registro.observaciones[e.matriculaId] ?? "",
        }))
      );
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, bimestre]);

  const aulaNombre = aulas.find((a) => a.id === aulaId)?.nombre ?? "aula";

  const hoja = useMemo(
    () =>
      hojaDeNotas({
        titulo: "REGISTRO DE NOTAS",
        aula: aulaNombre,
        bimestre,
        anio,
        cursos,
        filas,
      }),
    [aulaNombre, bimestre, anio, cursos, filas]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={aulaId} onChange={(e) => setAulaId(e.target.value)} className={controlClass}>
          {aulas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <select
          value={bimestre}
          onChange={(e) => setBimestre(Number(e.target.value))}
          className={controlClass}
        >
          {BIMESTRES.map((b) => (
            <option key={b} value={b}>
              Bimestre {b}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <ExportarExcelButton archivo={`notas_${aulaNombre}_bim${bimestre}`} hoja={hoja} />
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
