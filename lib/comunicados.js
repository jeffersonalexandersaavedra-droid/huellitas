// Comunicados y agenda: a quién va dirigido cada aviso.
// En el formulario el destino es un solo valor: "colegio", "nivel:primaria"
// o "aula:<id>"; en la base son las columnas nivel y aula_id.

export const CAMPOS_COMUNICADO =
  "id, titulo, mensaje, fecha_evento, nivel, aula_id, autor, autor_id, created_at, aulas(nombre)";

const NIVELES = { inicial: "Todo Inicial", primaria: "Toda Primaria" };

export function destinoDe(c) {
  if (c.aula_id) return c.aulas?.nombre ?? "Un aula";
  return NIVELES[c.nivel] ?? "Todo el colegio";
}

// Opciones del selector "¿Para quién es?". El personal puede escribir a
// todo el colegio o a un nivel; el docente, solo a sus aulas.
export function opcionesDestino(aulas, { todoElColegio = false } = {}) {
  const generales = todoElColegio
    ? [
        { valor: "colegio", label: "Todo el colegio" },
        ...Object.entries(NIVELES).map(([nivel, label]) => ({ valor: `nivel:${nivel}`, label })),
      ]
    : [];
  return [...generales, ...aulas.map((a) => ({ valor: `aula:${a.id}`, label: a.nombre }))];
}

export function columnasDestino(valor) {
  const [tipo, id] = valor.split(":");
  return { nivel: tipo === "nivel" ? id : null, aula_id: tipo === "aula" ? id : null };
}
