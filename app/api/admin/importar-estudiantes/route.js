import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DNI_REGEX = /^\d{8}$/;

function ultimoDiaMes(anio, mes) {
  return new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);
}

// Carga masiva de estudiantes a un aula. Crea el estudiante (sin cuenta de
// acceso todavía — se activa luego), su matrícula y sus 10 cuotas del año.
// body: { aulaId, estudiantes: [{ apellidos, nombres, dni, fechaNacimiento? }] }
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const aulaId = body?.aulaId;
  const filas = Array.isArray(body?.estudiantes) ? body.estudiantes : [];

  if (!aulaId) {
    return NextResponse.json({ error: "Selecciona un aula." }, { status: 400 });
  }
  if (filas.length === 0) {
    return NextResponse.json({ error: "No hay estudiantes para importar." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: aula } = await admin
    .from("aulas")
    .select("id, nivel, anio_escolar_id")
    .eq("id", aulaId)
    .maybeSingle();
  if (!aula) {
    return NextResponse.json({ error: "El aula no existe." }, { status: 404 });
  }

  const { data: anio } = await admin
    .from("anios_escolares")
    .select("id, anio")
    .eq("id", aula.anio_escolar_id)
    .maybeSingle();

  const nombreConcepto = aula.nivel === "inicial" ? "Pensión Inicial" : "Pensión Primaria";
  const { data: concepto } = await admin
    .from("conceptos_cobro")
    .select("id, monto_base")
    .eq("nombre", nombreConcepto)
    .maybeSingle();
  if (!concepto) {
    return NextResponse.json(
      { error: `No existe el concepto "${nombreConcepto}".` },
      { status: 400 }
    );
  }

  const { data: descPuntualidad } = await admin
    .from("descuentos")
    .select("monto")
    .eq("anio_escolar_id", anio.id)
    .eq("tipo", "puntualidad")
    .maybeSingle();

  const montoBase = Number(concepto.monto_base);
  const montoConDescuento = montoBase - Number(descPuntualidad?.monto ?? 0);

  let creados = 0;
  const omitidos = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const dni = String(fila.dni ?? "").trim();
    const nombres = String(fila.nombres ?? "").trim();
    const apellidos = String(fila.apellidos ?? "").trim();
    const nro = i + 1;

    if (!DNI_REGEX.test(dni)) {
      omitidos.push({ fila: nro, dni, motivo: "DNI inválido (8 dígitos)" });
      continue;
    }
    if (!nombres || !apellidos) {
      omitidos.push({ fila: nro, dni, motivo: "Faltan nombres o apellidos" });
      continue;
    }

    const { data: existente } = await admin
      .from("estudiantes")
      .select("id")
      .eq("dni", dni)
      .maybeSingle();
    if (existente) {
      omitidos.push({ fila: nro, dni, motivo: "Ya existe un estudiante con ese DNI" });
      continue;
    }

    const email = `estudiante${dni}@huellitas.pe`;
    const { data: est, error: estErr } = await admin
      .from("estudiantes")
      .insert({
        dni,
        nombres,
        apellidos,
        fecha_nacimiento: fila.fechaNacimiento || null,
        email_interno: email,
        password_cambiado: false,
      })
      .select("id")
      .single();
    if (estErr || !est) {
      omitidos.push({ fila: nro, dni, motivo: estErr?.message || "No se pudo crear" });
      continue;
    }

    const { data: mat, error: matErr } = await admin
      .from("matriculas")
      .insert({
        estudiante_id: est.id,
        aula_id: aula.id,
        anio_escolar_id: anio.id,
        estado: "activa",
      })
      .select("id")
      .single();
    if (matErr || !mat) {
      await admin.from("estudiantes").delete().eq("id", est.id);
      omitidos.push({ fila: nro, dni, motivo: matErr?.message || "No se pudo matricular" });
      continue;
    }

    const cuotas = Array.from({ length: 10 }, (_, k) => {
      const mes = k + 3; // marzo (3) a diciembre (12)
      return {
        matricula_id: mat.id,
        concepto_id: concepto.id,
        mes,
        monto: montoBase,
        monto_con_descuento: montoConDescuento,
        fecha_vencimiento: ultimoDiaMes(anio.anio, mes),
        estado: "pendiente",
      };
    });
    await admin.from("cuotas").insert(cuotas);

    creados += 1;
  }

  return NextResponse.json({ creados, omitidos });
}
