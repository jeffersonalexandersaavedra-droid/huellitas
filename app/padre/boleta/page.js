import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { estudianteActual, matriculaVigente, informeDeProgreso } from "@/lib/consultas";
import ImprimirButton from "@/components/ImprimirButton";
import AvisoVacio from "@/components/AvisoVacio";
import InformeProgreso from "@/components/InformeProgreso";

export const metadata = { title: "Boleta preventiva" };

// Boleta preventiva: vista previa del Informe de progreso con las notas de
// los bimestres ya iniciados. No depende de los pagos (ver lib/bimestres.js).
export default async function BoletaPreventivaPage() {
  const supabase = await createClient();
  const estudiante = await estudianteActual(supabase);
  const matricula = estudiante ? await matriculaVigente(supabase, estudiante.id, "id") : null;
  const informe = matricula ? await informeDeProgreso(supabase, matricula.id) : null;

  if (!informe) {
    return <AvisoVacio>No tienes una matrícula activa. Comunícate con administración.</AvisoVacio>;
  }

  const conNotas = Object.keys(informe.notas).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/padre"
          className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Volver al portal
        </Link>
        {conNotas && <ImprimirButton />}
      </div>

      {conNotas ? (
        <InformeProgreso informe={informe} />
      ) : (
        <AvisoVacio>
          Aún no hay notas registradas este año. La boleta preventiva aparecerá cuando los docentes
          registren las notas del primer bimestre.
        </AvisoVacio>
      )}
    </div>
  );
}
