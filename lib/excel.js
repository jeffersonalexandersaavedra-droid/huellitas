// Excel con formato profesional (ExcelJS) para todas las descargas del
// sistema, y lectura de Excel para la carga masiva.
//
// Una hoja se describe así:
// {
//   nombre: "Bimestre 1",                       // pestaña
//   titulo: "REGISTRO AUXILIAR DE EVALUACIÓN",  // franja superior
//   subtitulos: ["Aula: 3° Primaria A", ...],   // líneas bajo el título
//   columnas: [{ titulo, ancho, tipo, vertical }],
//     tipo: "texto" (defecto) | "centro" | "numero" | "soles" | "porcentaje" | "nota"
//     vertical: encabezado girado (columnas angostas, ej. cursos)
//   filas: [[valor, ...], ...],
//   pie: ["Escala: AD = ...", ...],              // notas al final
//   firma: "Firma del docente",                  // línea de firma opcional
// }

import { COLEGIO } from "@/lib/colegio";
import { LEYENDA_ESCALA } from "@/lib/cursos";
import { fechaLarga } from "@/lib/fecha";

const MORADO = "FF5B2C6F";
const MORADO_CLARO = "FFE8DEF0";
const CREMA = "FFFAF7F5";
const BORDE = { style: "thin", color: { argb: "FFD6CCDD" } };
const BORDES = { top: BORDE, left: BORDE, bottom: BORDE, right: BORDE };

// Colores de la escala literal (igual que en la web).
const COLOR_NOTA = {
  AD: { fondo: "FFD1FAE5", texto: "FF047857" },
  A: { fondo: "FFDBEAFE", texto: "FF1D4ED8" },
  B: { fondo: "FFFEF3C7", texto: "FFB45309" },
  C: { fondo: "FFFFE4E6", texto: "FFBE123C" },
};

const FORMATOS = { soles: '"S/" #,##0.00', porcentaje: '0"%"', numero: "0" };

function nombreHoja(nombre) {
  return (nombre || "Hoja1").replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
}

function nombreArchivo(archivo) {
  const limpio = archivo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "");
  return limpio.endsWith(".xlsx") ? limpio : `${limpio}.xlsx`;
}

function agregarHoja(libro, hoja) {
  const columnas = hoja.columnas;
  const total = columnas.length;
  const ws = libro.addWorksheet(nombreHoja(hoja.nombre), {
    pageSetup: {
      paperSize: 9, // A4
      orientation: total > 6 ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    headerFooter: { oddFooter: `&L${COLEGIO.nombre}&RPágina &P de &N` },
  });

  ws.columns = columnas.map((c) => ({ width: c.ancho ?? 14 }));

  // Franja de título + subtítulos (celdas combinadas a todo el ancho).
  const franja = (texto, estilo) => {
    const fila = ws.addRow([texto]);
    ws.mergeCells(fila.number, 1, fila.number, total);
    Object.assign(fila.getCell(1), estilo);
    return fila;
  };

  const titulo = franja(hoja.titulo ?? hoja.nombre, {
    font: { bold: true, size: 14, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: MORADO } },
    alignment: { vertical: "middle", horizontal: "center" },
  });
  titulo.height = 26;

  for (const sub of [COLEGIO.nombre, ...(hoja.subtitulos ?? [])]) {
    franja(sub, {
      font: { size: 10, color: { argb: "FF2A1F33" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: CREMA } },
      alignment: { vertical: "middle", horizontal: "center" },
    });
  }
  ws.addRow([]);

  // Encabezado de la tabla.
  const encabezado = ws.addRow(columnas.map((c) => c.titulo));
  const alto = columnas.some((c) => c.vertical)
    ? Math.min(110, 12 + 6.5 * Math.max(...columnas.filter((c) => c.vertical).map((c) => c.titulo.length)))
    : 30;
  encabezado.height = alto;
  encabezado.eachCell((celda, i) => {
    const col = columnas[i - 1];
    celda.font = { bold: true, size: 10, color: { argb: MORADO } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MORADO_CLARO } };
    celda.border = BORDES;
    celda.alignment = col.vertical
      ? { textRotation: 90, vertical: "bottom", horizontal: "center", wrapText: true }
      : { vertical: "middle", horizontal: col.tipo === "texto" || !col.tipo ? "left" : "center", wrapText: true };
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
      if (FORMATOS[tipo]) celda.numFmt = FORMATOS[tipo];
      if (indice % 2 === 1) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREMA } };
      }
      const color = tipo === "nota" && COLOR_NOTA[String(celda.value ?? "").trim()];
      if (color) {
        celda.font = { size: 10, bold: true, color: { argb: color.texto } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color.fondo } };
      }
    });
  });

  if (hoja.filas.length) {
    ws.views = [{ state: "frozen", ySplit: filaEncabezado, xSplit: hoja.fijarColumnas ?? 0 }];
    ws.autoFilter = {
      from: { row: filaEncabezado, column: 1 },
      to: { row: filaEncabezado + hoja.filas.length, column: total },
    };
  }

  // Notas al pie y firma.
  if (hoja.pie?.length || hoja.firma) ws.addRow([]);
  for (const texto of hoja.pie ?? []) {
    const fila = ws.addRow([texto]);
    ws.mergeCells(fila.number, 1, fila.number, total);
    fila.getCell(1).font = { size: 9, italic: true, color: { argb: "FF57534E" } };
  }
  if (hoja.firma) {
    ws.addRow([]);
    ws.addRow([]);
    const desde = Math.max(1, total - 3);
    const linea = ws.addRow([]);
    ws.mergeCells(linea.number, desde, linea.number, total);
    linea.getCell(desde).value = hoja.firma;
    linea.getCell(desde).border = { top: { style: "thin", color: { argb: "FF2A1F33" } } };
    linea.getCell(desde).alignment = { horizontal: "center" };
    linea.getCell(desde).font = { size: 10 };
  }

  ws.pageSetup.printTitlesRow = `${filaEncabezado}:${filaEncabezado}`;
}

// Genera y descarga un .xlsx en el navegador.
export async function descargarExcel(archivo, hojas) {
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  libro.creator = COLEGIO.nombre;
  libro.created = new Date();
  for (const hoja of hojas) agregarHoja(libro, hoja);

  const buffer = await libro.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo(archivo);
  enlace.click();
  URL.revokeObjectURL(url);
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

// Hoja de notas de un aula y bimestre (registro auxiliar del docente y
// consulta de notas del admin). filas: [{ nombre, dni, notas: {curso: nota}, observacion }]
export function hojaDeNotas({ titulo, aula, bimestre, anio, docente, cursos, filas }) {
  return {
    nombre: `Bimestre ${bimestre}`,
    titulo,
    subtitulos: [
      [`Año escolar ${anio ?? ""}`.trim(), `Aula: ${aula}`, `Bimestre ${bimestre}`].join(" · "),
      ...(docente ? [`Docente: ${docente}`] : []),
    ],
    columnas: [
      { titulo: "N.°", ancho: 5, tipo: "centro" },
      { titulo: "Apellidos y nombres", ancho: 34 },
      { titulo: "DNI", ancho: 11, tipo: "centro" },
      ...cursos.map((c) => ({ titulo: c, ancho: 6.5, tipo: "nota", vertical: true })),
      { titulo: "Observación", ancho: 40 },
    ],
    filas: filas.map((f, i) => [
      i + 1,
      f.nombre,
      f.dni,
      ...cursos.map((c) => f.notas[c] ?? ""),
      f.observacion ?? "",
    ]),
    fijarColumnas: 2,
    pie: [`Escala: ${LEYENDA_ESCALA}`, `Generado el ${fechaLarga()} desde el sistema de ${COLEGIO.nombre}.`],
    firma: docente ? "Firma del docente" : undefined,
  };
}
