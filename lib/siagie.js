// Completa el registro de notas que descarga el SIAGIE (RegNotas_*.xlsx)
// con las notas guardadas en el portal, para volver a subirlo al SIAGIE.
//
// Solo escribe el NL y la conclusión descriptiva en las celdas que el
// docente llenaría a mano; todo lo demás (protección, validaciones, hoja
// oculta de parámetros, estilos) queda tal cual. Se ejecuta en el navegador.
//
// Cómo se cruza la información:
// - Competencias: por su texto (la leyenda "01 = Resuelve problemas de
//   cantidad" de cada hoja) contra las competencias de cada área del portal.
// - Estudiantes: por DNI cuando el código del SIAGIE es "000000" + DNI, y si
//   no, por apellidos y nombres.

import { claveNota, NOMBRE_BIMESTRE } from "@/lib/cursos";
import { NIVELES } from "@/lib/grados";
import { sinTildes } from "@/lib/ui";

const NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const NS_DOC_RELS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_XML = "http://www.w3.org/XML/1998/namespace";
const DECLARACION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

// "Áreas Matemática, d'Joel" → "AREAS MATEMATICA D JOEL"
function normalizar(texto) {
  return sinTildes(texto)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

// 1 → "A", 27 → "AA"
function letraColumna(n) {
  let letra = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) letra = String.fromCharCode(65 + ((n - 1) % 26)) + letra;
  return letra;
}

const numeroColumna = (ref) =>
  [...ref.replace(/\d+$/, "")].reduce((n, letra) => n * 26 + letra.charCodeAt(0) - 64, 0);

function leerXml(zip, ruta) {
  const archivo = zip.file(ruta);
  if (!archivo) return null;
  const texto = archivo.asText().replace(/^﻿/, "");
  const doc = new DOMParser().parseFromString(texto, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("El archivo está dañado o no es un Excel válido.");
  }
  return { ruta, doc, declaracion: texto.match(/^<\?xml[^>]*\?>/)?.[0] ?? DECLARACION };
}

function guardarXml(zip, { ruta, doc, declaracion }) {
  const xml = new XMLSerializer().serializeToString(doc);
  zip.file(ruta, xml.startsWith("<?xml") ? xml : declaracion + xml);
}

const hijos = (nodo, nombre) => [...nodo.getElementsByTagNameNS(NS, nombre)];

// Texto de un <si> o <is> (sin la guía fonética <rPh>).
const textoDe = (nodo) =>
  hijos(nodo, "t")
    .filter((t) => t.parentNode.localName !== "rPh")
    .map((t) => t.textContent)
    .join("");

function valorCelda(celda, textos) {
  const tipo = celda.getAttribute("t");
  if (tipo === "inlineStr") return textoDe(celda);
  const v = hijos(celda, "v")[0]?.textContent ?? "";
  return (tipo === "s" ? textos[Number(v)] ?? "" : v).trim();
}

// Elemento nuevo con el mismo prefijo de espacio de nombres que `referencia`
// (el SIAGIE escribe "x:c", "x:v"...).
const crear = (doc, referencia, nombre) =>
  doc.createElementNS(NS, referencia.prefix ? `${referencia.prefix}:${nombre}` : nombre);

// Hojas del libro: [{ nombre, ruta }].
function hojasDelLibro(zip) {
  const libro = leerXml(zip, "xl/workbook.xml");
  const rels = leerXml(zip, "xl/_rels/workbook.xml.rels");
  if (!libro || !rels) throw new Error("El archivo no es un Excel (.xlsx) válido.");

  const destinos = new Map(
    [...rels.doc.getElementsByTagNameNS(NS_RELS, "Relationship")].map((r) => {
      const destino = r.getAttribute("Target");
      return [r.getAttribute("Id"), destino.startsWith("/") ? destino.slice(1) : `xl/${destino}`];
    })
  );
  const sst = [...rels.doc.getElementsByTagNameNS(NS_RELS, "Relationship")].find((r) =>
    r.getAttribute("Type").endsWith("/sharedStrings")
  );
  return {
    hojas: hijos(libro.doc, "sheet").map((h) => ({
      nombre: h.getAttribute("name"),
      ruta: destinos.get(h.getAttributeNS(NS_DOC_RELS, "id")),
    })),
    rutaTextos: sst ? destinos.get(sst.getAttribute("Id")) : null,
  };
}

// Celdas de una hoja indexadas por referencia ("D3" → elemento).
function celdasDe(hoja) {
  return new Map(hijos(hoja.doc, "c").map((c) => [c.getAttribute("r"), c]));
}

// Estructura de una hoja de área del SIAGIE:
// fila 1 "01", "02"... sobre cada par de columnas; fila 2 "NL" y
// "Conclusión descriptiva"; estudiantes desde la fila 3 (B = código,
// C = apellidos y nombres) y debajo la LEYENDA con el texto de cada competencia.
function estructuraArea(celdas, textos) {
  const valor = (ref) => (celdas.has(ref) ? valorCelda(celdas.get(ref), textos) : "");

  const columnas = [];
  for (let col = 4; valor(`${letraColumna(col)}2`); col++) {
    if (normalizar(valor(`${letraColumna(col)}2`)) !== "NL") continue;
    columnas.push({
      numero: Number(valor(`${letraColumna(col)}1`)),
      nl: letraColumna(col),
      conclusion: letraColumna(col + 1),
    });
  }

  const estudiantes = [];
  for (let fila = 3; valor(`B${fila}`) || valor(`C${fila}`); fila++) {
    estudiantes.push({ fila, codigo: valor(`B${fila}`), nombre: valor(`C${fila}`) });
  }

  const leyenda = new Map();
  for (const [ref, celda] of celdas) {
    const coincide = /^B\d+$/.test(ref) && valorCelda(celda, textos).match(/^(\d{1,2})\s*=\s*(.+)$/);
    if (coincide) leyenda.set(Number(coincide[1]), coincide[2]);
  }

  return {
    estudiantes,
    competencias: columnas
      .filter((c) => leyenda.has(c.numero))
      .map((c) => ({ ...c, texto: leyenda.get(c.numero) })),
  };
}

// Tabla de textos compartidos con alta de textos nuevos.
function textosCompartidos(zip, ruta) {
  const sst = ruta ? leerXml(zip, ruta) : null;
  const lista = sst ? hijos(sst.doc, "si").map(textoDe) : [];
  const indice = new Map();
  lista.forEach((texto, i) => indice.has(texto) || indice.set(texto, i));
  let usos = 0;

  return {
    lista,
    existe: Boolean(sst),
    indice(texto) {
      usos++;
      if (indice.has(texto)) return indice.get(texto);
      const raiz = sst.doc.documentElement;
      const si = crear(sst.doc, raiz, "si");
      const t = crear(sst.doc, raiz, "t");
      if (texto !== texto.trim()) t.setAttributeNS(NS_XML, "xml:space", "preserve");
      t.textContent = texto;
      si.appendChild(t);
      raiz.appendChild(si);
      lista.push(texto);
      indice.set(texto, lista.length - 1);
      return lista.length - 1;
    },
    guardar() {
      if (!sst || !usos) return;
      const raiz = sst.doc.documentElement;
      raiz.setAttribute("count", String(Number(raiz.getAttribute("count") || lista.length) + usos));
      raiz.setAttribute("uniqueCount", String(lista.length));
      guardarXml(zip, sst);
    },
  };
}

// Escribe un texto en una celda (la crea en su lugar si no existe).
function escribirCelda(hoja, celdas, ref, texto, textos) {
  let celda = celdas.get(ref);
  if (!celda) {
    const numeroFila = ref.match(/\d+$/)[0];
    const fila = hijos(hoja.doc, "row").find((r) => r.getAttribute("r") === numeroFila);
    if (!fila) return false;
    celda = crear(hoja.doc, fila, "c");
    celda.setAttribute("r", ref);
    const siguiente = hijos(fila, "c").find((c) => numeroColumna(c.getAttribute("r")) > numeroColumna(ref));
    fila.insertBefore(celda, siguiente ?? null);
    celdas.set(ref, celda);
  }
  while (celda.firstChild) celda.removeChild(celda.firstChild);
  if (textos.existe) {
    celda.setAttribute("t", "s");
    const v = crear(hoja.doc, celda, "v");
    v.textContent = String(textos.indice(texto));
    celda.appendChild(v);
  } else {
    celda.setAttribute("t", "inlineStr");
    const is = crear(hoja.doc, celda, "is");
    const t = crear(hoja.doc, celda, "t");
    t.textContent = texto;
    is.appendChild(t);
    celda.appendChild(is);
  }
  return true;
}

// file: el RegNotas descargado del SIAGIE.
// nivel: "inicial" | "primaria" del aula elegida.
// cargarRegistro(bimestre) → { areas, estudiantes, notas } del portal
//   (ver areasPorNivel y registroDelAula en lib/consultas.js).
// Devuelve { datos (Uint8Array), nombre, resumen }.
export async function completarRegistroSiagie(file, { nivel, cargarRegistro }) {
  const { default: PizZip } = await import("pizzip");
  let zip;
  try {
    zip = new PizZip(await file.arrayBuffer());
  } catch {
    throw new Error("No se pudo abrir el archivo. Debe ser el Excel (.xlsx) que descargas del SIAGIE.");
  }

  const { hojas, rutaTextos } = hojasDelLibro(zip);
  const textos = textosCompartidos(zip, rutaTextos);
  const hojaParametros = hojas.find((h) => h.nombre === "Parametros");
  if (!hojaParametros) {
    throw new Error("Este archivo no es un registro de notas del SIAGIE (no tiene la hoja de parámetros).");
  }

  // Parámetros: B6 = periodo ("B2"), C3 = nivel, C7 = grado, C8 = sección.
  const parametros = celdasDe(leerXml(zip, hojaParametros.ruta));
  const parametro = (ref) => (parametros.has(ref) ? valorCelda(parametros.get(ref), textos.lista) : "");
  const bimestre = Number(parametro("B6").match(/^B([1-4])$/)?.[1]);
  if (!bimestre) throw new Error("El archivo no es de un bimestre (B1 a B4). Descarga el registro por periodo.");
  if (nivel && normalizar(parametro("C3")) !== normalizar(NIVELES[nivel])) {
    throw new Error(`El archivo es del nivel ${parametro("C3")} y el aula elegida es de ${NIVELES[nivel]}.`);
  }

  const { areas, estudiantes, notas } = await cargarRegistro(bimestre);

  const competenciaPorTexto = new Map();
  for (const area of areas) {
    area.competencias.forEach((texto, i) =>
      competenciaPorTexto.set(normalizar(texto), { curso: area.nombre, numero: i + 1 })
    );
  }
  const porDni = new Map(estudiantes.map((e) => [e.dni, e]));
  const porNombre = new Map(estudiantes.map((e) => [normalizar(`${e.apellidos} ${e.nombres}`), e]));
  const buscarEstudiante = ({ codigo, nombre }) =>
    (/^0{6}\d{8}$/.test(codigo) && porDni.get(codigo.slice(6))) || porNombre.get(normalizar(nombre)) || null;

  const resumen = {
    bimestre,
    periodo: NOMBRE_BIMESTRE[bimestre],
    grado: parametro("C7"),
    seccion: parametro("C8"),
    estudiantesArchivo: 0,
    sinCoincidencia: [], // estudiantes del SIAGIE que no están en el aula del portal
    areas: [],
    notas: 0,
    conclusiones: 0,
  };
  const encontrados = new Set();

  for (const hoja of hojas) {
    if (!hoja.ruta || hoja.nombre === "Parametros" || hoja.nombre === "Generalidades") continue;
    const xml = leerXml(zip, hoja.ruta);
    if (!xml) continue;
    const celdas = celdasDe(xml);
    const estructura = estructuraArea(celdas, textos.lista);
    resumen.estudiantesArchivo = Math.max(resumen.estudiantesArchivo, estructura.estudiantes.length);

    const filas = estructura.estudiantes.map((fila) => ({ ...fila, estudiante: buscarEstudiante(fila) }));
    for (const fila of filas) {
      if (fila.estudiante) encontrados.add(fila.estudiante.matriculaId);
      else if (!resumen.sinCoincidencia.includes(fila.nombre)) resumen.sinCoincidencia.push(fila.nombre);
    }

    let escritas = 0;
    for (const competencia of estructura.competencias) {
      const propia = competenciaPorTexto.get(normalizar(competencia.texto));
      if (!propia) continue;
      for (const { fila, estudiante } of filas) {
        const registro = estudiante && notas[estudiante.matriculaId]?.[claveNota(propia.curso, propia.numero)];
        if (!registro?.nota) continue;
        escribirCelda(xml, celdas, `${competencia.nl}${fila}`, registro.nota, textos);
        escritas++;
        const conclusion = registro.conclusion?.replace(/\s+/g, " ").trim();
        if (conclusion) {
          escribirCelda(xml, celdas, `${competencia.conclusion}${fila}`, conclusion, textos);
          resumen.conclusiones++;
        }
      }
    }

    if (escritas) {
      guardarXml(zip, xml);
      resumen.areas.push(hoja.nombre);
      resumen.notas += escritas;
    }
  }
  textos.guardar();

  return {
    datos: zip.generate({ type: "uint8array", compression: "DEFLATE" }),
    nombre: file.name,
    resumen: { ...resumen, encontrados: encontrados.size },
  };
}
