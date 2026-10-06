// Consultas que se repetían en varias páginas. Reciben el cliente de
// Supabase (de servidor o de navegador), así siempre respetan el RLS.

import { BIMESTRES, areasCalificables, claveNota } from "@/lib/cursos";
import { bimestreActualPorMes, bimestresIniciados } from "@/lib/bimestres";

export async function obtenerAnioActivo(supabase) {
  const { data } = await supabase
    .from("anios_escolares")
    .select("id, anio")
    .eq("activo", true)
    .maybeSingle();
  return data;
}

export async function aulasDelAnio(supabase, anioId) {
  if (!anioId) return [];
  const { data } = await supabase
    .from("aulas")
    .select("id, nombre, nivel, grado, seccion")
    .eq("anio_escolar_id", anioId)
    .order("nivel", { ascending: true })
    .order("nombre", { ascending: true });
  return data ?? [];
}

// Estudiantes con matrícula activa en un aula, ordenados por apellido.
export async function estudiantesDelAula(supabase, aulaId) {
  const { data } = await supabase
    .from("matriculas")
    .select("id, estudiantes(nombres, apellidos, dni)")
    .eq("aula_id", aulaId)
    .eq("estado", "activa");

  return (data ?? [])
    .filter((m) => m.estudiantes)
    .map(({ id, estudiantes: { nombres, apellidos, dni } }) => ({
      matriculaId: id,
      nombres,
      apellidos,
      nombre: `${apellidos} ${nombres}`,
      // Para columnas angostas: primer apellido + inicial ("Fernández J.")
      corto: `${apellidos.split(" ")[0]} ${nombres.charAt(0)}.`,
      dni,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Áreas con competencias por nivel: { inicial: [...], primaria: [...] },
// cada una { nombre, activo, competencias } en el orden del Informe de
// progreso (ver lib/cursos.js).
export async function areasPorNivel(supabase) {
  const { data } = await supabase.from("cursos").select("nombre, nivel, activo, competencias");
  const areas = areasCalificables(data ?? []);
  return {
    inicial: areas.filter((a) => a.nivel === "inicial"),
    primaria: areas.filter((a) => a.nivel === "primaria"),
  };
}

// Registro de un aula en un bimestre: estudiantes, notas por competencia
// { matriculaId: { "Matemática#1": { nota, conclusion } } }, comentario
// general { matriculaId: texto } y áreas que ya tienen notas. Con docenteId
// solo trae el comentario de ese docente (el que edita).
export async function registroDelAula(supabase, { aulaId, bimestre, docenteId = null }) {
  const estudiantes = await estudiantesDelAula(supabase, aulaId);
  const ids = estudiantes.map((e) => e.matriculaId);
  if (ids.length === 0) return { estudiantes, notas: {}, observaciones: {}, cursosConNotas: [] };

  let consultaObs = supabase
    .from("observaciones_estudiante")
    .select("matricula_id, texto")
    .eq("bimestre", bimestre)
    .in("matricula_id", ids);
  if (docenteId) consultaObs = consultaObs.eq("docente_id", docenteId);

  const [notasData, { data: obsData }] = await Promise.all([
    todasLasFilas(() =>
      supabase
        .from("notas_curso")
        .select("matricula_id, curso, competencia, nota, conclusion")
        .eq("bimestre", bimestre)
        .in("matricula_id", ids)
        .order("id")
    ),
    consultaObs,
  ]);

  const notas = {};
  const cursosConNotas = new Set();
  for (const n of notasData) {
    cursosConNotas.add(n.curso);
    notas[n.matricula_id] = {
      ...notas[n.matricula_id],
      [claveNota(n.curso, n.competencia)]: { nota: n.nota, conclusion: n.conclusion ?? "" },
    };
  }

  const observaciones = {};
  for (const o of obsData ?? []) {
    observaciones[o.matricula_id] = [observaciones[o.matricula_id], o.texto]
      .filter(Boolean)
      .join(" · ");
  }

  return { estudiantes, notas, observaciones, cursosConNotas: [...cursosConNotas] };
}

// Datos del Informe de progreso (boleta preventiva) de una matrícula: áreas
// con sus competencias, notas y comentarios de los bimestres ya iniciados y
// asistencia por bimestre. Lo usan el portal del padre y la ficha del admin.
export async function informeDeProgreso(supabase, matriculaId) {
  const { data: matricula } = await supabase
    .from("matriculas")
    .select(
      "id, estudiantes(dni, nombres, apellidos), aulas(nombre, nivel, grado, seccion), anios_escolares(anio), docentes(nombres, apellidos)"
    )
    .eq("id", matriculaId)
    .maybeSingle();
  if (!matricula?.estudiantes) return null;

  const [areas, { data: notas }, { data: comentarios }, { data: asistencias }] = await Promise.all([
    areasPorNivel(supabase),
    supabase
      .from("notas_curso")
      .select("curso, competencia, bimestre, nota, conclusion")
      .eq("matricula_id", matriculaId),
    supabase
      .from("observaciones_estudiante")
      .select("bimestre, texto")
      .eq("matricula_id", matriculaId)
      .order("fecha_registro"),
    supabase.from("asistencias").select("fecha, estado").eq("matricula_id", matriculaId),
  ]);

  // El padre no puede leer la tabla de docentes: su tutor llega por RPC.
  let tutor = matricula.docentes;
  if (!tutor) {
    const { data: docentes } = await supabase.rpc("mis_docentes");
    tutor = (docentes ?? []).find((d) => d.es_tutor) ?? null;
  }

  // Año en curso: hasta el bimestre actual; años anteriores: completos.
  const anio = matricula.anios_escolares?.anio;
  const bimestres = anio < new Date().getFullYear() ? BIMESTRES : bimestresIniciados();
  const visibles = (filas) => (filas ?? []).filter((f) => bimestres.includes(f.bimestre));

  const notasPorClave = {};
  for (const n of visibles(notas)) {
    const clave = claveNota(n.curso, n.competencia);
    notasPorClave[clave] = { ...notasPorClave[clave], [n.bimestre]: n };
  }

  const comentariosPorBimestre = {};
  for (const c of visibles(comentarios)) {
    (comentariosPorBimestre[c.bimestre] ??= []).push(c.texto);
  }

  const asistencia = Object.fromEntries(bimestres.map((b) => [b, {}]));
  for (const a of asistencias ?? []) {
    const b = bimestreActualPorMes(Number(a.fecha.slice(5, 7)));
    if (asistencia[b]) asistencia[b][a.estado] = (asistencia[b][a.estado] ?? 0) + 1;
  }

  const cursosConNotas = new Set(visibles(notas).map((n) => n.curso));
  return {
    estudiante: matricula.estudiantes,
    aula: matricula.aulas,
    anio,
    tutor: tutor ? `${tutor.apellidos}, ${tutor.nombres}` : null,
    bimestres,
    areas: (areas[matricula.aulas?.nivel] ?? []).filter((a) => a.activo || cursosConNotas.has(a.nombre)),
    notas: notasPorClave,
    comentarios: comentariosPorBimestre,
    asistencia,
  };
}

// Enlace de Drive "Unidades de docentes" que define el admin.
export async function enlaceDriveDocentes(supabase) {
  const { data } = await supabase
    .from("sitio_config")
    .select("contenido")
    .eq("id", "docentes")
    .maybeSingle();
  return data?.contenido?.drive_url ?? "";
}

// Ficha del docente conectado.
export async function docenteActual(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("docentes")
    .select("id, nombres, apellidos, especialidad, bio, foto_url")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  return data;
}

// Aulas y cursos que dicta el docente en el año activo.
export async function asignacionesDelDocente(supabase, docenteId) {
  const anio = await obtenerAnioActivo(supabase);
  const { data } = await supabase
    .from("docente_asignaciones")
    .select("aula_id, curso, aulas(id, nombre, nivel, grado, seccion)")
    .eq("docente_id", docenteId)
    .eq("anio_escolar_id", anio?.id ?? "");
  return { anio, asignaciones: data ?? [] };
}

// Aulas únicas (ordenadas) a partir de las asignaciones de un docente.
export function aulasDeAsignaciones(asignaciones) {
  const aulas = new Map();
  for (const a of asignaciones) {
    if (a.aulas && !aulas.has(a.aula_id)) aulas.set(a.aula_id, a.aulas);
  }
  return [...aulas.values()].sort((x, y) => x.nombre.localeCompare(y.nombre));
}

// Trae todas las filas de una consulta paginando de 1000 en 1000 (límite
// de Supabase). `consulta` es una función que arma la consulta desde cero.
export async function todasLasFilas(consulta, tamano = 1000) {
  const filas = [];
  for (let desde = 0; ; desde += tamano) {
    const { data, error } = await consulta().range(desde, desde + tamano - 1);
    if (error) throw error;
    filas.push(...(data ?? []));
    if (!data || data.length < tamano) return filas;
  }
}

// Como `.in("id", ids)` pero por lotes, para no pasar el largo máximo de la
// URL con cientos de ids. `consulta` recibe un lote y arma la consulta.
export async function filasPorIds(consulta, ids, lote = 100) {
  const filas = [];
  for (let i = 0; i < ids.length; i += lote) {
    const { data, error } = await consulta(ids.slice(i, i + lote));
    if (error) throw error;
    filas.push(...(data ?? []));
  }
  return filas;
}

// Estudiante dueño de la sesión (portal del padre).
export async function estudianteActual(supabase, campos = "id, dni, nombres, apellidos") {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("estudiantes")
    .select(campos)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  return data;
}

// Matrícula activa más reciente del estudiante.
export async function matriculaVigente(supabase, estudianteId, campos = "id, aulas(nombre, nivel)") {
  const { data } = await supabase
    .from("matriculas")
    .select(campos)
    .eq("estudiante_id", estudianteId)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// Estudiantes matriculados en el año, para los buscadores de caja y
// facturación: [{ matriculaId, estudianteId, nombre, dni, aula }].
export async function estudiantesMatriculados(supabase, anioId) {
  const { data } = await supabase
    .from("matriculas")
    .select("id, estudiante_id, aulas(nombre), estudiantes(dni, nombres, apellidos)")
    .eq("anio_escolar_id", anioId ?? "")
    .eq("estado", "activa");
  return (data ?? [])
    .filter((m) => m.estudiantes)
    .map((m) => ({
      matriculaId: m.id,
      estudianteId: m.estudiante_id,
      nombre: `${m.estudiantes.apellidos} ${m.estudiantes.nombres}`,
      dni: m.estudiantes.dni,
      aula: m.aulas?.nombre ?? "—",
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Apoderados de varios estudiantes (el principal primero) con los datos que
// pide un comprobante: Map(estudianteId → [apoderado]).
export async function apoderadosDe(supabase, estudianteIds) {
  if (!estudianteIds.length) return new Map();
  const { data } = await supabase
    .from("estudiante_apoderado")
    .select("estudiante_id, es_principal, apoderados(dni, nombres, apellidos, parentesco, direccion, email)")
    .in("estudiante_id", estudianteIds)
    .order("es_principal", { ascending: false });
  const mapa = new Map();
  for (const v of data ?? []) {
    if (!v.apoderados) continue;
    if (!mapa.has(v.estudiante_id)) mapa.set(v.estudiante_id, []);
    mapa.get(v.estudiante_id).push(v.apoderados);
  }
  return mapa;
}
