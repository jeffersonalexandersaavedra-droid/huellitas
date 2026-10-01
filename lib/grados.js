// Niveles, grados y secciones del colegio. Cada grado puede dividirse en
// secciones (3° Primaria A, B, C...); cada sección es un aula.

export const NIVELES = { inicial: "Inicial", primaria: "Primaria" };

export const GRADOS = {
  inicial: ["Inicial 3 años", "Inicial 4 años", "Inicial 5 años"],
  primaria: ["1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria"],
};

export const SECCIONES = ["A", "B", "C", "D", "E", "F"];

const ORDEN = [...GRADOS.inicial, ...GRADOS.primaria];

// Posición del grado para ordenarlos de menor a mayor.
export function ordenGrado(grado) {
  const i = ORDEN.indexOf(grado);
  return i === -1 ? ORDEN.length : i;
}

// Primera letra libre para una nueva sección del grado.
export function siguienteSeccion(usadas) {
  return SECCIONES.find((s) => !usadas.includes(s)) ?? null;
}
