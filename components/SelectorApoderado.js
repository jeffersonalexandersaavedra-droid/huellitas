import { useId } from "react";
import { inputClass } from "@/lib/ui";

const etiqueta = "mb-1 block text-xs font-medium text-stone-600";

// Selector reutilizable de "¿quién realiza el pago?" a partir de los
// apoderados registrados del estudiante. Devuelve el índice seleccionado.
export default function SelectorApoderado({ apoderados, value, onChange }) {
  const id = useId();

  if (!apoderados?.length) {
    return (
      <div>
        <p className={etiqueta}>¿Quién realiza el pago?</p>
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-400">
          No hay apoderados registrados. Se registrará como el titular de la
          cuenta.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className={etiqueta}>
        ¿Quién realiza el pago?
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {apoderados.map((a, i) => (
          <option key={a.id} value={i}>
            {a.nombres} {a.apellidos} ({a.parentesco})
          </option>
        ))}
      </select>
    </div>
  );
}
