"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AdminShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barra superior móvil (solo < md) */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="flex items-center gap-2">
            <Image
              src="/logos/huellitas-escudo.png"
              alt=""
              width={28}
              height={34}
            />
            <span className="font-display text-lg font-semibold text-huellitas-primary">
              Huellitas<span className="text-huellitas-accent">.</span>
            </span>
          </div>
        </div>

        {/* Header de escritorio (solo >= md) */}
        <Header />

        <main className="flex-1 overflow-y-auto bg-huellitas-cream p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
