import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { crearCuentaAcceso } from "@/lib/accesos";
import { correoInterno } from "@/lib/colegio";
import { MENSAJE_PASSWORD, passwordValida } from "@/lib/validacion";

// Crea la cuenta de acceso de un estudiante que aún no la tiene (por
// ejemplo, los de la carga masiva). body: { estudianteId, password }
export async function POST(request) {
  if (!(await usuarioConRol("admin", "secretaria"))) return noAutorizado();

  const body = await request.json().catch(() => null);
  const { estudianteId, password } = body ?? {};

  if (!estudianteId) return respuestaError("Falta el estudiante.");
  if (!passwordValida(password)) return respuestaError(MENSAJE_PASSWORD);

  const admin = createAdminClient();

  const { data: estudiante } = await admin
    .from("estudiantes")
    .select("id, dni, nombres, apellidos, user_id")
    .eq("id", estudianteId)
    .maybeSingle();

  if (!estudiante) return respuestaError("No se encontró el estudiante.", 404);
  if (estudiante.user_id) return respuestaError("Este estudiante ya tiene acceso creado.", 409);

  const email = correoInterno("alumno", estudiante.dni);

  let userId;
  try {
    userId = await crearCuentaAcceso(admin, {
      email,
      password,
      rol: "estudiante",
      datos: { nombres: estudiante.nombres, apellidos: estudiante.apellidos },
    });
  } catch (error) {
    return respuestaError(error.message, 500);
  }

  const { error } = await admin
    .from("estudiantes")
    .update({ user_id: userId, email_interno: email, password_cambiado: false })
    .eq("id", estudianteId);

  if (error) {
    await admin.auth.admin.deleteUser(userId);
    return respuestaError(error.message, 500);
  }

  return NextResponse.json({ dni: estudiante.dni, password });
}
