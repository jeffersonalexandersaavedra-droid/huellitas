import { CircleCheck, Plug } from "lucide-react";

// Configuración › Servicios opcionales: qué está activo y qué está listo
// para activar cuando la dirección lo apruebe (datos de lib/servicios.js).
export default function ServiciosOpcionales({ servicios }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
        <Plug className="h-5 w-5" strokeWidth={2} />
        Servicios opcionales
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Ya están programados en el sistema. Los que dicen «Listo para activar» funcionan en cuanto el colegio crea la
        cuenta del proveedor, pone sus claves en Vercel (Settings › Environment Variables) y vuelve a publicar.
      </p>

      <ul className="mt-4 divide-y divide-stone-100">
        {servicios.map((s) => (
          <li key={s.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-huellitas-ink">{s.nombre}</p>
              {s.activo ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Activo
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Listo para activar
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-stone-600">{s.detalle}</p>
            <p className="mt-1 text-xs text-stone-500">
              {s.proveedor} · {s.costo}
            </p>
            {!s.activo && (
              <p className="mt-1 text-xs text-stone-500">
                Para activarlo: <span className="font-mono">{s.requiere.join(", ")}</span>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
