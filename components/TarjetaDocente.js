import Avatar from "@/components/Avatar";

// Perfil profesional del docente tal como lo ven los padres.
export default function TarjetaDocente({ docente }) {
  const nombre = `${docente.nombres} ${docente.apellidos}`;
  return (
    <article className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4">
      <Avatar nombre={nombre} fotoUrl={docente.foto_url} size={64} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-huellitas-ink">{nombre}</p>
          {docente.es_tutor && (
            <span className="rounded-full bg-huellitas-accent px-2 py-0.5 text-xs font-semibold text-huellitas-ink">
              Tutor(a)
            </span>
          )}
        </div>
        <p className="text-sm text-huellitas-primary">{docente.especialidad || "Docente"}</p>
        {docente.cursos?.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1">
            {docente.cursos.map((c) => (
              <li key={c} className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                {c}
              </li>
            ))}
          </ul>
        )}
        {docente.bio && (
          <details className="group mt-2 text-sm">
            <summary className="cursor-pointer list-none font-medium text-huellitas-accent-dark hover:underline">
              <span className="group-open:hidden">Ver trayectoria</span>
              <span className="hidden group-open:inline">Ocultar trayectoria</span>
            </summary>
            <p className="mt-1 whitespace-pre-line text-stone-600">{docente.bio}</p>
          </details>
        )}
      </div>
    </article>
  );
}
