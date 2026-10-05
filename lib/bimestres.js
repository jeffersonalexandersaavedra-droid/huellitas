// Bimestres del año escolar (marzo–diciembre).
//
// Las notas y la boleta preventiva se muestran siempre, estén o no al día
// las pensiones: la Ley 26549 (art. 16, modificado por el D.U. 002-2020)
// prohíbe condicionar la entrega de notas o la evaluación al pago.

// Bimestre en curso según el mes (1–12).
export function bimestreActualPorMes(mes) {
  if (mes <= 5) return 1;
  if (mes <= 7) return 2;
  if (mes <= 9) return 3;
  return 4;
}

// Bimestres ya iniciados en el año (1 … bimestre actual).
export function bimestresIniciados(mes = new Date().getMonth() + 1) {
  return Array.from({ length: bimestreActualPorMes(mes) }, (_, i) => i + 1);
}
