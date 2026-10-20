import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fichaEstudiante } from "@/lib/ficha";
import FichaEstudiante from "@/components/FichaEstudiante";

export const metadata = { title: "Ficha del estudiante" };

export default async function EstudianteDetallePage({ params }) {
  const [{ id }, supabase] = await Promise.all([params, createClient()]);
  const [
    ficha,
    {
      data: { user },
    },
  ] = await Promise.all([fichaEstudiante(supabase, id), supabase.auth.getUser()]);
  if (!ficha) notFound();
  // Solo la dirección da o quita descuentos; la secretaria solo los ve.
  return <FichaEstudiante {...ficha} puedeDarDescuentos={user?.app_metadata?.role === "admin"} />;
}
