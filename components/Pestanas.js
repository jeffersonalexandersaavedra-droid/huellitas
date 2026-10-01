"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Pestañas de navegación. Marca la activa por `activo` (id) o, si no se
// indica, por la ruta actual. items: [{ id, href, label, icon? }]
export default function Pestanas({ items, activo }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-stone-200">
      {items.map(({ id, href, label, icon: Icon }) => {
        const esActiva = activo ? id === activo : pathname === href;
        return (
          <Link
            key={id}
            href={href}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              esActiva
                ? "border-huellitas-primary text-huellitas-primary"
                : "border-transparent text-stone-500 hover:text-huellitas-primary"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
