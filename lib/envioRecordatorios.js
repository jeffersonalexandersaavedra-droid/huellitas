import "server-only";

import { correoConfigurado, enviarCorreos, htmlDocumento } from "@/lib/correo";
import { whatsappApiConfigurado, enviarWhatsApps } from "@/lib/whatsappApi";
import { detalleRecordatorio } from "@/lib/recordatorios";
import { montoACobrar, formatSoles } from "@/lib/cuentas";
import { MESES, formatFecha } from "@/lib/fecha";

// Canales automáticos que el colegio activó. Los dos son opcionales: el
// correo necesita una cuenta de Resend y WhatsApp la API de Meta (de pago).
export const canalesAutomaticos = () => ({ correo: correoConfigurado(), whatsapp: whatsappApiConfigurado() });

function correoDeRecordatorio({ estudiante, situacion }, horario) {
  const cuotas = situacion.vencidas.length ? situacion.vencidas : [situacion.proxima];
  const total = situacion.vencidas.length ? situacion.deuda : situacion.montoProxima;
  return htmlDocumento({
    titulo: "Recordatorio de pago",
    subtitulo: `I.E.P. Huellitas · ${estudiante}`,
    secciones: [
      {
        titulo: situacion.vencidas.length ? "Pensiones pendientes" : "Próxima pensión",
        filas: [
          ...cuotas.map((c) => [`${MESES[c.mes]} (vence ${formatFecha(c.fecha_vencimiento)})`, formatSoles(montoACobrar(c).monto)]),
          ["Total", formatSoles(total)],
        ],
      },
      {
        titulo: "Cómo pagar",
        filas: [
          ["Portal de padres", "Yape o transferencia, subiendo la foto del voucher"],
          ["Secretaría", horario || "En el colegio"],
        ],
      },
    ],
    notas: ["Si ya realizó el pago, por favor ignore este mensaje."],
  });
}

// Envía el recordatorio a cada familia por los canales pedidos que estén
// activos. Devuelve cuántos aceptó cada canal y a quiénes no se pudo
// escribir por falta de correo o celular.
export async function enviarRecordatorios(familias, horario, canales = canalesAutomaticos()) {
  const usarCorreo = canales.correo && correoConfigurado();
  const usarWhatsApp = canales.whatsapp && whatsappApiConfigurado();
  const porCorreo = usarCorreo ? familias.filter((f) => f.email) : [];
  const porWhatsApp = usarWhatsApp ? familias.filter((f) => f.telefono) : [];

  const [correo, whatsapp] = await Promise.all([
    enviarCorreos(
      porCorreo.map((f) => ({
        para: f.email,
        asunto: `Recordatorio de pago · ${f.estudiante}`,
        html: correoDeRecordatorio(f, horario),
      }))
    ),
    enviarWhatsApps(
      porWhatsApp.map((f) => ({
        telefono: f.telefono,
        variables: [f.apoderado, f.estudiante, detalleRecordatorio(f.situacion)],
      }))
    ),
  ]);

  const alcanzadas = new Set([...porCorreo, ...porWhatsApp].map((f) => f.matriculaId));
  return { correo, whatsapp, sinContacto: familias.filter((f) => !alcanzadas.has(f.matriculaId)).map((f) => f.estudiante) };
}
