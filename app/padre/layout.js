import { PawPrint } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function PadreLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between bg-huellitas-primary px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-huellitas-accent">
            <PawPrint className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-sm font-medium text-white">
            Nombre del estudiante
          </span>
        </div>
        <LogoutButton />
      </header>

      <main className="flex flex-1 items-center justify-center bg-huellitas-cream p-6">
        {children}
      </main>
    </div>
  );
}
