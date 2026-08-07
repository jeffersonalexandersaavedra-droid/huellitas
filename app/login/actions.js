"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DNI_REGEX = /^\d{8}$/;
const DNI_NOT_FOUND =
  "No encontramos un estudiante con ese DNI. Verifica el número o comunícate con administración.";
const INVALID_CREDENTIALS =
  "Correo o contraseña incorrectos. Verifica tus datos.";

export async function login(formData) {
  const identifier = formData.get("identifier")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  let email = identifier;

  if (DNI_REGEX.test(identifier)) {
    const admin = createAdminClient();

    const { data: apoderado } = await admin
      .from("apoderados")
      .select("user_id")
      .eq("dni_estudiante_login", identifier)
      .maybeSingle();

    if (!apoderado?.user_id) {
      return { error: DNI_NOT_FOUND };
    }

    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(apoderado.user_id);

    if (userError || !userData?.user?.email) {
      return { error: DNI_NOT_FOUND };
    }

    email = userData.user.email;
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
  redirect(role === "admin" ? "/admin/dashboard" : "/padre");
}
