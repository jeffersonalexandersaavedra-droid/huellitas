import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { MENSAJE_PASSWORD, passwordValida } from "@/lib/validacion";

// Restablece la contraseña de un estudiante (admin o secretaria) o de un
// docente (solo admin). body: { tipo: "estudiante" | "docente", id, password }
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { tipo, id, password } = body ?? {};

  if (tipo !== "estudiante" && tipo !== "docente") return respuestaError("Tipo inválido.");

  const roles = tipo === "estudiante" ? ["admin", "secretaria"] : ["admin"];
  if (!(await usuarioConRol(...roles))) return noAutorizado();

  if (!id) return respuestaError("Falta el identificador.");
  if (!passwordValida(password)) return respuestaError(MENSAJE_PASSWORD);

  const admin = createAdminClient();
  const tabla = tipo === "estudiante" ? "estudiantes" : "docentes";

  const { data: fila } = await admin.from(tabla).select("user_id").eq("id", id).maybeSingle();
  if (!fila) return respuestaError("No se encontró el registro.", 404);
  if (!fila.user_id) return respuestaError("Esta persona no tiene cuenta de acceso creada.");

  const { error } = await admin.auth.admin.updateUserById(fila.user_id, { password });
  if (error) return respuestaError(error.message, 500);

  // El estudiante vuelve a usar una contraseña dada por el colegio: el
  // portal le mostrará de nuevo el aviso para cambiarla.
  if (tipo === "estudiante") {
    await admin.from("estudiantes").update({ password_cambiado: false }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
