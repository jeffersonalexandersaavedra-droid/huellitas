import Link from "next/link";
import { ArrowRight, ChevronDown, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { enlaceWhatsApp } from "@/lib/whatsapp";

function Soporte({ soporte }) {
  const whatsapp = soporte && enlaceWhatsApp(soporte.whatsapp, "Hola, necesito ayuda con el sistema del colegio Huellitas.");
  return (
    <section className="rounded-xl bg-huellitas-primary p-5 text-white shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <LifeBuoy className="h-5 w-5" strokeWidth={2} />
        Soporte técnico
      </h2>
      {soporte ? (
        <>
          <p className="mt-1 text-sm text-white/80">
            ¿Algo no funciona o tienes una duda que no está aquí? Escríbele a {soporte.nombre}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-huellitas-accent px-4 py-2 text-sm font-medium text-huellitas-ink hover:bg-huellitas-accent-dark hover:text-white"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                WhatsApp
              </a>
            )}
            {soporte.correo && (
              <a
                href={`mailto:${soporte.correo}`}
                className="flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                <Mail className="h-4 w-4" strokeWidth={2} />
                {soporte.correo}
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-white/80">¿Algo no funciona? Avísale a la dirección del colegio.</p>
      )}
    </section>
  );
}

// Centro de ayuda: guías paso a paso (capacitación) y contacto de soporte.
// guias: [{ id, titulo, ruta, pasos }] · soporte: { nombre, whatsapp, correo } | null
export default function CentroAyuda({ guias, soporte }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Ayuda</h1>
        <p className="mt-1 text-sm text-stone-500">Cómo hacer cada tarea en el sistema, paso a paso.</p>
      </div>

      <div className="space-y-3">
        {guias.map((g) => (
          <details key={g.id} className="group rounded-xl bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium text-huellitas-ink">
              {g.titulo}
              <ChevronDown className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-open:rotate-180" strokeWidth={2} />
            </summary>
            <div className="border-t border-stone-100 px-5 pb-5 pt-3">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-stone-700">
                {g.pasos.map((paso) => (
                  <li key={paso}>{paso}</li>
                ))}
              </ol>
              <Link
                href={g.ruta}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
              >
                Ir a la sección
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </details>
        ))}
      </div>

      <Soporte soporte={soporte} />
    </div>
  );
}
