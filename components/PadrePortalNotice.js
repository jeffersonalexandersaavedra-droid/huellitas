import Link from "next/link";
import { Lock } from "lucide-react";

export default function PadrePortalNotice({ className = "" }) {
  return (
    <div
      className={`rounded-xl bg-huellitas-primary-light p-6 text-center ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-huellitas-accent-dark">
        <Lock className="h-6 w-6" strokeWidth={2} />
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-huellitas-ink">
        Portal de padres en construcción
      </h3>

      <p className="mt-2 text-sm text-huellitas-ink/70">
        Estamos preparando tu acceso al sistema. Muy pronto podrás ingresar
        para consultar los pagos y notas de tu hijo. Mientras tanto,
        comunícate directamente con el colegio para cualquier consulta.
      </p>

      <Link
        href="/#contacto"
        className="mt-5 inline-flex items-center rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-white"
      >
        Contactar al colegio
      </Link>
    </div>
  );
}
