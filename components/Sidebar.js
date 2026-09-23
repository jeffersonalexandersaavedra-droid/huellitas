"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Wallet,
  Receipt,
  BarChart3,
  FileText,
  Globe,
  Settings,
  X,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/estudiantes", label: "Estudiantes", icon: Users },
  { href: "/admin/docentes", label: "Docentes", icon: GraduationCap },
  { href: "/admin/pagos", label: "Pagos", icon: Wallet },
  { href: "/admin/facturacion", label: "Facturación", icon: Receipt },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/notas", label: "Notas", icon: FileText },
  { href: "/admin/pagina", label: "Menú principal", icon: Globe },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const pathname = usePathname();

  return (
    <>
      {/* Fondo oscuro al abrir el menú en móvil */}
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-huellitas-ink/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col bg-huellitas-primary transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <Image
              src="/logos/huellitas-escudo-sin-fondo.png"
              alt=""
              width={32}
              height={39}
            />
            <span className="font-display text-lg font-semibold text-white">
              Huellitas<span className="text-huellitas-accent">.</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-huellitas-primary"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <LogoutButton className="w-full" />
        </div>
      </aside>
    </>
  );
}
