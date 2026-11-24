import CentroAyuda from "@/components/CentroAyuda";
import { GUIAS_PERSONAL } from "@/lib/ayuda";
import { puedeVerRuta } from "@/lib/roles";
import { usuarioSesion } from "@/lib/sesion";
import { contactoSoporte } from "@/lib/servicios";

export const metadata = { title: "Ayuda" };

export default async function AyudaPersonalPage() {
  const rol = (await usuarioSesion())?.app_metadata?.role;
  const guias = GUIAS_PERSONAL.filter((g) => puedeVerRuta(rol, g.ruta) && (!g.soloAdmin || rol === "admin"));
  return <CentroAyuda guias={guias} soporte={contactoSoporte()} />;
}
