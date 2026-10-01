import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Usuario autenticado si su rol está entre los permitidos; si no, null.
export async function usuarioConRol(...roles) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && roles.includes(user.app_metadata?.role) ? user : null;
}

export function respuestaError(error, status = 400) {
  return NextResponse.json({ error }, { status });
}

export const noAutorizado = () => respuestaError("No autorizado.", 403);
