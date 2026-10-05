import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { enviarCorreo, htmlDocumento } from "@/lib/correo";
import { COLEGIO } from "@/lib/colegio";
import { codigoReclamacion, seccionesHoja, NOTAS_HOJA } from "@/lib/reclamaciones";

// Respuesta del colegio a una hoja de reclamación (solo admin). Se guarda
// y se envía al correo del consumidor. body: { respuesta }
export async function POST(request, { params }) {
  const usuario = await usuarioConRol("admin");
  if (!usuario) return noAutorizado();

  const body = await request.json().catch(() => null);
  const respuesta = String(body?.respuesta ?? "").trim().slice(0, 3000);
  if (!respuesta) return respuestaError("Escribe la respuesta.");

  const { id } = await params;
  const { data: hoja, error } = await createAdminClient()
    .from("reclamaciones")
    .update({ respuesta, fecha_respuesta: new Date().toISOString(), respondido_por: usuario.id })
    .eq("id", id)
    .is("respuesta", null)
    .select()
    .maybeSingle();
  if (error) return respuestaError(error.message, 500);
  if (!hoja) return respuestaError("La hoja no existe o ya fue respondida.");

  const codigo = codigoReclamacion(hoja);
  const enviada = await enviarCorreo({
    para: hoja.consumidor_email,
    asunto: `Respuesta a tu hoja de reclamación N.° ${codigo}`,
    html: htmlDocumento({
      titulo: `Respuesta a la hoja N.° ${codigo}`,
      subtitulo: `${COLEGIO.nombre} · RUC ${COLEGIO.ruc}`,
      secciones: seccionesHoja(hoja),
      notas: NOTAS_HOJA,
    }),
    responderA: COLEGIO.correo,
  });

  return NextResponse.json({ hoja, enviada });
}
