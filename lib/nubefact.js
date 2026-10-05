import "server-only";

import { redondear } from "@/lib/facturacion";
import { METODOS_PAGO } from "@/lib/pagoInfo";

// Proveedor de facturación electrónica (Nubefact, OSE/PSE autorizado por
// SUNAT). Envía boletas, facturas y notas de crédito y devuelve el PDF, el
// XML y la constancia (CDR). Se activa con las variables de entorno
// NUBEFACT_RUTA y NUBEFACT_TOKEN (Nubefact → API - Integración).

const TIPO = { factura: 1, boleta: 2, nota_credito: 3 };

// Servicios educativos inafectos al IGV (art. 2, inciso g, de la Ley del
// IGV): "Inafecto – Operación onerosa". Si el contador indica otro
// tratamiento tributario, se cambia aquí.
const TIPO_IGV = 9;

// Nota de crédito tipo 01 (catálogo 09 de SUNAT): anulación de la operación.
const NOTA_CREDITO_ANULACION = 1;

// Código de error de Nubefact cuando el documento ya existe (reenvío).
const YA_EXISTE = 23;

export const nubefactConfigurado = () =>
  Boolean(process.env.NUBEFACT_RUTA && process.env.NUBEFACT_TOKEN);

// { datos } si respondió bien; { error, codigo } si rechazó la solicitud
// (el documento NO se creó); { error, sinRespuesta } si no se sabe.
async function llamar(cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(process.env.NUBEFACT_RUTA, {
      method: "POST",
      headers: {
        Authorization: `Token token="${process.env.NUBEFACT_TOKEN}"`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpo),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return { sinRespuesta: true, error: "El proveedor de facturación no respondió. Vuelve a intentarlo." };
  }
  const datos = await respuesta.json().catch(() => null);
  if (!datos) {
    return { sinRespuesta: true, error: `El proveedor de facturación respondió con error ${respuesta.status}.` };
  }
  if (datos.errors) return { error: String(datos.errors), codigo: Number(datos.codigo) };
  return { datos };
}

// "2026-10-05" → "05-10-2026"
const fechaNubefact = (iso) => iso.split("-").reverse().join("-");

// Estado del comprobante según la respuesta de SUNAT: códigos 2000–3999
// son rechazo; sin respuesta aún (boletas, caídas de SUNAT) queda pendiente.
export function resultadoSunat(d) {
  const codigo = Number(d.sunat_responsecode);
  const estado = d.aceptada_por_sunat
    ? "aceptado"
    : codigo >= 2000 && codigo < 4000
      ? "rechazado"
      : "pendiente";
  return {
    estado,
    sunat_descripcion: d.sunat_description || d.sunat_soap_error || d.sunat_note || null,
    enlace_pdf: d.enlace_del_pdf || null,
    enlace_xml: d.enlace_del_xml || null,
    enlace_cdr: d.enlace_del_cdr || null,
    cadena_qr: d.cadena_para_codigo_qr || null,
    hash: d.codigo_hash || null,
  };
}

function cuerpoComprobante(c, referencia) {
  const total = redondear(c.total);
  return {
    operacion: "generar_comprobante",
    tipo_de_comprobante: TIPO[c.tipo],
    serie: c.serie,
    numero: c.numero,
    sunat_transaction: 1,
    cliente_tipo_de_documento: c.cliente_tipo_doc,
    cliente_numero_de_documento: c.cliente_num_doc || "-",
    cliente_denominacion: c.cliente_nombre,
    cliente_direccion: c.cliente_direccion ?? "",
    cliente_email: c.cliente_email ?? "",
    fecha_de_emision: fechaNubefact(c.fecha_emision),
    moneda: 1,
    porcentaje_de_igv: 18,
    total_inafecta: total,
    total_igv: 0,
    total,
    detraccion: false,
    observaciones: c.observaciones ?? "",
    medio_de_pago: METODOS_PAGO[c.metodo] ?? "",
    ...(referencia && {
      documento_que_se_modifica_tipo: TIPO[referencia.tipo],
      documento_que_se_modifica_serie: referencia.serie,
      documento_que_se_modifica_numero: referencia.numero,
      tipo_de_nota_de_credito: NOTA_CREDITO_ANULACION,
    }),
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: Boolean(c.cliente_email),
    codigo_unico: c.id,
    items: c.items.map((item, i) => {
      const subtotal = redondear(item.cantidad * item.precio);
      return {
        unidad_de_medida: "ZZ",
        codigo: String(i + 1).padStart(3, "0"),
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        valor_unitario: item.precio,
        precio_unitario: item.precio,
        subtotal,
        tipo_de_igv: TIPO_IGV,
        igv: 0,
        total: subtotal,
        anticipo_regularizacion: false,
      };
    }),
  };
}

export async function consultarComprobante(c) {
  return llamar({
    operacion: "consultar_comprobante",
    tipo_de_comprobante: TIPO[c.tipo],
    serie: c.serie,
    numero: c.numero,
  });
}

// Envía el comprobante; si ya existía (reintento), trae su estado.
export async function generarComprobante(c, referencia = null) {
  const r = await llamar(cuerpoComprobante(c, referencia));
  return r.codigo === YA_EXISTE ? consultarComprobante(c) : r;
}

// Comunicación de baja (solo comprobantes no entregados, hasta 7 días).
export async function comunicarBaja(c, motivo) {
  return llamar({
    operacion: "generar_anulacion",
    tipo_de_comprobante: TIPO[c.tipo],
    serie: c.serie,
    numero: c.numero,
    motivo,
  });
}
