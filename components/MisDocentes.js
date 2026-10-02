import TarjetaDocente from "@/components/TarjetaDocente";

// Docentes del aula del estudiante con su perfil profesional (tutor primero).
export default function MisDocentes({ docentes, aula }) {
  if (docentes.length === 0) return null;
  const ordenados = [...docentes].sort((a, b) => Number(b.es_tutor) - Number(a.es_tutor));

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-semibold text-huellitas-primary">
        Docentes de {aula ?? "tu hijo(a)"}
      </h2>
      <p className="text-sm text-stone-500">
        Conoce a los profesionales que acompañan a tu hijo(a) este año.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {ordenados.map((d) => (
          <TarjetaDocente key={d.docente_id ?? d.id} docente={d} />
        ))}
      </div>
    </section>
  );
}
