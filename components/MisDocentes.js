import TarjetaDocente from "@/components/TarjetaDocente";

// Docentes del aula del estudiante con su perfil profesional.
export default function MisDocentes({ docentes }) {
  if (docentes.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl font-semibold text-huellitas-primary">
        Docentes de tu hijo(a)
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {docentes.map((d) => (
          <TarjetaDocente key={d.docente_id} docente={d} />
        ))}
      </div>
    </div>
  );
}
