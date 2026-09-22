import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminsManager from "@/components/AdminsManager";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.role !== "admin") {
    redirect("/login");
  }

  // Listar administradores (requiere service role).
  const admin = createAdminClient();
  const { data: lista } = await admin.auth.admin.listUsers({ perPage: 200 });

  const administradores = (lista?.users ?? [])
    .filter((u) => u.app_metadata?.role === "admin")
    .map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.user_metadata?.nombre ?? "",
      creado: u.created_at,
      esYo: u.id === user.id,
    }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Configuración
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Administra las cuentas de administrador del sistema.
      </p>

      <div className="mt-6">
        <AdminsManager administradores={administradores} />
      </div>
    </div>
  );
}
