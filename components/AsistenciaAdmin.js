"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todasLasFilas } from "@/lib/consultas";
import { ESTADOS_ASISTENCIA, CLAVES_ASISTENCIA } from "@/lib/asistencia";
import { descargarExcel } from "@/lib/excel";
import { MESES, hoyISO, formatFecha } from "@/lib/fecha";
import { inputClass } from "@/lib/ui";
import Campo from "@/components/Campo";

const PERIODOS = { dia: "Día", mes: "Mes", anio: "Año" };

function rango(periodo, fecha, mes, anio) {
  if (periodo === "dia") return [fecha, fecha];
  if (periodo === "mes") {
    const [a, m] = mes.split("-").map(Number);
    const ultimo = new Date(a, m, 0).getDate();
    return [`${mes}-01`, `${mes}-${String(ultimo).padStart(2, "0")}`];
  }
  return [`${anio}-01-01`, `${anio}-12-31`];
}

const totalesVacios = () => Object.fromEntries(CLAVES_ASISTENCIA.map((k) => [k, 0]));

// % de días que el estudiante estuvo en clase (asistió o llegó tarde).
function porcentaje(t) {
  const total = CLAVES_ASISTENCIA.reduce((s, k) => s + t[k], 0);
  return total ? Math.round(((t.asistio + t.tardanza) / total) * 100) : 0;
}

export default function AsistenciaAdmin({ aulas, anio }) {
  const supabase = createClient();
  const hoy = hoyISO();
  const [aulaId, setAulaId] = useState("");
  const [periodo, setPeriodo] = useState("dia");
  const [fecha, setFecha] = useState(hoy);
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [desde, hasta] = rango(periodo, fecha, mes, anio);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError("");
      try {
        const filas = await todasLasFilas(() => {
          const q = supabase
            .from("asistencias")
            .select(
              "id, fecha, estado, matricula_id, matriculas!inner(aula_id, estudiantes(nombres, apellidos, dni), aulas(nombre))"
            )
            .gte("fecha", desde)
            .lte("fecha", hasta)
            .order("fecha")
            .order("id");
          return aulaId ? q.eq("matriculas.aula_id", aulaId) : q;
        });
        if (!cancelado) setRegistros(filas);
      } catch (e) {
        if (!cancelado) setError(e.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, desde, hasta]);

  // Agrupa por estudiante: sus marcas por fecha y sus totales.
  const estudiantes = useMemo(() => {
    const mapa = new Map();
    for (const r of registros) {
      const est = r.matriculas?.estudiantes;
      if (!mapa.has(r.matricula_id)) {
        mapa.set(r.matricula_id, {
          id: r.matricula_id,
          nombre: est ? `${est.apellidos} ${est.nombres}` : "—",
          dni: est?.dni ?? "",
          aula: r.matriculas?.aulas?.nombre ?? "",
          marcas: {},
          totales: totalesVacios(),
        });
      }
      const fila = mapa.get(r.matricula_id);
      fila.marcas[r.fecha] = r.estado;
      fila.totales[r.estado] += 1;
    }
    return [...mapa.values()].sort(
      (a, b) => a.aula.localeCompare(b.aula) || a.nombre.localeCompare(b.nombre)
    );
  }, [registros]);

  const totalGeneral = useMemo(() => {
    const t = totalesVacios();
    for (const r of registros) t[r.estado] += 1;
    return t;
  }, [registros]);

  const titulo =
    periodo === "dia"
      ? formatFecha(fecha)
      : periodo === "mes"
        ? `${MESES[Number(mes.slice(5))]} ${mes.slice(0, 4)}`
        : `Año ${anio}`;

  function exportar() {
    const base = [
      { titulo: "Aula", ancho: 16 },
      { titulo: "Estudiante", ancho: 32 },
      { titulo: "DNI", ancho: 11, tipo: "centro" },
    ];
    const columnasTotales = CLAVES_ASISTENCIA.map((k) => ({
      titulo: ESTADOS_ASISTENCIA[k].label,
      ancho: 7,
      tipo: "numero",
      vertical: true,
    }));
    const datos = (e) => [e.aula, e.nombre, e.dni];
    const totales = (e) => CLAVES_ASISTENCIA.map((k) => e.totales[k]);
    let columnas;
    let filas;

    if (periodo === "dia") {
      columnas = [...base, { titulo: "Estado", ancho: 20, tipo: "centro" }];
      filas = estudiantes.map((e) => [...datos(e), ESTADOS_ASISTENCIA[e.marcas[fecha]]?.label ?? ""]);
    } else if (periodo === "mes") {
      const dias = Array.from({ length: Number(hasta.slice(-2)) }, (_, i) => String(i + 1));
      columnas = [
        ...base,
        ...dias.map((d) => ({ titulo: d, ancho: 3.6, tipo: "centro" })),
        ...columnasTotales,
      ];
      filas = estudiantes.map((e) => [
        ...datos(e),
        ...dias.map((d) => ESTADOS_ASISTENCIA[e.marcas[`${mes}-${d.padStart(2, "0")}`]]?.corto ?? ""),
        ...totales(e),
      ]);
    } else {
      columnas = [...base, ...columnasTotales, { titulo: "% asistencia", ancho: 9, tipo: "porcentaje", vertical: true }];
      filas = estudiantes.map((e) => [...datos(e), ...totales(e), porcentaje(e.totales)]);
    }

    const etiqueta = periodo === "dia" ? fecha : periodo === "mes" ? mes : String(anio);
    const aula = aulas.find((a) => a.id === aulaId)?.nombre ?? "Todas las aulas";
    descargarExcel(`asistencia_${etiqueta}`, [
      {
        nombre: `Asistencia ${etiqueta}`,
        titulo: "REGISTRO DE ASISTENCIA",
        subtitulos: [`${titulo} · ${aula}`],
        columnas,
        filas,
        fijarColumnas: 3,
        pie: [CLAVES_ASISTENCIA.map((k) => `${ESTADOS_ASISTENCIA[k].corto} = ${ESTADOS_ASISTENCIA[k].label}`).join(" · ")],
      },
    ]);
  }


  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <Campo label="Aula">
          <select value={aulaId} onChange={(e) => setAulaId(e.target.value)} className={inputClass}>
            <option value="">Todas las aulas</option>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Periodo">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={inputClass}>
            {Object.entries(PERIODOS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Campo>
        {periodo === "dia" && (
          <Campo label="Fecha">
            <input type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
          </Campo>
        )}
        {periodo === "mes" && (
          <Campo label="Mes">
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputClass} />
          </Campo>
        )}
        {periodo === "anio" && (
          <Campo label="Año">
            <input type="text" value={anio} readOnly className={inputClass} />
          </Campo>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-huellitas-primary">{titulo}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {CLAVES_ASISTENCIA.map((k) => (
                <span key={k} className={`rounded-full px-2 py-1 ${ESTADOS_ASISTENCIA[k].clase}`}>
                  {ESTADOS_ASISTENCIA[k].label}: {totalGeneral[k]}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={exportar}
            disabled={!estudiantes.length}
            className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Descargar Excel
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {cargando ? (
          <p className="py-8 text-center text-sm text-stone-400">Cargando...</p>
        ) : estudiantes.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            No hay asistencia registrada en este periodo.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-4 font-medium">Estudiante</th>
                  <th className="py-2 pr-4 font-medium">Aula</th>
                  {periodo === "dia" ? (
                    <th className="py-2 font-medium">Estado</th>
                  ) : (
                    <>
                      {CLAVES_ASISTENCIA.map((k) => (
                        <th key={k} className="px-2 py-2 text-center font-medium" title={ESTADOS_ASISTENCIA[k].label}>
                          {ESTADOS_ASISTENCIA[k].corto}
                        </th>
                      ))}
                      <th className="py-2 text-right font-medium">% asist.</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((e) => (
                  <tr key={e.id} className="border-b border-stone-50">
                    <td className="py-2 pr-4 text-huellitas-ink">{e.nombre}</td>
                    <td className="py-2 pr-4 text-stone-500">{e.aula}</td>
                    {periodo === "dia" ? (
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADOS_ASISTENCIA[e.marcas[fecha]]?.clase ?? ""}`}>
                          {ESTADOS_ASISTENCIA[e.marcas[fecha]]?.label}
                        </span>
                      </td>
                    ) : (
                      <>
                        {CLAVES_ASISTENCIA.map((k) => (
                          <td key={k} className="px-2 py-2 text-center text-stone-600">
                            {e.totales[k]}
                          </td>
                        ))}
                        <td className="py-2 text-right font-medium text-huellitas-ink">
                          {porcentaje(e.totales)}%
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
