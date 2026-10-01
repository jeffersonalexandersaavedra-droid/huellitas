import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { estudianteActual, matriculaVigente } from "@/lib/consultas";
import PadreUserMenu from "@/components/PadreUserMenu";

// El proxy ya garantiza que aquí solo entran cuentas de estudiante.
export default async function PadreLayout({ children }) {
  const supabase = await createClient();
  const estudiante = await estudianteActual(supabase);
  const matricula = estudiante ? await matriculaVigente(supabase, estudiante.id) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-huellitas-cream">
      <header className="bg-gradient-to-r from-huellitas-primary to-huellitas-primary-dark px-4 py-4 md:px-6 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <Image
              src="/logos/huellitas-escudo-sin-fondo.png"
              alt=""
              width={32}
              height={39}
              className="h-9 w-auto md:h-10"
            />
            <span className="hidden font-display text-lg font-semibold text-white sm:inline">
              Huellitas
            </span>
          </div>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-display text-base font-semibold text-white md:text-lg">
              {estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : "Portal del padre"}
            </p>
            {matricula?.aulas && (
              <p className="truncate text-xs text-white/80 md:text-sm">{matricula.aulas.nombre}</p>
            )}
          </div>

          <div className="shrink-0">
            <PadreUserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
