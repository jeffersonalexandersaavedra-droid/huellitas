// Calificación por competencias del Currículo Nacional (igual que el
// SIAGIE). Cada curso (área) de la tabla `cursos` trae su lista de
// competencias; el docente pone a cada una un nivel de logro (NL) y, si
// quiere, una conclusión descriptiva.

// Escala literal de Inicial y Primaria.
export const NOTAS_LITERALES = ["AD", "A", "B", "C"];

export const ESCALA_NOTAS = {
  AD: "Logro destacado",
  A: "Logro esperado",
  B: "En proceso",
  C: "En inicio",
};

// Descripción de cada nivel, tal como la imprime el Informe de progreso.
export const DESCRIPCION_ESCALA = {
  AD: "Cuando el estudiante evidencia un nivel superior a lo esperado respecto a la competencia. Esto quiere decir que demuestra aprendizajes que van más allá del nivel esperado.",
  A: "Cuando el estudiante evidencia el nivel esperado respecto a la competencia, demostrando manejo satisfactorio en todas las tareas propuestas y en el tiempo programado.",
  B: "Cuando el estudiante está próximo o cerca al nivel esperado respecto a la competencia, para lo cual requiere acompañamiento durante un tiempo razonable para lograrlo.",
  C: "Cuando el estudiante muestra progreso mínimo en una competencia de acuerdo al nivel esperado. Evidencia con frecuencia dificultades en el desarrollo de las tareas, por lo que necesita mayor tiempo de acompañamiento e intervención del docente.",
};

// "AD = Logro destacado · A = Logro esperado · ..."
export const LEYENDA_ESCALA = Object.entries(ESCALA_NOTAS)
  .map(([nota, texto]) => `${nota} = ${texto}`)
  .join(" · ");

export const BIMESTRES = [1, 2, 3, 4];
export const NOMBRE_BIMESTRE = { 1: "Primer bimestre", 2: "Segundo bimestre", 3: "Tercer bimestre", 4: "Cuarto bimestre" };

// Área que agrupa las competencias transversales (TIC y "Gestiona su
// aprendizaje"): el SIAGIE las muestra aparte, no asociadas a un área.
export const AREA_TRANSVERSAL = "Competencias transversales";

// Regla del SIAGIE para la conclusión descriptiva.
export const CONCLUSION_MIN = 10;
export const CONCLUSION_MAX = 500;

export function conclusionValida(texto) {
  const largo = texto.trim().length;
  return largo === 0 || (largo >= CONCLUSION_MIN && largo <= CONCLUSION_MAX);
}

// Nota de una competencia aún sin calificar.
export const NOTA_VACIA = { nota: "", conclusion: "" };

// Clave de una nota dentro de un registro: "Matemática#2".
export function claveNota(curso, competencia) {
  return `${curso}#${competencia}`;
}

// "01", "02"... como numera el SIAGIE las competencias de cada área.
export function numeroCompetencia(n) {
  return String(n).padStart(2, "0");
}

// Áreas calificables (con competencias): primero las áreas por nombre y al
// final las competencias transversales.
export function areasCalificables(cursos) {
  return cursos
    .filter((c) => c.competencias?.length)
    .sort(
      (a, b) =>
        Number(a.nombre === AREA_TRANSVERSAL) - Number(b.nombre === AREA_TRANSVERSAL) ||
        a.nombre.localeCompare(b.nombre)
    );
}
