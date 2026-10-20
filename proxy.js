import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { puedeVerRuta, rutaInicio } from "@/lib/roles";

// En Next.js 16 "middleware.js" se llama "proxy.js". Refresca la sesión de
// Supabase y deja entrar a cada ruta solo al rol que le corresponde.
export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() renueva la sesión si hace falta y verifica el token aquí
  // mismo (sin ir a Supabase en cada clic cuando hay claves asimétricas).
  const { data } = await supabase.auth.getClaims();
  const rol = data?.claims?.app_metadata?.role;
  if (!puedeVerRuta(rol, request.nextUrl.pathname)) {
    // Con sesión pero sin permiso: a su propio inicio; sin sesión: al login.
    return NextResponse.redirect(new URL(rutaInicio(rol) ?? "/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/docente/:path*", "/padre/:path*"],
};
