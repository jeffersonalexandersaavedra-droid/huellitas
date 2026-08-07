const COLOR_MAP = {
  AD: "bg-emerald-50 text-emerald-700",
  A: "bg-blue-50 text-blue-700",
  B: "bg-huellitas-accent/15 text-huellitas-accent-dark",
  C: "bg-rose-50 text-rose-700",
};

function colorForNota(nota) {
  const upper = nota.trim().toUpperCase();
  if (COLOR_MAP[upper]) return COLOR_MAP[upper];

  const numeric = Number(nota);
  if (!Number.isNaN(numeric)) {
    if (numeric >= 18) return COLOR_MAP.AD;
    if (numeric >= 14) return COLOR_MAP.A;
    if (numeric >= 11) return COLOR_MAP.B;
    return COLOR_MAP.C;
  }

  return "bg-stone-100 text-stone-600";
}

export default function NotaBadge({ nota }) {
  return (
    <span
      className={`inline-flex min-w-10 items-center justify-center rounded-lg px-3 py-1 text-sm font-semibold ${colorForNota(nota)}`}
    >
      {nota}
    </span>
  );
}
