import { COLEGIO } from "@/lib/colegio";
import { codigoReclamacion, seccionesHoja, NOTAS_HOJA, fechaHoraReclamacion } from "@/lib/reclamaciones";

// Hoja de reclamación completa (constancia para el consumidor y vista del
// colegio). Se imprime tal cual.
export default function HojaReclamacion({ hoja }) {
  return (
    <article className="rounded-xl bg-white p-5 shadow-sm print:p-0 print:shadow-none sm:p-8">
      <header className="flex flex-col gap-1 border-b-2 border-huellitas-primary pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-huellitas-primary">Libro de Reclamaciones</p>
          <p className="text-xs text-stone-500">
            {COLEGIO.nombre} · RUC {COLEGIO.ruc}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-mono text-sm font-semibold text-huellitas-ink">Hoja N.° {codigoReclamacion(hoja)}</p>
          <p className="text-xs text-stone-500">{fechaHoraReclamacion(hoja.created_at)}</p>
        </div>
      </header>

      {seccionesHoja(hoja).map((seccion) => (
        <section key={seccion.titulo} className="mt-5">
          <h2 className="text-sm font-semibold text-huellitas-primary">{seccion.titulo}</h2>
          <dl className="mt-2 divide-y divide-stone-100 text-sm">
            {seccion.filas.map(([etiqueta, valor]) => (
              <div key={etiqueta} className="grid gap-1 py-1.5 sm:grid-cols-[11rem_1fr] sm:gap-3">
                <dt className="text-stone-500">{etiqueta}</dt>
                <dd className="whitespace-pre-wrap break-words text-huellitas-ink">{valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <div className="mt-6 space-y-1 border-t border-stone-200 pt-3 text-xs text-stone-500">
        {NOTAS_HOJA.map((nota) => (
          <p key={nota}>{nota}</p>
        ))}
      </div>
    </article>
  );
}
