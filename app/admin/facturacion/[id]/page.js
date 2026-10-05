import { createClient } from "@/lib/supabase/server";
import ComprobanteImpreso from "@/components/ComprobanteImpreso";

export const metadata = { title: "Comprobante" };

export default async function ComprobanteAdminPage({ params }) {
  const { id } = await params;
  return (
    <ComprobanteImpreso
      supabase={await createClient()}
      id={id}
      volver={{ href: "/admin/facturacion?tab=emitidos", texto: "Volver a facturación" }}
    />
  );
}
