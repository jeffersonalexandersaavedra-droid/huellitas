import { Download } from "lucide-react";
import { formatFecha } from "@/lib/fecha";
import { formatSoles } from "@/lib/cuentas";
import { TIPOS_CORTOS, numeroComprobante, enlaceComprobante } from "@/lib/facturacion";

// Boletas, facturas y tickets de los pagos del estudiante, para descargar.
export default function MisComprobantes({ comprobantes }) {
  if (!comprobantes.length) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-semibold text-huellitas-primary">Comprobantes de pago</h2>
      <p className="mt-1 text-sm text-stone-500">Descarga tus boletas y facturas cuando las necesites.</p>

      <ul className="mt-2 divide-y divide-stone-100">
        {comprobantes.map((c) => {
          const anulado = c.estado === "anulado";
          return (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className={`font-medium ${anulado ? "text-stone-400 line-through" : "text-huellitas-ink"}`}>
                  {TIPOS_CORTOS[c.tipo]} {numeroComprobante(c)}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {formatFecha(c.fecha_emision)} · {c.items.map((i) => i.descripcion.split(" – ")[0]).join(", ")}
                  {anulado && " · Anulado"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <b className="text-huellitas-ink">
                  {c.tipo === "nota_credito" ? "−" : ""}
                  {formatSoles(c.total)}
                </b>
                <a
                  href={enlaceComprobante(c, "/padre/comprobantes")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Descargar ${TIPOS_CORTOS[c.tipo]} ${numeroComprobante(c)}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-huellitas-primary text-huellitas-primary hover:bg-huellitas-primary-light"
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
