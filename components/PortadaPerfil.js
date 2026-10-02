import Image from "next/image";
import { Camera } from "lucide-react";
import Avatar from "@/components/Avatar";

// Cabecera de perfil con la imagen del colegio de portada y la foto encima.
// Si recibe `onFoto`, muestra la cámara para cambiar la foto.
export default function PortadaPerfil({
  nombre,
  fotoUrl,
  etiqueta,
  detalles = [],
  onFoto,
  aviso,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="relative h-32 sm:h-44">
        <Image
          src="/logos/huellitas-banner.png"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover object-[52%_38%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-huellitas-primary/95 via-huellitas-primary/30 to-huellitas-primary-dark/90" />
      </div>

      <div className="px-5 pb-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
          <div className="relative -mt-12 w-fit shrink-0 sm:-mt-14">
            <Avatar nombre={nombre} fotoUrl={fotoUrl} size={104} className="shadow-md ring-4 ring-white" />
            {onFoto && (
              <label
                className="absolute bottom-1 right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-huellitas-primary text-white shadow ring-2 ring-white transition-colors hover:bg-huellitas-primary-dark"
                title="Cambiar foto"
              >
                <Camera className="h-4 w-4" strokeWidth={2} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFoto(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="min-w-0 sm:pt-3">
            {etiqueta && (
              <p className="text-xs font-semibold uppercase tracking-wider text-huellitas-accent-dark">
                {etiqueta}
              </p>
            )}
            <h2 className="font-display text-2xl font-semibold leading-tight text-huellitas-ink">
              {nombre}
            </h2>
            {detalles.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {detalles.map((d) => (
                  <li
                    key={d}
                    className="rounded-full bg-huellitas-primary-light px-3 py-0.5 text-xs font-medium text-huellitas-primary"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {aviso && <p className="mt-3 text-xs text-huellitas-primary">{aviso}</p>}
        {children && <div className="mt-5 border-t border-stone-100 pt-4">{children}</div>}
      </div>
    </section>
  );
}
