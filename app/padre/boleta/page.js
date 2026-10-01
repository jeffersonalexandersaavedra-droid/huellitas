import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { estudianteActual, matriculaVigente } from "@/lib/consultas";
import { bimestresDesbloqueados } from "@/lib/bimestres";
import { BIMESTRES } from "@/lib/cursos";
import { COLEGIO } from "@/lib/colegio";
import { fechaLarga } from "@/lib/fecha";
import ImprimirButton from "@/components/ImprimirButton";
import AvisoVacio from "@/components/AvisoVacio";

export const metadata = { title: "Boleta preventiva" };

const NIVELES = { inicial: "Inicial", primaria: "Primaria" };
const COLOR_NOTA = { AD: "text-emerald-700", A: "text-huellitas-primary", B: "text-amber-700", C: "text-rose-700" };

// Boleta preventiva: notas del registro auxiliar de los bimestres pagados
// (acumulativa: el 2.º bimestre incluye el 1.º, etc.). No reemplaza a la
// boleta oficial del SIAGIE.
export default async function BoletaPreventivaPage() {
  const supabase = await createClient();
  const estudiante = await estudianteActual(supabase);
  const matricula = estudiante
    ? await matriculaVigente(
        supabase,
        estudiante.id,
        "id, aulas(nombre, nivel), anios_escolares(anio)"
      )
    : null;

  if (!matricula) {
    return <AvisoVacio>No tienes una matrícula activa. Comunícate con administración.</AvisoVacio>;
  }

  const [{ data: cuotas }, { data: notas }, { data: observaciones }, { data: catalogo }, { data: docentes }] =
    await Promise.all([
      supabase.from("cuotas").select("mes, estado").eq("matricula_id", matricula.id),
      supabase.from("notas_curso").select("curso, bimestre, nota").eq("matricula_id", matricula.id),
      supabase
        .from("observaciones_estudiante")
        .select("bimestre, texto")
        .eq("matricula_id", matricula.id)
        .order("bimestre"),
      supabase
        .from("cursos")
        .select("nombre")
        .eq("nivel", matricula.aulas?.nivel ?? "")
        .eq("activo", true)
        .order("nombre"),
      supabase.rpc("mis_docentes"),
    ]);

  const visibles = bimestresDesbloqueados(cuotas ?? []);
  const notasVisibles = (notas ?? []).filter((n) => visibles.includes(n.bimestre));
  const obsVisibles = (observaciones ?? []).filter((o) => visibles.includes(o.bimestre));

  const nota = {};
  for (const n of notasVisibles) nota[`${n.curso}|${n.bimestre}`] = n.nota;
  const cursos = [
    ...new Set([...(catalogo ?? []).map((c) => c.nombre), ...notasVisibles.map((n) => n.curso)]),
  ];

  const anio = matricula.anios_escolares?.anio ?? new Date().getFullYear();
  const tutor = (docentes ?? []).find((d) => d.es_tutor);
  const datos = [
    ["Estudiante", `${estudiante.apellidos}, ${estudiante.nombres}`],
    ["DNI", estudiante.dni],
    ["Nivel", NIVELES[matricula.aulas?.nivel] ?? "—"],
    ["Grado / aula", matricula.aulas?.nombre ?? "—"],
    ["Tutor(a)", tutor ? `${tutor.nombres} ${tutor.apellidos}` : "—"],
    ["Año escolar", anio],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/padre"
          className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Volver al portal
        </Link>
        {visibles.length > 0 && <ImprimirButton />}
      </div>

      {visibles.length === 0 ? (
        <AvisoVacio icono={Lock}>
          Para ver la boleta preventiva debes tener pagadas las pensiones del primer bimestre
          (marzo a mayo). Regulariza tus pagos para desbloquearla.
        </AvisoVacio>
      ) : (
        <article className="rounded-xl bg-white p-6 shadow-sm print:rounded-none print:p-0 print:shadow-none md:p-10">
          <header className="flex items-center gap-4 border-b-2 border-huellitas-primary pb-4">
            <Image src="/logos/huellitas-escudo.png" alt="" width={56} height={68} />
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold text-huellitas-primary">{COLEGIO.nombre}</p>
              <p className="text-xs text-stone-500">
                {COLEGIO.direccion} · {COLEGIO.dre} · {COLEGIO.ugel}
              </p>
            </div>
          </header>

          <h1 className="mt-5 text-center font-display text-lg font-semibold uppercase tracking-wide text-huellitas-ink">
            Boleta preventiva de notas {anio}
          </h1>
          <p className="text-center text-xs text-stone-500">
            Bimestres incluidos: {visibles.map((b) => `${b}.º`).join(", ")}
          </p>

          <dl className="mt-5 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex gap-2">
                <dt className="w-28 shrink-0 text-stone-500">{etiqueta}:</dt>
                <dd className="font-medium text-huellitas-ink">{valor}</dd>
              </div>
            ))}
          </dl>

          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-huellitas-primary-light text-huellitas-primary">
                <th className="border border-stone-300 px-3 py-2 text-left">Área curricular</th>
                {BIMESTRES.map((b) => (
                  <th key={b} className="w-20 border border-stone-300 px-2 py-2 text-center">
                    {b}.º Bim.
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cursos.map((curso) => (
                <tr key={curso}>
                  <td className="border border-stone-300 px-3 py-2 text-huellitas-ink">{curso}</td>
                  {BIMESTRES.map((b) => {
                    const valor = visibles.includes(b) ? nota[`${curso}|${b}`] : null;
                    return (
                      <td
                        key={b}
                        className={`border border-stone-300 px-2 py-2 text-center font-semibold ${
                          COLOR_NOTA[valor] ?? "text-stone-300"
                        }`}
                      >
                        {valor ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {obsVisibles.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-huellitas-primary">Observaciones del docente</h2>
              <ul className="mt-2 space-y-1 text-sm text-stone-700">
                {obsVisibles.map((o, i) => (
                  <li key={i}>
                    <b>{o.bimestre}.º bimestre:</b> {o.texto}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-6 text-xs text-stone-500">
            Escala: AD = logro destacado · A = logro esperado · B = en proceso · C = en inicio.
          </p>
          <p className="mt-3 rounded-lg border border-huellitas-accent/50 bg-huellitas-accent/10 p-3 text-xs text-huellitas-ink print:border-stone-300 print:bg-transparent">
            Documento referencial generado el {fechaLarga()} a partir del registro auxiliar del
            docente. No reemplaza a la boleta oficial (Informe de progreso del SIAGIE), que se
            solicita en la dirección del colegio con firma y sello.
          </p>
        </article>
      )}
    </div>
  );
}
