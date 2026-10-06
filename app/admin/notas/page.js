import { createClient } from "@/lib/supabase/server";
import NotasAdminPanel from "@/components/NotasAdminPanel";
import { obtenerAnioActivo, aulasDelAnio, areasPorNivel } from "@/lib/consultas";

export const metadata = { title: "Notas" };

export default async function NotasPage() {
  const supabase = await createClient();
  const anioActivo = await obtenerAnioActivo(supabase);
  const [aulas, areas] = await Promise.all([aulasDelAnio(supabase, anioActivo?.id), areasPorNivel(supabase)]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Notas por aula</h1>
      <p className="mt-1 text-sm text-stone-500">
        Niveles de logro por competencia, conclusiones y comentarios que registraron los docentes.
      </p>

      <div className="mt-6">
        <NotasAdminPanel aulas={aulas} anio={anioActivo?.anio} areasPorNivel={areas} />
      </div>
    </div>
  );
}
