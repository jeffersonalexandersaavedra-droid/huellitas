import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function DocenteLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard de rol: solo docentes entran aquí.
  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "docente") redirect("/login");

  const { data: docente } = await supabase
    .from("docentes")
    .select("nombres, apellidos")
    .eq("user_id", user.id)
    .maybeSingle();

  const nombre = docente
    ? `${docente.nombres} ${docente.apellidos}`
    : "Portal del docente";

  return (
    <div className="flex min-h-dvh flex-col bg-huellitas-cream">
      <header className="bg-gradient-to-r from-huellitas-primary to-huellitas-primary-dark px-4 py-4 md:px-6">
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
              {nombre}
            </p>
            <p className="text-xs text-white/80">Docente</p>
          </div>

          <div className="shrink-0">
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
        {children}
      </main>
    </div>
  );
}
