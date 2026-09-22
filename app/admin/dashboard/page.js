import Link from "next/link";
import {
  Users,
  GraduationCap,
  AlertTriangle,
  Wallet,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { estadoCuenta, montoVencido } from "@/lib/cuentas";
import { MESES } from "@/lib/fecha";

export const metadata = { title: "Dashboard" };

const soles = (n) =>
  `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: anioActivo } = await supabase
    .from("anios_escolares")
    .select("id, anio")
    .eq("activo", true)
    .maybeSingle();

  const anioId = anioActivo?.id ?? "";

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, estado, aulas(nombre, nivel)")
    .eq("anio_escolar_id", anioId)
    .eq("estado", "activa");

  const matriculaIds = (matriculas ?? []).map((m) => m.id);

  const { data: cuotas } = matriculaIds.length
    ? await supabase
        .from("cuotas")
        .select("matricula_id, monto, estado, fecha_vencimiento")
        .in("matricula_id", matriculaIds)
    : { data: [] };

  const { data: pagos } = matriculaIds.length
    ? await supabase
        .from("pagos")
        .select("monto, estado, fecha_pago")
        .in("matricula_id", matriculaIds)
    : { data: [] };

  // --- KPIs ---
  const total = (matriculas ?? []).length;
  const inicial = (matriculas ?? []).filter((m) => m.aulas?.nivel === "inicial").length;
  const primaria = (matriculas ?? []).filter((m) => m.aulas?.nivel === "primaria").length;

  const cuotasPorMatricula = new Map();
  for (const c of cuotas ?? []) {
    if (!cuotasPorMatricula.has(c.matricula_id)) cuotasPorMatricula.set(c.matricula_id, []);
    cuotasPorMatricula.get(c.matricula_id).push(c);
  }

  let conDeuda = 0;
  for (const mId of matriculaIds) {
    if (estadoCuenta(cuotasPorMatricula.get(mId) ?? []) === "con-deuda") conDeuda += 1;
  }

  const deudaTotal = montoVencido(cuotas ?? []);

  const ahora = new Date();
  const ingresosMes = (pagos ?? [])
    .filter((p) => {
      if (!["pagado", "verificado", "validado"].includes(p.estado)) return false;
      if (!p.fecha_pago) return false;
      const f = new Date(p.fecha_pago);
      return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
    })
    .reduce((s, p) => s + Number(p.monto || 0), 0);

  const porValidar = (pagos ?? []).filter((p) => p.estado === "validando").length;

  // Distribución por aula
  const porAula = new Map();
  for (const m of matriculas ?? []) {
    const nombre = m.aulas?.nombre ?? "Sin aula";
    porAula.set(nombre, (porAula.get(nombre) ?? 0) + 1);
  }
  const aulasOrden = [...porAula.entries()].sort((a, b) => b[1] - a[1]);
  const maxAula = Math.max(1, ...aulasOrden.map(([, n]) => n));

  const kpis = [
    { label: "Estudiantes matriculados", valor: total, icon: Users, color: "text-huellitas-primary" },
    { label: "Con deuda vencida", valor: conDeuda, icon: AlertTriangle, color: "text-rose-600" },
    { label: `Ingresos de ${MESES[ahora.getMonth() + 1]}`, valor: soles(ingresosMes), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Deuda vencida acumulada", valor: soles(deudaTotal), icon: Wallet, color: "text-huellitas-accent-dark" },
    { label: "Vouchers por validar", valor: porValidar, icon: Inbox, color: "text-sky-600", href: "/admin/pagos" },
    { label: "Niveles", valor: `${inicial} inicial · ${primaria} primaria`, icon: GraduationCap, color: "text-huellitas-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Resumen del año escolar {anioActivo?.anio ?? ""}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          const contenido = (
            <div className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow">
              <div className="min-w-0">
                <p className="text-sm text-stone-500">{k.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-huellitas-ink">
                  {k.valor}
                </p>
              </div>
              <span className={`shrink-0 ${k.color}`}>
                <Icon className="h-6 w-6" strokeWidth={2} />
              </span>
            </div>
          );
          return k.href ? (
            <Link key={k.label} href={k.href}>
              {contenido}
            </Link>
          ) : (
            <div key={k.label}>{contenido}</div>
          );
        })}
      </div>

      {/* Distribución por aula */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Estudiantes por aula
        </h2>
        {aulasOrden.length === 0 ? (
          <p className="mt-4 text-sm text-stone-400">
            Aún no hay estudiantes matriculados este año.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {aulasOrden.map(([nombre, n]) => (
              <div key={nombre} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-stone-600">{nombre}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-huellitas-primary-light">
                  <div
                    className="h-full rounded-full bg-huellitas-primary"
                    style={{ width: `${(n / maxAula) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-medium text-huellitas-ink">
                  {n}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
