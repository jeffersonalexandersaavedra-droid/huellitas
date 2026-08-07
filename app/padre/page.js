import { createClient } from "@/lib/supabase/server";
import PadreDashboard from "@/components/PadreDashboard";

export default async function PadrePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estudiante } = await supabase
    .from("estudiantes")
    .select("id, nombres, apellidos, password_cambiado")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!estudiante) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-huellitas-ink/70">
          No encontramos tu información de estudiante. Comunícate con
          administración.
        </p>
      </div>
    );
  }

  const { data: matricula } = await supabase
    .from("matriculas")
    .select("id, aulas(nombre, nivel), anios_escolares(anio)")
    .eq("estudiante_id", estudiante.id)
    .maybeSingle();

  if (!matricula) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-huellitas-ink/70">
          No tienes una matrícula activa este año. Comunícate con
          administración.
        </p>
      </div>
    );
  }

  const { data: cuotas } = await supabase
    .from("cuotas")
    .select(
      "id, mes, monto, monto_con_descuento, fecha_vencimiento, estado, conceptos_cobro(nombre, tipo)"
    )
    .eq("matricula_id", matricula.id)
    .order("mes", { ascending: true });

  const { data: notas } = await supabase
    .from("notas_curso")
    .select("id, curso, bimestre, nota, comentario")
    .eq("matricula_id", matricula.id)
    .order("bimestre", { ascending: true });

  return (
    <PadreDashboard
      estudiante={estudiante}
      matricula={matricula}
      cuotas={cuotas ?? []}
      notas={notas ?? []}
    />
  );
}
