import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  nubefactConfigurado,
  generarComprobante,
  comunicarBaja,
  resultadoSunat,
} from "@/lib/nubefact";
import {
  errorComprobante,
  itemsDePago,
  totalItems,
  redondear,
  numeroComprobante,
  TIPOS_CORTOS,
  DIAS_COMUNICACION_BAJA,
} from "@/lib/facturacion";
import { hoyISO } from "@/lib/fecha";

// Emisión y anulación de comprobantes. Todo pasa por aquí (con la
// service_role) para que nadie pueda saltarse la numeración ni las reglas
// de SUNAT desde el navegador.

const BUCKET = "comprobantes";
const ARCHIVOS = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
const MAX_ARCHIVO = 5 * 1024 * 1024;

const texto = (valor, max) => String(valor ?? "").trim().slice(0, max);

function limpiarCliente(c = {}) {
  return {
    tipoDoc: ["1", "4", "6", "7", "-"].includes(c.tipoDoc) ? c.tipoDoc : "1",
    numDoc: texto(c.numDoc, 15).toUpperCase(),
    nombre: texto(c.nombre, 150),
    direccion: texto(c.direccion, 200),
    email: texto(c.email, 100).toLowerCase(),
  };
}

function limpiarItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 20).map((i) => ({
    descripcion: texto(i.descripcion, 250),
    cantidad: Number(i.cantidad),
    precio: redondear(i.precio),
  }));
}

// Conceptos, método y matrícula de un pago ya validado.
async function datosDelPago(admin, pagoId) {
  const { data: pago } = await admin
    .from("pagos")
    .select(
      "id, monto, metodo, estado, fecha_pago, cuota_id, cuotas_ids, matricula_id, matriculas(estudiantes(nombres, apellidos), aulas(nombre), anios_escolares(anio))"
    )
    .eq("id", pagoId)
    .maybeSingle();
  if (!pago) return { error: "No se encontró el pago." };
  if (pago.estado !== "pagado" && pago.estado !== "verificado") {
    return { error: "Solo se emiten comprobantes de pagos ya validados." };
  }

  const ids = pago.cuotas_ids?.length ? pago.cuotas_ids : [pago.cuota_id].filter(Boolean);
  const { data: cuotas } = ids.length
    ? await admin
        .from("cuotas")
        .select("id, mes, monto, monto_con_descuento, fecha_vencimiento, conceptos_cobro(nombre)")
        .in("id", ids)
    : { data: [] };

  const m = pago.matriculas;
  return {
    matriculaId: pago.matricula_id,
    metodo: pago.metodo,
    items: itemsDePago({
      pago,
      cuotas: cuotas ?? [],
      alumno: m?.estudiantes && `${m.estudiantes.apellidos} ${m.estudiantes.nombres}`,
      aula: m?.aulas?.nombre,
      anio: m?.anios_escolares?.anio,
    }),
  };
}

async function reservarNumero(admin, tipo, prefijo = null) {
  const { data } = await admin.rpc("reservar_numero", { p_tipo: tipo, p_prefijo: prefijo });
  return data?.[0] ?? null;
}

const liberarNumero = (admin, { serie, numero }) =>
  admin.rpc("liberar_numero", { p_serie: serie, p_numero: numero });

async function actualizar(admin, id, cambios) {
  const { data, error } = await admin.from("comprobantes").update(cambios).eq("id", id).select().single();
  if (error) return { error: error.message };
  const aviso =
    data.estado === "rechazado"
      ? `SUNAT rechazó el comprobante${data.sunat_descripcion ? `: ${data.sunat_descripcion}` : "."} Emite uno nuevo con los datos corregidos.`
      : null;
  return { comprobante: data, aviso };
}

// Envía un comprobante electrónico al proveedor (también sirve para
// reintentar uno pendiente: si ya existía, solo trae su estado).
async function enviar(admin, c, referencia = null) {
  const r = await generarComprobante(c, referencia);
  if (r.datos) return actualizar(admin, c.id, resultadoSunat(r.datos));
  if (r.sinRespuesta) {
    const res = await actualizar(admin, c.id, { sunat_descripcion: r.error });
    return { ...res, aviso: r.error };
  }
  // El proveedor no lo creó (datos inválidos o cuenta sin servicio): se
  // descarta y se devuelve el número para no dejar saltos.
  await admin.from("comprobantes").delete().eq("id", c.id);
  await liberarNumero(admin, c);
  return { error: `El proveedor de facturación no aceptó el comprobante: ${r.error}` };
}

async function guardarArchivo(admin, id, archivo) {
  const extension = ARCHIVOS[archivo.type];
  if (!extension) return "El archivo debe ser PDF, JPG o PNG.";
  if (archivo.size > MAX_ARCHIVO) return "El archivo no debe pasar de 5 MB.";
  const ruta = `${id}.${extension}`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: true });
  if (error) return `No se pudo guardar el archivo: ${error.message}`;
  await admin.from("comprobantes").update({ archivo_path: ruta }).eq("id", id);
  return null;
}

// datos: { tipo, pagoId?, matriculaId?, cliente, items?, metodo?, observaciones?,
//          manual?: { serie, numero, fecha } }  (manual = emitido fuera del sistema)
export async function emitirComprobante(datos, archivo, usuarioId) {
  const admin = createAdminClient();
  const tipo = datos.tipo;
  const cliente = limpiarCliente(datos.cliente);
  let items = limpiarItems(datos.items);
  let metodo = datos.metodo || null;
  let matriculaId = datos.matriculaId || null;

  if (datos.pagoId) {
    const pago = await datosDelPago(admin, datos.pagoId);
    if (pago.error) return pago;
    ({ items, metodo, matriculaId } = pago);
  }

  const error = errorComprobante({ tipo, cliente, items });
  if (error) return { error };

  const modo = tipo === "ticket" ? "interno" : datos.manual ? "manual" : "electronico";
  if (modo === "electronico" && !nubefactConfigurado()) {
    return {
      error:
        "La facturación electrónica aún no está conectada. Emite el comprobante en SUNAT o en tu facturador y regístralo aquí.",
    };
  }

  const hoy = hoyISO();
  let numeracion;
  let fecha = hoy;
  if (modo === "manual") {
    numeracion = {
      serie: texto(datos.manual.serie, 4).toUpperCase(),
      numero: Number(datos.manual.numero),
    };
    if (!/^[A-Z0-9]{4}$/.test(numeracion.serie) || !Number.isInteger(numeracion.numero) || numeracion.numero <= 0) {
      return { error: "Indica la serie (4 caracteres) y el número del comprobante emitido." };
    }
    if (datos.manual.fecha) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.manual.fecha) || datos.manual.fecha > hoy) {
        return { error: "La fecha de emisión no es válida." };
      }
      fecha = datos.manual.fecha;
    }
  } else {
    numeracion = await reservarNumero(admin, tipo);
    if (!numeracion) return { error: `No hay una serie activa para ${TIPOS_CORTOS[tipo]}.` };
  }

  const { data: comprobante, error: errorGuardar } = await admin
    .from("comprobantes")
    .insert({
      tipo,
      modo,
      ...numeracion,
      fecha_emision: fecha,
      pago_id: datos.pagoId || null,
      matricula_id: matriculaId,
      cliente_tipo_doc: cliente.tipoDoc,
      cliente_num_doc: cliente.numDoc || null,
      cliente_nombre: cliente.nombre,
      cliente_direccion: cliente.direccion || null,
      cliente_email: cliente.email || null,
      items,
      total: totalItems(items),
      metodo,
      observaciones: texto(datos.observaciones, 250) || null,
      estado: modo === "electronico" ? "pendiente" : "emitido",
      emitido_por: usuarioId,
    })
    .select()
    .single();

  if (errorGuardar) {
    if (modo !== "manual") await liberarNumero(admin, numeracion);
    if (errorGuardar.code === "23505") {
      return {
        error: errorGuardar.message.includes("pago_vigente")
          ? "Este pago ya tiene un comprobante vigente."
          : `El comprobante ${numeroComprobante(numeracion)} ya está registrado.`,
      };
    }
    return { error: errorGuardar.message };
  }

  if (archivo) {
    const errorArchivo = await guardarArchivo(admin, comprobante.id, archivo);
    if (errorArchivo) return { comprobante, aviso: `Comprobante registrado. ${errorArchivo}` };
  }

  return modo === "electronico" ? enviar(admin, comprobante) : { comprobante };
}

const diasDesde = (fechaISO) => Math.round((Date.parse(hoyISO()) - Date.parse(fechaISO)) / 86400000);

// accion: "enviar" (reintentar / actualizar estado de uno pendiente) o
// "anular" con { motivo, via: "nota" | "baja" }.
export async function gestionarComprobante(id, { accion, motivo, via }, usuarioId) {
  const admin = createAdminClient();
  const { data: c } = await admin.from("comprobantes").select("*").eq("id", id).maybeSingle();
  if (!c) return { error: "No se encontró el comprobante." };

  const referencia = async () =>
    c.referencia_id
      ? (await admin.from("comprobantes").select("tipo, serie, numero").eq("id", c.referencia_id).single()).data
      : null;

  if (accion === "enviar") {
    if (c.modo !== "electronico" || c.estado !== "pendiente") {
      return { error: "Solo se reenvían comprobantes electrónicos pendientes." };
    }
    return enviar(admin, c, await referencia());
  }

  if (accion !== "anular") return { error: "Acción no válida." };
  if (c.tipo === "nota_credito") return { error: "Una nota de crédito no se anula." };
  if (c.estado === "anulado" || c.estado === "rechazado") return { error: "El comprobante ya no está vigente." };
  const razon = texto(motivo, 100);
  if (!razon) return { error: "Indica el motivo de la anulación." };

  const anulado = { estado: "anulado", motivo: razon, anulado_en: new Date().toISOString() };

  if (c.modo !== "electronico") {
    const res = await actualizar(admin, c.id, anulado);
    return c.modo === "manual"
      ? { ...res, aviso: "Recuerda anularlo también en SUNAT o en el facturador donde lo emitiste." }
      : res;
  }
  if (c.estado === "pendiente") {
    return { error: "Aún no hay respuesta de SUNAT. Usa «Actualizar estado» antes de anularlo." };
  }

  if (via === "baja") {
    if (diasDesde(c.fecha_emision) > DIAS_COMUNICACION_BAJA) {
      return { error: "Pasaron más de 7 días desde su emisión: anúlalo con una nota de crédito." };
    }
    const r = await comunicarBaja(c, razon);
    if (!r.datos) return { error: r.error };
    const ticket = r.datos.sunat_ticket_numero ? ` (ticket ${r.datos.sunat_ticket_numero})` : "";
    return actualizar(admin, c.id, {
      ...anulado,
      sunat_descripcion: r.datos.sunat_description || `Comunicación de baja enviada a SUNAT${ticket}.`,
    });
  }

  // Nota de crédito "anulación de la operación" (serie BC01 o FC01).
  const numeracion = await reservarNumero(admin, "nota_credito", c.serie[0]);
  if (!numeracion) return { error: "No hay una serie activa para notas de crédito." };
  const { data: nota, error } = await admin
    .from("comprobantes")
    .insert({
      tipo: "nota_credito",
      modo: "electronico",
      ...numeracion,
      fecha_emision: hoyISO(),
      pago_id: c.pago_id,
      matricula_id: c.matricula_id,
      cliente_tipo_doc: c.cliente_tipo_doc,
      cliente_num_doc: c.cliente_num_doc,
      cliente_nombre: c.cliente_nombre,
      cliente_direccion: c.cliente_direccion,
      cliente_email: c.cliente_email,
      items: c.items,
      total: c.total,
      metodo: c.metodo,
      observaciones: razon,
      referencia_id: c.id,
      motivo: razon,
      estado: "pendiente",
      emitido_por: usuarioId,
    })
    .select()
    .single();
  if (error) {
    await liberarNumero(admin, numeracion);
    return { error: error.message };
  }

  const r = await enviar(admin, nota, c);
  if (r.error || r.comprobante.estado === "rechazado") return { error: r.error ?? r.aviso };
  await admin.from("comprobantes").update(anulado).eq("id", c.id);
  return { comprobante: r.comprobante, aviso: `Se emitió la nota de crédito ${numeroComprobante(nota)}.` };
}

// Enlaces temporales (1 hora) a los PDF registrados a mano: { id: url }.
export async function enlacesDeArchivos(comprobantes) {
  const conArchivo = comprobantes.filter((c) => c.archivo_path);
  if (!conArchivo.length) return {};
  const { data } = await createAdminClient()
    .storage.from(BUCKET)
    .createSignedUrls(conArchivo.map((c) => c.archivo_path), 3600);
  return Object.fromEntries(conArchivo.map((c, i) => [c.id, data?.[i]?.signedUrl ?? null]));
}
