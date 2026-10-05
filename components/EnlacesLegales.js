import Link from "next/link";
import { BookOpenText } from "lucide-react";

// Enlaces obligatorios en todo el sitio: Libro de Reclamaciones (Indecopi),
// política de privacidad (Ley 29733) y términos de uso.
export default function EnlacesLegales({ className = "" }) {
  return (
    <nav className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${className}`}>
      <Link
        href="/libro-de-reclamaciones"
        className="flex items-center gap-1 rounded-md border border-current px-2 py-1 font-medium"
      >
        <BookOpenText className="h-4 w-4" strokeWidth={2} />
        Libro de Reclamaciones
      </Link>
      <Link href="/privacidad" className="underline-offset-2 hover:underline">
        Política de privacidad
      </Link>
      <Link href="/terminos" className="underline-offset-2 hover:underline">
        Términos de uso
      </Link>
    </nav>
  );
}
