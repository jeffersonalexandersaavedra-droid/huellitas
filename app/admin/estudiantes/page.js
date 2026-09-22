import { createClient } from "@/lib/supabase/server";
import EstudiantesTable from "@/components/EstudiantesTable";
import { estadoCuenta } from "@/lib/cuentas";

export const metadata = { title: "Estudiantes" };

export default async function EstudiantesPage() {
  const supabase = await createClient();

  const { data: anioActivo } = await supabase
    .from("anios_escolares")
    .select("id")
    .eq("activo", true)
    .maybeSingle();

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select(
      "id, estudiante_id, aulas(nombre, nivel), estudiantes(id, dni, nombres, apellidos)"
    )
    .eq("anio_escolar_id", anioActivo?.id ?? "")
    .eq("estado", "activa");

  const estudianteIds = (matriculas ?? []).map((m) => m.estudiante_id);
  const matriculaIds = (matriculas ?? []).map((m) => m.id);

  const { data: vinculos } = estudianteIds.length
    ? await supabase
        .from("estudiante_apoderado")
        .select("estudiante_id, es_principal, apoderados(nombres, apellidos)")
        .in("estudiante_id", estudianteIds)
        .eq("es_principal", true)
    : { data: [] };

  const { data: cuotas } = matriculaIds.length
    ? await supabase
        .from("cuotas")
        .select("matricula_id, estado, fecha_vencimiento")
        .in("matricula_id", matriculaIds)
    : { data: [] };

  const principalPorEstudiante = new Map(
    (vinculos ?? []).map((v) => [
      v.estudiante_id,
      v.apoderados ? `${v.apoderados.nombres} ${v.apoderados.apellidos}` : null,
    ])
  );

  const cuotasPorMatricula = new Map();
  for (const c of cuotas ?? []) {
    if (!cuotasPorMatricula.has(c.matricula_id)) cuotasPorMatricula.set(c.matricula_id, []);
    cuotasPorMatricula.get(c.matricula_id).push(c);
  }

  const estudiantes = (matriculas ?? []).map((m) => ({
    id: m.estudiantes.id,
    dni: m.estudiantes.dni,
    nombres: m.estudiantes.nombres,
    apellidos: m.estudiantes.apellidos,
    aula: m.aulas?.nombre ?? "",
    nivel: m.aulas?.nivel ?? "",
    apoderadoPrincipal: principalPorEstudiante.get(m.estudiante_id) ?? "",
    estadoCuenta: estadoCuenta(cuotasPorMatricula.get(m.id) ?? []),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Estudiantes
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Estudiantes matriculados en el año en curso.
      </p>

      <div className="mt-6">
        <EstudiantesTable estudiantes={estudiantes} />
      </div>
    </div>
  );
}
