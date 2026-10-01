import { createClient } from "@/lib/supabase/server";
import IncidenciasAdmin from "@/components/IncidenciasAdmin";

export const metadata = { title: "Incidencias" };

export default async function IncidenciasAdminPage() {
  const supabase = await createClient();
  const { data: incidencias } = await supabase
    .from("incidencias")
    .select("id, titulo, descripcion, fecha, leida, created_at, aulas(nombre), docentes(nombres, apellidos)")
    .order("leida", { ascending: true })
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Incidencias</h1>
      <p className="mt-1 text-sm text-stone-500">
        Reportes de tutoría enviados por los docentes (bullying, conducta, hechos del aula).
      </p>
      <div className="mt-6">
        <IncidenciasAdmin incidencias={incidencias ?? []} />
      </div>
    </div>
  );
}
