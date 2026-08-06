export default async function EstudianteDetallePage({ params }) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">
        Ficha del estudiante
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Aquí irán los datos y el estado de cuenta del estudiante{" "}
        <span className="font-mono text-stone-700">{id}</span>.
      </p>
    </div>
  );
}
