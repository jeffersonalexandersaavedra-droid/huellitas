import "server-only";

import { nubefactConfigurado } from "@/lib/nubefact";
import { correoConfigurado } from "@/lib/correo";
import { whatsappApiConfigurado } from "@/lib/whatsappApi";

// Servicios externos opcionales. El código ya está en el sistema: cada uno
// se activa cuando el colegio crea su cuenta y pone las claves en Vercel
// (Settings › Environment Variables) y vuelve a publicar (Redeploy).
export function serviciosOpcionales() {
  const correo = correoConfigurado();
  const whatsapp = whatsappApiConfigurado();
  return [
    {
      id: "facturacion",
      nombre: "Boletas y facturas electrónicas automáticas",
      detalle:
        "La boleta se envía a SUNAT desde la página con un clic, con su PDF oficial y QR. Mientras no se active, se emiten en SUNAT SOL y aquí se registra su serie y número.",
      proveedor: "Nubefact",
      costo: "De pago (plan anual o mensual del proveedor)",
      requiere: ["NUBEFACT_RUTA", "NUBEFACT_TOKEN"],
      activo: nubefactConfigurado(),
    },
    {
      id: "correo",
      nombre: "Correos automáticos",
      detalle: "Recordatorios de pago por correo y copia del Libro de Reclamaciones al reclamante.",
      proveedor: "Resend",
      costo: "Plan gratuito de 100 correos al día; requiere un dominio propio",
      requiere: ["RESEND_API_KEY", "RESEND_FROM"],
      activo: correo,
    },
    {
      id: "whatsapp",
      nombre: "WhatsApp automático",
      detalle:
        "Envía los recordatorios por WhatsApp sin usar el celular. El botón «WhatsApp» de Pagos › Recordatorios es gratis y ya funciona.",
      proveedor: "WhatsApp Business (Meta)",
      costo: "Meta cobra por mensaje; requiere verificar el negocio y una plantilla aprobada",
      requiere: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", "WHATSAPP_PLANTILLA"],
      activo: whatsapp,
    },
    {
      id: "programados",
      nombre: "Recordatorios programados (días 5 y 25 de cada mes)",
      detalle: "El sistema envía solo los recordatorios por los canales de arriba que estén activos.",
      proveedor: "Vercel Cron",
      costo: "Gratis",
      requiere: ["CRON_SECRET", "correo o WhatsApp activo"],
      activo: Boolean(process.env.CRON_SECRET) && (correo || whatsapp),
    },
    {
      id: "dni",
      nombre: "Autocompletar nombres por DNI y RUC",
      detalle: "Al emitir un comprobante, basta escribir el DNI o RUC para llenar el nombre o la razón social.",
      proveedor: "Decolecta",
      costo: "Requiere una cuenta en decolecta.com",
      requiere: ["DECOLECTA_TOKEN"],
      activo: Boolean(process.env.DECOLECTA_TOKEN),
    },
  ];
}

// Contacto de soporte técnico del sistema (SOPORTE_* en Vercel), o null.
export function contactoSoporte() {
  const { SOPORTE_NOMBRE: nombre, SOPORTE_WHATSAPP: whatsapp, SOPORTE_CORREO: correo } = process.env;
  if (!whatsapp && !correo) return null;
  return { nombre: nombre || "Soporte técnico", whatsapp: whatsapp || null, correo: correo || null };
}
