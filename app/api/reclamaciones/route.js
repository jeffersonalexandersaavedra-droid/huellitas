import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { respuestaError } from "@/lib/api";
import { enviarCorreo, htmlDocumento } from "@/lib/correo";
import { COLEGIO } from "@/lib/colegio";
import {
  RECLAMACION_VACIA,
  errorReclamacion,
  codigoReclamacion,
  seccionesHoja,
  NOTAS_HOJA,
} from "@/lib/reclamaciones";

// Registro público de una hoja de reclamación. Envía la copia al correo
// del consumidor y avisa al colegio. body: campos de RECLAMACION_VACIA.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return respuestaError("Datos incompletos.");
  // Campo trampa: los robots lo llenan, las personas no lo ven.
  if (body.sitio_web) return respuestaError("No se pudo registrar.");

  const datos = Object.fromEntries(
    Object.keys(RECLAMACION_VACIA).map((campo) => {
      const valor = body[campo];
      return [campo, typeof valor === "string" ? valor.trim() : valor];
    })
  );
  datos.menor_de_edad = Boolean(datos.menor_de_edad);
  const error = errorReclamacion(datos);
  if (error) return respuestaError(error);

  const { data: hoja, error: errorGuardar } = await createAdminClient()
    .from("reclamaciones")
    .insert({
      ...datos,
      consumidor_email: datos.consumidor_email.toLowerCase(),
      consumidor_telefono: datos.consumidor_telefono || null,
      apoderado_nombre: datos.menor_de_edad ? datos.apoderado_nombre : null,
      monto: datos.monto === "" || datos.monto == null ? null : Number(datos.monto),
    })
    .select()
    .single();
  if (errorGuardar) return respuestaError("No se pudo registrar la hoja. Intenta de nuevo.", 500);

  const codigo = codigoReclamacion(hoja);
  const html = htmlDocumento({
    titulo: `Libro de Reclamaciones – Hoja N.° ${codigo}`,
    subtitulo: `${COLEGIO.nombre} · RUC ${COLEGIO.ruc}`,
    secciones: seccionesHoja(hoja),
    notas: NOTAS_HOJA,
  });
  const [copiaEnviada] = await Promise.all([
    enviarCorreo({
      para: hoja.consumidor_email,
      asunto: `Copia de tu hoja de reclamación N.° ${codigo}`,
      html,
      responderA: COLEGIO.correo,
    }),
    enviarCorreo({
      para: COLEGIO.correo,
      asunto: `Nueva hoja de reclamación N.° ${codigo}`,
      html,
      responderA: hoja.consumidor_email,
    }),
  ]);

  return NextResponse.json({ hoja, copiaEnviada });
}
