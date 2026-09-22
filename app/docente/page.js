import { createClient } from "@/lib/supabase/server";
import DocentePanel from "@/components/DocentePanel";

export const metadata = { title: "Portal del docente" };

export default async function DocentePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: docente } = await supabase
    .from("docentes")
    .select("id, nombres, apellidos")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!docente) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-huellitas-ink/70">
          No encontramos tu ficha de docente. Comunícate con administración.
        </p>
      </div>
    );
  }

  const { data: anioActivo } = await supabase
    .from("anios_escolares")
    .select("id, anio")
    .eq("activo", true)
    .maybeSingle();

  const { data: asignaciones } = await supabase
    .from("docente_asignaciones")
    .select("id, aula_id, curso, aulas(id, nombre, nivel)")
    .eq("docente_id", docente.id)
    .eq("anio_escolar_id", anioActivo?.id ?? "");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Mis cursos {anioActivo?.anio ?? ""}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Registra las notas y observaciones de tus estudiantes por bimestre.
      </p>

      <div className="mt-6">
        <DocentePanel
          docenteId={docente.id}
          userId={user.id}
          asignaciones={asignaciones ?? []}
        />
      </div>
    </div>
  );
}
