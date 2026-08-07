export const metadata = { title: "Pagos" };

export default function PagosPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Validación de pagos
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Aquí se listarán los vouchers subidos por los padres para validar o
        rechazar.
      </p>
    </div>
  );
}
