import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { respuestaError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Ping diario (Vercel Cron, ver vercel.json) para que Supabase no pause el
// proyecto gratuito tras una semana sin uso. Vercel envía
// "Authorization: Bearer <CRON_SECRET>"; sin esa clave no responde.
export async function GET(request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return respuestaError("No autorizado.", 401);
  }

  const { error } = await createAdminClient().from("anios_escolares").select("id").limit(1);
  if (error) return respuestaError("La base de datos no respondió.", 503);
  return NextResponse.json({ ok: true, fecha: new Date().toISOString() });
}
