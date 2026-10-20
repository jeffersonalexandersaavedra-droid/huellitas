"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CONCLUSION_MIN, CONCLUSION_MAX, NOTA_VACIA, claveNota, conclusionValida } from "@/lib/cursos";
import { bimestreActualPorMes } from "@/lib/bimestres";
import { registroDelAula, aulasDeAsignaciones } from "@/lib/consultas";
import AvisoVacio from "@/components/AvisoVacio";
import SelectorRegistro from "@/components/SelectorRegistro";
import TablaCompetencias from "@/components/TablaCompetencias";
import DescargasRegistro from "@/components/DescargasRegistro";

// Áreas con competencias que el docente dicta en el aula y las asignadas
// que aún no tienen competencias cargadas.
function areasDelAula(asignaciones, areasPorNivel, aulaId, nivel) {
  const asignados = asignaciones.filter((a) => a.aula_id === aulaId).map((a) => a.curso);
  const enAula = new Set(asignados);
  const areas = (areasPorNivel[nivel] ?? []).filter((a) => enAula.has(a.nombre));
  const conCompetencias = new Set(areas.map((a) => a.nombre));
  return { areas, sinCompetencias: asignados.filter((c) => !conCompetencias.has(c)).sort() };
}

// Qué cambió una competencia respecto de lo guardado: nota a guardar, nota a
// borrar, un error o nada.
function cambioDeCompetencia(actual, antes, donde) {
  const conclusion = actual.conclusion.trim();
  if (actual.nota === antes.nota && conclusion === antes.conclusion.trim()) return null;
  if (!actual.nota && conclusion) return { error: `Falta el nivel de logro en ${donde}.` };
  if (!conclusionValida(conclusion)) {
    return { error: `La conclusión de ${donde} debe tener entre ${CONCLUSION_MIN} y ${CONCLUSION_MAX} caracteres.` };
  }
  return actual.nota ? { nota: actual.nota, conclusion: conclusion || null } : { borrar: true };
}

// Cambios pendientes respecto de lo guardado, ya validados.
function calcularCambios(registro, original, areas) {
  const cambios = { notas: [], borrar: [], observaciones: [], errores: [] };
  for (const e of registro.estudiantes) {
    const mId = e.matriculaId;
    for (const a of areas) {
      a.competencias.forEach((_, i) => {
        const clave = claveNota(a.nombre, i + 1);
        const cambio = cambioDeCompetencia(
          registro.notas[mId]?.[clave] ?? NOTA_VACIA,
          original.notas[mId]?.[clave] ?? NOTA_VACIA,
          `C${i + 1} de ${a.nombre} (${e.corto})`
        );
        const fila = { matricula_id: mId, curso: a.nombre, competencia: i + 1 };
        if (cambio?.error) cambios.errores.push(cambio.error);
        else if (cambio?.borrar) cambios.borrar.push(fila);
        else if (cambio) cambios.notas.push({ ...fila, nota: cambio.nota, conclusion: cambio.conclusion });
      });
    }
    const texto = (registro.observaciones[mId] ?? "").trim();
    if (texto !== (original.observaciones[mId] ?? "").trim()) cambios.observaciones.push({ matricula_id: mId, texto });
  }
  return { ...cambios, total: cambios.notas.length + cambios.borrar.length + cambios.observaciones.length };
}

// Consultas que guardan los cambios del bimestre.
function operacionesDeGuardado(supabase, cambios, { bimestre, docenteId, autor }) {
  const operaciones = [
    ...cambios.borrar.map((b) => supabase.from("notas_curso").delete().match({ ...b, bimestre })),
    ...cambios.observaciones.map(({ matricula_id, texto }) => {
      const clave = { matricula_id, docente_id: docenteId, bimestre };
      return texto
        ? supabase
            .from("observaciones_estudiante")
            .upsert({ ...clave, texto, registrado_por: autor }, { onConflict: "matricula_id,docente_id,bimestre" })
        : supabase.from("observaciones_estudiante").delete().match(clave);
    }),
  ];
  if (cambios.notas.length) {
    operaciones.push(
      supabase
        .from("notas_curso")
        .upsert(
          cambios.notas.map((n) => ({ ...n, bimestre, registrado_por: autor })),
          { onConflict: "matricula_id,curso,competencia,bimestre" }
        )
    );
  }
  return operaciones;
}

function avisoDelRegistro({ cargando, estudiantes, area }) {
  if (cargando) return "Cargando...";
  if (!estudiantes.length) return "No hay estudiantes matriculados en esta aula.";
  if (!area) return "No tienes áreas con competencias para calificar en esta aula.";
  return null;
}

// Registro de notas del docente por competencias: elige aula, bimestre y
// área; pone el nivel de logro de cada competencia y, si quiere, la
// conclusión descriptiva y el comentario general del estudiante.
export default function DocentePanel({ docenteId, docente, anio, asignaciones, areasPorNivel }) {
  const supabase = createClient();
  const aulas = useMemo(() => aulasDeAsignaciones(asignaciones), [asignaciones]);

  const [aulaId, setAulaId] = useState(aulas[0]?.id ?? "");
  const [bimestre, setBimestre] = useState(() => bimestreActualPorMes(new Date().getMonth() + 1));
  const [areaNombre, setAreaNombre] = useState("");

  const aula = aulas.find((a) => a.id === aulaId);
  const { areas, sinCompetencias } = useMemo(
    () => areasDelAula(asignaciones, areasPorNivel, aulaId, aula?.nivel),
    [asignaciones, areasPorNivel, aulaId, aula?.nivel]
  );
  const area = areas.find((a) => a.nombre === areaNombre) ?? areas[0];

  const [registro, setRegistro] = useState({ estudiantes: [], notas: {}, observaciones: {} });
  const [original, setOriginal] = useState({ notas: {}, observaciones: {} });
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { ok, texto }

  useEffect(() => {
    if (!aulaId) return;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setMensaje(null);
      const datos = await registroDelAula(supabase, { aulaId, bimestre, docenteId });
      if (cancelado) return;
      setRegistro(datos);
      setOriginal({ notas: datos.notas, observaciones: datos.observaciones });
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, bimestre]);

  const cambios = useMemo(() => calcularCambios(registro, original, areas), [registro, original, areas]);

  const pendientes = cambios.total + cambios.errores.length;
  const aviso = avisoDelRegistro({ cargando, estudiantes: registro.estudiantes, area });

  function confirmarSalida(cambiar) {
    return (valor) => {
      if (pendientes && !confirm("Tienes notas sin guardar en este bimestre. ¿Cambiar de todos modos?")) return;
      cambiar(valor);
    };
  }

  function cambiarNota(matriculaId, clave, cambio) {
    setRegistro((prev) => ({
      ...prev,
      notas: {
        ...prev.notas,
        [matriculaId]: {
          ...prev.notas[matriculaId],
          [clave]: { ...NOTA_VACIA, ...prev.notas[matriculaId]?.[clave], ...cambio },
        },
      },
    }));
  }

  function cambiarObservacion(matriculaId, texto) {
    setRegistro((prev) => ({ ...prev, observaciones: { ...prev.observaciones, [matriculaId]: texto } }));
  }

  async function guardar() {
    if (guardando) return;
    if (cambios.errores.length) return setMensaje({ ok: false, texto: cambios.errores.join(" ") });
    if (!cambios.total) return setMensaje({ ok: true, texto: "No había cambios por guardar." });
    setGuardando(true);
    setMensaje(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const operaciones = operacionesDeGuardado(supabase, cambios, { bimestre, docenteId, autor: user?.id ?? null });
      const fallo = (await Promise.all(operaciones)).find((r) => r.error);
      if (fallo) throw fallo.error;

      setOriginal({ notas: registro.notas, observaciones: registro.observaciones });
      setMensaje({ ok: true, texto: "Notas guardadas correctamente." });
    } catch (error) {
      setMensaje({ ok: false, texto: `No se pudo guardar: ${error.message}` });
    } finally {
      setGuardando(false);
    }
  }

  if (aulas.length === 0) {
    return (
      <AvisoVacio icono={BookOpen}>Todavía no tienes aulas asignadas. Comunícate con administración.</AvisoVacio>
    );
  }

  return (
    <div className="space-y-6">
      <SelectorRegistro
        aulas={aulas}
        aulaId={aulaId}
        onAula={confirmarSalida(setAulaId)}
        bimestre={bimestre}
        onBimestre={confirmarSalida(setBimestre)}
        areas={areas}
        area={area}
        onArea={setAreaNombre}
      />

      <div className="rounded-xl bg-white p-3 shadow-sm sm:p-6">
        {aviso ? (
          <p className="py-8 text-center text-sm text-stone-400">{aviso}</p>
        ) : (
          <>
            <h2 className="font-display text-lg font-semibold text-huellitas-primary">{area.nombre}</h2>
            <div className="mt-3">
              <TablaCompetencias
                area={area}
                estudiantes={registro.estudiantes}
                notas={registro.notas}
                observaciones={registro.observaciones}
                onNota={cambiarNota}
                onObservacion={cambiarObservacion}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-stone-500">
                {pendientes
                  ? `Cambios sin guardar: ${pendientes} (en todas tus áreas de este bimestre).`
                  : "Todo guardado."}
              </p>
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
                  mensaje.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {mensaje.texto}
              </p>
            )}

            <div className="mt-6 border-t border-stone-100 pt-5">
              <DescargasRegistro
                aula={aula}
                bloqueado={pendientes ? "Guarda tus cambios antes de completar el archivo del SIAGIE." : ""}
                datosRegistro={() => ({ anio, bimestre, aula, docente, areas, ...registro })}
                cargarRegistro={async (b) => ({ areas, ...(await registroDelAula(supabase, { aulaId, bimestre: b })) })}
              />
            </div>
          </>
        )}
        {sinCompetencias.length > 0 && (
          <p className="mt-4 text-xs text-stone-400">
            Sin competencias para calificar: {sinCompetencias.join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}
