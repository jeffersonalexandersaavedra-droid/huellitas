const ESTADOS = {
  pagado: { label: "Pagado", className: "bg-emerald-50 text-emerald-700" },
  validado: { label: "Validado", className: "bg-emerald-50 text-emerald-700" },
  activa: { label: "Al día", className: "bg-emerald-50 text-emerald-700" },
  verificando: {
    label: "Verificando",
    className: "bg-huellitas-accent/10 text-huellitas-accent-dark",
  },
  validando: {
    label: "Validando",
    className: "bg-huellitas-accent/10 text-huellitas-accent-dark",
  },
  verificado: { label: "Verificado", className: "bg-sky-50 text-sky-700" },
  pendiente: { label: "Pendiente", className: "bg-stone-100 text-stone-600" },
  retirado: { label: "Retirado", className: "bg-stone-100 text-stone-600" },
  culminado: { label: "Culminado", className: "bg-stone-100 text-stone-600" },
  vencido: { label: "Atrasado", className: "bg-rose-50 text-rose-700" },
  rechazado: { label: "Rechazado", className: "bg-rose-50 text-rose-700" },
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
