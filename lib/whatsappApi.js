import "server-only";

import { numeroWhatsApp } from "@/lib/whatsapp";

// Envío automático por WhatsApp Business (API de Meta). Es opcional y de
// pago (Meta cobra por mensaje): se activa con WHATSAPP_TOKEN,
// WHATSAPP_PHONE_ID y WHATSAPP_PLANTILLA (plantilla aprobada por Meta, con
// 3 variables: apoderado, estudiante y detalle). Sin ellas no envía nada y
// el panel usa el botón gratuito "clic para chatear".
const VERSION_API = "v21.0";
const CONCURRENCIA = 5;

export const whatsappApiConfigurado = () =>
  Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_PLANTILLA);

// Meta no acepta saltos de línea ni muchos espacios seguidos en las variables.
const textoDeVariable = (texto) => String(texto ?? "").replace(/\s+/g, " ").trim();

async function enviarPlantilla({ telefono, variables }) {
  const numero = numeroWhatsApp(telefono);
  if (!numero) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/${VERSION_API}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "template",
        template: {
          name: process.env.WHATSAPP_PLANTILLA,
          language: { code: process.env.WHATSAPP_IDIOMA || "es" },
          components: [
            { type: "body", parameters: variables.map((v) => ({ type: "text", text: textoDeVariable(v) })) },
          ],
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Envía varias plantillas (de a pocas a la vez). Devuelve cuántas aceptó Meta.
export async function enviarWhatsApps(mensajes) {
  if (!whatsappApiConfigurado()) return 0;
  let aceptados = 0;
  for (let i = 0; i < mensajes.length; i += CONCURRENCIA) {
    const resultados = await Promise.all(mensajes.slice(i, i + CONCURRENCIA).map(enviarPlantilla));
    aceptados += resultados.filter(Boolean).length;
  }
  return aceptados;
}
