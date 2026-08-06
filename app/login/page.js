import Link from "next/link";
import { PawPrint } from "lucide-react";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Ingresar · I.E.P. Huellitas",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 text-amber-400"
          >
            <PawPrint className="h-7 w-7" strokeWidth={2} />
          </Link>
          <h1 className="text-xl font-semibold text-emerald-900">
            I.E.P. Huellitas
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Ingresa con tu correo y contraseña.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
