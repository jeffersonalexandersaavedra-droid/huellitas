import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { crearCuentaAcceso } from "@/lib/accesos";
import { EMAIL_REGEX, MENSAJE_PASSWORD, passwordValida } from "@/lib/validacion";
import { ROLES_PERSONAL } from "@/lib/roles";

// Crear un administrador o una secretaria. body: { nombre, email, password, rol }
export async function POST(request) {
  if (!(await usuarioConRol("admin"))) return noAutorizado();

  const body = await request.json().catch(() => null);
  const { nombre, email, password, rol } = body ?? {};

  if (!ROLES_PERSONAL.includes(rol)) return respuestaError("Rol inválido.");
  if (!EMAIL_REGEX.test(email ?? "")) return respuestaError("Correo inválido.");
  if (!passwordValida(password)) return respuestaError(MENSAJE_PASSWORD);

  try {
    const id = await crearCuentaAcceso(createAdminClient(), {
      email: email.trim(),
      password,
      rol,
      datos: nombre?.trim() ? { nombre: nombre.trim() } : {},
    });
    return NextResponse.json({ id, email: email.trim() });
  } catch (error) {
    return respuestaError(error.message);
  }
}

// Eliminar una cuenta del personal (nunca la propia). body: { userId }
export async function DELETE(request) {
  const actor = await usuarioConRol("admin");
  if (!actor) return noAutorizado();

  const body = await request.json().catch(() => null);
  const userId = body?.userId;

  if (!userId) return respuestaError("Falta el identificador.");
  if (userId === actor.id) return respuestaError("No puedes eliminar tu propia cuenta.");

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  if (!ROLES_PERSONAL.includes(data?.user?.app_metadata?.role)) {
    return respuestaError("Solo se pueden eliminar administradores o secretarias desde aquí.");
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return respuestaError(error.message, 500);

  return NextResponse.json({ ok: true });
}
