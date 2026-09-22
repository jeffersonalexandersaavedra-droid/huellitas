// Áreas / cursos sugeridos del Currículo Nacional para asignar a los
// docentes y registrar notas. El campo "curso" se guarda como texto, así
// que esta lista solo alimenta los desplegables (se puede escribir otro).

export const CURSOS_PRIMARIA = [
  "Matemática",
  "Comunicación",
  "Personal Social",
  "Ciencia y Tecnología",
  "Arte y Cultura",
  "Educación Física",
  "Educación Religiosa",
  "Inglés",
  "Tutoría",
];

export const CURSOS_INICIAL = [
  "Comunicación",
  "Matemática",
  "Personal Social",
  "Psicomotriz",
  "Ciencia y Tecnología",
  "Descubrimiento del Mundo",
  "Arte y Cultura",
  "Religión",
];

export function cursosPorNivel(nivel) {
  return nivel === "inicial" ? CURSOS_INICIAL : CURSOS_PRIMARIA;
}

// Escala de calificación literal del Currículo Nacional (EBR).
// Se usa como sugerencia; el campo admite también notas numéricas.
export const NOTAS_LITERALES = ["AD", "A", "B", "C"];

export const BIMESTRES = [1, 2, 3, 4];
