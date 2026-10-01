import AdminShell from "@/components/AdminShell";
import { createClient } from "@/lib/supabase/server";

// Panel compartido por administración y secretaría: el menú muestra solo
// las secciones del rol (el proxy ya bloquea las demás rutas).
export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AdminShell
      rol={user?.app_metadata?.role ?? ""}
      nombre={user?.user_metadata?.nombre || user?.email || ""}
    >
      {children}
    </AdminShell>
  );
}
