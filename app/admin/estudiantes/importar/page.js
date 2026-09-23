import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ImportarEstudiantes from "@/components/ImportarEstudiantes";

export const metadata = { title: "Importar estudiantes" };

export default async function ImportarPage() {
  const supabase = await createClient();

  const { data: anioActivo } = await supabase
    .from("anios_escolares")
    .select("id")
    .eq("activo", true)
    .maybeSingle();

  const { data: aulas } = await supabase
    .from("aulas")
    .select("id, nombre, nivel")
    .eq("anio_escolar_id", anioActivo?.id ?? "")
    .order("nombre", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/estudiantes"
        className="inline-flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Volver a estudiantes
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold text-huellitas-ink">
        Carga masiva de estudiantes
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Importa varios estudiantes de un aula a la vez. La cuenta de acceso de
        cada uno se activa después desde su ficha.
      </p>

      <div className="mt-6">
        <ImportarEstudiantes aulas={aulas ?? []} />
      </div>
    </div>
  );
}
