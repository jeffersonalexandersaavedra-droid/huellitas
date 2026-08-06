import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cliente de Supabase para usar en Server Components y Server Actions.
// Usa la anon key + cookies de sesión: respeta siempre las políticas de RLS
// del usuario autenticado (admin o padre).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar: puede fallar si se llama desde un Server Component
            // sin un Server Action/Route Handler que refresque la sesión.
            // El proxy.js ya se encarga de refrescar la sesión en cada request.
          }
        },
      },
    }
  );
}
