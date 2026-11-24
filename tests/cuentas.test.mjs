import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cuotaEstaVencida,
  tieneDeuda,
  montoACobrar,
  siguienteCuotaPorPagar,
  reglaDePagoEnOrden,
  cuotasDelPago,
} from "@/lib/cuentas";

// 20 de octubre de 2026, mediodía (hora local).
const HOY = new Date(2026, 9, 20, 12);
const cuota = (mes, estado, extra = {}) => ({
  id: `c${mes}`,
  mes,
  estado,
  monto: 300,
  monto_con_descuento: 280,
  fecha_vencimiento: `2026-${String(mes).padStart(2, "0")}-28`,
  ...extra,
});

test("una pensión pendiente vence al terminar su fecha límite", () => {
  assert.equal(cuotaEstaVencida(cuota(9, "pendiente"), HOY), true);
  assert.equal(cuotaEstaVencida(cuota(10, "pendiente"), HOY), false);
  assert.equal(cuotaEstaVencida(cuota(10, "pendiente", { fecha_vencimiento: "2026-10-20" }), HOY), false);
});

test("una pensión pagada nunca cuenta como deuda", () => {
  assert.equal(cuotaEstaVencida(cuota(3, "pagado"), HOY), false);
  assert.equal(tieneDeuda([cuota(3, "pagado"), cuota(10, "pendiente")], HOY), false);
  assert.equal(tieneDeuda([cuota(3, "pagado"), cuota(9, "pendiente")], HOY), true);
});

test("el descuento por pronto pago se mantiene hasta el vencimiento y luego se pierde", () => {
  assert.deepEqual(montoACobrar(cuota(10, "pendiente"), HOY), { monto: 280, descuentoVigente: true });
  assert.deepEqual(montoACobrar(cuota(9, "pendiente"), HOY), { monto: 300, descuentoVigente: false });
});

test("se paga en orden: la cuota que toca es la más antigua sin pagar", () => {
  const cuotas = [cuota(5, "pendiente"), cuota(3, "pagado"), cuota(4, "pendiente")];
  assert.equal(siguienteCuotaPorPagar(cuotas).mes, 4);
});

test("un voucher en revisión bloquea los meses siguientes", () => {
  const regla = reglaDePagoEnOrden([cuota(3, "validando"), cuota(4, "pendiente")]);
  assert.equal(regla.cuotaPagable, null);
  assert.equal(regla.enRevision.mes, 3);
  assert.match(regla.motivoBloqueo, /revisando tu voucher de Marzo/);
});

test("un pago consolidado cubre todas sus cuotas", () => {
  assert.deepEqual(cuotasDelPago({ cuota_id: null, cuotas_ids: ["a", "b"] }), ["a", "b"]);
  assert.deepEqual(cuotasDelPago({ cuota_id: "a", cuotas_ids: [] }), ["a"]);
  assert.deepEqual(cuotasDelPago({ cuota_id: null, cuotas_ids: null }), []);
});
