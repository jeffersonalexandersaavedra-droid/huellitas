// Reglas de comprobantes compartidas por el panel, el portal del padre y
// el servidor (validaciones, descripciones y reportes).

import { MESES, formatFecha } from "@/lib/fecha";
import { montoACobrar } from "@/lib/cuentas";
import { METODOS_PAGO } from "@/lib/pagoInfo";

export const TIPOS_COMPROBANTE = {
  boleta: "Boleta de venta electrónica",
  factura: "Factura electrónica",
  nota_credito: "Nota de crédito electrónica",
  ticket: "Ticket de venta",
};

export const TIPOS_CORTOS = {
  boleta: "Boleta",
  factura: "Factura",
  nota_credito: "Nota de crédito",
  ticket: "Ticket",
};

// Código SUNAT del tipo de comprobante (registro de ventas).
export const CODIGO_SUNAT = { factura: "01", boleta: "03", nota_credito: "07" };

// Catálogo 06 de SUNAT (tipo de documento del cliente).
export const DOCUMENTOS_CLIENTE = {
  1: "DNI",
  6: "RUC",
  4: "Carné de extranjería",
  7: "Pasaporte",
  "-": "Sin documento",
};

// Una boleta de más de S/ 700 debe identificar al cliente con su documento.
export const TOPE_BOLETA_SIN_DOCUMENTO = 700;

// Días que SUNAT permite para dar de baja un comprobante no entregado.
export const DIAS_COMUNICACION_BAJA = 7;

export const ESTADOS_COMPROBANTE = {
  pendiente: { texto: "Enviando a SUNAT", clase: "bg-amber-50 text-amber-700" },
  emitido: { texto: "Emitido", clase: "bg-sky-50 text-sky-700" },
  aceptado: { texto: "Aceptado por SUNAT", clase: "bg-emerald-50 text-emerald-700" },
  rechazado: { texto: "Rechazado", clase: "bg-rose-50 text-rose-700" },
  anulado: { texto: "Anulado", clase: "bg-stone-100 text-stone-500" },
};

export const redondear = (n) => Math.round(Number(n || 0) * 100) / 100;

export const numeroComprobante = (c) => `${c.serie}-${c.numero}`;

// Mensaje de error si el documento no es válido para ese tipo; null si está bien.
export function errorDocumento(tipoDoc, numero) {
  const n = (numero ?? "").trim();
  if (tipoDoc === "-") return null;
  if (tipoDoc === "1" && !/^\d{8}$/.test(n)) return "El DNI debe tener 8 dígitos.";
  if (tipoDoc === "6" && !/^(10|15|16|17|20)\d{9}$/.test(n)) return "El RUC debe tener 11 dígitos válidos.";
  if ((tipoDoc === "4" || tipoDoc === "7") && !/^[A-Za-z0-9]{6,12}$/.test(n)) {
    return "El documento debe tener de 6 a 12 caracteres.";
  }
  return null;
}

// Valida los datos de un comprobante nuevo. Devuelve el primer error o null.
export function errorComprobante({ tipo, cliente, items }) {
  if (!TIPOS_COMPROBANTE[tipo] || tipo === "nota_credito") return "Tipo de comprobante no válido.";
  if (!cliente?.nombre?.trim()) return "Falta el nombre o razón social del cliente.";
  if (tipo === "factura" && cliente.tipoDoc !== "6") return "La factura requiere el RUC del cliente.";
  if (tipo === "factura" && !cliente.direccion?.trim()) return "La factura requiere la dirección fiscal del cliente.";
  const errorDoc = errorDocumento(cliente.tipoDoc, cliente.numDoc);
  if (errorDoc) return errorDoc;
  if (!items?.length) return "Agrega al menos un concepto.";
  if (items.some((i) => !i.descripcion?.trim() || !(i.cantidad > 0) || !(i.precio > 0))) {
    return "Cada concepto necesita descripción, cantidad y precio mayores a cero.";
  }
  const total = totalItems(items);
  if (tipo === "boleta" && cliente.tipoDoc === "-" && total > TOPE_BOLETA_SIN_DOCUMENTO) {
    return `Las boletas de más de S/ ${TOPE_BOLETA_SIN_DOCUMENTO} deben llevar el documento del cliente.`;
  }
  return null;
}

export const totalItems = (items) =>
  redondear(items.reduce((s, i) => s + redondear(i.cantidad * i.precio), 0));

// Titular del comprobante a partir de un apoderado (padre, madre...).
export function clienteDeApoderado(apoderado) {
  if (!apoderado) return { tipoDoc: "1", numDoc: "", nombre: "", direccion: "", email: "" };
  return {
    tipoDoc: "1",
    numDoc: apoderado.dni ?? "",
    nombre: `${apoderado.nombres} ${apoderado.apellidos}`.trim(),
    direccion: apoderado.direccion ?? "",
    email: apoderado.email ?? "",
  };
}

// Conceptos de un pago: una línea por cuota (marzo, abril...) con el monto
// que se cobró ese día. Si hubo redondeos, la última línea se ajusta para
// que el total sea exactamente lo pagado.
export function itemsDePago({ pago, cuotas, alumno, aula, anio }) {
  const ids = pago.cuotas_ids?.length ? pago.cuotas_ids : pago.cuota_id ? [pago.cuota_id] : [];
  const lista = ids
    .map((id) => cuotas.find((c) => c.id === id))
    .filter(Boolean)
    .sort((a, b) => (a.mes ?? 0) - (b.mes ?? 0));
  const total = redondear(pago.monto);
  const detalle = [alumno && `Alumno(a): ${alumno}`, aula].filter(Boolean).join(" – ");
  const linea = (concepto, precio) => ({
    descripcion: [concepto, detalle].filter(Boolean).join(" – "),
    cantidad: 1,
    precio,
  });

  if (!lista.length) return [linea(`Pensión de enseñanza ${anio ?? ""}`.trim(), total)];

  const fechaPago = pago.fecha_pago ? new Date(pago.fecha_pago) : new Date();
  const items = lista.map((c) =>
    linea(
      [c.conceptos_cobro?.nombre ?? "Pensión de enseñanza", MESES[c.mes], anio].filter(Boolean).join(" "),
      redondear(montoACobrar(c, fechaPago).monto)
    )
  );
  const ultima = items[items.length - 1];
  ultima.precio = redondear(ultima.precio + total - totalItems(items));
  if (ultima.precio <= 0) {
    return [linea(items.map((i) => i.descripcion.split(" – ")[0]).join(", "), total)];
  }
  return items;
}

// ---- Reportes (Excel) ----

const tipoDocCliente = (c) => (c.cliente_tipo_doc === "-" ? "0" : c.cliente_tipo_doc);

const resumenPorMetodo = (filas) => {
  const suma = {};
  for (const c of filas) {
    const metodo = METODOS_PAGO[c.metodo] ?? "Sin método";
    suma[metodo] = redondear((suma[metodo] ?? 0) + Number(c.total));
  }
  return Object.entries(suma)
    .map(([metodo, monto]) => `${metodo}: S/ ${monto.toFixed(2)}`)
    .join(" · ");
};

// Registro de ventas del periodo (formato contable): boletas, facturas y
// notas de crédito. Los tickets internos no son comprobantes de pago y no
// entran aquí. Un comprobante dado de baja va en cero; uno anulado con nota
// de crédito conserva su monto y la nota resta (conNota: ids anulados así).
// Cada nota de crédito trae `referencia` (tipo, serie, numero).
export function hojaRegistroVentas(comprobantes, periodo, conNota = new Set()) {
  const filas = comprobantes
    .filter((c) => c.tipo !== "ticket" && c.estado !== "rechazado" && c.estado !== "pendiente")
    .sort(
      (a, b) =>
        a.fecha_emision.localeCompare(b.fecha_emision) || a.serie.localeCompare(b.serie) || a.numero - b.numero
    );

  let total = 0;
  const filasHoja = filas.map((c) => {
    const deBaja = c.estado === "anulado" && !conNota.has(c.id);
    const monto = deBaja ? 0 : (c.tipo === "nota_credito" ? -1 : 1) * Number(c.total);
    total += monto;
    const ref = c.referencia;
    return [
      formatFecha(c.fecha_emision),
      CODIGO_SUNAT[c.tipo],
      c.serie,
      c.numero,
      tipoDocCliente(c),
      c.cliente_num_doc ?? "",
      deBaja ? "ANULADO" : c.cliente_nombre,
      monto,
      0,
      monto,
      ref ? CODIGO_SUNAT[ref.tipo] : "",
      ref ? numeroComprobante(ref) : "",
      ESTADOS_COMPROBANTE[c.estado]?.texto ?? c.estado,
    ];
  });

  return {
    nombre: "Registro de ventas",
    titulo: "REGISTRO DE VENTAS E INGRESOS",
    subtitulos: [`Periodo ${periodo} · ${filas.length} comprobantes · Total S/ ${redondear(total).toFixed(2)}`],
    columnas: [
      { titulo: "Fecha emisión", ancho: 12, tipo: "centro" },
      { titulo: "Tipo", ancho: 6, tipo: "centro" },
      { titulo: "Serie", ancho: 8, tipo: "centro" },
      { titulo: "Número", ancho: 10, tipo: "centro" },
      { titulo: "Doc. cliente", ancho: 8, tipo: "centro" },
      { titulo: "N.° documento", ancho: 14, tipo: "centro" },
      { titulo: "Cliente", ancho: 34 },
      { titulo: "Valor inafecto", ancho: 13, tipo: "soles" },
      { titulo: "IGV", ancho: 9, tipo: "soles" },
      { titulo: "Total", ancho: 13, tipo: "soles" },
      { titulo: "Tipo ref.", ancho: 8, tipo: "centro" },
      { titulo: "Comprobante ref.", ancho: 18, tipo: "centro" },
      { titulo: "Estado", ancho: 18, tipo: "centro" },
    ],
    filas: filasHoja,
    pie: [
      "Tipo: 01 factura · 03 boleta de venta · 07 nota de crédito. Doc. cliente: 1 DNI · 6 RUC · 4 carné de extranjería · 7 pasaporte · 0 sin documento.",
      "Servicios educativos inafectos al IGV (art. 2, inciso g, de la Ley del IGV): confirmar con el contador.",
    ],
  };
}

// Arqueo de caja de un día: todo lo cobrado con comprobante, incluidos los
// tickets internos, con el total por método de pago.
export function hojaArqueo(comprobantes, fecha) {
  const filas = comprobantes.filter(
    (c) => c.tipo !== "nota_credito" && c.estado !== "rechazado" && c.estado !== "anulado"
  );
  const total = redondear(filas.reduce((s, c) => s + Number(c.total), 0));
  return {
    nombre: "Arqueo",
    titulo: "ARQUEO DE CAJA – VENTAS DEL DÍA",
    subtitulos: [`Fecha ${formatFecha(fecha)} · ${filas.length} comprobantes · Total S/ ${total.toFixed(2)}`],
    columnas: [
      { titulo: "Comprobante", ancho: 16, tipo: "centro" },
      { titulo: "Tipo", ancho: 12, tipo: "centro" },
      { titulo: "Cliente", ancho: 32 },
      { titulo: "Concepto", ancho: 48 },
      { titulo: "Método", ancho: 14, tipo: "centro" },
      { titulo: "Total", ancho: 12, tipo: "soles" },
    ],
    filas: filas.map((c) => [
      numeroComprobante(c),
      TIPOS_CORTOS[c.tipo],
      c.cliente_nombre,
      c.items.map((i) => i.descripcion).join(" | "),
      METODOS_PAGO[c.metodo] ?? "—",
      Number(c.total),
    ]),
    pie: [
      `Por método: ${resumenPorMetodo(filas) || "—"}`,
      "Incluye tickets de venta internos (no se declaran a SUNAT).",
    ],
  };
}

// ---- Llamadas al servidor (desde el navegador) ----

async function respuesta(peticion) {
  try {
    const res = await peticion;
    return await res.json();
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }
}

// datos: ver lib/emision.js. archivo: PDF opcional (registro manual).
export function solicitarEmision(datos, archivo = null) {
  const formulario = new FormData();
  formulario.append("datos", JSON.stringify(datos));
  if (archivo) formulario.append("archivo", archivo);
  return respuesta(fetch("/api/facturacion", { method: "POST", body: formulario }));
}

export function solicitarAccion(id, cuerpo) {
  return respuesta(
    fetch(`/api/facturacion/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    })
  );
}

// tipo: "dni" | "ruc" → { nombre, direccion?, aviso? } o { error }
export function consultarDocumento(tipo, numero) {
  return respuesta(fetch(`/api/facturacion/consulta?tipo=${tipo}&numero=${encodeURIComponent(numero)}`));
}

// Dónde ver un comprobante: PDF del proveedor, PDF registrado (enlace
// firmado en `archivo_url`) o la representación impresa del sistema.
export const enlaceComprobante = (c, base) => c.enlace_pdf ?? c.archivo_url ?? `${base}/${c.id}`;
