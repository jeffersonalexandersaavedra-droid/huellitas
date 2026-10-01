import { createClient } from "@/lib/supabase/server";
import PagosBandeja from "@/components/PagosBandeja";
import RegistrarPagoCaja from "@/components/RegistrarPagoCaja";
import Pestanas from "@/components/Pestanas";
import { obtenerAnioActivo } from "@/lib/consultas";

export const metadata = { title: "Pagos" };

const PESTANAS = [
  { id: "vouchers", href: "/admin/pagos", label: "Vouchers por validar" },
  { id: "caja", href: "/admin/pagos?tab=caja", label: "Registrar pago en caja" },
];

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

    contenido = <PagosBandeja pagosIniciales={pagos ?? []} usuarioId={user.id} />;
  } else {
    const anioActivo = await obtenerAnioActivo(supabase);
    const { data: matriculas } = await supabase
      .from("matriculas")
      .select("id, estudiante_id, aulas(nombre), estudiantes(dni, nombres, apellidos)")
      .eq("anio_escolar_id", anioActivo?.id ?? "")
      .eq("estado", "activa");

    const estudiantes = (matriculas ?? [])
      .filter((m) => m.estudiantes)
      .map((m) => ({
        matriculaId: m.id,
        estudianteId: m.estudiante_id,
        nombre: `${m.estudiantes.apellidos} ${m.estudiantes.nombres}`,
        dni: m.estudiantes.dni,
        aula: m.aulas?.nombre ?? "—",
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    contenido = <RegistrarPagoCaja estudiantes={estudiantes} usuarioId={user.id} />;
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
