"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// Ventana sobre la página (<dialog> nativo: mantiene el foco dentro y se
// cierra con Escape). En celular sube desde abajo y en pantallas grandes va
// centrada. `pie` queda fijo al final (botones de acción).
export default function Modal({ titulo, subtitulo, onCerrar, ancho = "sm:max-w-md", pie, children }) {
  const ref = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    dialogo.showModal();
    return () => dialogo.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-huellitas-ink/50"
    >
      <div className="flex h-full items-end justify-center sm:items-center sm:p-4">
        <div className={`flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-lg sm:rounded-2xl ${ancho}`}>
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div className="min-w-0">
              <h2 id={idTitulo} className="font-display text-lg font-semibold text-huellitas-primary">{titulo}</h2>
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
    </dialog>
  );
}
