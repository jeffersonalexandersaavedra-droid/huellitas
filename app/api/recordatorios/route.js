import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esCronAutorizado, usuarioConRol, noAutorizado, respuestaError } from "@/lib/api";
import { obtenerAnioActivo, familiasPorRecordar, horarioAtencion } from "@/lib/consultas";
import { canalesAutomaticos, enviarRecordatorios } from "@/lib/envioRecordatorios";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function recordar(supabase, canales, matriculaIds) {
  const anio = await obtenerAnioActivo(supabase);
  if (!anio) return respuestaError("No hay un año escolar activo.");
  const [familias, horario] = await Promise.all([
    familiasPorRecordar(supabase, anio.id, matriculaIds),
    horarioAtencion(supabase),
  ]);
  return NextResponse.json({ familias: familias.length, ...(await enviarRecordatorios(familias, horario, canales)) });
}

// Recordatorio automático (Vercel Cron, días 5 y 25 de cada mes). Solo
// envía si el colegio activó el correo o WhatsApp Business.
export async function GET(request) {
  if (!esCronAutorizado(request)) return respuestaError("No autorizado.", 401);
  const canales = canalesAutomaticos();
  if (!canales.correo && !canales.whatsapp) {
    return NextResponse.json({ omitido: "Ningún canal automático está activado." });
  }
  return recordar(createAdminClient(), canales);
}

// Envío desde Pagos › Recordatorios. body: { matriculaIds?: string[], canal: "correo" | "whatsapp" }
export async function POST(request) {
  if (!(await usuarioConRol("admin", "secretaria"))) return noAutorizado();
  const { matriculaIds, canal } = await request.json().catch(() => ({}));
  if (!["correo", "whatsapp"].includes(canal)) return respuestaError("Canal no válido.");
  if (matriculaIds !== undefined && (!Array.isArray(matriculaIds) || matriculaIds.length === 0)) {
    return respuestaError("Elige al menos una familia.");
  }
  if (!canalesAutomaticos()[canal]) {
    return respuestaError(canal === "correo" ? "El envío de correos no está activado." : "WhatsApp automático no está activado.");
  }
  return recordar(await createClient(), { [canal]: true }, matriculaIds);
}
