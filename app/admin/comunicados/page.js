import { createClient } from "@/lib/supabase/server";
import { obtenerAnioActivo, aulasDelAnio, comunicadosRecientes } from "@/lib/consultas";
import { opcionesDestino } from "@/lib/comunicados";
import ComunicadosManager from "@/components/ComunicadosManager";

export const metadata = { title: "Comunicados" };

export default async function ComunicadosAdminPage() {
  const supabase = await createClient();
  const [aulas, comunicados] = await Promise.all([
    obtenerAnioActivo(supabase).then((anio) => aulasDelAnio(supabase, anio?.id)),
    comunicadosRecientes(supabase),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Comunicados y agenda</h1>
      <p className="mt-1 text-sm text-stone-500">
        Avisos que los padres ven al entrar a su portal. Con fecha, también salen en su agenda.
      </p>
      <div className="mt-6">
        <ComunicadosManager
          destinos={opcionesDestino(aulas, { todoElColegio: true })}
          comunicados={comunicados}
          puedeBorrarTodo
        />
      </div>
    </div>
  );
}
