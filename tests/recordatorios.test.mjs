import { test } from "node:test";
import assert from "node:assert/strict";
import {
  situacionDePago,
  hayQueRecordar,
  detalleRecordatorio,
  mensajeRecordatorio,
  DIAS_AVISO_PREVIO,
} from "@/lib/recordatorios";

const HOY = new Date(2026, 9, 20, 12); // 20/10/2026
const cuota = (mes, estado, fecha) => ({
  id: `c${mes}`,
  mes,
  estado,
  monto: 300,
  monto_con_descuento: 280,
  fecha_vencimiento: fecha ?? `2026-${String(mes).padStart(2, "0")}-28`,
});

test("junta las pensiones vencidas y suma su precio completo", () => {
  const s = situacionDePago([cuota(8, "pendiente"), cuota(9, "vencido"), cuota(10, "pendiente")], HOY);
  assert.deepEqual(s.vencidas.map((c) => c.mes), [8, 9]);
  assert.equal(s.deuda, 600);
  assert.equal(detalleRecordatorio(s), "las pensiones de Agosto y Septiembre por S/ 600.00");
});

test("no recuerda una pensión con voucher en revisión ni una ya pagada", () => {
  const s = situacionDePago([cuota(8, "validando"), cuota(9, "pagado")], HOY);
  assert.equal(hayQueRecordar(s), false);
});

test(`avisa de la próxima pensión solo dentro de los ${DIAS_AVISO_PREVIO} días previos`, () => {
  const cerca = situacionDePago([cuota(10, "pendiente", "2026-10-24")], HOY);
  assert.equal(cerca.proxima?.mes, 10);
  assert.equal(cerca.montoProxima, 280);

  const lejos = situacionDePago([cuota(10, "pendiente", "2026-10-31")], HOY);
  assert.equal(lejos.proxima, null);
  assert.equal(hayQueRecordar(lejos), false);
});

test("el mensaje incluye a quién, qué debe y el horario de secretaría", () => {
  const situacion = situacionDePago([cuota(9, "pendiente")], HOY);
  const texto = mensajeRecordatorio({
    apoderado: "Juana Saavedra",
    estudiante: "Jefferson Fernandez",
    situacion,
    horario: "Lun a Vie · Hasta 18:00",
  });
  assert.match(texto, /^Hola Juana Saavedra/);
  assert.match(texto, /Jefferson Fernandez tiene pendiente la pensión de Septiembre por S\/ 300\.00/);
  assert.match(texto, /secretaría \(Lun a Vie · Hasta 18:00\)/);
});

test("con varias pensiones el mensaje concuerda en plural", () => {
  const situacion = situacionDePago([cuota(8, "pendiente"), cuota(9, "pendiente")], HOY);
  const texto = mensajeRecordatorio({ apoderado: "Juana", estudiante: "Jefferson", situacion, horario: "" });
  assert.match(texto, /Jefferson tiene pendientes las pensiones de Agosto y Septiembre por S\/ 600\.00/);
  assert.match(texto, /o en secretaría\./);
});
