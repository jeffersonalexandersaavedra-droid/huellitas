import { createClient } from "@/lib/supabase/server";
import DocentesManager from "@/components/DocentesManager";

export const metadata = { title: "Docentes" };

export default async function DocentesPage() {
  const supabase = await createClient();

  const { data: anioActivo } = await supabase
    .from("anios_escolares")
    .select("id, anio")
    .eq("activo", true)
    .maybeSingle();

  const { data: docentes } = await supabase
    .from("docentes")
    .select("id, dni, nombres, apellidos, email, telefono, activo")
    .order("apellidos", { ascending: true });

  const { data: aulas } = await supabase
    .from("aulas")
    .select("id, nombre, nivel")
    .eq("anio_escolar_id", anioActivo?.id ?? "")
    .order("nombre", { ascending: true });

  const { data: asignaciones } = await supabase
    .from("docente_asignaciones")
    .select("id, docente_id, aula_id, curso, aulas(nombre, nivel)")
    .eq("anio_escolar_id", anioActivo?.id ?? "");

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, nombre, nivel, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Docentes
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Registra docentes y asígnales las aulas y cursos que dictan este año.
      </p>

      <div className="mt-6">
        <DocentesManager
          docentes={docentes ?? []}
          aulas={aulas ?? []}
          asignaciones={asignaciones ?? []}
          cursos={cursos ?? []}
          anioActivoId={anioActivo?.id ?? null}
        />
      </div>
    </div>
  );
}
