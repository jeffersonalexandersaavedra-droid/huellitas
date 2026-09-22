// Lógica CENTRALIZADA del estado de cuenta de un estudiante, calculada a
// partir de sus cuotas. Antes esta lógica estaba duplicada (y distinta) en
// la lista y en la ficha, lo que causaba que una dijera "Con deuda" y la
// otra "Al día". Ahora toda la app usa estas funciones para mostrar lo mismo.

export function cuotaEstaVencida(cuota, hoy = new Date()) {
  if (!cuota) return false;
  if (cuota.estado === "vencido") return true;
  if (cuota.estado === "pendiente" || cuota.estado === "validando") {
    return cuota.fecha_vencimiento && new Date(cuota.fecha_vencimiento) < hoy;
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

// Suma de lo que aún no está pagado (para KPIs y reportes).
export function montoPendiente(cuotas = []) {
  return cuotas
    .filter((c) => c.estado !== "pagado")
    .reduce((sum, c) => sum + Number(c.monto ?? 0), 0);
}

// Suma vencida (deuda real ya exigible).
export function montoVencido(cuotas = [], hoy = new Date()) {
  return cuotas
    .filter((c) => cuotaEstaVencida(c, hoy))
    .reduce((sum, c) => sum + Number(c.monto ?? 0), 0);
}
