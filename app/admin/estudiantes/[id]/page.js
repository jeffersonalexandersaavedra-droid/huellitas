import { notFound } from "next/navigation";
import Link from "next/link";
import { FileDown, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EstadoBadge from "@/components/EstadoBadge";
import EstadoCuentaBadge from "@/components/EstadoCuentaBadge";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import { MESES, formatFecha } from "@/lib/fecha";
import { tieneDeuda, montoVencido, montoACobrar, agruparPorMatricula, formatSoles } from "@/lib/cuentas";
import { BIMESTRES } from "@/lib/cursos";

export const metadata = { title: "Ficha del estudiante" };

export default async function EstudianteDetallePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: estudiante } = await supabase
    .from("estudiantes")
    .select("id, dni, nombres, apellidos, fecha_nacimiento, activo, password_cambiado, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!estudiante) {
    notFound();
  }

  // Matrículas del estudiante de la más reciente a la más antigua: la
  // primera es la del año en curso y las demás forman su histórico.
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, estado, aulas(nombre, nivel), anios_escolares(anio)")
    .eq("estudiante_id", id)
    .order("created_at", { ascending: false });
  const [matricula = null, ...anteriores] = (matriculas ?? []).sort(
    (a, b) => (b.anios_escolares?.anio ?? 0) - (a.anios_escolares?.anio ?? 0)
  );
  const idsAnteriores = anteriores.map((m) => m.id);

  const { data: vinculos } = await supabase
    .from("estudiante_apoderado")
    .select("es_principal, apoderados(nombres, apellidos, parentesco, telefono, email, direccion)")
    .eq("estudiante_id", id);

  const sinFilas = { data: [] };
  const [cuotasRes, notasRes, cuotasAnteriores, pagosAnteriores, notasAnteriores] = await Promise.all([
    matricula
      ? supabase
          .from("cuotas")
          .select("id, mes, monto, monto_con_descuento, fecha_vencimiento, estado, conceptos_cobro(nombre)")
          .eq("matricula_id", matricula.id)
          .order("mes", { ascending: true })
      : sinFilas,
    matricula ? supabase.from("notas_curso").select("bimestre").eq("matricula_id", matricula.id) : sinFilas,
    ...(idsAnteriores.length
      ? [
          supabase.from("cuotas").select("matricula_id, monto, estado, fecha_vencimiento").in("matricula_id", idsAnteriores),
          supabase.from("pagos").select("matricula_id, monto").eq("estado", "pagado").in("matricula_id", idsAnteriores),
          supabase.from("notas_curso").select("matricula_id").in("matricula_id", idsAnteriores),
        ]
      : [sinFilas, sinFilas, sinFilas]),
  ]);

  const cuotas = cuotasRes.data ?? [];
  const notas = notasRes.data ?? [];
  const apoderados = (vinculos ?? []).slice().sort((a, b) => Number(b.es_principal) - Number(a.es_principal));
  const conDeuda = tieneDeuda(cuotas);

  // Competencias calificadas por bimestre.
  const calificadas = {};
  for (const n of notas) calificadas[n.bimestre] = (calificadas[n.bimestre] ?? 0) + 1;

  // Histórico: un resumen por cada año anterior. Una matrícula de un año ya
  // pasado que sigue "activa" se muestra como culminada.
  const cuotasPorMatricula = agruparPorMatricula(cuotasAnteriores.data ?? []);
  const pagosPorMatricula = agruparPorMatricula(pagosAnteriores.data ?? []);
  const conNotas = new Set((notasAnteriores.data ?? []).map((n) => n.matricula_id));
  const historico = anteriores.map((m) => {
    const delAnio = cuotasPorMatricula.get(m.id) ?? [];
    return {
      id: m.id,
      anio: m.anios_escolares?.anio ?? "—",
      aula: m.aulas?.nombre ?? "—",
      estado: m.estado === "activa" ? "culminado" : m.estado,
      pensiones: `${delAnio.filter((c) => c.estado === "pagado").length} de ${delAnio.length}`,
      pagado: (pagosPorMatricula.get(m.id) ?? []).reduce((s, p) => s + Number(p.monto), 0),
      deuda: montoVencido(delAnio),
      conNotas: conNotas.has(m.id),
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
            {estudiante.nombres} {estudiante.apellidos}
          </h1>
          <EstadoBadge estado={estudiante.activo ? "activa" : "retirado"} />
          <EstadoCuentaBadge conDeuda={conDeuda} />
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-500">
            DNI <span className="font-mono">{estudiante.dni}</span>
            {matricula?.aulas && (
              <> · {matricula.aulas.nombre} ({matricula.aulas.nivel})</>
            )}
            {matricula?.anios_escolares && <> · {matricula.anios_escolares.anio}</>}
          </p>
          {matricula && (
            <a
              href={`/api/contrato/${estudiante.id}`}
              className="flex items-center gap-2 rounded-lg bg-huellitas-accent px-3 py-1.5 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
            >
              <FileDown className="h-4 w-4" strokeWidth={2} />
              Descargar contrato
            </a>
          )}
        </div>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-huellitas-primary">
            Datos del estudiante
          </h2>
          <ResetPasswordButton
            tipo="estudiante"
            id={estudiante.id}
            tieneAcceso={Boolean(estudiante.user_id)}
          />
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-400">Fecha de nacimiento</dt>
            <dd className="text-huellitas-ink">
              {estudiante.fecha_nacimiento
                ? formatFecha(estudiante.fecha_nacimiento)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-400">Acceso al portal</dt>
            <dd className="text-huellitas-ink">
              {estudiante.user_id ? `Ingresa con su DNI (${estudiante.dni})` : "Sin activar"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-400">Aula / grado</dt>
            <dd className="text-huellitas-ink">{matricula?.aulas?.nombre ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-400">Contraseña personalizada</dt>
            <dd className="text-huellitas-ink">
              {estudiante.password_cambiado ? "Sí" : "No (usa la del colegio)"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Apoderados
        </h2>
        {apoderados.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">No hay apoderados registrados.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {apoderados.map((v, i) => (
              <div key={i} className="rounded-lg border border-stone-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-huellitas-ink">
                    {v.apoderados?.nombres} {v.apoderados?.apellidos}
                  </p>
                  {v.es_principal && (
                    <span className="rounded-full bg-huellitas-accent px-2 py-0.5 text-xs font-medium text-huellitas-ink">
                      Principal
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm capitalize text-stone-500">
                  {v.apoderados?.parentesco}
                </p>
                <p className="mt-2 text-sm text-stone-600">{v.apoderados?.telefono || "—"}</p>
                <p className="text-sm text-stone-600">{v.apoderados?.email || "—"}</p>
                <p className="text-sm text-stone-600">{v.apoderados?.direccion || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Cuotas {matricula?.anios_escolares?.anio ?? ""}
        </h2>
        {cuotas.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">No hay cuotas generadas.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-4 font-medium">Concepto</th>
                  <th className="py-2 pr-4 font-medium">Vencimiento</th>
                  <th className="py-2 pr-4 font-medium">Monto</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((c) => (
                  <tr key={c.id} className="border-b border-stone-50">
                    <td className="py-3 pr-4 text-huellitas-ink">
                      {c.conceptos_cobro?.nombre ?? "Pensión"} {MESES[c.mes]}
                    </td>
                    <td className="py-3 pr-4 text-stone-500">
                      {formatFecha(c.fecha_vencimiento)}
                    </td>
                    <td className="py-3 pr-4 text-huellitas-ink">
                      {formatSoles(montoACobrar(c).monto)}
                    </td>
                    <td className="py-3">
                      <EstadoBadge estado={c.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-huellitas-primary">Notas</h2>
          {notas.length > 0 && (
            <Link
              href={`/admin/estudiantes/${estudiante.id}/informe?matricula=${matricula.id}`}
              className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-3 py-1.5 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
            >
              <FileText className="h-4 w-4" strokeWidth={2} />
              Informe de progreso
            </Link>
          )}
        </div>
        {notas.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">No hay notas registradas.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BIMESTRES.map((b) => (
              <li key={b} className="rounded-lg border border-stone-200 p-3">
                <p className="text-xs text-stone-400">Bimestre {b}</p>
                <p className="text-lg font-semibold text-huellitas-ink">{calificadas[b] ?? 0}</p>
                <p className="text-xs text-stone-500">competencias calificadas</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">Histórico</h2>
        <p className="text-sm text-stone-500">Años anteriores en el colegio.</p>
        {historico.length === 0 ? (
          <p className="mt-4 rounded-lg bg-huellitas-cream px-4 py-3 text-sm text-stone-500">
            {matricula
              ? `Aún no cuenta con histórico: su primera matrícula registrada es la de ${matricula.anios_escolares?.anio ?? "este año"}.`
              : "Aún no cuenta con histórico de matrículas."}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {historico.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-huellitas-ink">
                    {h.anio} · {h.aula}
                  </p>
                  <p className="text-xs text-stone-500">
                    {h.pensiones} pensiones pagadas · Pagado {formatSoles(h.pagado)}
                    {h.deuda > 0 && ` · Deuda ${formatSoles(h.deuda)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EstadoBadge estado={h.estado} />
                  <EstadoCuentaBadge conDeuda={h.deuda > 0} />
                  {h.conNotas && (
                    <Link
                      href={`/admin/estudiantes/${estudiante.id}/informe?matricula=${h.id}`}
                      className="flex items-center gap-1 rounded-lg border border-huellitas-primary px-2.5 py-1 text-xs font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
                    >
                      <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                      Informe
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
