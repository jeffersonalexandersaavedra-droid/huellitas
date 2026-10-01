import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { prepararMatricula, crearMatricula } from "@/lib/matricula";
import { DNI_REGEX } from "@/lib/validacion";

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

  let creados = 0;
  const omitidos = [];

  for (const [i, fila] of filas.entries()) {
    const dni = String(fila.dni ?? "").trim();
    const nombres = String(fila.nombres ?? "").trim();
    const apellidos = String(fila.apellidos ?? "").trim();
    const omitir = (motivo) => omitidos.push({ fila: i + 1, dni, motivo });

    if (!DNI_REGEX.test(dni)) {
      omitir("DNI inválido (8 dígitos)");
      continue;
    }
    if (!nombres || !apellidos) {
      omitir("Faltan nombres o apellidos");
      continue;
    }

    const { data: existente } = await admin
      .from("estudiantes")
      .select("id")
      .eq("dni", dni)
      .maybeSingle();
    if (existente) {
      omitir("Ya existe un estudiante con ese DNI");
      continue;
    }

    const { data: estudiante, error } = await admin
      .from("estudiantes")
      .insert({ dni, nombres, apellidos, fecha_nacimiento: fila.fechaNacimiento || null })
      .select("id")
      .single();
    if (error || !estudiante) {
      omitir(error?.message || "No se pudo crear");
      continue;
    }

    try {
      await crearMatricula(admin, plan, { estudianteId: estudiante.id });
      creados += 1;
    } catch (errorMatricula) {
      await admin.from("estudiantes").delete().eq("id", estudiante.id);
      omitir(errorMatricula.message || "No se pudo matricular");
    }
  }

  return NextResponse.json({ creados, omitidos });
}
