import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { crearCuentaAcceso } from "@/lib/accesos";
import { correoInterno } from "@/lib/colegio";
import { DNI_REGEX, EMAIL_REGEX, MENSAJE_PASSWORD, passwordValida } from "@/lib/validacion";

export async function POST(request) {
  if (!(await usuarioConRol("admin"))) return noAutorizado();

  const body = await request.json().catch(() => null);
  const docente = body?.docente ?? {};

  if (!DNI_REGEX.test(docente.dni ?? "")) return respuestaError("El DNI debe tener 8 dígitos.");
  if (!docente.nombres?.trim() || !docente.apellidos?.trim()) {
    return respuestaError("Nombres y apellidos son obligatorios.");
  }
  if (!passwordValida(docente.password)) return respuestaError(MENSAJE_PASSWORD);

  // Correo de acceso: el del docente o, si no tiene, uno interno del colegio.
  const emailPropio = docente.email?.trim();
  if (emailPropio && !EMAIL_REGEX.test(emailPropio)) {
    return respuestaError("El correo no tiene un formato válido.");
  }
  const email = emailPropio || correoInterno("docente", docente.dni);

  const admin = createAdminClient();

  const { data: existente } = await admin
    .from("docentes")
    .select("id")
    .eq("dni", docente.dni)
    .maybeSingle();
  if (existente) return respuestaError("Ya existe un docente con ese DNI.", 409);

  let authUserId = null;
  try {
    authUserId = await crearCuentaAcceso(admin, {
      email,
      password: docente.password,
      rol: "docente",
      datos: { nombres: docente.nombres, apellidos: docente.apellidos },
    });

    const { data: fila, error } = await admin
      .from("docentes")
      .insert({
        dni: docente.dni,
        nombres: docente.nombres.trim(),
        apellidos: docente.apellidos.trim(),
        email,
        telefono: docente.telefono?.trim() || null,
        user_id: authUserId,
        activo: true,
      })
      .select("id")
      .single();
    if (error || !fila) throw new Error(error?.message || "No se pudo crear el docente.");

    return NextResponse.json({
      docente_id: fila.id,
      dni: docente.dni,
      email,
      password: docente.password,
    });
  } catch (error) {
    if (authUserId) await admin.auth.admin.deleteUser(authUserId);
    return respuestaError(error.message || "No se pudo registrar al docente.", 500);
  }
}
