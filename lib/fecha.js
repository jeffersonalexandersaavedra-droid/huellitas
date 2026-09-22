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

export function nombreMes(mes) {
  return MESES[mes] ?? "";
}

export function formatFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString("es-PE") : "—";
}
