// Meses (pensiones) que conforman cada bimestre del año escolar
// (marzo–diciembre). El padre solo ve las notas de un bimestre si tiene
// pagadas las pensiones de esos meses.
export const BIMESTRE_MESES = {
  1: [3, 4, 5], // Marzo – Mayo
  2: [6, 7], // Junio – Julio
  3: [8, 9], // Agosto – Septiembre
  4: [10, 11, 12], // Octubre – Diciembre
};

// Bimestre en curso según el mes (1–12).
export function bimestreActualPorMes(mes) {
  if (mes <= 5) return 1;
  if (mes <= 7) return 2;
  if (mes <= 9) return 3;
  return 4;
}

// ¿Están pagadas TODAS las pensiones de los meses de este bimestre?
// Si no hay cuotas de esos meses, se considera libre (nada que pagar).
export function bimestrePagado(bimestre, cuotas = []) {
  const meses = BIMESTRE_MESES[bimestre] || [];
  const relevantes = cuotas.filter((c) => meses.includes(c.mes));
  if (relevantes.length === 0) return true;
  return relevantes.every((c) => c.estado === "pagado");
}
