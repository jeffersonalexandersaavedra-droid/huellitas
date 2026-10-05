import { createClient } from "@/lib/supabase/server";
import PagosBandeja from "@/components/PagosBandeja";
import RegistrarPagoCaja from "@/components/RegistrarPagoCaja";
import Pestanas from "@/components/Pestanas";
import { obtenerAnioActivo, estudiantesMatriculados } from "@/lib/consultas";
import { nubefactConfigurado } from "@/lib/nubefact";

export const metadata = { title: "Pagos" };

const PESTANAS = [
  { id: "vouchers", href: "/admin/pagos", label: "Vouchers por validar" },
  { id: "caja", href: "/admin/pagos?tab=caja", label: "Registrar pago en caja" },
];

// Ruta del archivo en el depósito "vouchers" (los pagos antiguos guardaban
// la URL pública completa).
const rutaVoucher = (v) => (v?.startsWith("http") ? v.split("/vouchers/")[1] : v);

export default async function PagosPage({ searchParams }) {
  const { tab } = await searchParams;
  const activa = tab === "caja" ? "caja" : "vouchers";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let contenido;
  if (activa === "vouchers") {
    const { data: pagos } = await supabase
      .from("pagos")
      .select(
        "id, monto, metodo, banco, numero_operacion, voucher_url, fecha_pago, estado, cuota_id, cuotas_ids, pagado_por, pagado_por_parentesco, cuotas(mes, conceptos_cobro(nombre)), matriculas(estudiantes(nombres, apellidos, dni), aulas(nombre))"
      )
      .eq("estado", "validando")
      .order("fecha_pago", { ascending: true });

    // Los vouchers son privados: se muestran con enlaces temporales (1 hora).
    const rutas = (pagos ?? []).map((p) => rutaVoucher(p.voucher_url)).filter(Boolean);
    const { data: firmados } = rutas.length
      ? await supabase.storage.from("vouchers").createSignedUrls(rutas, 3600)
      : { data: [] };
    const enlace = Object.fromEntries((firmados ?? []).map((f) => [f.path, f.signedUrl]));

    contenido = (
      <PagosBandeja
        pagosIniciales={(pagos ?? []).map((p) => ({ ...p, voucherUrl: enlace[rutaVoucher(p.voucher_url)] ?? null }))}
        usuarioId={user.id}
      />
    );
  } else {
    const anioActivo = await obtenerAnioActivo(supabase);
    contenido = (
      <RegistrarPagoCaja
        estudiantes={await estudiantesMatriculados(supabase, anioActivo?.id)}
        usuarioId={user.id}
        anio={anioActivo?.anio}
        configurado={nubefactConfigurado()}
        consultaHabilitada={Boolean(process.env.DECOLECTA_TOKEN)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Pagos</h1>
      <p className="mt-1 text-sm text-stone-500">
        Valida los vouchers que envían los padres o registra los pagos recibidos en el colegio.
      </p>

      <div className="mt-6">
        <Pestanas items={PESTANAS} activo={activa} />
      </div>

      <div className="mt-6">{contenido}</div>
    </div>
  );
}
