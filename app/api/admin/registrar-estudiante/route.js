import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { crearCuentaAcceso } from "@/lib/accesos";
import { prepararMatricula, crearMatricula } from "@/lib/matricula";
import { correoInterno } from "@/lib/colegio";
import { DNI_REGEX, MENSAJE_PASSWORD, passwordValida } from "@/lib/validacion";

const limpio = (valor) => valor?.trim() || null;

// Matrícula completa: cuenta de acceso del estudiante (entra con su DNI),
// ficha, apoderados, matrícula y pensiones del año.
export async function POST(request) {
  if (!(await usuarioConRol("admin", "secretaria"))) return noAutorizado();

  const body = await request.json().catch(() => null);
  const estudiante = body?.estudiante ?? {};
  const matricula = body?.matricula ?? {};
  const apoderados = body?.apoderados ?? [];

  if (!DNI_REGEX.test(estudiante.dni ?? "")) return respuestaError("El DNI debe tener 8 dígitos.");
  if (!estudiante.nombres?.trim() || !estudiante.apellidos?.trim()) {
    return respuestaError("Nombres y apellidos son obligatorios.");
  }
  if (!passwordValida(estudiante.password)) return respuestaError(MENSAJE_PASSWORD);
  if (!matricula.aulaId) return respuestaError("Selecciona un aula.");
  if (!Array.isArray(apoderados) || apoderados.length < 1 || apoderados.length > 2) {
    return respuestaError("Debes registrar entre 1 y 2 apoderados.");
  }
  if (apoderados.some((a) => !a.nombres?.trim() || !a.apellidos?.trim() || !a.parentesco)) {
    return respuestaError("Cada apoderado necesita nombres, apellidos y parentesco.");
  }

  const admin = createAdminClient();

  const { data: existente } = await admin
    .from("estudiantes")
    .select("id")
    .eq("dni", estudiante.dni)
    .maybeSingle();
  if (existente) return respuestaError("Ya existe un estudiante con ese DNI.", 409);

  let plan;
  try {
    plan = await prepararMatricula(admin, matricula.aulaId);
  } catch (error) {
    return respuestaError(error.message);
  }

  const email = correoInterno("alumno", estudiante.dni);
  let authUserId = null;
  let estudianteId = null;
  const apoderadoIds = [];

  try {
    authUserId = await crearCuentaAcceso(admin, {
      email,
      password: estudiante.password,
      rol: "estudiante",
      datos: { nombres: estudiante.nombres, apellidos: estudiante.apellidos },
    });

    const { data: fila, error: estudianteError } = await admin
      .from("estudiantes")
      .insert({
        dni: estudiante.dni,
        nombres: estudiante.nombres.trim(),
        apellidos: estudiante.apellidos.trim(),
        fecha_nacimiento: estudiante.fechaNacimiento || null,
        user_id: authUserId,
        email_interno: email,
        password_cambiado: false,
      })
      .select("id")
      .single();
    if (estudianteError || !fila) {
      throw new Error(estudianteError?.message || "No se pudo crear el estudiante.");
    }
    estudianteId = fila.id;

    const hayPrincipal = apoderados.some((a) => a.esPrincipal);
    for (const [index, a] of apoderados.entries()) {
      const { data: apoderado, error: apoderadoError } = await admin
        .from("apoderados")
        .insert({
          nombres: a.nombres.trim(),
          apellidos: a.apellidos.trim(),
          dni: limpio(a.dni),
          parentesco: a.parentesco,
          telefono: limpio(a.telefono),
          email: limpio(a.email),
          direccion: limpio(a.direccion),
        })
        .select("id")
        .single();
      if (apoderadoError || !apoderado) {
        throw new Error(apoderadoError?.message || "No se pudo registrar al apoderado.");
      }
      apoderadoIds.push(apoderado.id);

      const { error: vinculoError } = await admin.from("estudiante_apoderado").insert({
        estudiante_id: estudianteId,
        apoderado_id: apoderado.id,
        es_principal: hayPrincipal ? Boolean(a.esPrincipal) : index === 0,
      });
      if (vinculoError) throw new Error(vinculoError.message);
    }

    await crearMatricula(admin, plan, {
      estudianteId,
      docenteId: matricula.docenteId || null,
    });

    return NextResponse.json({
      estudiante_id: estudianteId,
      dni: estudiante.dni,
      password: estudiante.password,
    });
  } catch (error) {
    // Deshace todo lo creado: el estudiante arrastra en cascada sus
    // vínculos; los apoderados y la cuenta se borran aparte.
    if (estudianteId) await admin.from("estudiantes").delete().eq("id", estudianteId);
    if (apoderadoIds.length) await admin.from("apoderados").delete().in("id", apoderadoIds);
    if (authUserId) await admin.auth.admin.deleteUser(authUserId);
    return respuestaError(error.message || "No se pudo registrar al estudiante.", 500);
  }
}
