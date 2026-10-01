import { createClient } from "@/lib/supabase/server";
import DocentesManager from "@/components/DocentesManager";
import DriveDocentesCard from "@/components/DriveDocentesCard";
import { obtenerAnioActivo, aulasDelAnio, enlaceDriveDocentes } from "@/lib/consultas";

export const metadata = { title: "Docentes" };

export default async function DocentesPage() {
  const supabase = await createClient();

  const anioActivo = await obtenerAnioActivo(supabase);

  const { data: docentes } = await supabase
    .from("docentes")
    .select("id, dni, nombres, apellidos, email, telefono, activo")
    .order("apellidos", { ascending: true });

  const aulas = await aulasDelAnio(supabase, anioActivo?.id);

  const { data: asignaciones } = await supabase
    .from("docente_asignaciones")
    .select("id, docente_id, aula_id, curso, aulas(nombre, nivel)")
    .eq("anio_escolar_id", anioActivo?.id ?? "");

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, nombre, nivel, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  const driveUrl = await enlaceDriveDocentes(supabase);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Docentes
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Registra docentes y asígnales las aulas y cursos que dictan este año.
      </p>

      <div className="mt-6 space-y-6">
        <DriveDocentesCard urlInicial={driveUrl} />
        <DocentesManager
          docentes={docentes ?? []}
          aulas={aulas}
          asignaciones={asignaciones ?? []}
          cursos={cursos ?? []}
          anioActivoId={anioActivo?.id ?? null}
        />
      </div>
    </div>
  );
}
