import CentroAyuda from "@/components/CentroAyuda";
import { GUIAS_DOCENTE } from "@/lib/ayuda";
import { contactoSoporte } from "@/lib/servicios";

export const metadata = { title: "Ayuda" };

export default function AyudaDocentePage() {
  return <CentroAyuda guias={GUIAS_DOCENTE} soporte={contactoSoporte()} />;
}
