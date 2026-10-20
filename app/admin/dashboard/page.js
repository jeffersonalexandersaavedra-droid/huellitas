import Link from "next/link";
import {
  Users,
  GraduationCap,
  AlertTriangle,
  Wallet,
  Inbox,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { estadoCuenta, montoVencido, agruparPorMatricula, formatSoles } from "@/lib/cuentas";
import { MESES } from "@/lib/fecha";
import { obtenerAnioActivo } from "@/lib/consultas";

export const metadata = { title: "Dashboard" };

const COBRADOS = new Set(["pagado", "verificado"]);

// Matrículas activas del año con sus cuotas y pagos.
async function datosDelAnio(supabase, anioId) {
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, estado, aulas(nombre, nivel)")
    .eq("anio_escolar_id", anioId ?? "")
    .eq("estado", "activa");
  const ids = (matriculas ?? []).map((m) => m.id);
  if (!ids.length) return { matriculas: [], cuotas: [], pagos: [] };

  const [{ data: cuotas }, { data: pagos }] = await Promise.all([
    supabase.from("cuotas").select("matricula_id, monto, estado, fecha_vencimiento").in("matricula_id", ids),
    supabase.from("pagos").select("monto, estado, fecha_pago").in("matricula_id", ids),
  ]);
  return { matriculas, cuotas: cuotas ?? [], pagos: pagos ?? [] };
}

async function incidenciasSinLeer(supabase) {
  const { count } = await supabase
    .from("incidencias")
    .select("id", { count: "exact", head: true })
    .eq("leida", false);
  return count ?? 0;
}

function indicadores({ matriculas, cuotas, pagos }, ahora) {
  const delNivel = (nivel) => matriculas.filter((m) => m.aulas?.nivel === nivel).length;
  const porMatricula = agruparPorMatricula(cuotas);
  const conDeuda = matriculas.filter((m) => estadoCuenta(porMatricula.get(m.id) ?? []) === "con-deuda").length;
  const delMes = (fecha) => {
    const f = new Date(fecha);
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  };
  const ingresosMes = pagos
    .filter((p) => COBRADOS.has(p.estado) && p.fecha_pago && delMes(p.fecha_pago))
    .reduce((s, p) => s + Number(p.monto || 0), 0);

  return [
    { label: "Estudiantes matriculados", valor: matriculas.length, icon: Users, color: "text-huellitas-primary" },
    { label: "Con deuda vencida", valor: conDeuda, icon: AlertTriangle, color: "text-rose-600" },
    { label: `Ingresos de ${MESES[ahora.getMonth() + 1]}`, valor: formatSoles(ingresosMes), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Deuda vencida acumulada", valor: formatSoles(montoVencido(cuotas)), icon: Wallet, color: "text-huellitas-accent-dark" },
    {
      label: "Vouchers por validar",
      valor: pagos.filter((p) => p.estado === "validando").length,
      icon: Inbox,
      color: "text-sky-600",
      href: "/admin/pagos",
    },
    { label: "Niveles", valor: `${delNivel("inicial")} inicial · ${delNivel("primaria")} primaria`, icon: GraduationCap, color: "text-huellitas-primary" },
  ];
}

function TarjetaKpi({ label, valor, icon: Icon, color, href }) {
  const contenido = (
    <div className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow">
      <div className="min-w-0">
        <p className="text-sm text-stone-500">{label}</p>
        <p className="mt-2 font-display text-2xl font-semibold text-huellitas-ink">{valor}</p>
      </div>
      <span className={`shrink-0 ${color}`}>
        <Icon className="h-6 w-6" strokeWidth={2} />
      </span>
    </div>
  );
  return href ? <Link href={href}>{contenido}</Link> : contenido;
}

function EstudiantesPorAula({ matriculas }) {
  const porAula = new Map();
  for (const m of matriculas) {
    const nombre = m.aulas?.nombre ?? "Sin aula";
    porAula.set(nombre, (porAula.get(nombre) ?? 0) + 1);
  }
  const aulas = [...porAula.entries()].sort((a, b) => b[1] - a[1]);
  const maximo = Math.max(1, ...aulas.map(([, n]) => n));

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-huellitas-primary">Estudiantes por aula</h2>
      {aulas.length === 0 ? (
        <p className="mt-4 text-sm text-stone-400">Aún no hay estudiantes matriculados este año.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {aulas.map(([nombre, n]) => (
            <div key={nombre} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm text-stone-600">{nombre}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-huellitas-primary-light">
                <div className="h-full rounded-full bg-huellitas-primary" style={{ width: `${(n / maximo) * 100}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-medium text-huellitas-ink">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    anioActivo,
  ] = await Promise.all([supabase.auth.getUser(), obtenerAnioActivo(supabase)]);
  // Dirección ve además las incidencias que aún no ha leído.
  const esAdmin = user?.app_metadata?.role === "admin";
  const [datos, sinLeer] = await Promise.all([
    datosDelAnio(supabase, anioActivo?.id),
    esAdmin ? incidenciasSinLeer(supabase) : null,
  ]);

  const kpis = indicadores(datos, new Date());
  if (sinLeer !== null) {
    kpis.push({ label: "Incidencias sin leer", valor: sinLeer, icon: ShieldAlert, color: "text-rose-600", href: "/admin/incidencias" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">Resumen del año escolar {anioActivo?.anio ?? ""}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <TarjetaKpi key={k.label} {...k} />
        ))}
      </div>

      <EstudiantesPorAula matriculas={datos.matriculas} />
    </div>
  );
}
