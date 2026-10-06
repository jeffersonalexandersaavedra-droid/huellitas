import "server-only";

// Envío de correos (Resend). Se activa con RESEND_API_KEY y RESEND_FROM
// (remitente de un dominio verificado, ej. "Huellitas <avisos@huellitas.edu.pe>").
// Sin ellas no se envía nada y quien llama decide qué mostrar.
export const correoConfigurado = () => Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);

// para: string o lista. Devuelve true si el proveedor aceptó el envío.
export async function enviarCorreo({ para, asunto, html, responderA }) {
  if (!correoConfigurado()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [para].flat().filter(Boolean),
        subject: asunto,
        html,
        ...(responderA && { reply_to: responderA }),
      }),
      signal: AbortSignal.timeout(15000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Escapa texto del usuario antes de ponerlo en un correo HTML.
const escaparHtml = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Correo con formato del colegio: título, secciones [{ titulo, filas: [[etiqueta, valor]] }] y notas.
export function htmlDocumento({ titulo, subtitulo, secciones, notas = [] }) {
  const fila = ([etiqueta, valor]) =>
    `<tr><td style="padding:4px 8px;color:#78716c;vertical-align:top;width:170px">${escaparHtml(etiqueta)}</td>` +
    `<td style="padding:4px 8px;color:#2a1f33;white-space:pre-wrap">${escaparHtml(valor)}</td></tr>`;
  const seccion = (s) =>
    `<h3 style="margin:20px 0 6px;font-size:14px;color:#5b2c6f">${escaparHtml(s.titulo)}</h3>` +
    `<table style="width:100%;border-collapse:collapse;font-size:13px">${s.filas.map(fila).join("")}</table>`;
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto">
  <div style="background:#5b2c6f;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0">
    <div style="font-size:18px;font-weight:bold">${escaparHtml(titulo)}</div>
    ${subtitulo ? `<div style="font-size:13px;opacity:.85">${escaparHtml(subtitulo)}</div>` : ""}
  </div>
  <div style="border:1px solid #e8def0;border-top:0;padding:4px 20px 20px;border-radius:0 0 8px 8px">
    ${secciones.map(seccion).join("")}
    ${notas.map((n) => `<p style="font-size:11px;color:#78716c;margin:12px 0 0">${escaparHtml(n)}</p>`).join("")}
  </div>
</div>`;
}
