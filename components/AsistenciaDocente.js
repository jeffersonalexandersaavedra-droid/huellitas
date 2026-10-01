"use client";

import { useEffect, useState } from "react";
import { Save, CheckCheck, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { estudiantesDelAula } from "@/lib/consultas";
import { ESTADOS_ASISTENCIA, CLAVES_ASISTENCIA } from "@/lib/asistencia";
import { hoyISO } from "@/lib/fecha";
import { inputClass } from "@/lib/ui";
import AvisoVacio from "@/components/AvisoVacio";
import Campo from "@/components/Campo";

export default function AsistenciaDocente({ aulas }) {
  const supabase = createClient();
  const [aulaId, setAulaId] = useState(aulas[0]?.id ?? "");
  const [fecha, setFecha] = useState(hoyISO());
  const [estudiantes, setEstudiantes] = useState([]);
  const [marcas, setMarcas] = useState({}); // { matriculaId: estado }
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!aulaId || !fecha) return;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setMensaje("");
      const lista = await estudiantesDelAula(supabase, aulaId);
      const ids = lista.map((e) => e.matriculaId);
      const { data } = ids.length
        ? await supabase
            .from("asistencias")
            .select("matricula_id, estado")
            .eq("fecha", fecha)
            .in("matricula_id", ids)
        : { data: [] };
      if (cancelado) return;
      setEstudiantes(lista);
      setMarcas(Object.fromEntries((data ?? []).map((a) => [a.matricula_id, a.estado])));
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, fecha]);

  function marcarTodosAsistio() {
    setMarcas((prev) => {
      const nuevo = { ...prev };
      for (const e of estudiantes) nuevo[e.matriculaId] ??= "asistio";
      return nuevo;
    });
  }

  async function guardar() {
    const filas = Object.entries(marcas).map(([matricula_id, estado]) => ({
      matricula_id,
      fecha,
      estado,
      updated_at: new Date().toISOString(),
    }));
    if (!filas.length) return;
    setGuardando(true);
    const { error } = await supabase
      .from("asistencias")
      .upsert(filas, { onConflict: "matricula_id,fecha" });
    setGuardando(false);
    setMensaje(error ? `Error al guardar: ${error.message}` : "Asistencia guardada.");
  }

  if (aulas.length === 0) {
    return (
      <AvisoVacio icono={BookOpen}>
        Todavía no tienes aulas asignadas. Comunícate con administración.
      </AvisoVacio>
    );
  }

  const resumen = CLAVES_ASISTENCIA.map((k) => ({
    clave: k,
    total: Object.values(marcas).filter((m) => m === k).length,
  }));
  const faltan = estudiantes.length - Object.keys(marcas).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2">
        <Campo label="Aula">
          <select value={aulaId} onChange={(e) => setAulaId(e.target.value)} className={inputClass}>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Fecha">
          <input
            type="date"
            value={fecha}
            max={hoyISO()}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
        </Campo>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm md:p-6">
        {cargando ? (
          <p className="py-8 text-center text-sm text-stone-400">Cargando...</p>
        ) : estudiantes.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            No hay estudiantes matriculados en esta aula.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {resumen.map(({ clave, total }) => (
                  <span key={clave} className={`rounded-full px-2 py-1 ${ESTADOS_ASISTENCIA[clave].clase}`}>
                    {ESTADOS_ASISTENCIA[clave].label}: {total}
                  </span>
                ))}
                {faltan > 0 && (
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-500">
                    Sin marcar: {faltan}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={marcarTodosAsistio}
                className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
              >
                <CheckCheck className="h-4 w-4" strokeWidth={2} />
                Marcar a los demás como asistió
              </button>
            </div>

            <ul className="mt-4 divide-y divide-stone-100">
              {estudiantes.map((e, i) => (
                <li
                  key={e.matriculaId}
                  className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-huellitas-ink">
                    <span className="text-stone-400">{i + 1}. </span>
                    {e.nombre}
                  </span>
                  <div className="flex gap-1">
                    {CLAVES_ASISTENCIA.map((k) => {
                      const activo = marcas[e.matriculaId] === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          title={ESTADOS_ASISTENCIA[k].label}
                          onClick={() => setMarcas((prev) => ({ ...prev, [e.matriculaId]: k }))}
                          className={`min-w-[2.75rem] rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                            activo
                              ? `${ESTADOS_ASISTENCIA[k].clase} border-transparent`
                              : "border-stone-200 text-stone-400 hover:bg-stone-50"
                          }`}
                        >
                          {ESTADOS_ASISTENCIA[k].corto}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs text-stone-400">
              A = Asistió · T = Tardanza · FJ = Falta justificada · FI = Falta injustificada
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {mensaje && (
                <p className={`text-sm ${mensaje.startsWith("Error") ? "text-rose-600" : "text-emerald-600"}`}>
                  {mensaje}
                </p>
              )}
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || !Object.keys(marcas).length}
                className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:opacity-60"
              >
                <Save className="h-4 w-4" strokeWidth={2} />
                {guardando ? "Guardando..." : "Guardar asistencia"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
