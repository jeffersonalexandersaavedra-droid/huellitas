// Genera y descarga un Excel (.xlsx) en el navegador.
// hojas: [{ nombre, filas: [[celda, ...], ...] }]  (la 1.ª fila suele ser el encabezado)

function anchos(filas) {
  const max = [];
  for (const fila of filas) {
    fila.forEach((celda, i) => {
      max[i] = Math.max(max[i] ?? 8, Math.min(60, String(celda ?? "").length + 2));
    });
  }
  return max.map((wch) => ({ wch }));
}

export async function descargarExcel(archivo, hojas) {
  const XLSX = await import("xlsx");
  const libro = XLSX.utils.book_new();

  for (const hoja of hojas) {
    const ws = XLSX.utils.aoa_to_sheet(hoja.filas);
    ws["!cols"] = anchos(hoja.filas);
    const nombre = hoja.nombre.replace(/[:\\/?*[\]]/g, "-").slice(0, 31) || "Hoja1";
    XLSX.utils.book_append_sheet(libro, ws, nombre);
  }

  const nombreArchivo = archivo.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
  XLSX.writeFile(libro, nombreArchivo.endsWith(".xlsx") ? nombreArchivo : `${nombreArchivo}.xlsx`);
}
