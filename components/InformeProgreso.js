import { Fragment } from "react";
import Image from "next/image";
import { COLEGIO } from "@/lib/colegio";
import { NIVELES } from "@/lib/grados";
import { fechaLarga } from "@/lib/fecha";
import {
  AREA_TRANSVERSAL,
  BIMESTRES,
  DESCRIPCION_ESCALA,
  ESCALA_NOTAS,
  NOMBRE_BIMESTRE,
  claveNota,
} from "@/lib/cursos";
import NotaBadge from "@/components/NotaBadge";

const celda = "border border-stone-400 px-1.5 py-1 align-middle";
const cabecera = `${celda} bg-stone-200 text-center font-semibold text-stone-800`;

// Tabla de competencias con NL y conclusión por bimestre, como el Informe
// de progreso del SIAGIE. `transversal`: competencias no asociadas a áreas.
function TablaNiveles({ areas, notas, transversal = false }) {
  return (
    <table className="w-full table-fixed border-collapse text-[11px] leading-tight print:text-[9px]">
      <colgroup>
        <col className={transversal ? "w-[29%]" : "w-[9%]"} />
        {!transversal && <col className="w-[20%]" />}
        {BIMESTRES.map((b) => (
          <Fragment key={b}>
            <col className="w-[3.5%]" />
            <col className="w-[11.75%]" />
          </Fragment>
        ))}
        <col className="w-[10%]" />
      </colgroup>
      <thead>
        <tr>
          {transversal ? (
            <th rowSpan={2} className={cabecera}>
              Competencias transversales / No asociada(s) a área(s)
            </th>
          ) : (
            <>
              <th rowSpan={2} className={cabecera}>Área curricular</th>
              <th rowSpan={2} className={cabecera}>Competencias</th>
            </>
          )}
          {BIMESTRES.map((b) => (
            <th key={b} colSpan={2} className={`${cabecera} uppercase`}>
              {NOMBRE_BIMESTRE[b]}
            </th>
          ))}
          <th rowSpan={2} className={cabecera}>
            NL alcanzado al finalizar el período lectivo
          </th>
        </tr>
        <tr>
          {BIMESTRES.map((b) => (
            <Fragment key={b}>
              <th className={cabecera}>NL</th>
              <th className={cabecera}>Conclusión descriptiva</th>
            </Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {areas.flatMap((area) =>
          area.competencias.map((texto, i) => {
            const porBimestre = notas[claveNota(area.nombre, i + 1)] ?? {};
            return (
              <tr key={claveNota(area.nombre, i + 1)} className="[break-inside:avoid]">
                {!transversal && i === 0 && (
                  <td rowSpan={area.competencias.length} className={`${celda} font-semibold uppercase`}>
                    {area.nombre}
                  </td>
                )}
                <td className={celda}>{texto}</td>
                {BIMESTRES.map((b) => (
                  <Fragment key={b}>
                    <td className={`${celda} text-center font-bold`}>{porBimestre[b]?.nota}</td>
                    <td className={celda}>{porBimestre[b]?.conclusion}</td>
                  </Fragment>
                ))}
                <td className={celda} />
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

// En celular la tabla no entra: cada competencia con sus cuatro bimestres.
function ListaNiveles({ areas, notas }) {
  return (
    <div className="space-y-4">
      {areas.map((area) => (
        <section key={area.nombre} className="overflow-hidden rounded-lg border border-stone-300">
          <h3 className="bg-stone-200 px-3 py-2 text-xs font-semibold uppercase text-stone-800">{area.nombre}</h3>
          <ul className="divide-y divide-stone-200">
            {area.competencias.map((texto, i) => {
              const porBimestre = notas[claveNota(area.nombre, i + 1)] ?? {};
              return (
                <li key={i} className="px-3 py-2.5">
                  <p className="text-sm text-huellitas-ink">{texto}</p>
                  <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                    {BIMESTRES.map((b) => (
                      <div key={b}>
                        <span className="block text-[10px] font-medium text-stone-400">B{b}</span>
                        <NotaBadge nota={porBimestre[b]?.nota} />
                      </div>
                    ))}
                  </div>
                  {BIMESTRES.filter((b) => porBimestre[b]?.conclusion).map((b) => (
                    <p key={b} className="mt-1.5 text-xs text-stone-600">
                      <b>B{b}:</b> {porBimestre[b].conclusion}
                    </p>
                  ))}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

// Vista previa del Informe de progreso de las competencias del estudiante
// (formato del SIAGIE). No reemplaza al informe oficial: ver el aviso final.
// informe: ver informeDeProgreso en lib/consultas.js.
export default function InformeProgreso({ informe }) {
  const { estudiante, aula, anio, tutor, bimestres, areas, notas, comentarios, asistencia } = informe;
  const deArea = areas.filter((a) => a.nombre !== AREA_TRANSVERSAL);
  const transversales = areas.filter((a) => a.nombre === AREA_TRANSVERSAL);

  const datos = [
    ["DRE", COLEGIO.dre],
    ["UGEL", COLEGIO.ugel],
    ["Nivel", NIVELES[aula.nivel] ?? aula.nivel],
    ["Código modular", COLEGIO.codigoModular],
    ["Institución educativa", COLEGIO.nombre, true],
    ["Grado", aula.grado],
    ["Sección", aula.seccion || "Única"],
    ["Apellidos y nombres del estudiante", `${estudiante.apellidos}, ${estudiante.nombres}`.toUpperCase(), true],
    ["DNI", estudiante.dni, true],
    ["Apellidos y nombres del docente o tutor", tutor?.toUpperCase() ?? "—", true],
  ];
  const conteo = (valor) => valor || "-";

  return (
    <article className="relative overflow-hidden rounded-xl bg-white p-4 text-huellitas-ink shadow-sm [print-color-adjust:exact] print:overflow-visible print:rounded-none print:p-0 print:shadow-none sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center print:fixed"
      >
        <span className="-rotate-[30deg] whitespace-nowrap text-6xl font-black tracking-[0.2em] text-stone-200/70 sm:text-8xl">
          VISTA PREVIA
        </span>
      </div>

      <div className="relative space-y-5">
        <header className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-center text-sm font-bold uppercase sm:text-base">
              Informe de progreso de las competencias del estudiante – {anio}
            </h1>
            <p className="mt-1 text-center">
              <span className="inline-block rounded-full bg-huellitas-accent/20 px-3 py-0.5 text-xs font-semibold text-huellitas-accent-dark">
                Vista previa · sin valor oficial
              </span>
            </p>
            <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] border-l border-t border-stone-400 text-xs md:grid-cols-[minmax(10rem,auto)_1fr_minmax(6rem,auto)_1fr]">
              {datos.map(([etiqueta, valor, completo]) => (
                <Fragment key={etiqueta}>
                  <dt className="border-b border-r border-stone-400 bg-stone-200 px-2 py-1.5 font-semibold">
                    {etiqueta}:
                  </dt>
                  <dd className={`border-b border-r border-stone-400 px-2 py-1.5 ${completo ? "md:col-span-3" : ""}`}>
                    {valor}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>
          <Image
            src="/logos/huellitas-escudo.png"
            alt={COLEGIO.nombre}
            width={110}
            height={134}
            className="hidden h-auto w-24 shrink-0 sm:block print:block"
          />
        </header>

        <div className="hidden space-y-4 md:block print:block">
          {deArea.length > 0 && <TablaNiveles areas={deArea} notas={notas} />}
          {transversales.length > 0 && <TablaNiveles areas={transversales} notas={notas} transversal />}
        </div>
        <div className="md:hidden print:hidden">
          <ListaNiveles areas={areas} notas={notas} />
        </div>

        <table className="w-full border-collapse text-xs [break-inside:avoid]">
          <tbody>
            {Object.entries(ESCALA_NOTAS).map(([nota, nombre]) => (
              <tr key={nota}>
                <td className={`${celda} w-12 text-center font-bold sm:w-24`}>{nota}</td>
                <td className={`${celda} py-1.5`}>
                  <b className="uppercase">{nombre}</b>
                  <span className="block text-stone-600">{DESCRIPCION_ESCALA[nota]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="border border-stone-400 text-xs [break-inside:avoid]">
          <h2 className="border-b border-stone-400 bg-stone-200 px-2 py-1.5 text-center font-semibold">
            Comentario general
          </h2>
          <div className="space-y-1 px-2 py-2">
            {bimestres.some((b) => comentarios[b]?.length) ? (
              bimestres
                .filter((b) => comentarios[b]?.length)
                .map((b) => (
                  <p key={b}>
                    <b>B{b}:</b> {comentarios[b].join(" ")}
                  </p>
                ))
            ) : (
              <p className="text-stone-400">—</p>
            )}
          </div>
        </section>

        <table className="w-full table-fixed border-collapse text-center text-xs [break-inside:avoid]">
          <thead>
            <tr>
              <th rowSpan={2} className={cabecera}>Período</th>
              <th colSpan={2} className={cabecera}>Inasistencias</th>
              <th colSpan={2} className={cabecera}>Tardanzas</th>
            </tr>
            <tr>
              {["Justificadas", "Injustificadas", "Justificadas", "Injustificadas"].map((t, i) => (
                <th key={i} className={`${cabecera} font-medium`}>
                  <span className="sm:hidden">{t.slice(0, -6)}.</span>
                  <span className="hidden sm:inline">{t}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bimestres.map((b) => (
              <tr key={b}>
                <td className={`${celda} font-semibold`}>B{b}</td>
                <td className={celda}>{conteo(asistencia[b].falta_justificada)}</td>
                <td className={celda}>{conteo(asistencia[b].falta_injustificada)}</td>
                <td className={celda}>{conteo(asistencia[b].tardanza_justificada)}</td>
                <td className={celda}>{conteo(asistencia[b].tardanza)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 border border-stone-400 text-xs [break-inside:avoid]">
          <p className="border-r border-stone-400 bg-stone-200 px-2 py-1.5 text-center">
            Situación al finalizar el período lectivo
          </p>
          <p className="px-2 py-1.5 text-center text-stone-400">Se registra en el SIAGIE al cierre del año</p>
        </div>

        <footer className="space-y-3 [break-inside:avoid]">
          <p className="text-right text-xs text-stone-500">Fecha de emisión de la vista previa: {fechaLarga()}</p>
          <p className="rounded-lg border border-huellitas-accent/50 bg-huellitas-accent/10 p-3 text-xs leading-relaxed print:border-stone-400 print:bg-transparent">
            <b>Vista previa referencial.</b> Se genera con las notas que los docentes registran en el
            portal y puede cambiar hasta el cierre de cada bimestre. El Informe de progreso oficial
            (SIAGIE), con la firma del docente o tutor(a) y la firma y sello de la directora, se
            solicita en la institución educativa: {COLEGIO.direccion}.
          </p>
        </footer>
      </div>
    </article>
  );
}
