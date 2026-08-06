const ESTADOS = {
  pagado: { label: "Pagado", className: "bg-emerald-100 text-emerald-800" },
  validado: { label: "Validado", className: "bg-emerald-100 text-emerald-800" },
  verificando: { label: "Verificando", className: "bg-amber-100 text-amber-800" },
  pendiente: { label: "Pendiente", className: "bg-stone-100 text-stone-600" },
  vencido: { label: "Vencido", className: "bg-red-100 text-red-700" },
  rechazado: { label: "Rechazado", className: "bg-red-100 text-red-700" },
  activa: { label: "Activa", className: "bg-emerald-100 text-emerald-800" },
  retirado: { label: "Retirado", className: "bg-stone-100 text-stone-600" },
  culminado: { label: "Culminado", className: "bg-stone-100 text-stone-600" },
};

export default function EstadoBadge({ estado }) {
  const config = ESTADOS[estado] ?? {
    label: estado,
    className: "bg-stone-100 text-stone-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
