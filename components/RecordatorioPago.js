import { AlertTriangle, CalendarClock } from "lucide-react";
import { situacionDePago, hayQueRecordar, detalleRecordatorio } from "@/lib/recordatorios";
import { cantidad } from "@/lib/ui";

// Recordatorio en el portal del padre: pensiones atrasadas o la próxima por
// vencer, cómo pagar y el horario de secretaría. "Pagar ahora" abre el pago
// de `cuotaPagable` (null si hay un voucher en revisión: no se muestra).
export default function RecordatorioPago({ cuotas, horario, cuotaPagable, onPagar }) {
  const situacion = situacionDePago(cuotas);
  if (!hayQueRecordar(situacion)) return null;

  const atrasada = situacion.vencidas.length > 0;
  const Icono = atrasada ? AlertTriangle : CalendarClock;
  return (
    <div
      role="status"
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        atrasada ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <div className="flex gap-3">
        <Icono className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
        <div className="text-sm">
          <p className="font-semibold">
            {atrasada
              ? `Tienes ${cantidad(situacion.vencidas.length, "pensión atrasada", "pensiones atrasadas")}`
              : "Se acerca el pago de tu pensión"}
          </p>
          <p>
            {atrasada ? "Debes" : "Recuerda pagar"} {detalleRecordatorio(situacion)}.
          </p>
          <p className="mt-1 text-xs opacity-80">
            Paga por Yape o transferencia desde aquí, o en secretaría{horario ? ` (${horario})` : ""}.
          </p>
        </div>
      </div>
      {cuotaPagable && (
        <button
          type="button"
          onClick={() => onPagar(cuotaPagable, "yape")}
          className="shrink-0 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark"
        >
          Pagar ahora
        </button>
      )}
    </div>
  );
}
