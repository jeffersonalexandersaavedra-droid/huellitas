import Link from "next/link";
import LoginTabs from "@/components/LoginTabs";

export const metadata = {
  title: "Ingresar · I.E.P. Huellitas",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
          <div className="h-[5px] bg-huellitas-primary" />

          <div className="p-6">
            <div className="text-center">
              <p className="font-display text-3xl font-semibold text-huellitas-primary">
                Huellitas<span className="text-huellitas-accent">.</span>
              </p>
              <p className="mt-1 text-sm text-huellitas-ink/60">
                Ingresa a tu portal
              </p>
            </div>

            <div className="mt-6">
              <LoginTabs />
            </div>

            <p className="mt-6 text-center text-xs italic text-stone-400">
              Educando con Calidad y Calidez
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-huellitas-primary hover:underline">
            Volver a la página principal
          </Link>
        </p>
      </div>
    </div>
  );
}
