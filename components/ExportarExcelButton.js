"use client";

import { Download } from "lucide-react";
import { descargarExcel } from "@/lib/excel";

// Botón que descarga una hoja de Excel con formato (ver lib/excel.js).
// hoja: { nombre, titulo, subtitulos, columnas: [{ titulo, ancho, tipo }], filas }
export default function ExportarExcelButton({ archivo, hoja, label = "Exportar a Excel" }) {
  return (
    <button
      type="button"
      onClick={() => descargarExcel(archivo, [hoja])}
      disabled={!hoja.filas.length}
      className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
