import { Search, Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-stone-200 bg-white px-6">
      <div className="relative w-full max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          strokeWidth={2}
        />
        <input
          type="search"
          placeholder="Buscar estudiante..."
          className="w-full rounded-lg border border-stone-300 bg-huellitas-cream py-2 pl-9 pr-3 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100"
        >
          <Bell className="h-4 w-4" strokeWidth={2} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-huellitas-accent" />
        </button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-huellitas-primary-light text-sm font-medium text-huellitas-primary">
          A
        </div>
      </div>
    </header>
  );
}
