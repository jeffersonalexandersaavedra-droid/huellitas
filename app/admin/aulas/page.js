import { createClient } from "@/lib/supabase/server";
import AulasManager from "@/components/AulasManager";

export const metadata = { title: "Aulas" };

// Aulas como "cajas": cada una muestra sus docentes, sus estudiantes y la
// lista de útiles que descargan los padres. Se organizan por año escolar.
export default async function AulasPage({ searchParams }) {
  const { anio: anioParam } = await searchParams;
  const supabase = await createClient();

  const { data: anios } = await supabase
    .from("anios_escolares")
    .select("id, anio, activo")
    .order("anio", { ascending: false });

  const lista = anios ?? [];
  const anioSel = lista.find((a) => a.id === anioParam) ?? lista.find((a) => a.activo) ?? lista[0];

  const { data: aulasData } = await supabase
    .from("aulas")
    .select(
      "id, nombre, nivel, lista_utiles_url, matriculas(id, estado, estudiantes(id, dni, nombres, apellidos)), docente_asignaciones(curso, docentes(id, nombres, apellidos))"
    )
    .eq("anio_escolar_id", anioSel?.id ?? "")
    .order("nombre", { ascending: true });

  const aulas = (aulasData ?? []).map((a) => {
    const docentes = new Map();
    for (const asig of a.docente_asignaciones ?? []) {
      const d = asig.docentes;
      if (!d) continue;
      if (!docentes.has(d.id)) {
        docentes.set(d.id, { id: d.id, nombre: `${d.nombres} ${d.apellidos}`, cursos: [] });
      }
      docentes.get(d.id).cursos.push(asig.curso);
    }

    const estudiantes = (a.matriculas ?? [])
      .filter((m) => m.estado === "activa" && m.estudiantes)
      .map((m) => ({
        id: m.estudiantes.id,
        dni: m.estudiantes.dni,
        nombre: `${m.estudiantes.apellidos} ${m.estudiantes.nombres}`,
      }))
      .sort((x, y) => x.nombre.localeCompare(y.nombre));

    return {
      id: a.id,
      nombre: a.nombre,
      nivel: a.nivel,
      listaUtilesUrl: a.lista_utiles_url,
      totalMatriculas: (a.matriculas ?? []).length,
      docentes: [...docentes.values()],
      estudiantes,
    };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Aulas</h1>
      <p className="mt-1 text-sm text-stone-500">
        Crea las aulas de cada año, revisa qué docentes y estudiantes tiene cada una y sube su
        lista de útiles.
      </p>

      <div className="mt-6">
        <AulasManager anios={lista} anioSel={anioSel ?? null} aulas={aulas} />
      </div>
    </div>
  );
}
