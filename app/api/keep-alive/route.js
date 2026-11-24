import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esCronAutorizado, respuestaError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Ping diario (Vercel Cron) para que Supabase no pause el proyecto gratuito
// tras una semana sin uso.
export async function GET(request) {
  if (!esCronAutorizado(request)) return respuestaError("No autorizado.", 401);

  const { error } = await createAdminClient().from("anios_escolares").select("id").limit(1);
  if (error) return respuestaError("La base de datos no respondió.", 503);
  return NextResponse.json({ ok: true, fecha: new Date().toISOString() });
}
