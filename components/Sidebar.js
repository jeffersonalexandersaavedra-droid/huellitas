"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  BarChart3,
  FileText,
  Archive,
  Settings,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/estudiantes", label: "Estudiantes", icon: Users },
  { href: "/admin/pagos", label: "Pagos", icon: Wallet },
  { href: "/admin/facturacion", label: "Facturación", icon: Receipt },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/notas", label: "Notas", icon: FileText },
  { href: "/admin/historico", label: "Histórico", icon: Archive },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-huellitas-primary">
      <div className="flex items-center gap-2 px-5 py-5">
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

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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
  );
}
