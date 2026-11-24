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

// Tareas programadas (Vercel Cron, ver vercel.json): Vercel envía
// "Authorization: Bearer <CRON_SECRET>"; sin esa clave no se ejecutan.
export function esCronAutorizado(request) {
  const secreto = process.env.CRON_SECRET;
  return Boolean(secreto) && request.headers.get("authorization") === `Bearer ${secreto}`;
}

export function respuestaError(error, status = 400) {
  return NextResponse.json({ error }, { status });
}

export const noAutorizado = () => respuestaError("No autorizado.", 403);
