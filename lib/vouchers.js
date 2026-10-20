import "server-only";

import { cuotasDelPago } from "@/lib/cuentas";

// Los vouchers están en un depósito privado: se muestran con enlaces
// temporales de una hora. Los pagos antiguos guardaban la URL completa.
const VIGENCIA_SEGUNDOS = 3600;
const rutaVoucher = (v) => (v?.startsWith("http") ? v.split("/vouchers/")[1] : v);

// Agrega a cada pago `voucherUrl`: su enlace temporal, o null.
export async function conEnlaceVoucher(supabase, pagos = []) {
  const rutas = [...new Set(pagos.map((p) => rutaVoucher(p.voucher_url)).filter(Boolean))];
  const { data } = rutas.length
    ? await supabase.storage.from("vouchers").createSignedUrls(rutas, VIGENCIA_SEGUNDOS)
    : { data: [] };
  const enlace = Object.fromEntries((data ?? []).map((f) => [f.path, f.signedUrl]));
  return pagos.map((p) => ({ ...p, voucherUrl: enlace[rutaVoucher(p.voucher_url)] ?? null }));
}

// Voucher de cada cuota de la matrícula: { [cuotaId]: enlace }. Solo los
// vouchers en revisión o aceptados (los rechazados no).
export async function vouchersPorCuota(supabase, matriculaId) {
  const { data: pagos } = await supabase
    .from("pagos")
    .select("voucher_url, cuota_id, cuotas_ids")
    .eq("matricula_id", matriculaId)
    .in("estado", ["validando", "verificado", "pagado"])
    .not("voucher_url", "is", null)
    .order("fecha_pago", { ascending: true });

  const porCuota = {};
  for (const pago of await conEnlaceVoucher(supabase, pagos ?? [])) {
    if (!pago.voucherUrl) continue;
    for (const id of cuotasDelPago(pago)) porCuota[id] = pago.voucherUrl;
  }
  return porCuota;
}
