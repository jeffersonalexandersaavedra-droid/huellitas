"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#niveles", label: "Niveles" },
  { href: "#propuesta", label: "Propuesta" },
  { href: "#contacto", label: "Contacto" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#inicio"
          className="font-display text-xl font-semibold text-huellitas-primary"
        >
          Huellitas<span className="text-huellitas-accent">.</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-huellitas-ink/70 transition-colors hover:text-huellitas-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="rounded-lg bg-huellitas-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
        >
          Ingresar
        </Link>
      </div>
    </header>
  );
}
