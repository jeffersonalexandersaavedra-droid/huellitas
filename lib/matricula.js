import "server-only";

const MESES_CLASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // marzo – diciembre

function ultimoDiaMes(anio, mes) {
  return new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);
}

// Valida el aula y reúne lo necesario para matricular en ella: año escolar,
// pensión del nivel y descuento por puntualidad del año.
export async function prepararMatricula(admin, aulaId) {
  const { data: aula } = await admin
    .from("aulas")
    .select("id, nivel, anios_escolares(id, anio)")
    .eq("id", aulaId)
    .maybeSingle();
  if (!aula?.anios_escolares) throw new Error("El aula seleccionada no existe.");

  const nombreConcepto = aula.nivel === "inicial" ? "Pensión Inicial" : "Pensión Primaria";
  const [{ data: concepto }, { data: descuento }] = await Promise.all([
    admin.from("conceptos_cobro").select("id, monto_base").eq("nombre", nombreConcepto).maybeSingle(),
    admin
      .from("descuentos")
      .select("monto")
      .eq("anio_escolar_id", aula.anios_escolares.id)
      .eq("tipo", "puntualidad")
      .eq("activo", true)
      .maybeSingle(),
  ]);
  if (!concepto) throw new Error(`No existe el concepto de cobro "${nombreConcepto}".`);

  const monto = Number(concepto.monto_base);
  return {
    aulaId: aula.id,
    anioEscolarId: aula.anios_escolares.id,
    anio: aula.anios_escolares.anio,
    conceptoId: concepto.id,
    monto,
    montoConDescuento: monto - Number(descuento?.monto ?? 0),
  };
}

// Crea la matrícula y sus 10 pensiones. Si las cuotas fallan, deshace la
// matrícula para no dejar datos a medias. Devuelve el id de la matrícula.
export async function crearMatricula(admin, plan, { estudianteId, docenteId = null }) {
  const { data: matricula, error } = await admin
    .from("matriculas")
    .insert({
      estudiante_id: estudianteId,
      aula_id: plan.aulaId,
      anio_escolar_id: plan.anioEscolarId,
      docente_id: docenteId,
      estado: "activa",
    })
    .select("id")
    .single();
  if (error || !matricula) throw new Error(error?.message || "No se pudo crear la matrícula.");

  const cuotas = MESES_CLASE.map((mes) => ({
    matricula_id: matricula.id,
    concepto_id: plan.conceptoId,
    mes,
    monto: plan.monto,
    monto_con_descuento: plan.montoConDescuento,
    fecha_vencimiento: ultimoDiaMes(plan.anio, mes),
    estado: "pendiente",
  }));

  const { error: cuotasError } = await admin.from("cuotas").insert(cuotas);
  if (cuotasError) {
    await admin.from("matriculas").delete().eq("id", matricula.id);
    throw new Error(cuotasError.message);
  }
  return matricula.id;
}
