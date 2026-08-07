export const metadata = { title: "Facturación" };

export default function FacturacionPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Facturación
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Aquí se emitirán boletas, facturas y tickets de venta por los pagos
        registrados.
      </p>
    </div>
  );
}
