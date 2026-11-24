import { createClient } from "@/lib/supabase/server";
import PagosBandeja from "@/components/PagosBandeja";
import RegistrarPagoCaja from "@/components/RegistrarPagoCaja";
import RecordatoriosPago from "@/components/RecordatoriosPago";
import Pestanas from "@/components/Pestanas";
import { obtenerAnioActivo, estudiantesMatriculados, familiasPorRecordar, horarioAtencion } from "@/lib/consultas";
import { nubefactConfigurado } from "@/lib/nubefact";
import { conEnlaceVoucher } from "@/lib/vouchers";
import { canalesAutomaticos } from "@/lib/envioRecordatorios";

export const metadata = { title: "Pagos" };

const PESTANAS = [
  { id: "vouchers", href: "/admin/pagos", label: "Vouchers por validar" },
  { id: "caja", href: "/admin/pagos?tab=caja", label: "Registrar pago en caja" },
  { id: "recordatorios", href: "/admin/pagos?tab=recordatorios", label: "Recordatorios" },
];

async function bandejaVouchers(supabase) {
  const { data: pagos } = await supabase
    .from("pagos")
    .select(
      "id, monto, metodo, banco, numero_operacion, voucher_url, fecha_pago, estado, cuota_id, cuotas_ids, pagado_por, pagado_por_parentesco, cuotas(mes, conceptos_cobro(nombre)), matriculas(estudiantes(nombres, apellidos, dni), aulas(nombre))"
    )
    .eq("estado", "validando")
    .order("fecha_pago", { ascending: true });
  return <PagosBandeja pagos={await conEnlaceVoucher(supabase, pagos ?? [])} />;
}

async function cajaDelColegio(supabase) {
  const anioActivo = await obtenerAnioActivo(supabase);
  return (
    <RegistrarPagoCaja
      estudiantes={await estudiantesMatriculados(supabase, anioActivo?.id)}
      anio={anioActivo?.anio}
      configurado={nubefactConfigurado()}
      consultaHabilitada={Boolean(process.env.DECOLECTA_TOKEN)}
    />
  );
}

async function recordatorios(supabase) {
  const anioActivo = await obtenerAnioActivo(supabase);
  const [familias, horario] = await Promise.all([
    familiasPorRecordar(supabase, anioActivo?.id),
    horarioAtencion(supabase),
  ]);
  return <RecordatoriosPago familias={familias} horario={horario} canales={canalesAutomaticos()} />;
}

const CONTENIDO = { vouchers: bandejaVouchers, caja: cajaDelColegio, recordatorios };

export default async function PagosPage({ searchParams }) {
  const [{ tab }, supabase] = await Promise.all([searchParams, createClient()]);
  const activa = CONTENIDO[tab] ? tab : "vouchers";
  const contenido = await CONTENIDO[activa](supabase);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Pagos</h1>
      <p className="mt-1 text-sm text-stone-500">
        Valida los vouchers que envían los padres, registra los pagos recibidos en el colegio y recuerda las
        pensiones pendientes.
      </p>

      <div className="mt-6">
        <Pestanas items={PESTANAS} activo={activa} />
      </div>

      <div className="mt-6">{contenido}</div>
    </div>
  );
}
