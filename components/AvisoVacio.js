// Tarjeta para estados vacíos o avisos ("aún no hay...").
export default function AvisoVacio({ icono: Icono, children }) {
  return (
    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
      {Icono && <Icono className="mx-auto h-8 w-8 text-stone-300" strokeWidth={2} />}
      <p className="mt-3 text-sm text-huellitas-ink/70">{children}</p>
    </div>
  );
}
