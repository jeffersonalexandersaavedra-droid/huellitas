"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Download, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NOTAS_LITERALES, BIMESTRES } from "@/lib/cursos";

export default function DocentePanel({ docenteId, asignaciones, userId }) {
  const supabase = createClient();

  // Aulas únicas del docente.
  const aulas = useMemo(() => {
    const map = new Map();
    for (const a of asignaciones) {
      if (a.aulas && !map.has(a.aula_id)) {
        map.set(a.aula_id, { id: a.aula_id, nombre: a.aulas.nombre, nivel: a.aulas.nivel });
      }
    }
    return [...map.values()].sort((x, y) => x.nombre.localeCompare(y.nombre));
  }, [asignaciones]);

  const [aulaId, setAulaId] = useState(aulas[0]?.id ?? "");
  const [bimestre, setBimestre] = useState(1);

  // Cursos (columnas) que el docente dicta en el aula seleccionada.
  const cursos = useMemo(
    () =>
      asignaciones
        .filter((a) => a.aula_id === aulaId)
        .map((a) => a.curso)
        .sort(),
    [asignaciones, aulaId]
  );

  const [estudiantes, setEstudiantes] = useState([]); // [{matriculaId, nombre}]
  const [notas, setNotas] = useState({}); // { matriculaId: { curso: nota } }
  const [observaciones, setObservaciones] = useState({}); // { matriculaId: texto }
  const [orig, setOrig] = useState({ notas: {}, obs: {} });
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const aulaSel = aulas.find((a) => a.id === aulaId);

  useEffect(() => {
    if (!aulaId || !bimestre) return;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setMensaje("");

      const { data: matriculas } = await supabase
        .from("matriculas")
        .select("id, estudiantes(nombres, apellidos, dni)")
        .eq("aula_id", aulaId)
        .eq("estado", "activa");

      const ids = (matriculas ?? []).map((m) => m.id);

      const [{ data: notasData }, { data: obsData }] = await Promise.all([
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
              .eq("docente_id", docenteId)
              .eq("bimestre", bimestre)
              .in("matricula_id", ids)
          : Promise.resolve({ data: [] }),
      ]);

      const gridNotas = {};
      for (const n of notasData ?? []) {
        if (!gridNotas[n.matricula_id]) gridNotas[n.matricula_id] = {};
        gridNotas[n.matricula_id][n.curso] = n.nota ?? "";
      }
      const gridObs = {};
      for (const o of obsData ?? []) gridObs[o.matricula_id] = o.texto ?? "";

      const filas = (matriculas ?? [])
        .filter((m) => m.estudiantes)
        .map((m) => ({
          matriculaId: m.id,
          nombre: `${m.estudiantes.apellidos} ${m.estudiantes.nombres}`,
          dni: m.estudiantes.dni,
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      if (!cancelado) {
        setEstudiantes(filas);
        setNotas(gridNotas);
        setObservaciones(gridObs);
        // Copia profunda para comparar al guardar
        setOrig({
          notas: JSON.parse(JSON.stringify(gridNotas)),
          obs: { ...gridObs },
        });
        setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, bimestre]);

  function setNota(matriculaId, curso, valor) {
    setNotas((prev) => ({
      ...prev,
      [matriculaId]: { ...(prev[matriculaId] || {}), [curso]: valor },
    }));
  }
  function setObs(matriculaId, valor) {
    setObservaciones((prev) => ({ ...prev, [matriculaId]: valor }));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje("");

    const notasUpsert = [];
    const notasBorrar = []; // {matricula_id, curso}
    const obsUpsert = [];
    const obsBorrar = [];

    for (const est of estudiantes) {
      const mId = est.matriculaId;
      for (const curso of cursos) {
        const actual = (notas[mId]?.[curso] ?? "").trim();
        const original = (orig.notas[mId]?.[curso] ?? "").trim();
        if (actual === original) continue;
        if (actual) {
          notasUpsert.push({
            matricula_id: mId,
            curso,
            bimestre,
            nota: actual,
            registrado_por: userId ?? null,
          });
        } else if (original) {
          notasBorrar.push({ matricula_id: mId, curso });
        }
      }
      const obsActual = (observaciones[mId] ?? "").trim();
      const obsOriginal = (orig.obs[mId] ?? "").trim();
      if (obsActual !== obsOriginal) {
        if (obsActual) {
          obsUpsert.push({
            matricula_id: mId,
            docente_id: docenteId,
            bimestre,
            texto: obsActual,
            registrado_por: userId ?? null,
          });
        } else if (obsOriginal) {
          obsBorrar.push(mId);
        }
      }
    }

    try {
      if (notasUpsert.length) {
        const { error } = await supabase
          .from("notas_curso")
          .upsert(notasUpsert, { onConflict: "matricula_id,curso,bimestre" });
        if (error) throw error;
      }
      for (const b of notasBorrar) {
        await supabase
          .from("notas_curso")
          .delete()
          .eq("matricula_id", b.matricula_id)
          .eq("curso", b.curso)
          .eq("bimestre", bimestre);
      }
      if (obsUpsert.length) {
        const { error } = await supabase
          .from("observaciones_estudiante")
          .upsert(obsUpsert, { onConflict: "matricula_id,docente_id,bimestre" });
        if (error) throw error;
      }
      if (obsBorrar.length) {
        await supabase
          .from("observaciones_estudiante")
          .delete()
          .eq("docente_id", docenteId)
          .eq("bimestre", bimestre)
          .in("matricula_id", obsBorrar);
      }

      setOrig({
        notas: JSON.parse(JSON.stringify(notas)),
        obs: { ...observaciones },
      });
      const cambios = notasUpsert.length + notasBorrar.length + obsUpsert.length + obsBorrar.length;
      setMensaje(cambios ? "Notas guardadas correctamente." : "No había cambios por guardar.");
    } catch (e) {
      setMensaje("Error al guardar: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  function exportarSiage() {
    const csvCampo = (v) => {
      const s = String(v ?? "");
      return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const encabezado = `I.E.P. Huellitas - ${aulaSel?.nombre ?? ""} - Bimestre ${bimestre}`;
    const columnas = ["N°", "Apellidos y Nombres", "DNI", ...cursos, "Observación"];
    const lineas = estudiantes.map((e, i) =>
      [
        i + 1,
        e.nombre,
        e.dni,
        ...cursos.map((c) => notas[e.matriculaId]?.[c] ?? ""),
        observaciones[e.matriculaId] ?? "",
      ]
        .map(csvCampo)
        .join(";")
    );
    const contenido = "﻿" + [encabezado, "", columnas.join(";"), ...lineas].join("\r\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas_${(aulaSel?.nombre ?? "aula").replace(/\s+/g, "-")}_bim${bimestre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (asignaciones.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <BookOpen className="mx-auto h-8 w-8 text-stone-300" strokeWidth={2} />
        <p className="mt-3 text-sm text-huellitas-ink/70">
          Todavía no tienes aulas ni cursos asignados. Comunícate con administración.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selectores */}
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
            Aula
          </span>
          <select value={aulaId} onChange={(e) => setAulaId(e.target.value)} className={selectClass}>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
            Bimestre
          </span>
          <select value={bimestre} onChange={(e) => setBimestre(Number(e.target.value))} className={selectClass}>
            {BIMESTRES.map((b) => (
              <option key={b} value={b}>Bimestre {b}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Matriz */}
      <div className="rounded-xl bg-white p-4 shadow-sm md:p-6">
        {cargando ? (
          <p className="py-8 text-center text-sm text-stone-400">Cargando...</p>
        ) : estudiantes.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            No hay estudiantes matriculados en esta aula.
          </p>
        ) : cursos.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            No tienes cursos asignados en esta aula.
          </p>
        ) : (
          <>
            <datalist id="notas-literales">
              {NOTAS_LITERALES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 min-w-[12rem] border-b border-stone-200 bg-white px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-stone-400">
                      Estudiante
                    </th>
                    {cursos.map((c) => (
                      <th
                        key={c}
                        className="border-b border-stone-200 px-2 py-2 text-center text-xs font-medium text-huellitas-primary"
                      >
                        {c}
                      </th>
                    ))}
                    <th className="min-w-[14rem] border-b border-stone-200 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-stone-400">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((e, i) => (
                    <tr key={e.matriculaId} className="hover:bg-huellitas-cream/50">
                      <td className="sticky left-0 z-10 border-b border-stone-100 bg-white px-3 py-2 text-huellitas-ink">
                        <span className="text-stone-400">{i + 1}. </span>
                        {e.nombre}
                      </td>
                      {cursos.map((c) => (
                        <td key={c} className="border-b border-stone-100 px-1 py-1 text-center">
                          <input
                            type="text"
                            list="notas-literales"
                            value={notas[e.matriculaId]?.[c] ?? ""}
                            onChange={(ev) => setNota(e.matriculaId, c, ev.target.value)}
                            className="w-14 rounded-md border border-stone-300 px-1 py-1 text-center text-sm font-semibold text-huellitas-primary outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                          />
                        </td>
                      ))}
                      <td className="border-b border-stone-100 px-1 py-1">
                        <input
                          type="text"
                          value={observaciones[e.matriculaId] ?? ""}
                          onChange={(ev) => setObs(e.matriculaId, ev.target.value)}
                          placeholder="Observación del bimestre"
                          className="w-full rounded-md border border-stone-200 bg-huellitas-cream px-2 py-1 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={exportarSiage}
                className="flex items-center justify-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2.5 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Descargar archivo para SIAGIE
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" strokeWidth={2} />
                {guardando ? "Guardando..." : "Guardar notas"}
              </button>
            </div>

            {mensaje && (
              <p
                className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  mensaje.startsWith("Error")
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {mensaje}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const selectClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";
