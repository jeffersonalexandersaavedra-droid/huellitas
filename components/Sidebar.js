"use client";

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
  PawPrint,
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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-amber-400">
          <PawPrint className="h-5 w-5" strokeWidth={2} />
        </div>
        <span className="text-lg font-semibold text-emerald-900">
          Huellitas
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
                  ? "bg-emerald-800 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 px-3 py-3">
        <LogoutButton className="w-full" />
      </div>
    </aside>
  );
}
