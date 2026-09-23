// Selector reutilizable de "¿quién realiza el pago?" a partir de los
// apoderados registrados del estudiante. Devuelve el índice seleccionado.
export default function SelectorApoderado({ apoderados, value, onChange }) {
  if (!apoderados || apoderados.length === 0) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">
          ¿Quién realiza el pago?
        </label>
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-400">
          No hay apoderados registrados. Se registrará como el titular de la
          cuenta.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-stone-600">
        ¿Quién realiza el pago?
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
      >
        {apoderados.map((a, i) => (
          <option key={i} value={i}>
            {a.nombres} {a.apellidos} ({a.parentesco})
          </option>
        ))}
      </select>
    </div>
  );
}
