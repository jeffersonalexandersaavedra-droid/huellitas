import { ClipboardCheck } from "lucide-react";
import { ESTADOS_ASISTENCIA, CLAVES_ASISTENCIA, totalesVacios, porcentajeAsistencia } from "@/lib/asistencia";
import { diaYMes } from "@/lib/fecha";

const ULTIMAS = 5;

// Portal del padre: resumen de asistencia del año y las últimas faltas o
// tardanzas. `registros`: [{ fecha, estado }] de la matrícula vigente.
export default function AsistenciaPadre({ registros }) {
  const totales = totalesVacios();
  for (const r of registros) totales[r.estado] += 1;
  const novedades = registros
    .filter((r) => r.estado !== "asistio")
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, ULTIMAS);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-huellitas-primary">
        <ClipboardCheck className="h-5 w-5" strokeWidth={2} />
        Asistencia
      </h2>

      {registros.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Aún no hay asistencia registrada este año.</p>
      ) : (
        <>
          <p className="mt-3 text-sm text-huellitas-ink">
            Vino a clases el{" "}
            <span className="font-display text-2xl font-semibold text-huellitas-primary">
              {porcentajeAsistencia(totales)}%
            </span>{" "}
            de los {registros.length} días registrados.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {CLAVES_ASISTENCIA.map((k) => (
              <span key={k} className={`rounded-full px-2.5 py-1 ${ESTADOS_ASISTENCIA[k].clase}`}>
                {ESTADOS_ASISTENCIA[k].label}: {totales[k]}
              </span>
            ))}
          </div>
          {novedades.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-huellitas-ink">Últimas faltas y tardanzas</h3>
              <ul className="mt-2 space-y-1 text-sm text-stone-600">
                {novedades.map((r) => (
                  <li key={r.fecha} className="flex items-center justify-between gap-3">
                    <span>{diaYMes(r.fecha)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADOS_ASISTENCIA[r.estado].clase}`}>
                      {ESTADOS_ASISTENCIA[r.estado].label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
