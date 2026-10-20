const TARJETAS = ["a", "b", "c"];

// Se muestra al instante al cambiar de sección mientras el servidor prepara
// la página (loading.js de cada portal), para que se note que el clic llegó.
export default function CargandoSeccion() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <span className="sr-only">Cargando…</span>
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-stone-200" />
        <div className="h-4 w-80 max-w-full rounded bg-stone-200/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TARJETAS.map((t) => (
          <div key={t} className="h-24 rounded-xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-white shadow-sm" />
    </div>
  );
}
