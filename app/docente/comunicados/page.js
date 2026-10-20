import { createClient } from "@/lib/supabase/server";
import { docenteActual, asignacionesDelDocente, aulasDeAsignaciones, comunicadosRecientes } from "@/lib/consultas";
import { opcionesDestino } from "@/lib/comunicados";
import ComunicadosManager from "@/components/ComunicadosManager";
import SinFichaDocente from "@/components/SinFichaDocente";

export const metadata = { title: "Comunicados · Portal del docente" };

export default async function DocenteComunicadosPage() {
  const supabase = await createClient();
  const [docente, comunicados] = await Promise.all([docenteActual(supabase), comunicadosRecientes(supabase)]);
  if (!docente) return <SinFichaDocente />;
  const { asignaciones } = await asignacionesDelDocente(supabase, docente.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Comunicados</h1>
      <p className="mt-1 text-sm text-stone-500">
        Envía avisos a los padres de tus aulas (tareas, materiales, salidas). También ves los de dirección.
      </p>
      <div className="mt-6">
        <ComunicadosManager
          destinos={opcionesDestino(aulasDeAsignaciones(asignaciones))}
          comunicados={comunicados}
          usuarioId={docente.user_id}
        />
      </div>
    </div>
  );
}
