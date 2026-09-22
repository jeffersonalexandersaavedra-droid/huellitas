"use client";

import { Download } from "lucide-react";

// Botón reutilizable para exportar datos a CSV (abre en Excel).
// props: filename, columns (array de strings), rows (array de arrays).
export default function ExportarCSVButton({ filename, columns, rows, label = "Exportar a Excel" }) {
  function csvCampo(valor) {
    const s = String(valor ?? "");
    if (/[";\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function exportar() {
    const lineas = [columns, ...rows].map((fila) => fila.map(csvCampo).join(";"));
    const contenido = "﻿" + lineas.join("\r\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportar}
      disabled={!rows.length}
      className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
