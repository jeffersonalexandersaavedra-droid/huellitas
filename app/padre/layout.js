import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import PadreUserMenu from "@/components/PadreUserMenu";

export default async function PadreLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let estudianteNombre = "";
  let gradoAula = "";

  if (user) {
    const { data: apoderado } = await supabase
      .from("apoderados")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apoderado) {
      const { data: vinculo } = await supabase
        .from("estudiante_apoderado")
        .select("estudiante_id, estudiantes(nombres, apellidos)")
        .eq("apoderado_id", apoderado.id)
        .limit(1)
        .maybeSingle();

      if (vinculo?.estudiantes) {
        estudianteNombre = `${vinculo.estudiantes.nombres} ${vinculo.estudiantes.apellidos}`;
      }

      if (vinculo?.estudiante_id) {
        const { data: matricula } = await supabase
          .from("matriculas")
          .select("aulas(nombre)")
          .eq("estudiante_id", vinculo.estudiante_id)
          .maybeSingle();

        if (matricula?.aulas) {
          gradoAula = matricula.aulas.nombre;
        }
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-huellitas-cream">
      <header className="bg-gradient-to-r from-huellitas-primary to-huellitas-primary-dark px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logos/huellitas-escudo-sin-fondo.png"
              alt=""
              width={32}
              height={39}
              className="h-10 w-auto"
            />
            <span className="font-display text-lg font-semibold text-white">
              Huellitas
            </span>
          </div>

          <div className="text-center">
            <p className="font-display text-lg font-semibold text-white">
              {estudianteNombre || "Portal del padre"}
            </p>
            {gradoAula && <p className="text-sm text-white/80">{gradoAula}</p>}
          </div>

          <PadreUserMenu />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
        {children}
      </main>
    </div>
  );
}
