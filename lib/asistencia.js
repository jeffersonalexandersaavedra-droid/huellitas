// Estados de asistencia acordados con dirección (sin campo de detalle).
export const ESTADOS_ASISTENCIA = {
  asistio: { label: "Asistió", corto: "A", clase: "bg-emerald-100 text-emerald-700" },
  tardanza: { label: "Tardanza", corto: "T", clase: "bg-amber-100 text-amber-700" },
  falta_justificada: { label: "Falta justificada", corto: "FJ", clase: "bg-sky-100 text-sky-700" },
  falta_injustificada: { label: "Falta injustificada", corto: "FI", clase: "bg-rose-100 text-rose-700" },
};

export const CLAVES_ASISTENCIA = Object.keys(ESTADOS_ASISTENCIA);

export const totalesVacios = () => Object.fromEntries(CLAVES_ASISTENCIA.map((k) => [k, 0]));

// % de días que el estudiante estuvo en clase (asistió o llegó tarde).
export function porcentajeAsistencia(t) {
  const total = CLAVES_ASISTENCIA.reduce((s, k) => s + t[k], 0);
  return total ? Math.round(((t.asistio + t.tardanza) / total) * 100) : 0;
}

