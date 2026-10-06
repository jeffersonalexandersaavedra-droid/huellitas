"use client";

import { useState } from "react";
import { X, Upload, Copy, Check, Smartphone, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { YAPE, BANCOS } from "@/lib/pagoInfo";
import { formatSoles } from "@/lib/cuentas";
import { inputClass } from "@/lib/ui";
import Modal from "@/components/Modal";
import SelectorApoderado from "@/components/SelectorApoderado";

const METODOS = [
  { id: "yape", label: "Yape / Plin", icono: Smartphone },
  { id: "transferencia", label: "Transferencia", icono: Building2 },
];
const MAX_VOUCHER = 5 * 1024 * 1024;
const opcion = (activa) =>
  `flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-center text-sm font-medium transition-colors ${
    activa ? "border-huellitas-primary bg-huellitas-primary-light text-huellitas-primary" : "border-stone-200 text-stone-600"
  }`;

// Pago con voucher desde el portal del padre (Yape/Plin o transferencia):
// una cuota o "Pagar todo lo pendiente" (varias). Queda en "validando"
// hasta que administración revisa el voucher en Pagos.
//   cuotas: [{ id, concepto, monto }]
export default function ModalPago({ metodo: metodoInicial, cuotas, matriculaId, estudianteNombre, apoderados = [], onClose, onSubmitted }) {
  const unaCuota = cuotas.length === 1;
  const total = cuotas.reduce((s, c) => s + Number(c.monto), 0);

  const [metodo, setMetodo] = useState(metodoInicial);
  const [banco, setBanco] = useState("bcp");
  const [voucher, setVoucher] = useState(null);
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [monto, setMonto] = useState(String(total));
  const [pagadorIdx, setPagadorIdx] = useState("0");
  const [confirmado, setConfirmado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const cuenta =
    metodo === "yape"
      ? { numero: YAPE.numero, titular: YAPE.titular }
      : { numero: BANCOS[banco].cuenta, titular: BANCOS[banco].titular, banco: BANCOS[banco].label };
  const puedeEnviar =
    Boolean(voucher) && numeroOperacion.replace(/\D/g, "").length >= 6 && Number(monto) > 0 && confirmado;

  function elegirVoucher(file) {
    if (!file) return;
    if (file.size > MAX_VOUCHER) {
      setError("El archivo supera los 5 MB.");
      return;
    }
    setError("");
    setVoucher(file);
  }

  function copiar() {
    navigator.clipboard?.writeText(cuenta.numero.replace(/\s/g, ""));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function enviar() {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");

      const ids = cuotas.map((c) => c.id);
      const extension = voucher.name.split(".").pop();
      const ruta = `${user.id}/${unaCuota ? ids[0] : "total"}-${Date.now()}.${extension}`;
      const { error: errorSubida } = await supabase.storage.from("vouchers").upload(ruta, voucher);
      if (errorSubida) throw new Error("No se pudo subir el voucher. Intenta de nuevo.");

      const pagador = apoderados[Number(pagadorIdx)];
      const { error: errorPago } = await supabase.from("pagos").insert({
        ...(unaCuota ? { cuota_id: ids[0] } : { cuota_id: null, cuotas_ids: ids }),
        matricula_id: matriculaId,
        monto: Number(monto),
        metodo,
        banco: cuenta.banco ?? null,
        numero_operacion: numeroOperacion,
        voucher_url: ruta,
        estado: "validando",
        pagado_por: pagador ? `${pagador.nombres} ${pagador.apellidos}` : null,
        pagado_por_parentesco: pagador?.parentesco ?? null,
      });
      if (errorPago) throw new Error("No se pudo registrar el pago. Intenta de nuevo.");

      await supabase.from("cuotas").update({ estado: "validando" }).in("id", ids);
      onSubmitted?.();
      onClose();
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={unaCuota ? `Pagar ${cuotas[0].concepto}` : "Pagar todo lo pendiente"}
      onCerrar={onClose}
      pie={
        <button
          type="button"
          disabled={!puedeEnviar || enviando}
          onClick={enviar}
          className="w-full rounded-lg bg-huellitas-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Enviando..." : `Enviar pago de ${formatSoles(unaCuota ? Number(monto) || 0 : total)}`}
        </button>
      }
    >
      <div className="space-y-6">
        {!unaCuota && (
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-sm font-medium text-huellitas-ink">Estás pagando {cuotas.length} cuotas:</p>
            <ul className="mt-2 space-y-1">
              {cuotas.map((c) => (
                <li key={c.id} className="flex justify-between text-sm text-stone-600">
                  <span>{c.concepto}</span>
                  <span>{formatSoles(c.monto)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-huellitas-ink">1. Realiza el pago</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {METODOS.map(({ id, label, icono: Icono }) => (
              <button key={id} type="button" onClick={() => setMetodo(id)} className={opcion(metodo === id)}>
                <Icono className="h-4 w-4" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
          {metodo === "transferencia" && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Object.entries(BANCOS).map(([clave, b]) => (
                <button key={clave} type="button" onClick={() => setBanco(clave)} className={`${opcion(banco === clave)} text-xs`}>
                  {b.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 rounded-xl bg-huellitas-primary-light p-4">
            {cuenta.banco && (
              <p className="text-xs font-medium uppercase tracking-wide text-huellitas-primary/70">{cuenta.banco}</p>
            )}
            <p className="select-all font-display text-2xl font-semibold text-huellitas-primary">{cuenta.numero}</p>
            <p className="mt-1 text-sm text-huellitas-ink/70">Titular: {cuenta.titular}</p>
            <p className="mt-1 text-sm text-huellitas-ink/70">
              Concepto: {estudianteNombre} – {unaCuota ? cuotas[0].concepto : "varias cuotas"}
            </p>
            <p className="mt-2 font-display text-xl font-semibold text-huellitas-primary">{formatSoles(total)}</p>
          </div>
          <button
            type="button"
            onClick={copiar}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-huellitas-accent px-4 py-2 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
          >
            {copiado ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={2} />}
            {copiado ? "Copiado" : metodo === "yape" ? "Copiar número" : "Copiar número de cuenta"}
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-huellitas-ink">2. Sube tu voucher</p>
          {voucher ? (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-stone-200 p-3">
              <span className="truncate text-sm text-stone-600">{voucher.name}</span>
              <button type="button" onClick={() => setVoucher(null)} aria-label="Quitar voucher" className="text-stone-400 hover:text-rose-600">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                elegirVoucher(e.dataTransfer.files?.[0]);
              }}
              className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-stone-300 p-6 text-center transition-colors hover:border-huellitas-accent"
            >
              <Upload className="h-6 w-6 text-huellitas-accent" strokeWidth={2} />
              <span className="text-sm text-stone-600">Arrastra tu voucher aquí o haz clic para seleccionar</span>
              <span className="text-xs text-stone-400">JPG, PNG o PDF hasta 5 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => elegirVoucher(e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-huellitas-ink">3. Confirma los datos</p>
          <div className="mt-3 space-y-3">
            <SelectorApoderado apoderados={apoderados} value={pagadorIdx} onChange={setPagadorIdx} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-600">Número de operación</span>
              <input
                type="text"
                inputMode="numeric"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                className={inputClass}
              />
            </label>
            {unaCuota && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-stone-600">Monto pagado</span>
                <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} />
              </label>
            )}
            <label className="flex items-start gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="mt-0.5 accent-huellitas-primary"
              />
              Confirmo que los datos son correctos
            </label>
          </div>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>
    </Modal>
  );
}
