// Datos de la ficha del estudiante (panel de administración): sus datos,
// apoderados, la matrícula vigente con cuotas, descuentos y notas, y el
// histórico de los años anteriores. Devuelve null si el estudiante no existe.

import { tieneDeuda, montoVencido, agruparPorMatricula } from "@/lib/cuentas";

const SIN_FILAS = { data: [] };
const porAnioDesc = (a, b) => (b.anios_escolares?.anio ?? 0) - (a.anios_escolares?.anio ?? 0);

async function delAnioActual(supabase, matricula) {
  if (!matricula) return [[], [], []];
  const [{ data: cuotas }, { data: notas }, { data: descuentos }] = await Promise.all([
    supabase
      .from("cuotas")
      .select("id, mes, monto, monto_con_descuento, fecha_vencimiento, estado, conceptos_cobro(nombre)")
      .eq("matricula_id", matricula.id)
      .order("mes", { ascending: true }),
    supabase.from("notas_curso").select("bimestre").eq("matricula_id", matricula.id),
    supabase
      .from("descuentos_estudiante")
      .select("id, tipo, monto, motivo")
      .eq("matricula_id", matricula.id)
      .order("created_at", { ascending: true }),
  ]);
  return [cuotas ?? [], notas ?? [], descuentos ?? []];
}

// Un resumen por cada año anterior. Una matrícula de un año ya pasado que
// sigue "activa" se muestra como culminada.
async function historicoDe(supabase, anteriores) {
  const ids = anteriores.map((m) => m.id);
  const [cuotas, pagos, notas] = await Promise.all(
    ids.length
      ? [
          supabase.from("cuotas").select("matricula_id, monto, estado, fecha_vencimiento").in("matricula_id", ids),
          supabase.from("pagos").select("matricula_id, monto").eq("estado", "pagado").in("matricula_id", ids),
          supabase.from("notas_curso").select("matricula_id").in("matricula_id", ids),
        ]
      : [SIN_FILAS, SIN_FILAS, SIN_FILAS]
  );
  const cuotasPor = agruparPorMatricula(cuotas.data ?? []);
  const pagosPor = agruparPorMatricula(pagos.data ?? []);
  const conNotas = new Set((notas.data ?? []).map((n) => n.matricula_id));

  return anteriores.map((m) => {
    const delAnio = cuotasPor.get(m.id) ?? [];
    return {
      id: m.id,
      anio: m.anios_escolares?.anio ?? "—",
      aula: m.aulas?.nombre ?? "—",
      estado: m.estado === "activa" ? "culminado" : m.estado,
      pensiones: `${delAnio.filter((c) => c.estado === "pagado").length} de ${delAnio.length}`,
      pagado: (pagosPor.get(m.id) ?? []).reduce((s, p) => s + Number(p.monto), 0),
      deuda: montoVencido(delAnio),
      conNotas: conNotas.has(m.id),
    };
  });
}

export async function fichaEstudiante(supabase, id) {
  const [{ data: estudiante }, { data: matriculas }, { data: vinculos }] = await Promise.all([
    supabase
      .from("estudiantes")
      .select("id, dni, nombres, apellidos, fecha_nacimiento, activo, password_cambiado, user_id")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("matriculas")
      .select("id, estado, aulas(nombre, nivel), anios_escolares(anio)")
      .eq("estudiante_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("estudiante_apoderado")
      .select("es_principal, apoderados(id, nombres, apellidos, parentesco, telefono, email, direccion)")
      .eq("estudiante_id", id),
  ]);
  if (!estudiante) return null;

  // La matrícula más reciente es la del año en curso; las demás, el histórico.
  const [matricula = null, ...anteriores] = (matriculas ?? []).sort(porAnioDesc);
  const [[cuotas, notas, descuentos], historico] = await Promise.all([
    delAnioActual(supabase, matricula),
    historicoDe(supabase, anteriores),
  ]);

  // Competencias calificadas por bimestre.
  const calificadas = {};
  for (const n of notas) calificadas[n.bimestre] = (calificadas[n.bimestre] ?? 0) + 1;

  return {
    estudiante,
    matricula,
    apoderados: (vinculos ?? [])
      .filter((v) => v.apoderados)
      .sort((a, b) => Number(b.es_principal) - Number(a.es_principal))
      .map((v) => ({ ...v.apoderados, esPrincipal: v.es_principal })),
    cuotas,
    descuentos,
    conDeuda: tieneDeuda(cuotas),
    calificadas,
    conNotas: notas.length > 0,
    historico,
  };
}
