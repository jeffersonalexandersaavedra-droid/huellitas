import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EnlacesLegales from "@/components/EnlacesLegales";
import { COLEGIO } from "@/lib/colegio";

// Marco de las páginas públicas legales (libro de reclamaciones,
// privacidad y términos): cabecera del colegio y enlaces al pie.
export default function PaginaLegal({ titulo, subtitulo, children }) {
  return (
    <div className="min-h-dvh bg-huellitas-cream">
      <header className="border-b border-stone-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logos/huellitas-escudo.png" alt="" width={32} height={39} />
            <span className="font-display text-lg font-semibold text-huellitas-primary">{COLEGIO.nombre}</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Volver al inicio</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-huellitas-ink sm:text-3xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-stone-500">{subtitulo}</p>}
        <div className="mt-6">{children}</div>
      </main>

      <footer className="border-t border-stone-200 px-4 py-6 print:hidden">
        <div className="mx-auto max-w-3xl">
          <EnlacesLegales className="text-stone-500" />
        </div>
      </footer>
    </div>
  );
}

// Sección numerada de un texto legal.
export function SeccionLegal({ titulo, children }) {
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="font-display text-lg font-semibold text-huellitas-primary">{titulo}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-stone-700 [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}
