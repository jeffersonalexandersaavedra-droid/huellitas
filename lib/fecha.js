// Utilidades de fecha compartidas (antes MESES y formatFecha estaban
// repetidos en varios componentes).

export const MESES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Las fechas "YYYY-MM-DD" de la base se leen en hora local y no en UTC
// (si no, en Perú el 31/03 se mostraría como 30/03).
export function aFecha(valor) {
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
  }
  return new Date(valor);
}

// Último instante del día: una cuota vence al terminar su fecha límite.
export function finDelDia(valor) {
  const fecha = aFecha(valor);
  fecha.setHours(23, 59, 59, 999);
  return fecha;
}

export function formatFecha(fecha) {
  return fecha ? aFecha(fecha).toLocaleDateString("es-PE") : "—";
}

// Instante de hace `dias` días (para quedarse con lo reciente).
export function haceDias(dias) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
}

// "12 de octubre" (avisos y agenda del padre). Una fecha con hora se lee
// en hora de Lima, igual en el servidor (UTC) que en el celular.
export function diaYMes(fecha) {
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : hoyISO(new Date(fecha));
  return aFecha(dia).toLocaleDateString("es-PE", { day: "numeric", month: "long" });
}

// "1 de octubre de 2026" (para contratos y documentos).
export function fechaLarga(fecha = new Date()) {
  return aFecha(fecha).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Fecha de hoy en Perú, YYYY-MM-DD (valor de los <input type="date"> y fecha
// de emisión de comprobantes). Usa la hora de Lima aunque el servidor esté
// en UTC: a las 8 p. m. en Tocache sigue siendo el mismo día.
const formatoISOLima = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });

export function hoyISO(fecha = new Date()) {
  return formatoISOLima.format(fecha);
}
