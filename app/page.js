import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-800 text-amber-400">
          <PawPrint className="h-8 w-8" strokeWidth={2} />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-emerald-900">
          I.E.P. Huellitas
        </h1>

        <p className="mt-3 text-balance text-base text-stone-600">
          Educamos con amor para dejar huellitas en tu corazón.
        </p>

        <Link
          href="/login"
          className="mt-10 inline-flex w-full items-center justify-center rounded-lg bg-emerald-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Ingresar al sistema
        </Link>
      </div>

      <p className="mt-16 text-xs text-stone-400">
        San Juan de Lurigancho · RUC 20492591077
      </p>
    </div>
  );
}
