import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Iniciar sesión" };

// Para cambiar la foto de fondo, reemplaza este archivo en /public/logos/
// (o sube uno nuevo y cambia el nombre aquí).
const IMAGEN_FONDO = "/logos/huellitas-banner.png";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh w-full">
      {/* Panel izquierdo: imagen del colegio (solo escritorio) */}
      <div className="relative hidden md:block md:w-1/2 lg:w-3/5">
        <Image
          src={IMAGEN_FONDO}
          alt="I.E.P. Huellitas"
          fill
          priority
          className="object-cover object-[52%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-huellitas-primary/95 via-huellitas-primary/80 to-huellitas-primary-dark/95" />

        <div className="relative flex h-full flex-col justify-between p-10 text-white lg:p-14">
          <div className="flex items-center gap-2">
            <Image
              src="/logos/huellitas-escudo-sin-fondo.png"
              alt=""
              width={40}
              height={49}
              className="h-10 w-auto"
            />
            <span className="font-display text-xl font-semibold">
              Huellitas<span className="text-huellitas-accent">.</span>
            </span>
          </div>

          <div>
            <h2 className="max-w-lg font-display text-4xl font-semibold leading-tight lg:text-5xl">
              Educando con{" "}
              <span className="text-huellitas-accent">Calidad y Calidez</span>
            </h2>
            <p className="mt-4 max-w-md text-white/80">
              Sistema de gestión escolar de la I.E.P. Huellitas — Inicial y
              Primaria en Tocache, San Martín.
            </p>
          </div>

          <p className="text-xs text-white/60">
            © 2026 I.E.P. Huellitas · Más de 22 años formando estudiantes
          </p>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="relative flex w-full items-center justify-center p-6 md:w-1/2 lg:w-2/5">
        {/* Fondo con imagen para móvil */}
        <div className="absolute inset-0 md:hidden">
          <Image
            src={IMAGEN_FONDO}
            alt=""
            fill
            priority
            className="object-cover object-[52%_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-huellitas-primary/95 to-huellitas-primary-dark/95" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <Image
              src="/logos/huellitas-escudo.png"
              alt="Escudo de I.E.P. Huellitas"
              width={72}
              height={87}
              priority
              className="mx-auto h-20 w-auto"
            />

            <h1 className="mt-4 text-center font-display text-2xl font-semibold text-huellitas-primary">
              Bienvenido
            </h1>
            <p className="mt-1 text-center text-sm text-stone-500">
              Ingresa al sistema de gestión escolar
            </p>

            <div className="mt-6">
              <LoginForm />
            </div>

            <p className="mt-6 text-center text-xs italic text-stone-400">
              Educando con Calidad y Calidez
            </p>

            <div className="mt-6 border-t border-stone-100 pt-4 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-huellitas-primary hover:underline"
              >
                ← Volver a la página principal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
