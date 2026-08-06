import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase con la service_role key: se salta RLS por completo.
// Úsalo SOLO en Server Actions o Route Handlers para operaciones
// administrativas (crear usuarios, validar pagos, reportes, etc).
// El import "server-only" de arriba hace que el build falle si este
// archivo termina importado desde un Client Component.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está definida.");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
