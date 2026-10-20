import { createClient } from "@/lib/supabase/server";
import ComprobanteImpreso from "@/components/ComprobanteImpreso";

export const metadata = { title: "Comprobante de pago" };

export default async function ComprobantePadrePage({ params, searchParams }) {
  const [{ id }, { formato }] = await Promise.all([params, searchParams]);
  return (
    <ComprobanteImpreso
      supabase={await createClient()}
      id={id}
      formato={formato}
      volver={{ href: "/padre", texto: "Volver al portal" }}
    />
  );
}
