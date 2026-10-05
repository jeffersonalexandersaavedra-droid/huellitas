import { createClient } from "@/lib/supabase/server";
import ComprobanteImpreso from "@/components/ComprobanteImpreso";

export const metadata = { title: "Comprobante de pago" };

export default async function ComprobantePadrePage({ params }) {
  const { id } = await params;
  return (
    <ComprobanteImpreso
      supabase={await createClient()}
      id={id}
      volver={{ href: "/padre", texto: "Volver al portal" }}
    />
  );
}
