"use client";

import { Printer } from "lucide-react";

// Abre el diálogo de impresión del navegador (permite "Guardar como PDF").
export default function ImprimirButton({ label = "Imprimir o guardar PDF" }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
    >
      <Printer className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
