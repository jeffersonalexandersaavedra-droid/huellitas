import { PlugZap, Receipt, PlusCircle, FolderOpen, BarChart3, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MenuFacturacion from "@/components/MenuFacturacion";
import GlosarioFacturacion from "@/components/GlosarioFacturacion";
import FacturarPagos from "@/components/FacturarPagos";
import NuevoComprobante from "@/components/NuevoComprobante";
import ComprobantesEmitidos from "@/components/ComprobantesEmitidos";
import ReportesFacturacion from "@/components/ReportesFacturacion";
import SeriesComprobantes from "@/components/SeriesComprobantes";
import { obtenerAnioActivo, estudiantesMatriculados, apoderadosDe, filasPorIds } from "@/lib/consultas";
import { nubefactConfigurado } from "@/lib/nubefact";
import { enlacesDeArchivos } from "@/lib/emision";
import { cuotasDelPago } from "@/lib/cuentas";
import { usuarioSesion } from "@/lib/sesion";
import { hoyISO } from "@/lib/fecha";

export const metadata = { title: "Facturación" };

const SECCIONES = [
  { id: "pendientes", icono: Receipt, titulo: "Dar comprobante de un pago", texto: "Pagos cobrados que aún no tienen boleta." },
  { id: "nuevo", icono: PlusCircle, titulo: "Cobrar otra cosa", texto: "Certificados, constancias, uniformes..." },
  { id: "emitidos", icono: FolderOpen, titulo: "Ver los que ya entregué", texto: "Buscar, imprimir o anular." },
  { id: "reportes", icono: BarChart3, titulo: "Reportes para el contador", texto: "Ventas del mes y cuadre de caja." },
  { id: "series", icono: Settings, titulo: "Ajustes", texto: "Series y números de las boletas.", soloAdmin: true },
];

const ESTADOS_COBRADOS = ["pagado", "verificado"];
const vigente = (c) => c.tipo !== "nota_credito" && c.estado !== "rechazado" && c.estado !== "anulado";

// Pagos cobrados sin comprobante, con lo necesario para emitirlo.
async function pagosPorFacturar(supabase) {
  const { data } = await supabase
    .from("pagos")
    .select(
      "id, monto, metodo, fecha_pago, pagado_por, cuota_id, cuotas_ids, comprobantes(tipo, estado), matriculas(estudiante_id, estudiantes(nombres, apellidos), aulas(nombre), anios_escolares(anio))"
    )
    .in("estado", ESTADOS_COBRADOS)
    .order("fecha_pago", { ascending: false })
    .limit(200);

  const pagos = (data ?? []).filter((p) => !p.comprobantes.some(vigente));
  const idsCuotas = [...new Set(pagos.flatMap(cuotasDelPago))];
  const [cuotas, apoderados] = await Promise.all([
    filasPorIds(
      (lote) =>
        supabase
          .from("cuotas")
          .select("id, mes, monto, monto_con_descuento, fecha_vencimiento, conceptos_cobro(nombre)")
          .in("id", lote),
      idsCuotas
    ),
    apoderadosDe(supabase, [...new Set(pagos.map((p) => p.matriculas?.estudiante_id).filter(Boolean))]),
  ]);
  const cuotaPorId = new Map(cuotas.map((c) => [c.id, c]));

  return pagos.map(({ comprobantes, matriculas: m, ...p }) => ({
    ...p,
    alumno: m?.estudiantes ? `${m.estudiantes.apellidos} ${m.estudiantes.nombres}` : "Estudiante",
    aula: m?.aulas?.nombre ?? "—",
    anio: m?.anios_escolares?.anio,
    cuotas: cuotasDelPago(p)
      .map((id) => cuotaPorId.get(id))
      .filter(Boolean)
      .sort((a, b) => (a.mes ?? 0) - (b.mes ?? 0)),
    apoderados: apoderados.get(m?.estudiante_id) ?? [],
  }));
}

// Solo cuántos pagos esperan comprobante (para la tarjeta del menú).
async function cantidadPorFacturar(supabase) {
  const { data } = await supabase
    .from("pagos")
    .select("id, comprobantes(tipo, estado)")
    .in("estado", ESTADOS_COBRADOS)
    .order("fecha_pago", { ascending: false })
    .limit(200);
  return (data ?? []).filter((p) => !p.comprobantes.some(vigente)).length;
}

const CAMPOS_COMPROBANTE =
  "*, referencia:referencia_id(tipo, serie, numero), matriculas(estudiantes(nombres, apellidos))";

async function comprobantesDelMes(supabase, mes) {
  const [anio, numMes] = mes.split("-").map(Number);
  const finMes = new Date(anio, numMes, 0).getDate();
  const { data } = await supabase
    .from("comprobantes")
    .select(CAMPOS_COMPROBANTE)
    .gte("fecha_emision", `${mes}-01`)
    .lte("fecha_emision", `${mes}-${String(finMes).padStart(2, "0")}`)
    .order("fecha_emision", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []).map(({ matriculas: m, ...c }) => ({
    ...c,
    alumno: m?.estudiantes ? `${m.estudiantes.apellidos} ${m.estudiantes.nombres}` : null,
  }));
}

async function datosReportes(supabase, mes, dia) {
  const [delMes, { data: delDia }] = await Promise.all([
    comprobantesDelMes(supabase, mes),
    supabase.from("comprobantes").select("*").eq("fecha_emision", dia),
  ]);
  const anulados = delMes.filter((c) => c.estado === "anulado").map((c) => c.id);
  const notas = await filasPorIds(
    (lote) =>
      supabase
        .from("comprobantes")
        .select("referencia_id")
        .eq("tipo", "nota_credito")
        .neq("estado", "rechazado")
        .in("referencia_id", lote),
    anulados
  );
  return { delMes, delDia: delDia ?? [], conNota: notas.map((n) => n.referencia_id) };
}

async function contenidoDe(activa, supabase, { mes, dia, esAdmin, configurado, consultaHabilitada }) {
  if (activa === "pendientes") {
    const pagos = await pagosPorFacturar(supabase);
    return {
      porFacturar: pagos.length,
      vista: <FacturarPagos pagos={pagos} configurado={configurado} consultaHabilitada={consultaHabilitada} />,
    };
  }

  const porFacturar = cantidadPorFacturar(supabase);
  let vista;
  if (activa === "nuevo") {
    const [estudiantes, { data: conceptos }] = await Promise.all([
      obtenerAnioActivo(supabase).then((anio) => estudiantesMatriculados(supabase, anio?.id)),
      supabase
        .from("conceptos_cobro")
        .select("nombre, monto_base")
        .eq("activo", true)
        .not("tipo", "in", "(pension,matricula)")
        .order("nombre"),
    ]);
    vista = (
      <NuevoComprobante
        estudiantes={estudiantes}
        conceptos={conceptos ?? []}
        configurado={configurado}
        consultaHabilitada={consultaHabilitada}
      />
    );
  } else if (activa === "emitidos") {
    const comprobantes = await comprobantesDelMes(supabase, mes);
    const enlaces = await enlacesDeArchivos(comprobantes);
    vista = (
      <ComprobantesEmitidos
        comprobantes={comprobantes.map((c) => ({ ...c, archivo_url: enlaces[c.id] ?? null }))}
        mes={mes}
        esAdmin={esAdmin}
      />
    );
  } else if (activa === "reportes") {
    vista = <ReportesFacturacion {...await datosReportes(supabase, mes, dia)} mes={mes} dia={dia} />;
  } else {
    const { data: series } = await supabase.from("comprobante_series").select("*").order("serie");
    vista = <SeriesComprobantes series={series ?? []} />;
  }
  return { porFacturar: await porFacturar, vista };
}

export default async function FacturacionPage({ searchParams }) {
  const [{ tab, mes: mesParam, dia: diaParam }, supabase, user] = await Promise.all([
    searchParams,
    createClient(),
    usuarioSesion(),
  ]);
  const esAdmin = user?.app_metadata?.role === "admin";
  const secciones = SECCIONES.filter((s) => !s.soloAdmin || esAdmin);
  const activa = secciones.find((s) => s.id === tab)?.id ?? "pendientes";
  const configurado = nubefactConfigurado();
  const hoy = hoyISO();

  const { porFacturar, vista } = await contenidoDe(activa, supabase, {
    mes: /^\d{4}-\d{2}$/.test(mesParam ?? "") ? mesParam : hoy.slice(0, 7),
    dia: /^\d{4}-\d{2}-\d{2}$/.test(diaParam ?? "") ? diaParam : hoy,
    esAdmin,
    configurado,
    consultaHabilitada: Boolean(process.env.DECOLECTA_TOKEN),
  });
  const seccion = secciones.find((s) => s.id === activa);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Facturación</h1>
        <p className="mt-1 text-sm text-stone-500">
          Aquí entregas boletas, facturas y tickets por lo que pagan los padres.
        </p>
      </div>

      {!configurado && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <PlugZap className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
          <p>
            Por ahora las boletas y facturas se hacen en la página de SUNAT (SOL). Después copias aquí su serie y
            número para que el padre la vea en su portal. Los tickets internos sí se hacen aquí mismo.
            {esAdmin &&
              " Para crearlas directo desde el sistema, contrata Nubefact y agrega NUBEFACT_RUTA y NUBEFACT_TOKEN en Vercel."}
          </p>
        </div>
      )}

      <MenuFacturacion secciones={secciones} activa={activa} contador={{ pendientes: porFacturar }} />

      <section aria-labelledby="seccion-facturacion">
        <h2 id="seccion-facturacion" className="font-display text-xl font-semibold text-huellitas-primary">
          {seccion.titulo}
        </h2>
        <div className="mt-4">{vista}</div>
      </section>

      <GlosarioFacturacion />
    </div>
  );
}
