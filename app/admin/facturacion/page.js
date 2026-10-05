import { PlugZap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Pestanas from "@/components/Pestanas";
import FacturarPagos from "@/components/FacturarPagos";
import NuevoComprobante from "@/components/NuevoComprobante";
import ComprobantesEmitidos from "@/components/ComprobantesEmitidos";
import SeriesComprobantes from "@/components/SeriesComprobantes";
import {
  obtenerAnioActivo,
  estudiantesMatriculados,
  apoderadosDe,
  filasPorIds,
} from "@/lib/consultas";
import { nubefactConfigurado } from "@/lib/nubefact";
import { enlacesDeArchivos } from "@/lib/emision";
import { hoyISO } from "@/lib/fecha";

export const metadata = { title: "Facturación" };

const PESTANAS = [
  { id: "pendientes", href: "/admin/facturacion", label: "Pagos por facturar" },
  { id: "nuevo", href: "/admin/facturacion?tab=nuevo", label: "Otros cobros" },
  { id: "emitidos", href: "/admin/facturacion?tab=emitidos", label: "Emitidos y reportes" },
  { id: "series", href: "/admin/facturacion?tab=series", label: "Series", soloAdmin: true },
];

const vigente = (c) => c.tipo !== "nota_credito" && c.estado !== "rechazado" && c.estado !== "anulado";

// Pagos validados sin comprobante, con lo necesario para emitirlo.
async function pagosPorFacturar(supabase) {
  const { data } = await supabase
    .from("pagos")
    .select(
      "id, monto, metodo, fecha_pago, pagado_por, cuota_id, cuotas_ids, comprobantes(tipo, estado), matriculas(estudiante_id, estudiantes(nombres, apellidos), aulas(nombre), anios_escolares(anio))"
    )
    .in("estado", ["pagado", "verificado"])
    .order("fecha_pago", { ascending: false })
    .limit(200);

  const pagos = (data ?? []).filter((p) => !p.comprobantes.some(vigente));
  const idsCuotas = [...new Set(pagos.flatMap((p) => (p.cuotas_ids?.length ? p.cuotas_ids : [p.cuota_id])).filter(Boolean))];
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

  return pagos.map(({ comprobantes, matriculas: m, ...p }) => {
    const ids = p.cuotas_ids?.length ? p.cuotas_ids : [p.cuota_id];
    return {
      ...p,
      alumno: m?.estudiantes ? `${m.estudiantes.apellidos} ${m.estudiantes.nombres}` : "Estudiante",
      aula: m?.aulas?.nombre ?? "—",
      anio: m?.anios_escolares?.anio,
      cuotas: cuotas.filter((c) => ids.includes(c.id)).sort((a, b) => (a.mes ?? 0) - (b.mes ?? 0)),
      apoderados: apoderados.get(m?.estudiante_id) ?? [],
    };
  });
}

const CAMPOS_COMPROBANTE =
  "*, referencia:referencia_id(tipo, serie, numero), matriculas(estudiantes(nombres, apellidos))";

async function comprobantesEmitidos(supabase, mes, dia) {
  const [anio, numMes] = mes.split("-").map(Number);
  const finMes = new Date(anio, numMes, 0).getDate();
  const [{ data: delMes }, { data: delDia }] = await Promise.all([
    supabase
      .from("comprobantes")
      .select(CAMPOS_COMPROBANTE)
      .gte("fecha_emision", `${mes}-01`)
      .lte("fecha_emision", `${mes}-${String(finMes).padStart(2, "0")}`)
      .order("fecha_emision", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("comprobantes").select("*").eq("fecha_emision", dia),
  ]);

  const lista = delMes ?? [];
  const anulados = lista.filter((c) => c.estado === "anulado").map((c) => c.id);
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
  const enlaces = await enlacesDeArchivos(lista);

  return {
    comprobantes: lista.map(({ matriculas: m, ...c }) => ({
      ...c,
      alumno: m?.estudiantes ? `${m.estudiantes.apellidos} ${m.estudiantes.nombres}` : null,
      archivo_url: enlaces[c.id] ?? null,
    })),
    delDia: delDia ?? [],
    conNota: notas.map((n) => n.referencia_id),
  };
}

export default async function FacturacionPage({ searchParams }) {
  const { tab, mes: mesParam, dia: diaParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const esAdmin = user?.app_metadata?.role === "admin";
  const pestanas = PESTANAS.filter((p) => !p.soloAdmin || esAdmin);
  const activa = pestanas.find((p) => p.id === tab)?.id ?? "pendientes";
  const configurado = nubefactConfigurado();
  const consultaHabilitada = Boolean(process.env.DECOLECTA_TOKEN);
  const hoy = hoyISO();

  let contenido;
  if (activa === "pendientes") {
    contenido = (
      <FacturarPagos
        pagos={await pagosPorFacturar(supabase)}
        configurado={configurado}
        consultaHabilitada={consultaHabilitada}
      />
    );
  } else if (activa === "nuevo") {
    const anioActivo = await obtenerAnioActivo(supabase);
    const [estudiantes, { data: conceptos }] = await Promise.all([
      estudiantesMatriculados(supabase, anioActivo?.id),
      supabase
        .from("conceptos_cobro")
        .select("nombre, monto_base")
        .eq("activo", true)
        .not("tipo", "in", "(pension,matricula)")
        .order("nombre"),
    ]);
    contenido = (
      <NuevoComprobante
        estudiantes={estudiantes}
        conceptos={conceptos ?? []}
        configurado={configurado}
        consultaHabilitada={consultaHabilitada}
      />
    );
  } else if (activa === "emitidos") {
    const mes = /^\d{4}-\d{2}$/.test(mesParam ?? "") ? mesParam : hoy.slice(0, 7);
    const dia = /^\d{4}-\d{2}-\d{2}$/.test(diaParam ?? "") ? diaParam : hoy;
    contenido = (
      <ComprobantesEmitidos
        {...await comprobantesEmitidos(supabase, mes, dia)}
        mes={mes}
        dia={dia}
        esAdmin={esAdmin}
      />
    );
  } else {
    const { data: series } = await supabase.from("comprobante_series").select("*").order("serie");
    contenido = <SeriesComprobantes series={series ?? []} />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Facturación</h1>
      <p className="mt-1 text-sm text-stone-500">
        Boletas, facturas y notas de crédito electrónicas, y tickets de venta internos.
      </p>

      {!configurado && (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <PlugZap className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
          <p>
            La facturación electrónica aún no está conectada: las boletas y facturas se emiten en SUNAT
            (SOL) o en tu facturador y se registran aquí con su serie, número y PDF, para que el padre
            las vea en su portal.
            {esAdmin &&
              " Para emitirlas directamente desde el sistema, contrata el proveedor (Nubefact) y agrega NUBEFACT_RUTA y NUBEFACT_TOKEN en la configuración del servidor."}
          </p>
        </div>
      )}

      <div className="mt-6">
        <Pestanas items={pestanas} activo={activa} />
      </div>

      <div className="mt-6">{contenido}</div>
    </div>
  );
}
