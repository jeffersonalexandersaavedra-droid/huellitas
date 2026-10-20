import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fichaEstudiante } from "@/lib/ficha";
import FichaEstudiante from "@/components/FichaEstudiante";

export const metadata = { title: "Ficha del estudiante" };

export default async function EstudianteDetallePage({ params }) {
  const [{ id }, supabase] = await Promise.all([params, createClient()]);
  const ficha = await fichaEstudiante(supabase, id);
  if (!ficha) notFound();
  return <FichaEstudiante {...ficha} />;
}
