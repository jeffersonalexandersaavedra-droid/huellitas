import { createClient } from "@/lib/supabase/server";
import ExportarExcelButton from "@/components/ExportarExcelButton";
import EstadoCuentaBadge from "@/components/EstadoCuentaBadge";
import { tieneDeuda, montoVencido, agruparPorMatricula, formatSoles } from "@/lib/cuentas";
import { obtenerAnioActivo } from "@/lib/consultas";
import { MESES, formatFecha } from "@/lib/fecha";
import { METODOS_PAGO } from "@/lib/pagoInfo";

export const metadata = { title: "Reportes" };

export default async function ReportesPage() {
  const supabase = await createClient();

  const anioActivo = await obtenerAnioActivo(supabase);
  const anioId = anioActivo?.id ?? "";

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, estudiantes(dni, nombres, apellidos), aulas(nombre, nivel)")
    .eq("anio_escolar_id", anioId)
    .eq("estado", "activa");

  const matriculaIds = (matriculas ?? []).map((m) => m.id);

  const [{ data: cuotas }, { data: pagos }] = matriculaIds.length
    ? await Promise.all([
        supabase
          .from("cuotas")
          .select("matricula_id, monto, estado, fecha_vencimiento")
          .in("matricula_id", matriculaIds),
        supabase
          .from("pagos")
          .select(
            "monto, metodo, numero_operacion, fecha_pago, pagado_por, cuotas_ids, cuotas(mes), matriculas(estudiantes(dni, nombres, apellidos), aulas(nombre))"
          )
          .in("matricula_id", matriculaIds)
          .in("estado", ["pagado", "verificado"])
          .order("fecha_pago", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  const cuotasPorMat = agruparPorMatricula(cuotas ?? []);

  // Totales de cobranza: lo esperado según pensiones y lo realmente pagado.
  const totalEsperado = (cuotas ?? []).reduce((s, c) => s + Number(c.monto || 0), 0);
  const totalRecaudado = (pagos ?? []).reduce((s, p) => s + Number(p.monto || 0), 0);
  const totalVencido = montoVencido(cuotas ?? []);

  // Filas por estudiante
  const filas = (matriculas ?? []).map((m) => {
    const cs = cuotasPorMat.get(m.id) ?? [];
    const pagadas = cs.filter((c) => c.estado === "pagado").length;
    const pendientes = cs.filter((c) => c.estado !== "pagado").length;
    const vencido = montoVencido(cs);
    const est = m.estudiantes;
    return {
      nombre: est ? `${est.apellidos} ${est.nombres}` : "—",
      dni: est?.dni ?? "—",
      aula: m.aulas?.nombre ?? "—",
      pagadas,
      pendientes,
      vencido,
      conDeuda: tieneDeuda(cs),
    };
  });

  const morosos = filas
    .filter((f) => f.conDeuda)
    .sort((a, b) => b.vencido - a.vencido);

  const anio = anioActivo?.anio ?? "";
  const hojaCobranza = {
    nombre: "Cobranza",
    titulo: "REPORTE DE COBRANZA",
    subtitulos: [`Año escolar ${anio} · ${filas.length} estudiantes · ${morosos.length} con deuda vencida`],
    columnas: [
      { titulo: "Apellidos y nombres", ancho: 34 },
      { titulo: "DNI", ancho: 12, tipo: "codigo" },
      { titulo: "Aula", ancho: 18 },
      { titulo: "Pensiones pagadas", ancho: 11, tipo: "numero" },
      { titulo: "Pensiones pendientes", ancho: 11, tipo: "numero" },
      { titulo: "Deuda vencida", ancho: 14, tipo: "soles" },
      { titulo: "Estado", ancho: 12, tipo: "centro" },
    ],
    filas: filas
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((f) => [
        f.nombre,
        f.dni,
        f.aula,
        f.pagadas,
        f.pendientes,
        Number(f.vencido.toFixed(2)),
        f.conDeuda ? "Con deuda" : "Al día",
      ]),
  };

  // Pagos recibidos (caja + vouchers validados) para el reporte de ingresos.
  const hojaPagos = {
    nombre: "Pagos",
    titulo: "PAGOS RECIBIDOS",
    subtitulos: [`Año escolar ${anio} · Total recaudado ${formatSoles(totalRecaudado)}`],
    columnas: [
      { titulo: "Fecha", ancho: 12, tipo: "centro" },
      { titulo: "Estudiante", ancho: 32 },
      { titulo: "DNI", ancho: 12, tipo: "codigo" },
      { titulo: "Aula", ancho: 16 },
      { titulo: "Concepto", ancho: 20 },
      { titulo: "Método", ancho: 14, tipo: "centro" },
      { titulo: "N.° operación", ancho: 16, tipo: "centro" },
      { titulo: "Pagado por", ancho: 26 },
      { titulo: "Monto", ancho: 12, tipo: "soles" },
    ],
    filas: (pagos ?? []).map((p) => {
      const est = p.matriculas?.estudiantes;
      return [
        formatFecha(p.fecha_pago),
        est ? `${est.apellidos} ${est.nombres}` : "—",
        est?.dni ?? "—",
        p.matriculas?.aulas?.nombre ?? "—",
        p.cuotas_ids?.length > 1
          ? `${p.cuotas_ids.length} pensiones`
          : `Pensión ${MESES[p.cuotas?.mes] ?? ""}`.trim(),
        METODOS_PAGO[p.metodo] ?? p.metodo,
        p.numero_operacion ?? "",
        p.pagado_por ?? "",
        Number(p.monto),
      ];
    }),
  };

  const cards = [
    { label: "Esperado (año)", valor: formatSoles(totalEsperado) },
    { label: "Recaudado", valor: formatSoles(totalRecaudado) },
    { label: "Deuda vencida", valor: formatSoles(totalVencido) },
    { label: "Estudiantes con deuda", valor: morosos.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
            Reportes de cobranza
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Resumen del año {anioActivo?.anio ?? ""} y estudiantes con deuda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportarExcelButton archivo={`cobranza_${anio}`} hoja={hojaCobranza} label="Exportar cobranza" />
          <ExportarExcelButton archivo={`pagos_recibidos_${anio}`} hoja={hojaPagos} label="Exportar pagos recibidos" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-huellitas-ink">
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Estudiantes con deuda
        </h2>
        {morosos.length === 0 ? (
          <p className="mt-4 text-sm text-stone-400">
            No hay estudiantes con deuda vencida. 🎉
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-4 font-medium">Estudiante</th>
                  <th className="py-2 pr-4 font-medium">Aula</th>
                  <th className="py-2 pr-4 font-medium">Cuotas pend.</th>
                  <th className="py-2 pr-4 font-medium">Deuda vencida</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {morosos.map((f, i) => (
                  <tr key={i} className="border-b border-stone-50">
                    <td className="py-3 pr-4 text-huellitas-ink">
                      {f.nombre}
                      <span className="ml-1 text-xs text-stone-400">({f.dni})</span>
                    </td>
                    <td className="py-3 pr-4 text-stone-600">{f.aula}</td>
                    <td className="py-3 pr-4 text-stone-600">{f.pendientes}</td>
                    <td className="py-3 pr-4 font-medium text-rose-600">
                      {formatSoles(f.vencido)}
                    </td>
                    <td className="py-3">
                      <EstadoCuentaBadge conDeuda={f.conDeuda} />
                    </td>
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
