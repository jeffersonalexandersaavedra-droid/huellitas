import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { informeDeProgreso } from "@/lib/consultas";
import ImprimirButton from "@/components/ImprimirButton";
import InformeProgreso from "@/components/InformeProgreso";

export const metadata = { title: "Informe de progreso" };

// La misma vista previa del Informe de progreso que ve el padre, desde la
// ficha del estudiante (matrícula más reciente).
export default async function InformeEstudiantePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: matricula } = await supabase
    .from("matriculas")
    .select("id")
    .eq("estudiante_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const informe = matricula ? await informeDeProgreso(supabase, matricula.id) : null;
  if (!informe) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/estudiantes/${id}`}
          className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Volver a la ficha
        </Link>
        <ImprimirButton />
      </div>
      <InformeProgreso informe={informe} />
    </div>
  );
}
