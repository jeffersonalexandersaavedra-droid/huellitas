// Lógica CENTRALIZADA del estado de cuenta de un estudiante, calculada a
// partir de sus cuotas. Antes esta lógica estaba duplicada (y distinta) en
// la lista y en la ficha, lo que causaba que una dijera "Con deuda" y la
// otra "Al día". Ahora toda la app usa estas funciones para mostrar lo mismo.

import { finDelDia } from "@/lib/fecha";

export function cuotaEstaVencida(cuota, hoy = new Date()) {
  if (!cuota) return false;
  if (cuota.estado === "vencido") return true;
  if (cuota.estado === "pendiente" || cuota.estado === "validando") {
    return Boolean(cuota.fecha_vencimiento) && finDelDia(cuota.fecha_vencimiento) < hoy;
  }
  return false;
}

// ¿El estudiante tiene al menos una cuota vencida sin pagar?
export function tieneDeuda(cuotas = [], hoy = new Date()) {
  return cuotas.some((c) => cuotaEstaVencida(c, hoy));
}

// "con-deuda" | "al-dia"  (mismo criterio en toda la app)
export function estadoCuenta(cuotas = [], hoy = new Date()) {
  return tieneDeuda(cuotas, hoy) ? "con-deuda" : "al-dia";
}

// Suma vencida (deuda real ya exigible).
export function montoVencido(cuotas = [], hoy = new Date()) {
  return cuotas
    .filter((c) => cuotaEstaVencida(c, hoy))
    .reduce((sum, c) => sum + Number(c.monto ?? 0), 0);
}

// Monto que corresponde cobrar HOY por una cuota: mantiene el descuento
// mientras no venza; vencida, se cobra el monto completo.
export function montoACobrar(cuota, hoy = new Date()) {
  const vence = cuota.fecha_vencimiento ? finDelDia(cuota.fecha_vencimiento) : null;
  const descuentoVigente =
    cuota.monto_con_descuento != null && vence != null && hoy <= vence;
  return {
    monto: Number(descuentoVigente ? cuota.monto_con_descuento : cuota.monto),
    descuentoVigente,
  };
}

// Cuota más antigua por pagar: la única que se puede pagar por separado
// (regla de pago en orden; "Pagar todo" no se ve afectado).
export function siguienteCuotaPorPagar(cuotas = []) {
  return (
    cuotas
      .filter((c) => c.estado === "pendiente" || c.estado === "vencido")
      .sort((a, b) => (a.mes ?? 99) - (b.mes ?? 99))[0] ?? null
  );
}

// Agrupa filas por su matricula_id → Map(matriculaId → filas).
export function agruparPorMatricula(filas = []) {
  const mapa = new Map();
  for (const f of filas) {
    if (!mapa.has(f.matricula_id)) mapa.set(f.matricula_id, []);
    mapa.get(f.matricula_id).push(f);
  }
  return mapa;
}

export function formatSoles(n) {
  return `S/ ${Number(n || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
