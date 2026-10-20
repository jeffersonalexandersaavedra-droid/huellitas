import Link from "next/link";

// "¿Qué quieres hacer?": tarjetas grandes en lugar de pestañas.
// secciones: [{ id, icono, titulo, texto }] · contador: { [id]: número }
export default function MenuFacturacion({ secciones, activa, contador }) {
  return (
    <nav aria-label="¿Qué quieres hacer?">
      <p className="text-sm font-medium text-stone-600">¿Qué quieres hacer?</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {secciones.map(({ id, icono: Icono, titulo, texto }) => {
          const esActiva = id === activa;
          return (
            <li key={id}>
              <Link
                href={`/admin/facturacion?tab=${id}`}
                aria-current={esActiva ? "page" : undefined}
                className={`flex h-full gap-3 rounded-xl border-2 p-3 transition-colors lg:flex-col lg:gap-2 ${
                  esActiva
                    ? "border-huellitas-primary bg-huellitas-primary text-white"
                    : "border-transparent bg-white text-huellitas-ink shadow-sm hover:border-huellitas-primary/40"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <Icono className={`h-6 w-6 shrink-0 ${esActiva ? "text-huellitas-accent" : "text-huellitas-primary"}`} strokeWidth={2} />
                  {contador[id] > 0 && (
                    <span className="rounded-full bg-huellitas-accent px-2 py-0.5 text-xs font-semibold text-huellitas-ink lg:order-last">
                      {contador[id]}
                    </span>
                  )}
                </span>
                <span>
                  <b className="block text-sm">{titulo}</b>
                  <span className={`block text-xs ${esActiva ? "text-white/80" : "text-stone-500"}`}>{texto}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
