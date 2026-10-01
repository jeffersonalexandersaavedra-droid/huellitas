import { createClient } from "@/lib/supabase/server";
import { estudianteActual, matriculaVigente } from "@/lib/consultas";
import { bimestresDesbloqueados } from "@/lib/bimestres";
import PadreDashboard from "@/components/PadreDashboard";
import MisDocentes from "@/components/MisDocentes";
import AvisoVacio from "@/components/AvisoVacio";

export default async function PadrePage() {
  const supabase = await createClient();

  const estudiante = await estudianteActual(
    supabase,
    "id, dni, nombres, apellidos, password_cambiado, foto_url"
  );
  if (!estudiante) {
    return (
      <AvisoVacio>
        No encontramos tu información de estudiante. Comunícate con administración.
      </AvisoVacio>
    );
  }

  const matricula = await matriculaVigente(
    supabase,
    estudiante.id,
    "id, aulas(nombre, nivel, lista_utiles_url), anios_escolares(anio)"
  );
  if (!matricula) {
    return (
      <AvisoVacio>No tienes una matrícula activa este año. Comunícate con administración.</AvisoVacio>
    );
  }

  const [{ data: cuotas }, { data: notas }, { data: observaciones }, { data: vinculos }, { data: docentes }] =
    await Promise.all([
      supabase
        .from("cuotas")
        .select("id, mes, monto, monto_con_descuento, fecha_vencimiento, estado, conceptos_cobro(nombre, tipo)")
        .eq("matricula_id", matricula.id)
        .order("mes", { ascending: true }),
      supabase
        .from("notas_curso")
        .select("id, curso, bimestre, nota, comentario")
        .eq("matricula_id", matricula.id)
        .order("bimestre", { ascending: true }),
      supabase
        .from("observaciones_estudiante")
        .select("id, bimestre, texto")
        .eq("matricula_id", matricula.id)
        .order("bimestre", { ascending: true }),
      supabase
        .from("estudiante_apoderado")
        .select("es_principal, apoderados(nombres, apellidos, parentesco)")
        .eq("estudiante_id", estudiante.id)
        .order("es_principal", { ascending: false }),
      supabase.rpc("mis_docentes"),
    ]);

  // Las notas de bimestres sin pagar no salen del servidor.
  const visibles = bimestresDesbloqueados(cuotas ?? []);
  const soloVisibles = (filas) => (filas ?? []).filter((f) => visibles.includes(f.bimestre));

  return (
    <div className="space-y-6">
      <PadreDashboard
        estudiante={estudiante}
        matricula={matricula}
        cuotas={cuotas ?? []}
        notas={soloVisibles(notas)}
        observaciones={soloVisibles(observaciones)}
        apoderados={(vinculos ?? []).map((v) => v.apoderados).filter(Boolean)}
      />
      <MisDocentes docentes={docentes ?? []} />
    </div>
  );
}
