// Excel con formato (ExcelJS) para las descargas del sistema, el registro
// auxiliar por competencias y la lectura de Excel de la carga masiva.
//
// Una hoja de listado se describe así:
// {
//   nombre: "Cobranza",                         // pestaña
//   titulo: "REPORTE DE COBRANZA",              // franja superior
//   subtitulos: ["Año escolar 2026", ...],      // líneas bajo el título
//   columnas: [{ titulo, ancho, tipo, vertical }],
//     tipo: "texto" (defecto) | "centro" | "codigo" | "numero" | "soles" | "porcentaje"
//       "codigo": DNI, RUC o similar; si son solo dígitos se guarda como
//       número con ceros a la izquierda (sin el aviso de "número como texto")
//     vertical: encabezado girado (columnas angostas)
//   filas: [[valor, ...], ...],
//   pie: ["Leyenda...", ...],                   // notas al final
// }

import { COLEGIO } from "@/lib/colegio";
import {
  ESCALA_NOTAS,
  LEYENDA_ESCALA,
  NOMBRE_BIMESTRE,
  CONCLUSION_MIN,
  CONCLUSION_MAX,
  claveNota,
  numeroCompetencia,
} from "@/lib/cursos";
import { NIVELES } from "@/lib/grados";
import { fechaLarga } from "@/lib/fecha";
import { sinTildes } from "@/lib/ui";

const MORADO = "FF5B2C6F";
const MORADO_CLARO = "FFE8DEF0";
const CREMA = "FFFAF7F5";
const TINTA = "FF2A1F33";
const BORDE = { style: "thin", color: { argb: "FFBFB3C7" } };
const BORDES = { top: BORDE, left: BORDE, bottom: BORDE, right: BORDE };
const RELLENO = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const PIE_PAGINA = `&L${COLEGIO.nombre}&RPágina &P de &N`;

const FORMATOS = { soles: '"S/" #,##0.00', porcentaje: '0"%"', numero: "0" };

function nombreHoja(nombre) {
  return (nombre || "Hoja1").replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
}

function nombreArchivo(archivo) {
  const limpio = sinTildes(archivo)
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "");
  return limpio.endsWith(".xlsx") ? limpio : `${limpio}.xlsx`;
}

// DNI/RUC: número con sus ceros a la izquierda (formato "00000000").
function celdaCodigo(celda) {
  const valor = String(celda.value ?? "").trim();
  if (/^\d{1,15}$/.test(valor)) {
    celda.value = Number(valor);
    celda.numFmt = "0".repeat(valor.length);
  }
}

function hojaNueva(libro, nombre, { horizontal, cabecera } = {}) {
  return libro.addWorksheet(nombreHoja(nombre), {
    pageSetup: {
      paperSize: 9, // A4
      orientation: horizontal ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.5, header: 0.25, footer: 0.2 },
    },
    headerFooter: { oddHeader: cabecera ?? "", oddFooter: PIE_PAGINA },
  });
}

function agregarHoja(libro, hoja) {
  const columnas = hoja.columnas;
  const total = columnas.length;
  const ws = hojaNueva(libro, hoja.nombre, { horizontal: total > 6 });
  ws.columns = columnas.map((c) => ({ width: c.ancho ?? 14 }));

  // Franja de título + subtítulos (celdas combinadas a todo el ancho).
  const franja = (texto, estilo) => {
    const fila = ws.addRow([texto]);
    ws.mergeCells(fila.number, 1, fila.number, total);
    Object.assign(fila.getCell(1), estilo);
    return fila;
  };

  franja(hoja.titulo ?? hoja.nombre, {
    font: { bold: true, size: 14, color: { argb: "FFFFFFFF" } },
    fill: RELLENO(MORADO),
    alignment: { vertical: "middle", horizontal: "center" },
  }).height = 26;

  for (const sub of [COLEGIO.nombre, ...(hoja.subtitulos ?? [])]) {
    franja(sub, {
      font: { size: 10, color: { argb: TINTA } },
      fill: RELLENO(CREMA),
      alignment: { vertical: "middle", horizontal: "center" },
    });
  }
  ws.addRow([]);

  // Encabezado de la tabla.
  const encabezado = ws.addRow(columnas.map((c) => c.titulo));
  const verticales = columnas.filter((c) => c.vertical);
  encabezado.height = verticales.length
    ? Math.min(110, 12 + 6.5 * Math.max(...verticales.map((c) => c.titulo.length)))
    : 30;
  encabezado.eachCell((celda, i) => {
    const col = columnas[i - 1];
    celda.font = { bold: true, size: 10, color: { argb: MORADO } };
    celda.fill = RELLENO(MORADO_CLARO);
    celda.border = BORDES;
    celda.alignment = col.vertical
      ? { textRotation: 90, vertical: "bottom", horizontal: "center", wrapText: true }
      : { vertical: "middle", horizontal: (col.tipo ?? "texto") === "texto" ? "left" : "center", wrapText: true };
  });
  const filaEncabezado = encabezado.number;

  // Datos.
  hoja.filas.forEach((valores, indice) => {
    const fila = ws.addRow(valores);
    fila.eachCell({ includeEmpty: true }, (celda, i) => {
      const col = columnas[i - 1];
      if (!col) return;
      const tipo = col.tipo ?? "texto";
      celda.border = BORDES;
      celda.font = { size: 10 };
      celda.alignment = {
        vertical: "middle",
        horizontal: tipo === "texto" ? "left" : tipo === "soles" ? "right" : "center",
        wrapText: tipo === "texto",
      };
      if (tipo === "codigo") celdaCodigo(celda);
      if (FORMATOS[tipo]) celda.numFmt = FORMATOS[tipo];
      if (indice % 2 === 1) celda.fill = RELLENO(CREMA);
    });
  });

  // Encabezado fijo al desplazarse; filtros solo si los títulos van rectos
  // (en los girados la flecha tapa el texto).
  ws.views = [{ state: "frozen", ySplit: filaEncabezado }];
  if (hoja.filas.length && !verticales.length) {
    ws.autoFilter = {
      from: { row: filaEncabezado, column: 1 },
      to: { row: filaEncabezado + hoja.filas.length, column: total },
    };
  }

  if (hoja.pie?.length) ws.addRow([]);
  for (const texto of hoja.pie ?? []) {
    const fila = ws.addRow([texto]);
    ws.mergeCells(fila.number, 1, fila.number, total);
    fila.getCell(1).font = { size: 9, italic: true, color: { argb: "FF57534E" } };
  }

  ws.pageSetup.printTitlesRow = `${filaEncabezado}:${filaEncabezado}`;
}

async function libroNuevo() {
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  libro.creator = COLEGIO.nombre;
  libro.created = new Date();
  return libro;
}

// Descarga un archivo generado en el navegador.
export function descargarArchivo(nombre, datos, tipo) {
  const url = URL.createObjectURL(datos instanceof Blob ? datos : new Blob([datos], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function descargarLibro(archivo, libro) {
  descargarArchivo(nombreArchivo(archivo), await libro.xlsx.writeBuffer(), TIPO_XLSX);
}

// Genera y descarga un .xlsx con hojas de listado.
export async function descargarExcel(archivo, hojas) {
  const libro = await libroNuevo();
  for (const hoja of hojas) agregarHoja(libro, hoja);
  await descargarLibro(archivo, libro);
}

// ---------------------------------------------------------------------------
// Registro auxiliar por competencias, con la misma estructura del registro
// de notas del SIAGIE: una hoja por área con N.°, DNI, apellidos y nombres
// y, por cada competencia, NL (nivel de logro) + conclusión descriptiva.

const ESTILO_ENCABEZADO = {
  font: { bold: true, size: 10, color: { argb: "FFFFFFFF" } },
  fill: RELLENO(MORADO),
  border: BORDES,
  alignment: { vertical: "middle", horizontal: "center", wrapText: true },
};

const ANCHO = { numero: 5, dni: 11, nombre: 36, nl: 7, conclusion: 42 };

// Líneas que ocupa un texto con ajuste en una columna de `ancho` caracteres
// y alto de fila para que quepa (Excel no lo calcula en celdas combinadas).
const lineasDe = (texto, ancho) =>
  String(texto)
    .split("\n")
    .reduce((total, linea) => total + Math.max(1, Math.ceil(linea.length / (ancho * 1.1))), 0);
const altoPara = (texto, ancho, minimo = 18) => Math.max(minimo, lineasDe(texto, ancho) * 13 + 6);

// En los encabezados de impresión "&" es un código: se escribe "&&".
const textoCabecera = (texto) => texto.replaceAll("&", "&&");

const nombreSiagie = (e) => `${e.apellidos}, ${e.nombres}`.toLocaleUpperCase("es-PE");

function hojaGeneralidades(libro, { anio, bimestre, aula, docente, areas }) {
  const ws = hojaNueva(libro, "Generalidades");
  ws.columns = [{ width: 2 }, { width: 28 }, { width: 62 }];

  const titulo = ws.addRow(["", "REGISTRO AUXILIAR DE EVALUACIÓN"]);
  ws.mergeCells(titulo.number, 2, titulo.number, 3);
  Object.assign(titulo.getCell(2), {
    font: { bold: true, size: 14, color: { argb: "FFFFFFFF" } },
    fill: RELLENO(MORADO),
    alignment: { vertical: "middle", horizontal: "center" },
  });
  titulo.height = 26;

  const seccion = (texto) => {
    ws.addRow([]);
    const fila = ws.addRow(["", texto]);
    ws.mergeCells(fila.number, 2, fila.number, 3);
    Object.assign(fila.getCell(2), {
      font: { bold: true, size: 10, color: { argb: MORADO } },
      border: { bottom: { style: "medium", color: { argb: MORADO } } },
    });
  };
  const dato = (etiqueta, valor) => {
    const fila = ws.addRow(["", etiqueta, valor]);
    fila.getCell(2).font = { bold: true, size: 10, color: { argb: TINTA } };
    fila.getCell(2).alignment = { vertical: "top" };
    fila.getCell(3).font = { size: 10 };
    fila.getCell(3).alignment = { wrapText: true, vertical: "top", horizontal: "left" };
    for (const c of [2, 3]) fila.getCell(c).border = { bottom: BORDE };
    return fila;
  };

  seccion("INSTITUCIÓN EDUCATIVA");
  dato("Código modular – Anexo", COLEGIO.codigoModular);
  dato("Nombre", COLEGIO.nombre);
  dato("Nivel", NIVELES[aula.nivel] ?? aula.nivel);
  dato("DRE / UGEL", `${COLEGIO.dre} · ${COLEGIO.ugel}`);

  seccion("DATOS DEL REGISTRO DE NOTAS");
  dato("Año académico", Number(anio) || anio);
  dato("Diseño curricular", "Currículo Nacional 2017");
  dato("Período de evaluación", NOMBRE_BIMESTRE[bimestre].toUpperCase());
  dato("Grado", aula.grado ?? aula.nombre);
  dato("Sección", aula.seccion || "Única");
  if (docente) dato("Docente", docente);
  dato("Generado", `${fechaLarga()} desde el portal de ${COLEGIO.nombre}`);

  seccion("ÁREAS (una hoja por área)");
  for (const area of areas) {
    const texto = area.competencias.map((c, i) => `${numeroCompetencia(i + 1)} = ${c}`).join("\n");
    dato(area.nombre, texto).height = altoPara(texto, 62);
  }

  seccion("ESCALA DE CALIFICACIÓN");
  for (const [nota, texto] of Object.entries(ESCALA_NOTAS)) {
    dato(nota, texto).getCell(2).alignment = { vertical: "top", horizontal: "center" };
  }
  ws.addRow([]);
  const nota = ws.addRow([
    "",
    `Cada hoja sigue el orden de columnas del registro de notas del SIAGIE. NL = nivel de logro; la conclusión descriptiva debe tener entre ${CONCLUSION_MIN} y ${CONCLUSION_MAX} caracteres.`,
  ]);
  ws.mergeCells(nota.number, 2, nota.number, 3);
  nota.getCell(2).font = { size: 9, italic: true, color: { argb: "FF57534E" } };
  nota.getCell(2).alignment = { wrapText: true, vertical: "top" };
  nota.height = 28;
}

function hojaArea(libro, area, { estudiantes, notas, cabecera }) {
  const ws = hojaNueva(libro, area.nombre, { horizontal: true, cabecera: `&L&B${textoCabecera(area.nombre)}&B&R${cabecera}` });
  const total = 3 + area.competencias.length * 2;
  ws.columns = [
    { width: ANCHO.numero },
    { width: ANCHO.dni },
    { width: ANCHO.nombre },
    ...area.competencias.flatMap(() => [{ width: ANCHO.nl }, { width: ANCHO.conclusion }]),
  ];

  // Encabezado en dos filas, como el SIAGIE; la competencia va escrita
  // completa sobre sus dos columnas para no depender de una leyenda.
  const fila1 = ws.getRow(1);
  const fila2 = ws.getRow(2);
  ["N.°", "DNI", "Apellidos y nombres"].forEach((texto, i) => {
    fila1.getCell(i + 1).value = texto;
    ws.mergeCells(1, i + 1, 2, i + 1);
  });
  area.competencias.forEach((competencia, i) => {
    const col = 4 + i * 2;
    fila1.getCell(col).value = `${numeroCompetencia(i + 1)} · ${competencia}`;
    ws.mergeCells(1, col, 1, col + 1);
    fila2.getCell(col).value = "NL";
    fila2.getCell(col + 1).value = "Conclusión descriptiva de la competencia";
  });
  for (let c = 1; c <= total; c++) {
    Object.assign(fila1.getCell(c), ESTILO_ENCABEZADO);
    Object.assign(fila2.getCell(c), ESTILO_ENCABEZADO);
  }
  fila1.height = Math.max(...area.competencias.map((c) => altoPara(`01 · ${c}`, ANCHO.nl + ANCHO.conclusion, 30)));
  fila2.height = 20;

  estudiantes.forEach((e, i) => {
    const fila = ws.getRow(3 + i);
    fila.getCell(1).value = i + 1;
    fila.getCell(2).value = e.dni;
    fila.getCell(3).value = nombreSiagie(e);
    area.competencias.forEach((_, k) => {
      const registro = notas[e.matriculaId]?.[claveNota(area.nombre, k + 1)];
      fila.getCell(4 + k * 2).value = registro?.nota || null;
      fila.getCell(5 + k * 2).value = registro?.conclusion || null;
    });

    let lineas = 1;
    for (let c = 1; c <= total; c++) {
      const celda = fila.getCell(c);
      const esNl = c >= 4 && c % 2 === 0;
      const esConclusion = c >= 5 && c % 2 === 1;
      celda.border = BORDES;
      celda.font = { size: 10, bold: esNl };
      celda.alignment = {
        vertical: "middle",
        horizontal: c === 3 || esConclusion ? "left" : "center",
        wrapText: esConclusion,
      };
      if (c === 2) celdaCodigo(celda);
      // Mismas validaciones que el archivo del SIAGIE.
      if (esNl) {
        celda.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"AD,A,B,C"'],
          showErrorMessage: true,
          errorTitle: "Nivel de logro",
          error: "Elige AD, A, B o C.",
        };
      }
      if (esConclusion) {
        celda.dataValidation = {
          type: "textLength",
          operator: "between",
          allowBlank: true,
          formulae: [CONCLUSION_MIN, CONCLUSION_MAX],
          showErrorMessage: true,
          errorTitle: "Inconsistencia",
          error: `Se requiere ingresar sólo un mínimo de ${CONCLUSION_MIN} y un máximo de ${CONCLUSION_MAX} caracteres`,
        };
        lineas = Math.max(lineas, lineasDe(celda.value ?? "", ANCHO.conclusion));
      }
    }
    fila.height = Math.max(18, lineas * 13 + 6);
  });

  // Leyenda corta en la columna del nombre (no cruza las columnas fijas).
  const inicioLeyenda = 3 + estudiantes.length + 1;
  ["NL = Nivel de logro alcanzado", `Escala: ${LEYENDA_ESCALA}`].forEach((texto, i) => {
    const fila = ws.getRow(inicioLeyenda + i);
    fila.getCell(3).value = texto;
    fila.getCell(3).font = { size: 9, italic: true, color: { argb: "FF57534E" } };
    fila.getCell(3).alignment = { wrapText: true, vertical: "top" };
    fila.height = altoPara(texto, ANCHO.nombre, 15);
  });

  // Encabezado y estudiantes fijos al desplazarse.
  ws.views = [{ state: "frozen", xSplit: 3, ySplit: 2 }];
  ws.pageSetup.printTitlesRow = "1:2";
  ws.pageSetup.printTitlesColumn = "A:C";
}

function hojaComentarios(libro, { estudiantes, observaciones, cabecera }) {
  const ws = hojaNueva(libro, "Comentario general", { cabecera: `&L&BComentario general&B&R${cabecera}` });
  ws.columns = [{ width: ANCHO.numero }, { width: ANCHO.dni }, { width: ANCHO.nombre }, { width: 70 }];
  const encabezado = ws.getRow(1);
  ["N.°", "DNI", "Apellidos y nombres", "Comentario general del bimestre (aparece en la boleta)"].forEach(
    (texto, i) => Object.assign(encabezado.getCell(i + 1), { value: texto, ...ESTILO_ENCABEZADO })
  );
  encabezado.height = 30;

  estudiantes.forEach((e, i) => {
    const texto = observaciones[e.matriculaId] ?? "";
    const fila = ws.getRow(2 + i);
    [i + 1, e.dni, nombreSiagie(e), texto].forEach((valor, c) => {
      const celda = fila.getCell(c + 1);
      celda.value = valor;
      celda.border = BORDES;
      celda.font = { size: 10 };
      celda.alignment = { vertical: "middle", horizontal: c === 0 || c === 1 ? "center" : "left", wrapText: c === 3 };
    });
    celdaCodigo(fila.getCell(2));
    fila.height = altoPara(texto, 70);
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.pageSetup.printTitlesRow = "1:1";
}

// datos: { anio, bimestre, aula: { nombre, nivel, grado, seccion }, docente,
//   areas: [{ nombre, competencias }], estudiantes: [{ matriculaId, dni,
//   nombres, apellidos }], notas, observaciones } (ver registroDelAula).
export async function descargarRegistroAuxiliar(datos) {
  const libro = await libroNuevo();
  const cabecera = textoCabecera(`${datos.aula.nombre} · ${NOMBRE_BIMESTRE[datos.bimestre]} ${datos.anio ?? ""}`.trim());
  hojaGeneralidades(libro, datos);
  for (const area of datos.areas) hojaArea(libro, area, { ...datos, cabecera });
  if (Object.values(datos.observaciones).some(Boolean)) hojaComentarios(libro, { ...datos, cabecera });
  await descargarLibro(`registro_auxiliar_${datos.aula.nombre}_bim${datos.bimestre}`, libro);
}

// Lee la primera hoja de un .xlsx y devuelve una fila por objeto, usando
// la primera fila como encabezados. Las fechas llegan como Date.
export async function leerExcel(file) {
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(await file.arrayBuffer());
  const hoja = libro.worksheets[0];
  if (!hoja) return [];

  const texto = (valor) => {
    if (valor == null) return "";
    if (valor instanceof Date) return valor;
    if (typeof valor === "object") {
      if ("result" in valor) return valor.result ?? "";
      if ("richText" in valor) return valor.richText.map((t) => t.text).join("");
      if ("text" in valor) return valor.text;
    }
    return valor;
  };

  const encabezados = [];
  hoja.getRow(1).eachCell((celda, col) => {
    encabezados[col] = String(texto(celda.value)).trim();
  });

  const filas = [];
  hoja.eachRow((fila, numero) => {
    if (numero === 1) return;
    const registro = {};
    encabezados.forEach((clave, col) => {
      if (clave) registro[clave] = texto(fila.getCell(col).value);
    });
    filas.push(registro);
  });
  return filas;
}
