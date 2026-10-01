import Image from "next/image";
import { FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { docenteActual, enlaceDriveDocentes } from "@/lib/consultas";
import LogoutButton from "@/components/LogoutButton";
import Pestanas from "@/components/Pestanas";
import Avatar from "@/components/Avatar";

const SECCIONES = [
  { id: "notas", href: "/docente", label: "Notas" },
  { id: "asistencia", href: "/docente/asistencia", label: "Asistencia" },
  { id: "incidencias", href: "/docente/incidencias", label: "Incidencias" },
  { id: "perfil", href: "/docente/perfil", label: "Mi perfil" },
];

// El proxy ya garantiza que aquí solo entran docentes.
export default async function DocenteLayout({ children }) {
  const supabase = await createClient();
  const [docente, driveUrl] = await Promise.all([
    docenteActual(supabase),
    enlaceDriveDocentes(supabase),
  ]);

  const nombre = docente ? `${docente.nombres} ${docente.apellidos}` : "Portal del docente";

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

          <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
            <div className="hidden sm:block">
              <Avatar nombre={nombre} fotoUrl={docente?.foto_url} size={36} />
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <p className="truncate font-display text-base font-semibold text-white md:text-lg">
                {nombre}
              </p>
              <p className="truncate text-xs text-white/80">{docente?.especialidad || "Docente"}</p>
            </div>
          </div>

          <div className="shrink-0">
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Pestanas items={SECCIONES} />
          {driveUrl && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-huellitas-accent px-4 py-2 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
            >
              <FolderOpen className="h-4 w-4" strokeWidth={2} />
              Mis unidades (Drive)
            </a>
          )}
        </div>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
