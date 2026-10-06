// Utilidades de interfaz compartidas: clases de formularios, textos y búsqueda.

// Control de formulario de ancho natural (filtros en línea).
export const controlClass =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

// Control que ocupa todo el ancho (formularios).
export const inputClass = `w-full ${controlClass}`;

// Texto sin tildes: "Fernández" → "Fernandez".
export function sinTildes(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ¿Algún campo contiene lo buscado? Sin distinguir mayúsculas ni tildes.
export function coincide(busqueda, ...campos) {
  const q = sinTildes(busqueda).trim().toLowerCase();
  return !q || campos.some((campo) => sinTildes(campo).toLowerCase().includes(q));
}

// "1 estudiante", "3 estudiantes".
export function cantidad(n, singular, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
}
