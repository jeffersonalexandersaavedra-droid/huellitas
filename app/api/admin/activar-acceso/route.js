import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Crea la cuenta de acceso (login) de un estudiante que se registró pero
// quedó sin usuario (user_id null). Reutilizable para cualquier alumno a
// medias. body: { estudianteId, password }
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { estudianteId, password } = body ?? {};

  if (!estudianteId) {
    return NextResponse.json({ error: "Falta el estudiante." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: est } = await admin
    .from("estudiantes")
    .select("id, dni, user_id, email_interno")
    .eq("id", estudianteId)
    .maybeSingle();

  if (!est) {
    return NextResponse.json({ error: "No se encontró el estudiante." }, { status: 404 });
  }
  if (est.user_id) {
    return NextResponse.json(
      { error: "Este estudiante ya tiene acceso creado." },
      { status: 409 }
    );
  }

  const email = est.email_interno || `estudiante${est.dni}@huellitas.pe`;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "estudiante" },
  });

  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: authError?.message || "No se pudo crear la cuenta de acceso." },
      { status: 500 }
    );
  }

  const { error: updError } = await admin
    .from("estudiantes")
    .update({
      user_id: authData.user.id,
      email_interno: email,
      password_cambiado: false,
    })
    .eq("id", estudianteId);

  if (updError) {
    // Rollback: si no se pudo vincular, borrar el usuario recién creado.
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  return NextResponse.json({ email, password });
}
