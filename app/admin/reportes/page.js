import { createClient } from "@/lib/supabase/server";
import ExportarCSVButton from "@/components/ExportarCSVButton";
import EstadoCuentaBadge from "@/components/EstadoCuentaBadge";
import { tieneDeuda, montoVencido } from "@/lib/cuentas";

export const metadata = { title: "Reportes" };

const soles = (n) =>
  `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function ReportesPage() {
  const supabase = await createClient();

  const { data: anioActivo } = await supabase
    .from("anios_escolares")
    .select("id, anio")
    .eq("activo", true)
    .maybeSingle();

  const anioId = anioActivo?.id ?? "";

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, estudiantes(dni, nombres, apellidos), aulas(nombre, nivel)")
    .eq("anio_escolar_id", anioId)
    .eq("estado", "activa");

  const matriculaIds = (matriculas ?? []).map((m) => m.id);

  const { data: cuotas } = matriculaIds.length
    ? await supabase
        .from("cuotas")
        .select("matricula_id, monto, monto_con_descuento, estado, fecha_vencimiento")
        .in("matricula_id", matriculaIds)
    : { data: [] };

  const cuotasPorMat = new Map();
  for (const c of cuotas ?? []) {
    if (!cuotasPorMat.has(c.matricula_id)) cuotasPorMat.set(c.matricula_id, []);
    cuotasPorMat.get(c.matricula_id).push(c);
  }

  // Totales de cobranza
  const totalEsperado = (cuotas ?? []).reduce((s, c) => s + Number(c.monto || 0), 0);
  const totalRecaudado = (cuotas ?? [])
    .filter((c) => c.estado === "pagado")
    .reduce((s, c) => s + Number(c.monto_con_descuento ?? c.monto ?? 0), 0);
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

  const csvColumns = [
    "Apellidos y Nombres",
    "DNI",
    "Aula",
    "Cuotas pagadas",
    "Cuotas pendientes",
    "Deuda vencida (S/)",
    "Estado",
  ];
  const csvRows = filas
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((f) => [
      f.nombre,
      f.dni,
      f.aula,
      f.pagadas,
      f.pendientes,
      f.vencido.toFixed(2),
      f.conDeuda ? "Con deuda" : "Al día",
    ]);

  const cards = [
    { label: "Esperado (año)", valor: soles(totalEsperado) },
    { label: "Recaudado", valor: soles(totalRecaudado) },
    { label: "Deuda vencida", valor: soles(totalVencido) },
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
        <ExportarCSVButton
          filename={`cobranza_${anioActivo?.anio ?? "anio"}`}
          columns={csvColumns}
          rows={csvRows}
          label="Exportar cobranza"
        />
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
                      {soles(f.vencido)}
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
