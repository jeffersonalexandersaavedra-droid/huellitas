"use client";

import { X } from "lucide-react";

// Ventana sobre la página: en celular sube desde abajo y en pantallas
// grandes va centrada. `pie` queda fijo al final (botones de acción).
export default function Modal({ titulo, subtitulo, onCerrar, ancho = "sm:max-w-md", pie, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-huellitas-ink/50 sm:items-center sm:p-4"
    >
      <div className={`flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-lg sm:rounded-2xl ${ancho}`}>
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-huellitas-primary">{titulo}</h2>
            {subtitulo && <p className="text-sm text-stone-500">{subtitulo}</p>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {pie && <div className="border-t border-stone-100 p-5">{pie}</div>}
      </div>
    </div>
  );
}
