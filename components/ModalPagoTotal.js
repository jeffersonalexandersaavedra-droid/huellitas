"use client";

import { useState } from "react";
import { X, Upload, Smartphone, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NUMERO_YAPE = "942 608 498";
const TITULAR_YAPE = "Daysi Reátegui Peláez";

const BANCOS = {
  bcp: { label: "BCP", cuenta: "191-1234567-0-90", cci: "002-191-001234567090-15", titular: "I.E.P. Huellitas EIRL" },
  bbva: { label: "BBVA", cuenta: "0011-0234-01-98765432", cci: "011-234-000198765432-15", titular: "I.E.P. Huellitas EIRL" },
  interbank: { label: "Interbank", cuenta: "898-3001234567", cci: "003-898-003001234567-11", titular: "I.E.P. Huellitas EIRL" },
  scotiabank: { label: "Scotiabank", cuenta: "000-1234567", cci: "009-000-000001234567-45", titular: "I.E.P. Huellitas EIRL" },
};

export default function ModalPagoTotal({
  open,
  onClose,
  matriculaId,
  estudianteNombre,
  detalle, // [{ id, concepto, monto }]
  total,
  onSubmitted,
}) {
  const [metodo, setMetodo] = useState("yape");
  const [banco, setBanco] = useState("bcp");
  const [voucherFile, setVoucherFile] = useState(null);
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const cuentaBanco = BANCOS[banco];
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

    const ids = detalle.map((d) => d.id);
    const ext = voucherFile.name.split(".").pop();
    const path = `${user.id}/total-${Date.now()}.${ext}`;

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
      cuota_id: null,
      cuotas_ids: ids,
      matricula_id: matriculaId,
      monto: Number(total),
      metodo,
      banco: metodo === "transferencia" ? cuentaBanco.label : null,
      numero_operacion: numeroOperacion,
      voucher_url: publicUrl,
      estado: "validando",
    });
    if (pagoError) {
      setError("No se pudo registrar el pago. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    await supabase.from("cuotas").update({ estado: "validando" }).in("id", ids);

    setLoading(false);
    onSubmitted?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-huellitas-ink/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <h2 className="font-display text-lg font-semibold text-huellitas-primary">
            Pagar todo lo pendiente
          </h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto p-5">
          {/* Resumen de cuotas */}
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-sm font-medium text-huellitas-ink">
              Estás pagando {detalle.length} cuota(s):
            </p>
            <ul className="mt-2 space-y-1">
              {detalle.map((d) => (
                <li key={d.id} className="flex justify-between text-sm text-stone-600">
                  <span>{d.concepto}</span>
                  <span>S/ {Number(d.monto).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-stone-100 pt-3">
              <span className="font-medium text-huellitas-ink">Total</span>
              <span className="font-display text-xl font-semibold text-huellitas-primary">
                S/ {Number(total).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Método */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "yape", label: "Yape", icon: Smartphone },
              { key: "transferencia", label: "Transferencia", icon: Building2 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMetodo(key)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  metodo === key
                    ? "border-huellitas-primary bg-huellitas-primary-light text-huellitas-primary"
                    : "border-stone-200 text-stone-600"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          {/* Datos de pago */}
          {metodo === "yape" ? (
            <div className="rounded-xl bg-huellitas-primary-light p-4">
              <p className="select-all font-display text-2xl font-semibold text-huellitas-primary">
                {NUMERO_YAPE}
              </p>
              <p className="mt-1 text-sm text-huellitas-ink/70">Titular: {TITULAR_YAPE}</p>
              <p className="mt-1 text-sm text-huellitas-ink/70">
                Concepto: {estudianteNombre} · varias cuotas
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(BANCOS).map(([key, b]) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      banco === key
                        ? "border-huellitas-primary bg-huellitas-primary-light text-huellitas-primary"
                        : "border-stone-200 text-stone-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="banco-total"
                      value={key}
                      checked={banco === key}
                      onChange={() => setBanco(key)}
                      className="accent-huellitas-primary"
                    />
                    {b.label}
                  </label>
                ))}
              </div>
              <div className="mt-3 rounded-xl bg-huellitas-primary-light p-4">
                <p className="select-all font-display text-lg font-semibold text-huellitas-primary">
                  {cuentaBanco.cuenta}
                </p>
                <p className="mt-1 text-sm text-huellitas-ink/70">CCI: {cuentaBanco.cci}</p>
                <p className="mt-1 text-sm text-huellitas-ink/70">Titular: {cuentaBanco.titular}</p>
              </div>
            </div>
          )}

          {/* Voucher */}
          <div>
            <p className="text-sm font-medium text-huellitas-ink">Sube tu voucher</p>
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
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files?.[0]);
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
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Número de operación
            </label>
            <input
              type="text"
              value={numeroOperacion}
              onChange={(e) => setNumeroOperacion(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
            />
            <label className="mt-3 flex items-start gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="mt-0.5 accent-huellitas-primary"
              />
              Confirmo que pagué el total y los datos son correctos
            </label>
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
            {loading ? "Enviando..." : `Enviar pago de S/ ${Number(total).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
