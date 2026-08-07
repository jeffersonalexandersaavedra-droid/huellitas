import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EstadoBadge from "@/components/EstadoBadge";
import NotaBadge from "@/components/NotaBadge";

export const metadata = { title: "Ficha del estudiante" };

const MESES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default async function EstudianteDetallePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: estudiante } = await supabase
    .from("estudiantes")
    .select("id, dni, nombres, apellidos, fecha_nacimiento, activo, email_interno, password_cambiado")
    .eq("id", id)
    .maybeSingle();

  if (!estudiante) {
    notFound();
  }

  const { data: matricula } = await supabase
    .from("matriculas")
    .select("id, estado, aulas(nombre, nivel), anios_escolares(anio)")
    .eq("estudiante_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: vinculos } = await supabase
    .from("estudiante_apoderado")
    .select("es_principal, apoderados(nombres, apellidos, parentesco, telefono, email)")
    .eq("estudiante_id", id);

  const [cuotasRes, notasRes] = matricula
    ? await Promise.all([
        supabase
          .from("cuotas")
          .select("id, mes, monto, monto_con_descuento, fecha_vencimiento, estado, conceptos_cobro(nombre)")
          .eq("matricula_id", matricula.id)
          .order("mes", { ascending: true }),
        supabase
          .from("notas_curso")
          .select("id, curso, bimestre, nota, comentario")
          .eq("matricula_id", matricula.id)
          .order("bimestre", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  const cuotas = cuotasRes.data ?? [];
  const notas = notasRes.data ?? [];
  const apoderados = (vinculos ?? []).slice().sort((a, b) => Number(b.es_principal) - Number(a.es_principal));

  const notasPorBimestre = new Map();
  for (const n of notas) {
    if (!notasPorBimestre.has(n.bimestre)) notasPorBimestre.set(n.bimestre, []);
    notasPorBimestre.get(n.bimestre).push(n);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
            {estudiante.nombres} {estudiante.apellidos}
          </h1>
          <EstadoBadge estado={estudiante.activo ? "activa" : "retirado"} />
        </div>
        <p className="mt-1 text-sm text-stone-500">
          DNI <span className="font-mono">{estudiante.dni}</span>
          {matricula?.aulas && <> · {matricula.aulas.nombre}</>}
          {matricula?.anios_escolares && <> · {matricula.anios_escolares.anio}</>}
        </p>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Datos del estudiante
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-400">Fecha de nacimiento</dt>
            <dd className="text-huellitas-ink">
              {estudiante.fecha_nacimiento
                ? new Date(estudiante.fecha_nacimiento).toLocaleDateString("es-PE")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-400">Usuario de acceso</dt>
            <dd className="text-huellitas-ink">{estudiante.email_interno ?? "—"}</dd>
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
                      {c.fecha_vencimiento
                        ? new Date(c.fecha_vencimiento).toLocaleDateString("es-PE")
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-huellitas-ink">
                      S/ {Number(c.monto_con_descuento ?? c.monto).toFixed(2)}
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
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">Notas</h2>
        {notas.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">No hay notas registradas.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {Array.from(notasPorBimestre.entries()).map(([bimestre, filas]) => (
              <div key={bimestre}>
                <p className="text-sm font-medium text-huellitas-ink">Bimestre {bimestre}</p>
                <table className="mt-2 w-full text-left text-sm">
                  <tbody>
                    {filas.map((n) => (
                      <tr key={n.id} className="border-b border-stone-50">
                        <td className="py-2 pr-4 text-huellitas-ink">{n.curso}</td>
                        <td className="py-2 pr-4">
                          <NotaBadge nota={n.nota} />
                        </td>
                        <td className="py-2 text-stone-500">{n.comentario || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
