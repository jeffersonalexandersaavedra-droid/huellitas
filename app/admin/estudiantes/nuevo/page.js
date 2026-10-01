import { createClient } from "@/lib/supabase/server";
import RegistrarEstudianteForm from "@/components/RegistrarEstudianteForm";
import { obtenerAnioActivo, aulasDelAnio } from "@/lib/consultas";

export const metadata = { title: "Registrar estudiante" };

export default async function NuevoEstudiantePage({ searchParams }) {
  const { aula } = await searchParams;
  const supabase = await createClient();

  const anioActivo = await obtenerAnioActivo(supabase);

  const aulas = await aulasDelAnio(supabase, anioActivo?.id);

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
        <RegistrarEstudianteForm
          aulas={aulas}
          docentes={docentes ?? []}
          aulaInicial={aulas.some((a) => a.id === aula) ? aula : ""}
        />
      </div>
    </div>
  );
}
