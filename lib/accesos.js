import "server-only";

// Crea la cuenta de login (Supabase Auth) con su rol y devuelve su id.
// rol: "admin" | "secretaria" | "docente" | "estudiante"
export async function crearCuentaAcceso(admin, { email, password, rol, datos = {} }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: rol },
    user_metadata: datos,
  });

  if (error || !data?.user) {
    const yaExiste = /already/i.test(error?.message ?? "");
    throw new Error(
      yaExiste
        ? "Ya existe una cuenta con ese correo."
        : error?.message || "No se pudo crear la cuenta de acceso."
    );
  }
  return data.user.id;
}
