"use client";

import { useEffect, useRef } from "react";

const MM_POR_PX = 25.4 / 96;

// Papel de ticketera (80 mm). Al imprimir, la hoja mide justo lo que el
// ticket, así la impresora térmica no bota papel en blanco ni lo achica a A4.
export default function HojaTicket({ children }) {
  const hoja = useRef(null);

  useEffect(() => {
    const estilo = document.createElement("style");
    const ajustar = () => {
      const alto = Math.ceil(hoja.current.offsetHeight * MM_POR_PX) + 2;
      estilo.textContent = `@media print { @page { size: 80mm ${alto}mm; margin: 0; } }`;
    };
    ajustar();
    document.head.appendChild(estilo);
    window.addEventListener("beforeprint", ajustar);
    return () => {
      window.removeEventListener("beforeprint", ajustar);
      estilo.remove();
    };
  }, []);

  return (
    <div
      ref={hoja}
      className="relative mx-auto w-[80mm] bg-white px-[4mm] py-[5mm] text-[12px] leading-snug text-black shadow-sm print:mx-0 print:shadow-none"
    >
      {children}
    </div>
  );
}
