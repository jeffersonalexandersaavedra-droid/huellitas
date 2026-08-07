import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="h-2 bg-huellitas-primary" />

          <div className="p-8">
            <Image
              src="/logos/huellitas-escudo.png"
              alt="Escudo de I.E.P. Huellitas"
              width={66}
              height={80}
              className="mx-auto h-20 w-auto"
            />

            <h1 className="mt-4 text-center font-display text-2xl font-semibold text-huellitas-primary">
              Bienvenido
            </h1>
            <p className="mt-1 text-center text-sm text-stone-500">
              Ingresa al sistema de gestión
            </p>

            <div className="mt-6">
              <LoginForm />
            </div>

            <p className="mt-6 text-center text-xs italic text-stone-400">
              Educando con Calidad y Calidez
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-huellitas-primary hover:underline">
            ← Volver a la página principal
          </Link>
        </p>
      </div>
    </div>
  );
}
