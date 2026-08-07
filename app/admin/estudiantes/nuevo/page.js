import { createClient } from "@/lib/supabase/server";
import RegistrarEstudianteForm from "@/components/RegistrarEstudianteForm";

export const metadata = { title: "Registrar estudiante" };

export default async function NuevoEstudiantePage() {
  const supabase = await createClient();

  const { data: anioActivo } = await supabase
    .from("anios_escolares")
    .select("id")
    .eq("activo", true)
    .maybeSingle();

  const { data: aulas } = await supabase
    .from("aulas")
    .select("id, nombre, nivel")
    .eq("anio_escolar_id", anioActivo?.id ?? "")
    .order("nombre", { ascending: true });

  const { data: docentes } = await supabase
    .from("docentes")
    .select("id, nombres, apellidos")
    .eq("activo", true)
    .order("apellidos", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Registrar estudiante
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Crea el acceso al portal del estudiante y su matrícula del año en
        curso.
      </p>

      <div className="mt-6">
        <RegistrarEstudianteForm aulas={aulas ?? []} docentes={docentes ?? []} />
      </div>
    </div>
  );
}
