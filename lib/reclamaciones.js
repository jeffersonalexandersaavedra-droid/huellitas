// Libro de Reclamaciones virtual (Código de Protección y Defensa del
// Consumidor, art. 150; D.S. 011-2011-PCM modificado por D.S. 101-2022-PCM).
// Reglas compartidas por el formulario público, el panel y el servidor.

import { COLEGIO } from "@/lib/colegio";
import { EMAIL_REGEX } from "@/lib/validacion";

// Plazo máximo de respuesta (improrrogable).
export const PLAZO_DIAS_HABILES = 15;

export const TIPOS_RECLAMACION = {
  reclamo: {
    titulo: "Reclamo",
    ayuda: "Disconformidad relacionada con el servicio educativo o un producto.",
  },
  queja: {
    titulo: "Queja",
    ayuda: "Disconformidad no relacionada con el servicio, o malestar por la atención recibida.",
  },
};

export const DOCUMENTOS_RECLAMACION = ["DNI", "CE", "Pasaporte"];

export const RECLAMACION_VACIA = {
  tipo: "reclamo",
  consumidor_nombre: "",
  consumidor_tipo_doc: "DNI",
  consumidor_documento: "",
  consumidor_domicilio: "",
  consumidor_telefono: "",
  consumidor_email: "",
  menor_de_edad: false,
  apoderado_nombre: "",
  bien_tipo: "servicio",
  bien_descripcion: "",
  monto: "",
  detalle: "",
  pedido: "",
};

// Largo máximo de cada campo de texto.
export const LIMITES = {
  consumidor_nombre: 150,
  consumidor_documento: 12,
  consumidor_domicilio: 200,
  consumidor_telefono: 15,
  consumidor_email: 100,
  apoderado_nombre: 150,
  bien_descripcion: 200,
  detalle: 3000,
  pedido: 1500,
};

// N.° de la hoja: correlativo y año ("000012-2026").
export const codigoReclamacion = (r) =>
  `${String(r.numero).padStart(6, "0")}-${new Date(r.created_at).getFullYear()}`;

// Fecha límite de respuesta: 15 días hábiles (lunes a viernes) desde el
// registro. No descuenta feriados: responder antes es lo seguro.
export function fechaLimite(creado) {
  const fecha = new Date(creado);
  let habiles = 0;
  while (habiles < PLAZO_DIAS_HABILES) {
    fecha.setDate(fecha.getDate() + 1);
    const dia = fecha.getDay();
    if (dia !== 0 && dia !== 6) habiles += 1;
  }
  return fecha;
}

// Primer error de la hoja, o null si está completa.
export function errorReclamacion(r) {
  if (!TIPOS_RECLAMACION[r.tipo]) return "Elige si es un reclamo o una queja.";
  if (!r.consumidor_nombre?.trim()) return "Escribe tu nombre completo.";
  if (!DOCUMENTOS_RECLAMACION.includes(r.consumidor_tipo_doc)) return "Elige el tipo de documento.";
  if (r.consumidor_tipo_doc === "DNI" && !/^\d{8}$/.test(r.consumidor_documento?.trim() ?? "")) {
    return "El DNI debe tener 8 dígitos.";
  }
  if (!/^[A-Za-z0-9]{6,12}$/.test(r.consumidor_documento?.trim() ?? "")) return "Revisa tu número de documento.";
  if (!r.consumidor_domicilio?.trim()) return "Escribe tu domicilio.";
  if (!EMAIL_REGEX.test(r.consumidor_email?.trim() ?? "")) return "Escribe un correo válido: ahí recibirás la copia y la respuesta.";
  if (r.menor_de_edad && !r.apoderado_nombre?.trim()) return "Escribe el nombre del padre, madre o apoderado.";
  if (!r.bien_descripcion?.trim()) return "Describe el servicio o producto.";
  if (r.monto !== "" && r.monto != null && !(Number(r.monto) >= 0)) return "El monto no es válido.";
  if (!r.detalle?.trim()) return "Escribe el detalle de tu reclamo o queja.";
  if (!r.pedido?.trim()) return "Escribe qué solicitas al colegio.";
  for (const [campo, maximo] of Object.entries(LIMITES)) {
    if ((r[campo] ?? "").length > maximo) return "Uno de los textos es demasiado largo.";
  }
  return null;
}

export const fechaHoraReclamacion = (f) =>
  new Date(f).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "long", timeStyle: "short" });

// Contenido de la hoja de reclamación, por secciones (constancia en
// pantalla, correo al consumidor y panel del colegio).
export function seccionesHoja(r) {
  const monto = r.monto != null && r.monto !== "" ? `S/ ${Number(r.monto).toFixed(2)}` : "—";
  return [
    {
      titulo: "Proveedor",
      filas: [
        ["Razón social", COLEGIO.nombre],
        ["RUC", COLEGIO.ruc],
        ["Domicilio", COLEGIO.direccion],
      ],
    },
    {
      titulo: "1. Identificación del consumidor reclamante",
      filas: [
        ["Nombre", r.consumidor_nombre],
        [r.consumidor_tipo_doc, r.consumidor_documento],
        ["Domicilio", r.consumidor_domicilio],
        ["Teléfono", r.consumidor_telefono || "—"],
        ["Correo", r.consumidor_email],
        ...(r.menor_de_edad ? [["Padre, madre o apoderado", r.apoderado_nombre]] : []),
      ],
    },
    {
      titulo: "2. Identificación del bien contratado",
      filas: [
        ["Tipo", r.bien_tipo === "producto" ? "Producto" : "Servicio"],
        ["Monto reclamado", monto],
        ["Descripción", r.bien_descripcion],
      ],
    },
    {
      titulo: "3. Detalle de la reclamación y pedido del consumidor",
      filas: [
        ["Tipo", TIPOS_RECLAMACION[r.tipo]?.titulo],
        ["Detalle", r.detalle],
        ["Pedido", r.pedido],
      ],
    },
    {
      titulo: "4. Observaciones y acciones adoptadas por el proveedor",
      filas: r.respuesta
        ? [
            ["Fecha de respuesta", fechaHoraReclamacion(r.fecha_respuesta)],
            ["Respuesta", r.respuesta],
          ]
        : [["Estado", `Pendiente. Plazo máximo de respuesta: ${fechaHoraReclamacion(fechaLimite(r.created_at))}`]],
    },
  ];
}

export const NOTAS_HOJA = [
  "Reclamo: disconformidad relacionada con los productos o servicios. Queja: disconformidad no relacionada con los productos o servicios, o malestar o descontento respecto a la atención al público.",
  `El proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a ${PLAZO_DIAS_HABILES} días hábiles improrrogables.`,
  "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
];
