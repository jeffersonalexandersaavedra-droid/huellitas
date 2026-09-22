import { createClient } from "@/lib/supabase/server";
import NotasAdminPanel from "@/components/NotasAdminPanel";

export const metadata = { title: "Notas" };

export default async function NotasPage() {
  const supabase = await createClient();

  const { data: anioActivo } = await supabase
    .from("anios_escolares")
    .select("id, anio")
    .eq("activo", true)
    .maybeSingle();

  const { data: aulas } = await supabase
    .from("aulas")
    .select("id, nombre, nivel")
    .eq("anio_escolar_id", anioActivo?.id ?? "")
    .order("nombre", { ascending: true });

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
        <NotasAdminPanel aulas={aulas ?? []} />
      </div>
    </div>
  );
}
