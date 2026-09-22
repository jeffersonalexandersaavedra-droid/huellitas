// Badge de ESTADO DE PAGO (al día / con deuda). Reutilizable en la lista de
// estudiantes, la ficha y donde haga falta, para no duplicar el markup.
export default function EstadoCuentaBadge({ conDeuda }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        conDeuda ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {conDeuda ? "Con deuda" : "Al día"}
    </span>
  );
}
