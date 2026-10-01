import { createClient } from "@/lib/supabase/server";
import { docenteActual } from "@/lib/consultas";
import DocentePerfilForm from "@/components/DocentePerfilForm";
import SinFichaDocente from "@/components/SinFichaDocente";

export const metadata = { title: "Mi perfil · Portal del docente" };

export default async function DocentePerfilPage() {
  const supabase = await createClient();
  const docente = await docenteActual(supabase);
  if (!docente) return <SinFichaDocente />;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Mi perfil</h1>
      <p className="mt-1 text-sm text-stone-500">
        Los padres de tus estudiantes ven tu foto y tu información profesional en su portal.
      </p>
      <div className="mt-6">
        <DocentePerfilForm docente={docente} />
      </div>
    </div>
  );
}
