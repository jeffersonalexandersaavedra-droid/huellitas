import { createClient } from "@/lib/supabase/server";
import ComprobanteImpreso from "@/components/ComprobanteImpreso";

export const metadata = { title: "Comprobante" };

export default async function ComprobanteAdminPage({ params, searchParams }) {
  const [{ id }, { formato }] = await Promise.all([params, searchParams]);
  return (
    <ComprobanteImpreso
      supabase={await createClient()}
      id={id}
      formato={formato}
      volver={{ href: "/admin/facturacion?tab=emitidos", texto: "Volver a facturación" }}
    />
  );
}
