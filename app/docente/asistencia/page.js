import { createClient } from "@/lib/supabase/server";
import { asignacionesDelDocente, aulasDeAsignaciones } from "@/lib/consultas";
import { docenteActual } from "@/lib/sesion";
import AsistenciaDocente from "@/components/AsistenciaDocente";
import SinFichaDocente from "@/components/SinFichaDocente";

export const metadata = { title: "Asistencia · Portal del docente" };

export default async function DocenteAsistenciaPage() {
  const [supabase, docente] = await Promise.all([createClient(), docenteActual()]);
  if (!docente) return <SinFichaDocente />;

  const { asignaciones } = await asignacionesDelDocente(supabase, docente.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Asistencia</h1>
      <p className="mt-1 text-sm text-stone-500">
        Marca la asistencia del día de tu aula. Dirección puede verla y descargarla.
      </p>
      <div className="mt-6">
        <AsistenciaDocente aulas={aulasDeAsignaciones(asignaciones)} />
      </div>
    </div>
  );
}
