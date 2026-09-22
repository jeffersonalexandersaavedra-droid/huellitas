import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DNI_REGEX = /^\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const docente = body?.docente ?? {};

  if (!DNI_REGEX.test(docente.dni ?? "")) {
    return NextResponse.json({ error: "El DNI debe tener 8 dígitos." }, { status: 400 });
  }
  if (!docente.nombres?.trim() || !docente.apellidos?.trim()) {
    return NextResponse.json(
      { error: "Nombres y apellidos son obligatorios." },
      { status: 400 }
    );
  }
  if (!docente.password || docente.password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  // Correo de acceso: el que ingrese el admin, o uno interno si no hay.
  const emailProvisto = docente.email?.trim();
  if (emailProvisto && !EMAIL_REGEX.test(emailProvisto)) {
    return NextResponse.json({ error: "El correo no tiene un formato válido." }, { status: 400 });
  }
  const email = emailProvisto || `docente${docente.dni}@huellitas.pe`;

  const admin = createAdminClient();

  const { data: existente } = await admin
    .from("docentes")
    .select("id")
    .eq("dni", docente.dni)
    .maybeSingle();

  if (existente) {
    return NextResponse.json(
      { error: "Ya existe un docente con ese DNI." },
      { status: 409 }
    );
  }

  let authUserId = null;
  let docenteId = null;

  try {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: docente.password,
      email_confirm: true,
      app_metadata: { role: "docente" },
      user_metadata: { nombres: docente.nombres, apellidos: docente.apellidos },
    });

    if (authError || !authData?.user) {
      throw new Error(authError?.message || "No se pudo crear el usuario de acceso.");
    }
    authUserId = authData.user.id;

    const { data: docenteRow, error: docenteError } = await admin
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

    if (docenteError || !docenteRow) {
      throw new Error(docenteError?.message || "No se pudo crear el docente.");
    }
    docenteId = docenteRow.id;

    return NextResponse.json({
      docente_id: docenteId,
      dni: docente.dni,
      email,
      password: docente.password,
    });
  } catch (error) {
    // Rollback: si algo falla, deshacemos lo que se haya creado.
    if (docenteId) {
      await admin.from("docentes").delete().eq("id", docenteId);
    }
    if (authUserId) {
      await admin.auth.admin.deleteUser(authUserId);
    }
    return NextResponse.json(
      { error: error.message || "No se pudo registrar al docente." },
      { status: 500 }
    );
  }
}
