import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import UsuariosManager from "@/components/UsuariosManager";
import CursosManager from "@/components/CursosManager";

export const metadata = { title: "Configuración" };

const ROLES_PERSONAL = ["admin", "secretaria"];

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: cursos }, { data: lista }] = await Promise.all([
    supabase
      .from("cursos")
      .select("id, nombre, nivel, activo")
      .order("nivel", { ascending: true })
      .order("nombre", { ascending: true }),
    // Listar cuentas de Auth requiere la service role.
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const usuarios = (lista?.users ?? [])
    .filter((u) => ROLES_PERSONAL.includes(u.app_metadata?.role))
    .map((u) => ({
      id: u.id,
      email: u.email,
      rol: u.app_metadata.role,
      nombre: u.user_metadata?.nombre ?? "",
      creado: u.created_at,
      esYo: u.id === user.id,
    }))
    .sort((a, b) => a.rol.localeCompare(b.rol) || a.email.localeCompare(b.email));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Configuración
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Cuentas del personal (administradores y secretarias) y catálogo de cursos.
      </p>

      <div className="mt-6 space-y-6">
        <UsuariosManager usuarios={usuarios} />
        <CursosManager cursos={cursos ?? []} />
      </div>
    </div>
  );
}
