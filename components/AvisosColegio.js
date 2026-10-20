import { Megaphone } from "lucide-react";
import { MESES, aFecha, diaYMes, formatFecha } from "@/lib/fecha";

// Portal del padre: agenda (avisos con fecha que aún no pasa) y los
// últimos comunicados del colegio, de su nivel y de su aula. Cada aviso
// trae `nuevo` (publicado hace pocos días), calculado en el servidor.
export default function AvisosColegio({ avisos, agenda }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-huellitas-primary">
        <Megaphone className="h-5 w-5" strokeWidth={2} />
        Avisos del colegio
      </h2>

      {agenda.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-huellitas-ink">Próximas fechas</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {agenda.map((a) => {
              const fecha = aFecha(a.fecha_evento);
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-lg bg-huellitas-cream p-3">
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-huellitas-primary text-white">
                    <span className="font-display text-lg leading-none font-semibold">{fecha.getDate()}</span>
                    <span className="text-[10px] uppercase">{MESES[fecha.getMonth() + 1].slice(0, 3)}</span>
                  </span>
                  <span className="min-w-0 text-sm font-medium text-huellitas-ink">{a.titulo}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {avisos.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Por ahora no hay avisos nuevos.</p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {avisos.map((a) => (
            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-huellitas-ink">{a.titulo}</p>
                {a.nuevo && (
                  <span className="rounded-full bg-huellitas-accent px-2 py-0.5 text-[11px] font-semibold text-huellitas-ink">
                    Nuevo
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                {a.autor} · {formatFecha(a.created_at)}
                {a.fecha_evento && ` · Fecha: ${diaYMes(a.fecha_evento)}`}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-stone-600">{a.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
