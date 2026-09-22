import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.app_metadata?.role === "admin" ? user : null;
}

// Crear un nuevo administrador.
export async function POST(request) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const { email, password, nombre } = body ?? {};

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: nombre ? { nombre } : {},
  });

  if (error) {
    const msg = /already/i.test(error.message)
      ? "Ya existe una cuenta con ese correo."
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ id: data.user.id, email: data.user.email });
}

// Eliminar un administrador (no puedes eliminarte a ti mismo).
export async function DELETE(request) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const { userId } = body ?? {};

  if (!userId) {
    return NextResponse.json({ error: "Falta el identificador." }, { status: 400 });
  }
  if (userId === actor.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
