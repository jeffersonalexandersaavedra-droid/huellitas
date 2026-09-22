import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// El admin restablece la contraseña de un estudiante o un docente.
// body: { tipo: "estudiante" | "docente", id: <id de la fila>, password }
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { tipo, id, password } = body ?? {};

  if (tipo !== "estudiante" && tipo !== "docente") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "Falta el identificador." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const tabla = tipo === "estudiante" ? "estudiantes" : "docentes";

  const { data: fila, error: filaError } = await admin
    .from(tabla)
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (filaError || !fila) {
    return NextResponse.json({ error: "No se encontró el registro." }, { status: 404 });
  }
  if (!fila.user_id) {
    return NextResponse.json(
      { error: "Esta persona no tiene cuenta de acceso creada." },
      { status: 400 }
    );
  }

  const { error: updError } = await admin.auth.admin.updateUserById(fila.user_id, {
    password,
  });

  if (updError) {
    return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  // Para estudiantes: marcar que vuelve a usar una contraseña dada por el
  // colegio, para que el portal muestre de nuevo el aviso de cambiarla.
  if (tipo === "estudiante") {
    await admin.from("estudiantes").update({ password_cambiado: false }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
