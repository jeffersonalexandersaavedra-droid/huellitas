import { createClient } from "@/lib/supabase/server";
import { docenteActual, asignacionesDelDocente, areasPorNivel } from "@/lib/consultas";
import DocentePanel from "@/components/DocentePanel";
import SinFichaDocente from "@/components/SinFichaDocente";

export const metadata = { title: "Notas · Portal del docente" };

export default async function DocenteNotasPage() {
  const supabase = await createClient();
  const docente = await docenteActual(supabase);
  if (!docente) return <SinFichaDocente />;

  const [{ anio, asignaciones }, areas] = await Promise.all([
    asignacionesDelDocente(supabase, docente.id),
    areasPorNivel(supabase),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Registro de notas {anio?.anio ?? ""}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Califica cada competencia con su nivel de logro, como en el SIAGIE. Es la base de la
        boleta preventiva que ven los padres; el Informe de progreso oficial sale del SIAGIE.
      </p>

      <div className="mt-6">
        <DocentePanel
          docenteId={docente.id}
          docente={`${docente.nombres} ${docente.apellidos}`}
          anio={anio?.anio}
          asignaciones={asignaciones}
          areasPorNivel={areas}
        />
      </div>
    </div>
  );
}
