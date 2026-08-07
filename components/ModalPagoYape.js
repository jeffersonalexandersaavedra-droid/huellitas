"use client";

import { useState } from "react";
import { X, Upload, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NUMERO_YAPE = "942 608 498";
const TITULAR_YAPE = "Daysi Reátegui Peláez";

export default function ModalPagoYape({
  open,
  onClose,
  cuota,
  estudianteNombre,
  onSubmitted,
}) {
  const [voucherFile, setVoucherFile] = useState(null);
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [montoPagado, setMontoPagado] = useState(cuota ? String(cuota.monto) : "");
  const [confirmado, setConfirmado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !cuota) return null;

  const puedeEnviar =
    Boolean(voucherFile) &&
    numeroOperacion.replace(/\D/g, "").length >= 6 &&
    confirmado;

  function handleFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo supera los 5 MB.");
      return;
    }
    setError("");
    setVoucherFile(file);
  }

  function handleCopiar() {
    navigator.clipboard?.writeText(NUMERO_YAPE.replace(/\s/g, ""));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleSubmit() {
    if (!puedeEnviar) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }

    const extension = voucherFile.name.split(".").pop();
    const path = `${user.id}/${cuota.id}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("vouchers")
      .upload(path, voucherFile);

    if (uploadError) {
      setError("No se pudo subir el voucher. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("vouchers").getPublicUrl(path);

    const { error: pagoError } = await supabase.from("pagos").insert({
      cuota_id: cuota.id,
      matricula_id: cuota.matriculaId,
      monto: Number(montoPagado),
      metodo: "yape",
      numero_operacion: numeroOperacion,
      voucher_url: publicUrl,
      estado: "validando",
    });

    if (pagoError) {
      setError("No se pudo registrar el pago. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    await supabase.from("cuotas").update({ estado: "validando" }).eq("id", cuota.id);

    setLoading(false);
    onSubmitted?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-huellitas-ink/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <h2 className="font-display text-lg font-semibold text-huellitas-primary">
            Pagar con Yape
          </h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto p-5">
          <div>
            <p className="text-sm font-medium text-huellitas-ink">
              1. Realiza el pago desde tu app de Yape
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Envía el pago al siguiente número:
            </p>

            <div className="mt-3 rounded-xl bg-huellitas-primary-light p-4">
              <p className="select-all font-display text-2xl font-semibold text-huellitas-primary">
                {NUMERO_YAPE}
              </p>
              <p className="mt-1 text-sm text-huellitas-ink/70">
                Titular: {TITULAR_YAPE}
              </p>
              <p className="mt-1 text-sm text-huellitas-ink/70">
                Concepto: {estudianteNombre} - {cuota.concepto}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-huellitas-primary">
                S/ {Number(cuota.monto).toFixed(2)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopiar}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-huellitas-accent px-4 py-2 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
            >
              {copiado ? (
                <Check className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={2} />
              )}
              {copiado ? "Copiado" : "Copiar número"}
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-huellitas-ink">
              2. Sube tu voucher del pago
            </p>

            {voucherFile ? (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-stone-200 p-3">
                <span className="truncate text-sm text-stone-600">{voucherFile.name}</span>
                <button
                  type="button"
                  onClick={() => setVoucherFile(null)}
                  className="text-stone-400 hover:text-rose-600"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFile(event.dataTransfer.files?.[0]);
                }}
                className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-stone-300 p-6 text-center transition-colors hover:border-huellitas-accent"
              >
                <Upload className="h-6 w-6 text-huellitas-accent" strokeWidth={2} />
                <span className="text-sm text-stone-600">
                  Arrastra tu voucher aquí o haz clic para seleccionar
                </span>
                <span className="text-xs text-stone-400">JPG, PNG o PDF hasta 5 MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-huellitas-ink">3. Confirma los datos</p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Número de operación
                </label>
                <input
                  type="text"
                  value={numeroOperacion}
                  onChange={(event) => setNumeroOperacion(event.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Monto pagado
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoPagado}
                  onChange={(event) => setMontoPagado(event.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={confirmado}
                  onChange={(event) => setConfirmado(event.target.checked)}
                  className="mt-0.5 accent-huellitas-primary"
                />
                Confirmo que los datos son correctos
              </label>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
        </div>

        <div className="border-t border-stone-100 p-5">
          <button
            type="button"
            disabled={!puedeEnviar || loading}
            onClick={handleSubmit}
            className="w-full rounded-lg bg-huellitas-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar para verificación"}
          </button>
        </div>
      </div>
    </div>
  );
}
