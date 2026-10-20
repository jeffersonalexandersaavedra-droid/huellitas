import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { prepararMatricula, crearMatricula } from "@/lib/matricula";
import { DNI_REGEX } from "@/lib/validacion";

// Un aula entera puede tener decenas de estudiantes: se procesan de a
// varios para no exceder el tiempo de la función.
export const maxDuration = 60;
const LOTE = 8;

// Carga masiva de estudiantes a un aula: crea su ficha, matrícula y
// pensiones. El acceso al portal se activa después desde su ficha.
// body: { aulaId, estudiantes: [{ apellidos, nombres, dni, fechaNacimiento? }] }
export async function POST(request) {
  if (!(await usuarioConRol("admin", "secretaria"))) return noAutorizado();

  const body = await request.json().catch(() => null);
  const filas = Array.isArray(body?.estudiantes) ? body.estudiantes : [];

  if (!body?.aulaId) return respuestaError("Selecciona un aula.");
  if (filas.length === 0) return respuestaError("No hay estudiantes para importar.");

  const admin = createAdminClient();

  let plan;
  try {
    plan = await prepararMatricula(admin, body.aulaId);
  } catch (error) {
    return respuestaError(error.message);
  }

  // 1) Validar las filas y descartar los DNI que ya existen (una sola consulta).
  const omitidos = [];
  const validas = [];
  const enArchivo = new Set();
  filas.forEach((fila, posicion) => {
    const dni = String(fila.dni ?? "").trim();
    const nombres = String(fila.nombres ?? "").trim();
    const apellidos = String(fila.apellidos ?? "").trim();
    const omitir = (motivo) => omitidos.push({ fila: posicion + 1, dni, motivo });
    if (!DNI_REGEX.test(dni)) omitir("DNI inválido (8 dígitos)");
    else if (!nombres || !apellidos) omitir("Faltan nombres o apellidos");
    else if (enArchivo.has(dni)) omitir("DNI repetido en el archivo");
    else {
      enArchivo.add(dni);
      validas.push({ fila: posicion + 1, dni, nombres, apellidos, fechaNacimiento: fila.fechaNacimiento || null });
    }
  });

  const { data: existentes } = await admin
    .from("estudiantes")
    .select("dni")
    .in("dni", validas.map((v) => v.dni));
  const yaExisten = new Set((existentes ?? []).map((e) => e.dni));

  // 2) Crear ficha, matrícula y pensiones de cada uno, de a varios a la vez.
  async function importar({ fila, dni, nombres, apellidos, fechaNacimiento }) {
    if (yaExisten.has(dni)) return { fila, dni, motivo: "Ya existe un estudiante con ese DNI" };
    const { data: estudiante, error } = await admin
      .from("estudiantes")
      .insert({ dni, nombres, apellidos, fecha_nacimiento: fechaNacimiento })
      .select("id")
      .single();
    if (error || !estudiante) return { fila, dni, motivo: error?.message || "No se pudo crear" };
    try {
      await crearMatricula(admin, plan, { estudianteId: estudiante.id });
      return null;
    } catch (errorMatricula) {
      await admin.from("estudiantes").delete().eq("id", estudiante.id);
      return { fila, dni, motivo: errorMatricula.message || "No se pudo matricular" };
    }
  }

  let creados = 0;
  for (let i = 0; i < validas.length; i += LOTE) {
    const resultados = await Promise.all(validas.slice(i, i + LOTE).map(importar));
    for (const omitido of resultados) {
      if (omitido) omitidos.push(omitido);
      else creados += 1;
    }
  }

  return NextResponse.json({ creados, omitidos: omitidos.sort((a, b) => a.fila - b.fila) });
}
