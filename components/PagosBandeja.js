"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ExternalLink, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MESES, formatFecha } from "@/lib/fecha";
import { METODOS_PAGO } from "@/lib/pagoInfo";
import { formatSoles } from "@/lib/cuentas";
import { inputClass } from "@/lib/ui";
import AvisoVacio from "@/components/AvisoVacio";
import Campo from "@/components/Campo";
import Modal from "@/components/Modal";

// Motivos frecuentes: un toque y listo (se pueden editar).
const MOTIVOS = [
  "La foto del voucher no se ve bien",
  "El monto no coincide con la cuota",
  "No encontramos la operación en el banco",
  "El voucher ya se usó en otro pago",
];

function detallePago(p) {
  if (p.cuotas_ids?.length > 1) return `Pago consolidado · ${p.cuotas_ids.length} cuotas`;
  const concepto = p.cuotas?.conceptos_cobro?.nombre ?? "Pensión";
  return p.cuotas?.mes ? `${concepto} · ${MESES[p.cuotas.mes]}` : concepto;
}

// Vouchers enviados por los padres para validar. Cada pago trae
// `voucherUrl`: enlace temporal al archivo (el depósito es privado).
// Validar o rechazar cambia el pago y sus cuotas en un solo paso
// (función validar_pago de la base de datos).
export default function PagosBandeja({ pagos }) {
  const router = useRouter();
  const [resueltos, setResueltos] = useState(() => new Set());
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState("");
  const [rechazando, setRechazando] = useState(null);
  const [motivo, setMotivo] = useState("");

  const pendientes = pagos.filter((p) => !resueltos.has(p.id));

  async function resolver(pago, aprobar, motivoRechazo = null) {
    if (procesando) return;
    setProcesando(pago.id);
    setError("");
    const { error: fallo } = await createClient().rpc("validar_pago", {
      p_pago: pago.id,
      p_aprobar: aprobar,
      p_motivo: motivoRechazo,
    });
    setProcesando(null);
    if (fallo) return setError(fallo.message);
    setResueltos((prev) => new Set(prev).add(pago.id));
    setRechazando(null);
    router.refresh();
  }

  function abrirRechazo(pago) {
    setMotivo("");
    setRechazando(pago);
  }

  if (pendientes.length === 0) {
    return <AvisoVacio icono={Inbox}>No hay vouchers pendientes de validar.</AvisoVacio>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {pendientes.map((p) => {
        const est = p.matriculas?.estudiantes;
        return (
          <div
            key={p.id}
            className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-huellitas-ink">{est ? `${est.apellidos} ${est.nombres}` : "Estudiante"}</p>
              <p className="text-xs text-stone-500">
                DNI {est?.dni ?? "—"} · {p.matriculas?.aulas?.nombre ?? "—"}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {detallePago(p)} · {METODOS_PAGO[p.metodo] ?? p.metodo}
                {p.numero_operacion ? ` · Op. ${p.numero_operacion}` : ""}
              </p>
              {p.pagado_por && (
                <p className="text-xs text-huellitas-primary">
                  Pagado por: {p.pagado_por}
                  {p.pagado_por_parentesco ? ` (${p.pagado_por_parentesco})` : ""}
                </p>
              )}
              <p className="text-xs text-stone-400">Enviado el {formatFecha(p.fecha_pago)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-xl font-semibold text-huellitas-primary">{formatSoles(p.monto)}</p>

              {p.voucherUrl && (
                <a
                  href={p.voucherUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={2} />
                  Ver voucher
                </a>
              )}

              <button
                type="button"
                disabled={procesando === p.id}
                onClick={() => abrirRechazo(p)}
                className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" strokeWidth={2} />
                Rechazar
              </button>
              <button
                type="button"
                disabled={procesando === p.id}
                onClick={() => resolver(p, true)}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" strokeWidth={2} />
                {procesando === p.id ? "Guardando..." : "Validar"}
              </button>
            </div>
          </div>
        );
      })}

      {rechazando && (
        <Modal
          titulo="Rechazar voucher"
          subtitulo={`${detallePago(rechazando)} · ${formatSoles(rechazando.monto)}`}
          onCerrar={() => setRechazando(null)}
          pie={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRechazando(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={motivo.trim().length < 5 || procesando === rechazando.id}
                onClick={() => resolver(rechazando, false, motivo.trim())}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {procesando === rechazando.id ? "Guardando..." : "Rechazar y avisar al padre"}
              </button>
            </div>
          }
        >
          <p className="text-sm text-stone-600">
            El padre verá este motivo en su portal y podrá volver a enviar el voucher.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMotivo(m)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  motivo === m
                    ? "border-huellitas-primary bg-huellitas-primary-light text-huellitas-primary"
                    : "border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <Campo label="Motivo" required className="mt-4" ayuda="Mínimo 5 letras. Escríbelo como se lo dirías al padre.">
            <textarea
              rows={3}
              maxLength={300}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={inputClass}
            />
          </Campo>
        </Modal>
      )}
    </div>
  );
}
