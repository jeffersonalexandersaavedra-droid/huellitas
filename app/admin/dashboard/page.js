export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Resumen general del colegio. Próximamente: matriculados, pagos del
        mes y alertas de vouchers por validar.
      </p>
    </div>
  );
}
