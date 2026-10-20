import AdminShell from "@/components/AdminShell";
import { usuarioSesion } from "@/lib/sesion";

// Panel compartido por administración y secretaría: el menú muestra solo
// las secciones del rol (el proxy ya bloquea las demás rutas).
export default async function AdminLayout({ children }) {
  const user = await usuarioSesion();

  return (
    <AdminShell
      rol={user?.app_metadata?.role ?? ""}
      nombre={user?.user_metadata?.nombre || user?.email || ""}
    >
      {children}
    </AdminShell>
  );
}
