import { PawPrint } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function PadreLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-amber-400">
            <PawPrint className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-sm font-medium text-stone-700">
            Nombre del estudiante
          </span>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 bg-stone-50 p-6">{children}</main>
    </div>
  );
}
