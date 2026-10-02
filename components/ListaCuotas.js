import { Lock, Smartphone, Building2 } from "lucide-react";
import EstadoBadge from "@/components/EstadoBadge";
import { MESES, formatFecha } from "@/lib/fecha";
import { montoACobrar, cuotaEstaVencida, formatSoles } from "@/lib/cuentas";

// Lista de cuotas pensada para celular: mes, monto, estado y, solo en la
// cuota que toca pagar, los botones de método de pago.
// Sin `onPagar` es de solo lectura (historial).
export default function ListaCuotas({ cuotas, anio, cuotaPagableId = null, onPagar }) {
  return (
    <ul className="divide-y divide-stone-100">
      {cuotas.map((cuota) => {
        const { monto, descuentoVigente } = montoACobrar(cuota);
        const porPagar = cuota.estado === "pendiente" || cuota.estado === "vencido";
        const pagable = onPagar && porPagar && cuota.id === cuotaPagableId;
        const estado = porPagar && cuotaEstaVencida(cuota) ? "vencido" : cuota.estado;

        return (
          <li key={cuota.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-huellitas-ink">
                  {cuota.mes ? MESES[cuota.mes] : cuota.conceptos_cobro?.nombre ?? "Pago"}{" "}
                  <span className="font-normal text-stone-400">{anio}</span>
                </p>
                <p className="text-xs text-stone-500">Vence {formatFecha(cuota.fecha_vencimiento)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="font-semibold text-huellitas-ink">
                  {formatSoles(monto)}
                  {descuentoVigente && porPagar && (
                    <span className="ml-1 text-xs font-normal text-huellitas-accent-dark">con dscto.</span>
                  )}
                </p>
                <span className="flex items-center gap-1">
                  {onPagar && porPagar && !pagable && (
                    <Lock className="h-3 w-3 text-stone-400" strokeWidth={2} aria-label="Se paga en orden" />
                  )}
                  <EstadoBadge estado={estado} />
                </span>
              </div>
            </div>

            {pagable && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onPagar(cuota, "yape")}
                  className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-3 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark"
                >
                  <Smartphone className="h-4 w-4 text-huellitas-accent" strokeWidth={2} />
                  Yape
                </button>
                <button
                  type="button"
                  onClick={() => onPagar(cuota, "transferencia")}
                  className="flex items-center justify-center gap-2 rounded-lg border border-huellitas-primary px-3 py-2 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light"
                >
                  <Building2 className="h-4 w-4" strokeWidth={2} />
                  Transferencia
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
