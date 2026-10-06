// Colores de la escala literal (AD, A, B, C), iguales en todo el sistema.
const COLOR_NOTA = {
  AD: "bg-emerald-50 text-emerald-700",
  A: "bg-blue-50 text-blue-700",
  B: "bg-huellitas-accent/15 text-huellitas-accent-dark",
  C: "bg-rose-50 text-rose-700",
};

export function claseNota(nota) {
  return COLOR_NOTA[nota] ?? "bg-stone-100 text-stone-400";
}

export default function NotaBadge({ nota, className = "" }) {
  return (
    <span
      className={`inline-flex min-w-9 items-center justify-center rounded-lg px-2 py-0.5 text-sm font-semibold ${claseNota(nota)} ${className}`}
    >
      {nota || "—"}
    </span>
  );
}
