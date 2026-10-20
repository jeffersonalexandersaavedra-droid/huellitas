// Etiqueta + control de formulario, con asterisco si es obligatorio y una
// ayuda opcional debajo (en lugar de usar el placeholder como explicación).
export default function Campo({ label, required = false, ayuda, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-stone-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-stone-500">{ayuda}</span>}
    </label>
  );
}
