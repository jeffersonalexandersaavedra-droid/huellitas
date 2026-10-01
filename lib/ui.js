// Clases de Tailwind compartidas por los formularios del sistema.

// Control de formulario de ancho natural (filtros en línea).
export const controlClass =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

// Control que ocupa todo el ancho (formularios).
export const inputClass = `w-full ${controlClass}`;

// "1 estudiante", "3 estudiantes".
export function cantidad(n, singular, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
}
