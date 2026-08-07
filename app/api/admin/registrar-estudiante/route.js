import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DNI_REGEX = /^\d{8}$/;

function ultimoDiaMes(anio, mes) {
  return new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const estudiante = body?.estudiante ?? {};
  const matricula = body?.matricula ?? {};
  const apoderados = body?.apoderados ?? [];

  if (!DNI_REGEX.test(estudiante.dni ?? "")) {
    return NextResponse.json({ error: "El DNI debe tener 8 dígitos." }, { status: 400 });
  }
  if (!estudiante.nombres?.trim() || !estudiante.apellidos?.trim()) {
    return NextResponse.json(
      { error: "Nombres y apellidos son obligatorios." },
      { status: 400 }
    );
  }
  if (!estudiante.password || estudiante.password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }
  if (!matricula.aulaId) {
    return NextResponse.json({ error: "Selecciona un aula." }, { status: 400 });
  }
  if (!Array.isArray(apoderados) || apoderados.length < 1 || apoderados.length > 2) {
    return NextResponse.json(
      { error: "Debes registrar entre 1 y 2 apoderados." },
      { status: 400 }
    );
  }
  for (const a of apoderados) {
    if (!a.nombres?.trim() || !a.apellidos?.trim() || !a.parentesco) {
      return NextResponse.json(
        { error: "Cada apoderado necesita nombres, apellidos y parentesco." },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();

  const { data: existente } = await admin
    .from("estudiantes")
    .select("id")
    .eq("dni", estudiante.dni)
    .maybeSingle();

  if (existente) {
    return NextResponse.json(
      { error: "Ya existe un estudiante con ese DNI." },
      { status: 409 }
    );
  }

  const email = `estudiante${estudiante.dni}@huellitas.pe`;
  let authUserId = null;
  let estudianteId = null;

  try {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: estudiante.password,
      email_confirm: true,
      app_metadata: { role: "estudiante" },
      user_metadata: { nombres: estudiante.nombres, apellidos: estudiante.apellidos },
    });

    if (authError || !authData?.user) {
      throw new Error(authError?.message || "No se pudo crear el usuario de acceso.");
    }
    authUserId = authData.user.id;

    const { data: estudianteRow, error: estudianteError } = await admin
      .from("estudiantes")
      .insert({
        dni: estudiante.dni,
        nombres: estudiante.nombres.trim(),
        apellidos: estudiante.apellidos.trim(),
        fecha_nacimiento: estudiante.fechaNacimiento || null,
        user_id: authUserId,
        email_interno: email,
        password_cambiado: false,
      })
      .select("id")
      .single();

    if (estudianteError || !estudianteRow) {
      throw new Error(estudianteError?.message || "No se pudo crear el estudiante.");
    }
    estudianteId = estudianteRow.id;

    const hayPrincipalMarcado = apoderados.some((a) => a.esPrincipal);

    for (const [index, a] of apoderados.entries()) {
      const { data: apoderadoRow, error: apoderadoError } = await admin
        .from("apoderados")
        .insert({
          nombres: a.nombres.trim(),
          apellidos: a.apellidos.trim(),
          dni: a.dni?.trim() || null,
          parentesco: a.parentesco,
          telefono: a.telefono?.trim() || null,
          email: a.email?.trim() || null,
        })
        .select("id")
        .single();

      if (apoderadoError || !apoderadoRow) {
        throw new Error(apoderadoError?.message || "No se pudo registrar al apoderado.");
      }

      const esPrincipal = hayPrincipalMarcado ? Boolean(a.esPrincipal) : index === 0;

      const { error: vinculoError } = await admin.from("estudiante_apoderado").insert({
        estudiante_id: estudianteId,
        apoderado_id: apoderadoRow.id,
        es_principal: esPrincipal,
      });

      if (vinculoError) {
        throw new Error(vinculoError.message);
      }
    }

    const { data: aula, error: aulaError } = await admin
      .from("aulas")
      .select("id, nivel, anio_escolar_id")
      .eq("id", matricula.aulaId)
      .single();

    if (aulaError || !aula) {
      throw new Error("El aula seleccionada no existe.");
    }

    const { data: anioEscolar, error: anioError } = await admin
      .from("anios_escolares")
      .select("id, anio")
      .eq("id", aula.anio_escolar_id)
      .single();

    if (anioError || !anioEscolar) {
      throw new Error("No se encontró el año escolar del aula seleccionada.");
    }

    const { data: matriculaRow, error: matriculaError } = await admin
      .from("matriculas")
      .insert({
        estudiante_id: estudianteId,
        aula_id: aula.id,
        anio_escolar_id: anioEscolar.id,
        docente_id: matricula.docenteId || null,
        estado: "activa",
      })
      .select("id")
      .single();

    if (matriculaError || !matriculaRow) {
      throw new Error(matriculaError?.message || "No se pudo crear la matrícula.");
    }

    const nombreConcepto = aula.nivel === "inicial" ? "Pensión Inicial" : "Pensión Primaria";
    const { data: concepto } = await admin
      .from("conceptos_cobro")
      .select("id, monto_base")
      .eq("nombre", nombreConcepto)
      .maybeSingle();

    if (!concepto) {
      throw new Error(`No existe el concepto de cobro "${nombreConcepto}".`);
    }

    const { data: descuentoPuntualidad } = await admin
      .from("descuentos")
      .select("monto")
      .eq("anio_escolar_id", anioEscolar.id)
      .eq("tipo", "puntualidad")
      .maybeSingle();

    const montoBase = Number(concepto.monto_base);
    const montoConDescuento = montoBase - Number(descuentoPuntualidad?.monto ?? 0);

    const cuotasNuevas = Array.from({ length: 10 }, (_, i) => {
      const mes = i + 3; // marzo (3) a diciembre (12)
      return {
        matricula_id: matriculaRow.id,
        concepto_id: concepto.id,
        mes,
        monto: montoBase,
        monto_con_descuento: montoConDescuento,
        fecha_vencimiento: ultimoDiaMes(anioEscolar.anio, mes),
        estado: "pendiente",
      };
    });

    const { error: cuotasError } = await admin.from("cuotas").insert(cuotasNuevas);
    if (cuotasError) {
      throw new Error(cuotasError.message);
    }

    return NextResponse.json({
      estudiante_id: estudianteId,
      dni: estudiante.dni,
      email,
      password: estudiante.password,
    });
  } catch (error) {
    // Deja todo consistente: borrar el estudiante también borra en
    // cascada su matrícula y cuotas si llegaron a crearse.
    if (estudianteId) {
      await admin.from("estudiantes").delete().eq("id", estudianteId);
    }
    if (authUserId) {
      await admin.auth.admin.deleteUser(authUserId);
    }
    return NextResponse.json(
      { error: error.message || "No se pudo registrar al estudiante." },
      { status: 500 }
    );
  }
}
