import Avatar from "@/components/Avatar";
import { ROLES } from "@/lib/roles";

// Barra superior de escritorio: quién está conectado y con qué rol.
export default function Header({ nombre, rol }) {
  return (
    <header className="hidden h-16 shrink-0 items-center justify-end gap-3 border-b border-stone-200 bg-white px-6 md:flex print:hidden">
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-medium text-huellitas-ink">{nombre}</p>
        <p className="text-xs text-stone-500">{ROLES[rol] ?? ""}</p>
      </div>
      <Avatar nombre={nombre} size={36} />
    </header>
  );
}
