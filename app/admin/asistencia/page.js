import { createClient } from "@/lib/supabase/server";
import { obtenerAnioActivo, aulasDelAnio } from "@/lib/consultas";
import AsistenciaAdmin from "@/components/AsistenciaAdmin";

export const metadata = { title: "Asistencia" };

export default async function AsistenciaAdminPage() {
  const supabase = await createClient();
  const anio = await obtenerAnioActivo(supabase);
  const aulas = await aulasDelAnio(supabase, anio?.id);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Asistencia</h1>
      <p className="mt-1 text-sm text-stone-500">
        Registro que marcan los docentes. Consulta y descarga por día, mes o año.
      </p>
      <div className="mt-6">
        <AsistenciaAdmin aulas={aulas} anio={anio?.anio ?? new Date().getFullYear()} />
      </div>
    </div>
  );
}
