import { createClient } from "@/lib/supabase/server";
import NotasAdminPanel from "@/components/NotasAdminPanel";
import { obtenerAnioActivo, aulasDelAnio } from "@/lib/consultas";

export const metadata = { title: "Notas" };

export default async function NotasPage() {
  const supabase = await createClient();

  const anioActivo = await obtenerAnioActivo(supabase);

  const aulas = await aulasDelAnio(supabase, anioActivo?.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Notas por aula
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Consulta y exporta las notas y observaciones registradas por los
        docentes.
      </p>

      <div className="mt-6">
        <NotasAdminPanel aulas={aulas} />
      </div>
    </div>
  );
}
