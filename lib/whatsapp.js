// Enlaces "clic para chatear" de WhatsApp: gratis, abren WhatsApp con el
// mensaje ya escrito y la persona solo presiona Enviar.

// Celular peruano en formato internacional (51 + 9 dígitos), o null.
export function numeroWhatsApp(telefono) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  if (/^9\d{8}$/.test(digitos)) return `51${digitos}`;
  if (/^519\d{8}$/.test(digitos)) return digitos;
  return null;
}

// Enlace wa.me con el texto, o null si el teléfono no es un celular.
export function enlaceWhatsApp(telefono, texto) {
  const numero = numeroWhatsApp(telefono);
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null;
}
