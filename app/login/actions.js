"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DNI_REGEX = /^\d{8}$/;
const DNI_NOT_FOUND =
  "No encontramos a nadie con ese DNI. Verifica el número o comunícate con administración.";
const SIN_ACCESO =
  "Esta cuenta aún no tiene acceso al portal. Comunícate con administración para activarla.";
const INVALID_CREDENTIALS =
  "Correo o contraseña incorrectos. Verifica tus datos.";
const SIN_ROL =
  "Esta cuenta no tiene un rol asignado en el sistema. Comunícate con administración.";

export async function login(formData) {
  const identifier = formData.get("identifier")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  let email = identifier;

  // Si escribieron un DNI (8 dígitos), buscamos primero un estudiante y,
  // si no existe, un docente. El admin siempre entra con su correo.
  if (DNI_REGEX.test(identifier)) {
    const admin = createAdminClient();

    const { data: estudiante } = await admin
      .from("estudiantes")
      .select("user_id, email_interno")
      .eq("dni", identifier)
      .maybeSingle();

    if (estudiante) {
      if (!estudiante.user_id || !estudiante.email_interno) {
        return { error: SIN_ACCESO };
      }
      email = estudiante.email_interno;
    } else {
      const { data: docente } = await admin
        .from("docentes")
        .select("user_id, email")
        .eq("dni", identifier)
        .maybeSingle();

      if (!docente) {
        return { error: DNI_NOT_FOUND };
      }
      if (!docente.user_id || !docente.email) {
        return { error: SIN_ACCESO };
      }
      email = docente.email;
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: INVALID_CREDENTIALS };
  }

  const role = data.user?.app_metadata?.role;

  if (role === "admin") {
    redirect("/admin/dashboard");
  }
  if (role === "docente") {
    redirect("/docente");
  }
  if (role === "estudiante") {
    redirect("/padre");
  }

  await supabase.auth.signOut();
  return { error: SIN_ROL };
}
