"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Receipt, FileCheck2 } from "lucide-react";
import { ModalComprobante, AvisoComprobante } from "@/components/FormularioComprobante";
import AvisoVacio from "@/components/AvisoVacio";
import { inputClass, coincide } from "@/lib/ui";
import { MESES, formatFecha } from "@/lib/fecha";
import { formatSoles } from "@/lib/cuentas";
import { METODOS_PAGO } from "@/lib/pagoInfo";

// Pagos ya validados (caja o vouchers) que aún no tienen comprobante.
// pagos: [{ id, monto, metodo, fecha_pago, pagado_por, alumno, aula, anio,
//           cuotas, cuota_id, cuotas_ids, apoderados }]
export default function FacturarPagos({ pagos, configurado, consultaHabilitada }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(null);
  const [resultado, setResultado] = useState(null);

  const visibles = useMemo(() => pagos.filter((p) => coincide(busqueda, p.alumno, p.aula)), [busqueda, pagos]);

  function emitido(r) {
    setAbierto(null);
    setResultado(r);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {resultado && <AvisoComprobante resultado={resultado} onCerrar={() => setResultado(null)} />}

      {pagos.length === 0 ? (
        <AvisoVacio icono={FileCheck2}>Todos los pagos validados ya tienen su comprobante.</AvisoVacio>
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por estudiante o aula"
              className={`${inputClass} pl-9`}
            />
          </div>

          <ul className="space-y-3">
            {visibles.map((p) => {
              const meses = p.cuotas.map((c) => MESES[c.mes] || c.conceptos_cobro?.nombre).filter(Boolean);
              return (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-huellitas-ink">{p.alumno}</p>
                    <p className="text-xs text-stone-500">
                      {p.aula} · {meses.join(", ") || "Pago"} · {METODOS_PAGO[p.metodo] ?? p.metodo} ·{" "}
                      {formatFecha(p.fecha_pago)}
                    </p>
                    {p.pagado_por && <p className="text-xs text-huellitas-primary">Pagó: {p.pagado_por}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <b className="font-display text-lg text-huellitas-ink">{formatSoles(p.monto)}</b>
                    <button
                      type="button"
                      onClick={() => setAbierto(p)}
                      className="flex items-center gap-2 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark"
                    >
                      <Receipt className="h-4 w-4" strokeWidth={2} />
                      Emitir comprobante
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {abierto && (
        <ModalComprobante
          titulo="Emitir comprobante"
          subtitulo={`${abierto.alumno} · ${abierto.aula} · ${formatSoles(abierto.monto)}`}
          pago={abierto}
          apoderados={abierto.apoderados}
          configurado={configurado}
          consultaHabilitada={consultaHabilitada}
          onEmitido={emitido}
          onCerrar={() => setAbierto(null)}
        />
      )}
    </div>
  );
}
