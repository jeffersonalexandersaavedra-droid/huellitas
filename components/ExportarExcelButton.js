"use client";

import { Download } from "lucide-react";
import { descargarExcel } from "@/lib/excel";

// Botón que descarga una tabla como Excel (.xlsx).
// props: archivo, columnas (encabezados), filas (array de arrays), hoja, label
export default function ExportarExcelButton({
  archivo,
  columnas,
  filas,
  hoja = "Reporte",
  label = "Exportar a Excel",
}) {
  return (
    <button
      type="button"
      onClick={() => descargarExcel(archivo, [{ nombre: hoja, filas: [columnas, ...filas] }])}
      disabled={!filas.length}
      className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
