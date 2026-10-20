import { BookOpen } from "lucide-react";
import { AYUDA_TIPOS } from "@/lib/facturacion";

const PALABRAS = [
  ["Comprobante", "El papel o PDF que prueba que alguien pagó: boleta, factura o ticket."],
  ["Boleta", AYUDA_TIPOS.boleta],
  ["Factura", AYUDA_TIPOS.factura],
  ["Ticket interno", AYUDA_TIPOS.ticket],
  ["Nota de crédito", AYUDA_TIPOS.nota_credito],
  ["SUNAT", "La oficina del Estado que recibe las boletas y facturas."],
  ["Serie y número", "El código de cada comprobante. En B001-25, «B001» es la serie y «25» el número."],
  ["DNI y RUC", "DNI: documento de una persona (8 números). RUC: número de una empresa (11 números)."],
  ["Anular", "Dejar sin efecto un comprobante que salió mal."],
];

// Glosario plegable: lo que significa cada palabra de la facturación.
export default function GlosarioFacturacion() {
  return (
    <details className="group rounded-xl bg-white p-4 shadow-sm">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-huellitas-primary">
        <BookOpen className="h-4 w-4" strokeWidth={2} />
        ¿Qué significa cada palabra?
      </summary>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {PALABRAS.map(([palabra, significado]) => (
          <div key={palabra}>
            <dt className="font-medium text-huellitas-ink">{palabra}</dt>
            <dd className="text-stone-600">{significado}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
