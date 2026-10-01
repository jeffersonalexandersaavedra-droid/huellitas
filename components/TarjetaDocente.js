import Avatar from "@/components/Avatar";

// Perfil profesional del docente tal como lo ven los padres.
export default function TarjetaDocente({ docente }) {
  const nombre = `${docente.nombres} ${docente.apellidos}`;
  return (
    <div className="flex gap-4 rounded-lg border border-stone-200 p-4">
      <Avatar nombre={nombre} fotoUrl={docente.foto_url} size={64} />
      <div className="min-w-0">
        <p className="font-medium text-huellitas-ink">
          {nombre}
          {docente.es_tutor && (
            <span className="ml-2 rounded-full bg-huellitas-accent/30 px-2 py-0.5 text-xs font-normal">
              Tutor(a)
            </span>
          )}
        </p>
        {docente.especialidad && (
          <p className="text-sm text-huellitas-primary">{docente.especialidad}</p>
        )}
        {docente.cursos?.length > 0 && (
          <p className="mt-1 text-xs text-stone-500">{docente.cursos.join(" · ")}</p>
        )}
        {docente.bio && (
          <p className="mt-2 whitespace-pre-line text-sm text-stone-600">{docente.bio}</p>
        )}
      </div>
    </div>
  );
}
