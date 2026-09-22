"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Download, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NOTAS_LITERALES, BIMESTRES } from "@/lib/cursos";

export default function DocentePanel({ docenteId, asignaciones, userId }) {
  const supabase = createClient();

  // Aulas únicas a partir de las asignaciones del docente.
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
  const cursosDeAula = useMemo(
    () => asignaciones.filter((a) => a.aula_id === aulaId).map((a) => a.curso),
    [asignaciones, aulaId]
  );
  const [curso, setCurso] = useState(cursosDeAula[0] ?? "");
  const [bimestre, setBimestre] = useState(1);

  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const aulaSel = aulas.find((a) => a.id === aulaId);

  // Si cambia el aula, ajustar el curso al primero disponible.
  useEffect(() => {
    if (!cursosDeAula.includes(curso)) {
      setCurso(cursosDeAula[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId]);

  // Cargar estudiantes + notas + observaciones cuando hay selección completa.
  useEffect(() => {
    if (!aulaId || !curso || !bimestre) {
      setFilas([]);
      return;
    }

    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setMensaje("");

      const { data: matriculas } = await supabase
        .from("matriculas")
        .select("id, estudiantes(id, dni, nombres, apellidos)")
        .eq("aula_id", aulaId)
        .eq("estado", "activa");

      const matriculaIds = (matriculas ?? []).map((m) => m.id);

      const [{ data: notas }, { data: observaciones }] = await Promise.all([
        matriculaIds.length
          ? supabase
              .from("notas_curso")
              .select("matricula_id, nota, comentario")
              .eq("curso", curso)
              .eq("bimestre", bimestre)
              .in("matricula_id", matriculaIds)
          : Promise.resolve({ data: [] }),
        matriculaIds.length
          ? supabase
              .from("observaciones_estudiante")
              .select("matricula_id, texto")
              .eq("docente_id", docenteId)
              .eq("bimestre", bimestre)
              .in("matricula_id", matriculaIds)
          : Promise.resolve({ data: [] }),
      ]);

      const notaPorMat = new Map((notas ?? []).map((n) => [n.matricula_id, n]));
      const obsPorMat = new Map((observaciones ?? []).map((o) => [o.matricula_id, o.texto]));

      const nuevasFilas = (matriculas ?? [])
        .filter((m) => m.estudiantes)
        .map((m) => ({
          matriculaId: m.id,
          estudiante: m.estudiantes,
          nota: notaPorMat.get(m.id)?.nota ?? "",
          comentario: notaPorMat.get(m.id)?.comentario ?? "",
          observacion: obsPorMat.get(m.id) ?? "",
          notaOriginal: notaPorMat.has(m.id),
          obsOriginal: obsPorMat.has(m.id),
        }))
        .sort((a, b) =>
          `${a.estudiante.apellidos} ${a.estudiante.nombres}`.localeCompare(
            `${b.estudiante.apellidos} ${b.estudiante.nombres}`
          )
        );

      if (!cancelado) {
        setFilas(nuevasFilas);
        setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, curso, bimestre]);

  function actualizarFila(matriculaId, campo, valor) {
    setFilas((prev) =>
      prev.map((f) => (f.matriculaId === matriculaId ? { ...f, [campo]: valor } : f))
    );
  }

  async function guardar() {
    setGuardando(true);
    setMensaje("");

    const notasUpsert = [];
    const notasBorrar = [];
    const obsUpsert = [];
    const obsBorrar = [];

    for (const f of filas) {
      const nota = f.nota.trim();
      if (nota) {
        notasUpsert.push({
          matricula_id: f.matriculaId,
          curso,
          bimestre,
          nota,
          comentario: f.comentario.trim() || null,
          registrado_por: userId ?? null,
        });
      } else if (f.notaOriginal) {
        notasBorrar.push(f.matriculaId);
      }

      const texto = f.observacion.trim();
      if (texto) {
        obsUpsert.push({
          matricula_id: f.matriculaId,
          docente_id: docenteId,
          bimestre,
          texto,
          registrado_por: userId ?? null,
        });
      } else if (f.obsOriginal) {
        obsBorrar.push(f.matriculaId);
      }
    }

    try {
      if (notasUpsert.length) {
        const { error } = await supabase
          .from("notas_curso")
          .upsert(notasUpsert, { onConflict: "matricula_id,curso,bimestre" });
        if (error) throw error;
      }
      if (notasBorrar.length) {
        const { error } = await supabase
          .from("notas_curso")
          .delete()
          .eq("curso", curso)
          .eq("bimestre", bimestre)
          .in("matricula_id", notasBorrar);
        if (error) throw error;
      }
      if (obsUpsert.length) {
        const { error } = await supabase
          .from("observaciones_estudiante")
          .upsert(obsUpsert, { onConflict: "matricula_id,docente_id,bimestre" });
        if (error) throw error;
      }
      if (obsBorrar.length) {
        const { error } = await supabase
          .from("observaciones_estudiante")
          .delete()
          .eq("docente_id", docenteId)
          .eq("bimestre", bimestre)
          .in("matricula_id", obsBorrar);
        if (error) throw error;
      }

      setMensaje("Cambios guardados correctamente.");
      setFilas((prev) =>
        prev.map((f) => ({
          ...f,
          notaOriginal: f.nota.trim() !== "",
          obsOriginal: f.observacion.trim() !== "",
        }))
      );
    } catch (error) {
      setMensaje(`Error al guardar: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  }

  function exportarSiage() {
    const encabezado = [
      `I.E.P. Huellitas - ${aulaSel?.nombre ?? ""} - ${curso} - Bimestre ${bimestre}`,
    ];
    const columnas = ["N°", "Apellidos y Nombres", "DNI", "Nota", "Observación"];
    const lineas = filas.map((f, i) =>
      [
        i + 1,
        `${f.estudiante.apellidos} ${f.estudiante.nombres}`,
        f.estudiante.dni,
        f.nota,
        f.observacion,
      ]
        .map(csvCampo)
        .join(";")
    );

    const contenido =
      "﻿" +
      [encabezado.join(""), "", columnas.join(";"), ...lineas].join("\r\n");

    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas_${(aulaSel?.nombre ?? "aula").replace(/\s+/g, "-")}_${curso.replace(
      /\s+/g,
      "-"
    )}_bim${bimestre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (asignaciones.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <BookOpen className="mx-auto h-8 w-8 text-stone-300" strokeWidth={2} />
        <p className="mt-3 text-sm text-huellitas-ink/70">
          Todavía no tienes aulas ni cursos asignados. Comunícate con
          administración.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selectores */}
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
            Aula
          </span>
          <select
            value={aulaId}
            onChange={(e) => setAulaId(e.target.value)}
            className={selectClass}
          >
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
            Curso
          </span>
          <select
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            className={selectClass}
          >
            {cursosDeAula.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
            Bimestre
          </span>
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
        </label>
      </div>

      {/* Tabla de estudiantes */}
      <div className="rounded-xl bg-white p-4 shadow-sm md:p-6">
        {cargando ? (
          <p className="py-8 text-center text-sm text-stone-400">
            Cargando estudiantes...
          </p>
        ) : filas.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            No hay estudiantes matriculados en esta aula.
          </p>
        ) : (
          <>
            <datalist id="notas-literales">
              {NOTAS_LITERALES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>

            <div className="space-y-4">
              {filas.map((f, i) => (
                <div
                  key={f.matriculaId}
                  className="rounded-lg border border-stone-200 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-huellitas-ink">
                        {i + 1}. {f.estudiante.apellidos} {f.estudiante.nombres}
                      </p>
                      <p className="text-xs text-stone-400">
                        DNI {f.estudiante.dni}
                      </p>
                    </div>
                    <input
                      type="text"
                      list="notas-literales"
                      value={f.nota}
                      onChange={(e) =>
                        actualizarFila(f.matriculaId, "nota", e.target.value)
                      }
                      placeholder="Nota"
                      className="w-20 shrink-0 rounded-lg border border-stone-300 px-2 py-1.5 text-center text-sm font-semibold text-huellitas-primary outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                    />
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={f.comentario}
                      onChange={(e) =>
                        actualizarFila(f.matriculaId, "comentario", e.target.value)
                      }
                      placeholder="Comentario del curso (opcional)"
                      className={inputSmall}
                    />
                    <input
                      type="text"
                      value={f.observacion}
                      onChange={(e) =>
                        actualizarFila(f.matriculaId, "observacion", e.target.value)
                      }
                      placeholder="Observación general del bimestre (opcional)"
                      className={inputSmall}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones */}
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

function csvCampo(valor) {
  const s = String(valor ?? "");
  // Escapar comillas y envolver si tiene separador, comillas o saltos.
  if (/[";\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const selectClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

const inputSmall =
  "w-full rounded-lg border border-stone-200 bg-huellitas-cream px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";
