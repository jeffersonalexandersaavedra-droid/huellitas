"use client";

import { useState } from "react";
import { Check, X, ExternalLink, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MESES, formatFecha } from "@/lib/fecha";

const METODOS = {
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  deposito: "Depósito",
  efectivo: "Efectivo",
};

export default function PagosBandeja({ pagosIniciales }) {
  const supabase = createClient();
  const [pagos, setPagos] = useState(pagosIniciales);
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState("");

  function urlVoucher(voucher) {
    if (!voucher) return null;
    if (voucher.startsWith("http")) return voucher;
    const { data } = supabase.storage.from("vouchers").getPublicUrl(voucher);
    return data?.publicUrl ?? null;
  }

  async function resolver(pago, aprobar) {
    setProcesando(pago.id);
    setError("");

    const nuevoPago = aprobar ? "pagado" : "rechazado";
    const nuevaCuota = aprobar ? "pagado" : "pendiente";

    const { error: pagoErr } = await supabase
      .from("pagos")
      .update({ estado: nuevoPago, fecha_validacion: new Date().toISOString() })
      .eq("id", pago.id);

    let cuotaErr = null;
    if (!pagoErr) {
      // Un pago puede cubrir varias cuotas (pago consolidado) o una sola.
      const ids =
        pago.cuotas_ids && pago.cuotas_ids.length
          ? pago.cuotas_ids
          : pago.cuota_id
            ? [pago.cuota_id]
            : [];
      if (ids.length) {
        const res = await supabase
          .from("cuotas")
          .update({ estado: nuevaCuota })
          .in("id", ids);
        cuotaErr = res.error;
      }
    }

    setProcesando(null);

    if (pagoErr || cuotaErr) {
      setError((pagoErr || cuotaErr).message);
      return;
    }
    // Quitar de la bandeja
    setPagos((prev) => prev.filter((p) => p.id !== pago.id));
  }

  if (pagos.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <Inbox className="mx-auto h-8 w-8 text-stone-300" strokeWidth={2} />
        <p className="mt-3 text-sm text-stone-500">
          No hay vouchers pendientes de validar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {pagos.map((p) => {
        const est = p.matriculas?.estudiantes;
        const voucher = urlVoucher(p.voucher_url);
        return (
          <div
            key={p.id}
            className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-huellitas-ink">
                {est ? `${est.apellidos} ${est.nombres}` : "Estudiante"}
              </p>
              <p className="text-xs text-stone-500">
                DNI {est?.dni ?? "—"} · {p.matriculas?.aulas?.nombre ?? "—"}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {p.cuotas_ids && p.cuotas_ids.length > 1
                  ? `Pago consolidado · ${p.cuotas_ids.length} cuotas`
                  : `${p.cuotas?.conceptos_cobro?.nombre ?? "Pensión"}${
                      p.cuotas?.mes ? ` · ${MESES[p.cuotas.mes]}` : ""
                    }`}{" "}
                · {METODOS[p.metodo] ?? p.metodo}
                {p.numero_operacion ? ` · Op. ${p.numero_operacion}` : ""}
              </p>
              <p className="text-xs text-stone-400">
                Enviado el {formatFecha(p.fecha_pago)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <p className="font-display text-xl font-semibold text-huellitas-primary">
                S/ {Number(p.monto).toFixed(2)}
              </p>

              {voucher && (
                <a
                  href={voucher}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={2} />
                  Voucher
                </a>
              )}

              <button
                type="button"
                disabled={procesando === p.id}
                onClick={() => resolver(p, false)}
                aria-label="Rechazar"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                disabled={procesando === p.id}
                onClick={() => resolver(p, true)}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" strokeWidth={2} />
                Validar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
