"use client";

import { useRouter } from "next/navigation";
import { CalendarRange, Wallet } from "lucide-react";
import ExportarExcelButton from "@/components/ExportarExcelButton";
import Campo from "@/components/Campo";
import { controlClass } from "@/lib/ui";
import { hoyISO } from "@/lib/fecha";
import { formatSoles } from "@/lib/cuentas";
import {
  hojaRegistroVentas,
  hojaArqueo,
  cobradoEnCaja,
  totalesPorMetodo,
  totalesPorTipo,
  redondear,
} from "@/lib/facturacion";

const PLURALES = { boleta: "Boletas", factura: "Facturas", ticket: "Tickets", nota_credito: "Notas de crédito" };

function Tarjeta({ icono: Icono, titulo, explicacion, children }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
        <Icono className="h-5 w-5" strokeWidth={2} />
        {titulo}
      </h2>
      <p className="mt-1 text-sm text-stone-500">{explicacion}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

// Los dos reportes del contador: ventas del mes (registro de ventas) y
// cuadre de caja de un día, con los totales a la vista antes de descargar.
//   delMes: comprobantes del mes · delDia: comprobantes del día
//   conNota: ids anulados con nota de crédito (registro de ventas)
export default function ReportesFacturacion({ delMes, delDia, conNota, mes, dia }) {
  const router = useRouter();
  const ir = (cambios) =>
    router.push(`/admin/facturacion?${new URLSearchParams({ tab: "reportes", mes, dia, ...cambios })}`);

  const caja = cobradoEnCaja(delDia);
  const totalCaja = redondear(caja.reduce((s, c) => s + Number(c.total), 0));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Tarjeta
        icono={CalendarRange}
        titulo="Ventas del mes"
        explicacion="El Excel que le pasas al contador cada mes. Los tickets internos no entran porque no van a SUNAT."
      >
        <Campo label="Mes">
          <input type="month" value={mes} onChange={(e) => e.target.value && ir({ mes: e.target.value })} className={controlClass} />
        </Campo>
        <ul className="grid grid-cols-2 gap-2">
          {totalesPorTipo(delMes).map((t) => (
            <li key={t.tipo} className="rounded-lg bg-huellitas-cream p-3">
              <p className="text-xs text-stone-500">
                {PLURALES[t.tipo]} · {t.cantidad}
              </p>
              <p className="font-display text-lg font-semibold text-huellitas-ink">
                {t.tipo === "nota_credito" && t.monto > 0 ? "−" : ""}
                {formatSoles(t.monto)}
              </p>
            </li>
          ))}
        </ul>
        <ExportarExcelButton
          archivo={`registro_ventas_${mes}`}
          hoja={hojaRegistroVentas(delMes, mes, new Set(conNota))}
          label="Descargar ventas del mes"
        />
      </Tarjeta>

      <Tarjeta
        icono={Wallet}
        titulo="Cuadre de caja del día"
        explicacion="Para cerrar la caja: compara estos montos con el dinero en efectivo y con lo que llegó por Yape, Plin o banco."
      >
        <Campo label="Día">
          <input type="date" value={dia} max={hoyISO()} onChange={(e) => e.target.value && ir({ dia: e.target.value })} className={controlClass} />
        </Campo>
        {caja.length === 0 ? (
          <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-500">Ese día no se entregaron comprobantes.</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 text-sm">
            {totalesPorMetodo(caja).map((m) => (
              <li key={m.metodo} className="flex justify-between px-3 py-2">
                <span className="text-stone-600">{m.metodo}</span>
                <b className="text-huellitas-ink">{formatSoles(m.monto)}</b>
              </li>
            ))}
            <li className="flex justify-between bg-huellitas-cream px-3 py-2">
              <span className="font-medium text-huellitas-ink">Total del día ({caja.length})</span>
              <b className="text-huellitas-primary">{formatSoles(totalCaja)}</b>
            </li>
          </ul>
        )}
        <ExportarExcelButton archivo={`cuadre_caja_${dia}`} hoja={hojaArqueo(delDia, dia)} label="Descargar cuadre del día" />
      </Tarjeta>
    </div>
  );
}
