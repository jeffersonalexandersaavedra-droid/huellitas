import { createClient } from "@/lib/supabase/server";
import { docenteActual, asignacionesDelDocente, aulasDeAsignaciones } from "@/lib/consultas";
import IncidenciasDocente from "@/components/IncidenciasDocente";
import SinFichaDocente from "@/components/SinFichaDocente";

export const metadata = { title: "Incidencias · Portal del docente" };

export default async function DocenteIncidenciasPage() {
  const supabase = await createClient();
  const docente = await docenteActual(supabase);
  if (!docente) return <SinFichaDocente />;

  const [{ asignaciones }, { data: incidencias }] = await Promise.all([
    asignacionesDelDocente(supabase, docente.id),
    supabase
      .from("incidencias")
      .select("id, titulo, descripcion, fecha, leida, aulas(nombre)")
      .eq("docente_id", docente.id)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Registro de incidencias
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Tutoría: informa a dirección casos de bullying, conducta o cualquier hecho del aula.
      </p>
      <div className="mt-6">
        <IncidenciasDocente
          docenteId={docente.id}
          aulas={aulasDeAsignaciones(asignaciones)}
          incidencias={incidencias ?? []}
        />
      </div>
    </div>
  );
}
