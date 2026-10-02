// El catálogo de cursos ahora vive en la tabla `cursos` (administrable desde
// Configuración). Aquí quedan solo las constantes de calificación que usan
// el panel del docente y la vista de notas del admin.

// Escala de calificación literal del Currículo Nacional (EBR) para Inicial y
// Primaria: es la que el docente elige en el registro de notas.
export const NOTAS_LITERALES = ["AD", "A", "B", "C"];

export const BIMESTRES = [1, 2, 3, 4];

// Abreviatura para columnas angostas (celular): iniciales de las palabras
// importantes ("Ciencia y Tecnología" → "CT") o las 3 primeras letras si es
// una sola palabra ("Matemática" → "MAT").
const CONECTORES = ["y", "de", "del", "la", "el"];

export function abreviarCurso(nombre) {
  const palabras = nombre.split(/\s+/).filter((p) => !CONECTORES.includes(p.toLowerCase()));
  const abrev = palabras.length > 1 ? palabras.map((p) => p[0]).join("") : nombre.slice(0, 3);
  return abrev.toUpperCase();
}
