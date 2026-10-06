"use client";

import { Fragment, useState } from "react";
import { MessageSquareText } from "lucide-react";
import NotaBadge, { claseNota } from "@/components/NotaBadge";
import {
  NOTAS_LITERALES,
  CONCLUSION_MIN,
  CONCLUSION_MAX,
  NOTA_VACIA,
  claveNota,
  conclusionValida,
} from "@/lib/cursos";

const campoTexto =
  "w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

// Matriz de un área: estudiantes × competencias con su nivel de logro (NL).
// Cada fila se abre para ver o escribir las conclusiones descriptivas y el
// comentario general del bimestre. Sin `onNota` es de solo lectura (admin).
//   notas: { matriculaId: { "Matemática#1": { nota, conclusion } } }
//   observaciones: { matriculaId: texto }
export default function TablaCompetencias({ area, estudiantes, notas, observaciones, onNota, onObservacion }) {
  const editable = Boolean(onNota);
  const [abierto, setAbierto] = useState(null);
  const competencias = area.competencias.map((texto, i) => ({
    texto,
    etiqueta: `C${i + 1}`,
    clave: claveNota(area.nombre, i + 1),
  }));

  return (
    <div>
      <ol className="grid gap-x-6 gap-y-1 text-xs leading-snug text-stone-600 sm:grid-cols-2">
        {competencias.map((c) => (
          <li key={c.clave} className="flex gap-1.5">
            <b className="shrink-0 text-huellitas-primary">{c.etiqueta}</b>
            {c.texto}
          </li>
        ))}
      </ol>

      <div className="-mx-3 mt-4 overflow-x-auto sm:mx-0">
        <table className="w-full border-separate border-spacing-0 text-xs sm:text-sm">
          <thead>
            <tr className="text-stone-400">
              <th className="sticky left-0 z-10 w-24 border-b border-r border-stone-200 bg-white px-3 py-2 text-left font-medium uppercase tracking-wide sm:w-auto sm:min-w-[13rem]">
                Estudiante
              </th>
              {competencias.map((c) => (
                <th
                  key={c.clave}
                  title={c.texto}
                  className="border-b border-stone-200 px-1 py-2 text-center font-semibold text-huellitas-primary"
                >
                  {c.etiqueta}
                </th>
              ))}
              <th className="w-10 border-b border-stone-200 px-1 py-2">
                <span className="sr-only">Conclusiones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((e, n) => {
              const propias = notas[e.matriculaId] ?? {};
              const comentario = observaciones[e.matriculaId] ?? "";
              const escritas =
                competencias.filter((c) => propias[c.clave]?.conclusion?.trim()).length + (comentario.trim() ? 1 : 0);
              const estaAbierto = abierto === e.matriculaId;

              return (
                <Fragment key={e.matriculaId}>
                  <tr className="group">
                    <td
                      title={e.nombre}
                      className="sticky left-0 z-10 max-w-[6rem] border-b border-r border-stone-100 bg-white px-3 py-1.5 text-huellitas-ink group-hover:bg-huellitas-cream sm:max-w-none"
                    >
                      <span className="block truncate">
                        <span className="text-stone-400">{n + 1}. </span>
                        <span className="sm:hidden">{e.corto}</span>
                        <span className="hidden sm:inline">{e.nombre}</span>
                      </span>
                    </td>
                    {competencias.map((c) => {
                      const nota = propias[c.clave]?.nota ?? "";
                      return (
                        <td key={c.clave} className="border-b border-stone-100 px-0.5 py-1.5 text-center group-hover:bg-huellitas-cream sm:px-1">
                          {editable ? (
                            <select
                              aria-label={`${c.etiqueta} de ${e.nombre}`}
                              value={nota}
                              onChange={(ev) => onNota(e.matriculaId, c.clave, { nota: ev.target.value })}
                              className={`h-8 w-10 appearance-none rounded-md border border-stone-300 px-0 text-center font-semibold outline-none [text-align-last:center] focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20 sm:h-9 sm:w-12 ${
                                nota ? claseNota(nota) : "bg-white text-stone-300"
                              }`}
                            >
                              <option value="">–</option>
                              {NOTAS_LITERALES.map((valor) => (
                                <option key={valor} value={valor}>
                                  {valor}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <NotaBadge nota={nota} />
                          )}
                        </td>
                      );
                    })}
                    <td className="border-b border-stone-100 px-1.5 py-1.5 text-center group-hover:bg-huellitas-cream">
                      <button
                        type="button"
                        onClick={() => setAbierto(estaAbierto ? null : e.matriculaId)}
                        aria-expanded={estaAbierto}
                        title={editable ? "Conclusiones descriptivas y comentario" : "Ver conclusiones y comentario"}
                        className={`relative inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                          estaAbierto
                            ? "bg-huellitas-primary text-white"
                            : "text-stone-400 hover:bg-huellitas-primary-light hover:text-huellitas-primary"
                        }`}
                      >
                        <MessageSquareText className="h-4 w-4" strokeWidth={2} />
                        {escritas > 0 && !estaAbierto && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-huellitas-accent px-1 text-[10px] font-semibold text-white">
                            {escritas}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>

                  {estaAbierto && (
                    <tr>
                      <td colSpan={competencias.length + 2} className="border-b border-stone-200 bg-huellitas-cream/70 px-3 py-4">
                        <p className="text-sm font-medium text-huellitas-ink">{e.nombre}</p>
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          {competencias.map((c) => {
                            const registro = propias[c.clave] ?? NOTA_VACIA;
                            const conclusion = registro.conclusion ?? "";
                            const invalida = !conclusionValida(conclusion);
                            return (
                              <div key={c.clave}>
                                <p className="flex items-start gap-2 text-xs text-stone-600">
                                  <NotaBadge nota={registro.nota} className="shrink-0 text-xs" />
                                  <span>
                                    <b className="text-huellitas-primary">{c.etiqueta}</b> {c.texto}
                                  </span>
                                </p>
                                {editable ? (
                                  <>
                                    <textarea
                                      rows={2}
                                      maxLength={CONCLUSION_MAX}
                                      value={conclusion}
                                      onChange={(ev) => onNota(e.matriculaId, c.clave, { conclusion: ev.target.value })}
                                      placeholder="Conclusión descriptiva (opcional)"
                                      className={`mt-1.5 ${campoTexto} ${invalida ? "border-rose-400" : ""}`}
                                    />
                                    <p className={`text-right text-[11px] ${invalida || (conclusion.trim() && !registro.nota) ? "text-rose-600" : "text-stone-400"}`}>
                                      {conclusion.trim() && !registro.nota
                                        ? "Elige el NL de esta competencia · "
                                        : invalida
                                          ? `Mínimo ${CONCLUSION_MIN} caracteres · `
                                          : ""}
                                      {conclusion.length}/{CONCLUSION_MAX}
                                    </p>
                                  </>
                                ) : (
                                  <p className="mt-1 text-sm text-huellitas-ink/80">{conclusion || "Sin conclusión."}</p>
                                )}
                              </div>
                            );
                          })}
                          <div className="lg:col-span-2">
                            <p className="text-xs font-medium text-stone-600">
                              Comentario general del bimestre <span className="font-normal text-stone-400">(todas las áreas · sale en la boleta)</span>
                            </p>
                            {editable ? (
                              <textarea
                                rows={2}
                                value={comentario}
                                onChange={(ev) => onObservacion(e.matriculaId, ev.target.value)}
                                placeholder="Comentario general sobre el estudiante"
                                className={`mt-1.5 ${campoTexto}`}
                              />
                            ) : (
                              <p className="mt-1 text-sm text-huellitas-ink/80">{comentario || "Sin comentario."}</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
