import { createClient } from "@/lib/supabase/server";
import PagosBandeja from "@/components/PagosBandeja";

export const metadata = { title: "Pagos" };

export default async function PagosPage() {
  const supabase = await createClient();

  const { data: pagos } = await supabase
    .from("pagos")
    .select(
      "id, monto, metodo, banco, numero_operacion, voucher_url, fecha_pago, estado, cuota_id, cuotas_ids, cuotas(mes, conceptos_cobro(nombre)), matriculas(estudiantes(nombres, apellidos, dni), aulas(nombre))"
    )
    .eq("estado", "validando")
    .order("fecha_pago", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Validación de pagos
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Vouchers subidos por los padres, pendientes de validar.
      </p>

      <div className="mt-6">
        <PagosBandeja pagosIniciales={pagos ?? []} />
      </div>
    </div>
  );
}
