"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apoderadosDe } from "@/lib/consultas";
import BuscadorEstudiante from "@/components/BuscadorEstudiante";
import FormularioComprobante, { AvisoComprobante } from "@/components/FormularioComprobante";

// Comprobante de otros cobros (certificados, constancias, traslados...),
// de un estudiante o de una persona sin estudiante matriculado.
export default function NuevoComprobante({ estudiantes, conceptos, configurado, consultaHabilitada }) {
  const router = useRouter();
  // undefined: aún sin elegir · null: venta sin estudiante
  const [alumno, setAlumno] = useState(undefined);
  const [apoderados, setApoderados] = useState([]);
  const [resultado, setResultado] = useState(null);

  async function elegir(estudiante) {
    const porEstudiante = await apoderadosDe(createClient(), [estudiante.estudianteId]);
    setApoderados(porEstudiante.get(estudiante.estudianteId) ?? []);
    setAlumno(estudiante);
    setResultado(null);
  }

  function sinEstudiante() {
    setApoderados([]);
    setAlumno(null);
    setResultado(null);
  }

  return (
    <div className="space-y-4">
      {resultado && <AvisoComprobante resultado={resultado} onCerrar={() => setResultado(null)} />}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <BuscadorEstudiante estudiantes={estudiantes} onElegir={elegir} label="¿De qué estudiante es el cobro?" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-stone-600">
            {alumno ? (
              <>
                Comprobante para <b className="text-huellitas-ink">{alumno.nombre}</b> · {alumno.aula}
              </>
            ) : alumno === null ? (
              "Venta sin estudiante (por ejemplo, a un exalumno o a un tercero)."
            ) : (
              "Busca al estudiante o emite el comprobante sin estudiante."
            )}
          </p>
          {alumno !== null && (
            <button
              type="button"
              onClick={sinEstudiante}
              className="flex items-center gap-1 font-medium text-huellitas-primary hover:underline"
            >
              <UserX className="h-4 w-4" strokeWidth={2} />
              Sin estudiante
            </button>
          )}
        </div>
      </div>

      {alumno !== undefined && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <FormularioComprobante
            key={alumno?.matriculaId ?? "sin-estudiante"}
            alumno={alumno}
            apoderados={apoderados}
            conceptos={conceptos}
            configurado={configurado}
            consultaHabilitada={consultaHabilitada}
            onEmitido={(r) => {
              setResultado(r);
              setAlumno(undefined);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
