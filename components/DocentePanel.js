"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Download, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NOTAS_LITERALES, BIMESTRES, abreviarCurso } from "@/lib/cursos";
import { registroDelAula, aulasDeAsignaciones } from "@/lib/consultas";
import { descargarExcel } from "@/lib/excel";
import { COLEGIO } from "@/lib/colegio";
import { inputClass } from "@/lib/ui";
import AvisoVacio from "@/components/AvisoVacio";

// Escala literal + vacío; conserva una nota antigua que no esté en la escala.
function opcionesNota(actual) {
  const opciones = ["", ...NOTAS_LITERALES];
  return actual && !opciones.includes(actual) ? [...opciones, actual] : opciones;
}

export default function DocentePanel({ docenteId, asignaciones }) {
  const supabase = createClient();
  const aulas = useMemo(() => aulasDeAsignaciones(asignaciones), [asignaciones]);

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
      const registro = await registroDelAula(supabase, { aulaId, bimestre, docenteId });
      if (cancelado) return;
      setEstudiantes(registro.estudiantes);
      setNotas(registro.notas);
      setObservaciones(registro.observaciones);
      // Copia profunda para comparar al guardar
      setOrig({
        notas: JSON.parse(JSON.stringify(registro.notas)),
        obs: { ...registro.observaciones },
      });
      setCargando(false);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

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
            registrado_por: userId,
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
            registrado_por: userId,
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

  // Registro auxiliar en Excel, listo para transcribir al SIAGIE.
  function descargarRegistro() {
    const filas = [
      [`${COLEGIO.nombre} — Registro auxiliar`],
      [`Aula: ${aulaSel?.nombre ?? ""}`, `Bimestre ${bimestre}`],
      [],
      ["N°", "Apellidos y Nombres", "DNI", ...cursos, "Observación"],
      ...estudiantes.map((e, i) => [
        i + 1,
        e.nombre,
        e.dni,
        ...cursos.map((c) => notas[e.matriculaId]?.[c] ?? ""),
        observaciones[e.matriculaId] ?? "",
      ]),
    ];
    descargarExcel(`registro_${aulaSel?.nombre ?? "aula"}_bim${bimestre}`, [
      { nombre: `Bimestre ${bimestre}`, filas },
    ]);
  }

  if (asignaciones.length === 0) {
    return (
      <AvisoVacio icono={BookOpen}>
        Todavía no tienes aulas asignadas. Comunícate con administración.
      </AvisoVacio>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selectores */}
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-3 shadow-sm sm:p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
            Aula
          </span>
          <select value={aulaId} onChange={(e) => setAulaId(e.target.value)} className={inputClass}>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
            Bimestre
          </span>
          <select value={bimestre} onChange={(e) => setBimestre(Number(e.target.value))} className={inputClass}>
            {BIMESTRES.map((b) => (
              <option key={b} value={b}>Bimestre {b}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Matriz */}
      <div className="rounded-xl bg-white p-3 shadow-sm sm:p-6">
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
            {/* En celular: columnas angostas con abreviaturas; la tabla se
                desliza dentro de su tarjeta y el nombre queda fijo. */}
            <div className="-mx-3 overflow-x-auto sm:mx-0">
              <table className="w-full border-separate border-spacing-0 text-xs sm:text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-28 border-b border-r border-stone-200 bg-white px-3 py-2 text-left font-medium uppercase tracking-wide text-stone-400 sm:w-auto sm:min-w-[11rem]">
                      Estudiante
                    </th>
                    {cursos.map((c) => (
                      <th
                        key={c}
                        title={c}
                        className="border-b border-stone-200 px-1 py-2 text-center text-xs font-semibold leading-tight text-huellitas-primary sm:min-w-[4.25rem] sm:px-1.5 sm:font-medium"
                      >
                        <span className="sm:hidden">{abreviarCurso(c)}</span>
                        <span className="hidden sm:inline">{c}</span>
                      </th>
                    ))}
                    <th className="min-w-[11rem] border-b border-stone-200 px-2 py-2 text-left font-medium uppercase tracking-wide text-stone-400">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((e, i) => (
                    <tr key={e.matriculaId} className="group">
                      <td
                        title={e.nombre}
                        className="sticky left-0 z-10 max-w-[7rem] border-b border-r border-stone-100 bg-white px-3 py-1.5 text-huellitas-ink group-hover:bg-huellitas-cream sm:max-w-none"
                      >
                        <span className="block truncate">
                          <span className="text-stone-400">{i + 1}. </span>
                          <span className="sm:hidden">{e.corto}</span>
                          <span className="hidden sm:inline">{e.nombre}</span>
                        </span>
                      </td>
                      {cursos.map((c) => (
                        <td key={c} className="border-b border-stone-100 px-0.5 py-1.5 text-center group-hover:bg-huellitas-cream sm:px-1">
                          <select
                            aria-label={`${c} de ${e.nombre}`}
                            value={notas[e.matriculaId]?.[c] ?? ""}
                            onChange={(ev) => setNota(e.matriculaId, c, ev.target.value)}
                            className={`h-8 w-10 appearance-none rounded-md border border-stone-300 bg-white px-0 text-center font-semibold outline-none [text-align-last:center] focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20 sm:h-9 sm:w-14 ${
                              notas[e.matriculaId]?.[c] ? "text-huellitas-primary" : "text-stone-300"
                            }`}
                          >
                            {opcionesNota(notas[e.matriculaId]?.[c]).map((n) => (
                              <option key={n} value={n}>
                                {n || "–"}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                      <td className="border-b border-stone-100 px-1 py-1.5 group-hover:bg-huellitas-cream">
                        <input
                          type="text"
                          aria-label={`Observación de ${e.nombre}`}
                          value={observaciones[e.matriculaId] ?? ""}
                          onChange={(ev) => setObs(e.matriculaId, ev.target.value)}
                          placeholder="Observación del bimestre"
                          className="h-8 w-full rounded-md border border-stone-200 bg-huellitas-cream px-2 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20 sm:h-9"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone-500 sm:hidden">
              {cursos.map((c) => `${abreviarCurso(c)} = ${c}`).join(" · ")}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={descargarRegistro}
                className="flex items-center justify-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2.5 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Descargar registro auxiliar (Excel)
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

