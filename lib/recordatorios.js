// Recordatorios de pago: qué hay que recordarle a cada familia y con qué
// mensaje. Lo usan el portal del padre, la pestaña Pagos › Recordatorios y
// el envío automático, así todos dicen lo mismo.

import { cuotaEstaVencida, montoACobrar, formatSoles } from "@/lib/cuentas";
import { MESES, finDelDia, formatFecha } from "@/lib/fecha";

// Días antes del vencimiento en que se recuerda la pensión que viene.
export const DIAS_AVISO_PREVIO = 5;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const porMes = (a, b) => (a.mes ?? 99) - (b.mes ?? 99);

// "Marzo", "Marzo y Abril", "Marzo, Abril y Mayo".
function listaDeMeses(cuotas) {
  const meses = cuotas.map((c) => MESES[c.mes]);
  return meses.length > 1 ? `${meses.slice(0, -1).join(", ")} y ${meses.at(-1)}` : (meses[0] ?? "");
}

// Pensiones vencidas sin pagar (con lo que cuestan hoy) y la próxima que
// vence en los siguientes días. Las que tienen un voucher en revisión no se
// recuerdan: el padre ya pagó y falta validarlo.
export function situacionDePago(cuotas = [], hoy = new Date()) {
  const porPagar = cuotas.filter((c) => c.estado === "pendiente" || c.estado === "vencido").sort(porMes);
  const vencidas = porPagar.filter((c) => cuotaEstaVencida(c, hoy));
  const limite = new Date(hoy.getTime() + DIAS_AVISO_PREVIO * MS_POR_DIA);
  const proxima =
    porPagar.find(
      (c) => !cuotaEstaVencida(c, hoy) && c.fecha_vencimiento && finDelDia(c.fecha_vencimiento) <= limite
    ) ?? null;
  return {
    vencidas,
    deuda: vencidas.reduce((suma, c) => suma + montoACobrar(c, hoy).monto, 0),
    proxima,
    montoProxima: proxima ? montoACobrar(proxima, hoy).monto : 0,
  };
}

export const hayQueRecordar = (situacion) => situacion.vencidas.length > 0 || Boolean(situacion.proxima);

// Lo pendiente en una línea, p. ej. "las pensiones de Marzo y Abril por S/ 600.00".
export function detalleRecordatorio({ vencidas, deuda, proxima, montoProxima }) {
  if (vencidas.length) {
    return `${vencidas.length === 1 ? "la pensión" : "las pensiones"} de ${listaDeMeses(vencidas)} por ${formatSoles(deuda)}`;
  }
  if (proxima) {
    return `la pensión de ${MESES[proxima.mes]}, que vence el ${formatFecha(proxima.fecha_vencimiento)}, por ${formatSoles(montoProxima)}`;
  }
  return "";
}

// Mensaje completo para WhatsApp y correo. `horario`: atención en secretaría.
export function mensajeRecordatorio({ apoderado, estudiante, situacion, horario }) {
  const vencidas = situacion.vencidas.length;
  const verbo = vencidas ? `tiene ${vencidas > 1 ? "pendientes" : "pendiente"}` : "tiene por pagar";
  const secretaria = horario ? `en secretaría (${horario})` : "en secretaría";
  return [
    `Hola ${apoderado}, le saluda la I.E.P. Huellitas.`,
    `Le recordamos que ${estudiante} ${verbo} ${detalleRecordatorio(situacion)}.`,
    `Puede pagar por Yape o transferencia desde el portal de padres (subiendo su voucher) o ${secretaria}.`,
    "Si ya realizó el pago, por favor ignore este mensaje. ¡Gracias!",
  ].join("\n\n");
}
