"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { bimestreActualPorMes } from "@/lib/bimestres";
import { registroDelAula } from "@/lib/consultas";
import AvisoVacio from "@/components/AvisoVacio";
import SelectorRegistro from "@/components/SelectorRegistro";
import TablaCompetencias from "@/components/TablaCompetencias";
import DescargasRegistro from "@/components/DescargasRegistro";

// Consulta de notas por aula (solo lectura): lo que registraron los
// docentes, por área y competencia, con las mismas descargas del docente.
export default function NotasAdminPanel({ aulas, anio, areasPorNivel }) {
  const supabase = createClient();
  const [aulaId, setAulaId] = useState(aulas[0]?.id ?? "");
  const [bimestre, setBimestre] = useState(() => bimestreActualPorMes(new Date().getMonth() + 1));
  const [areaNombre, setAreaNombre] = useState("");
  const [registro, setRegistro] = useState({ estudiantes: [], notas: {}, observaciones: {}, cursosConNotas: [] });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!aulaId) return;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      const datos = await registroDelAula(supabase, { aulaId, bimestre });
      if (cancelado) return;
      setRegistro(datos);
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, bimestre]);

  const aula = aulas.find((a) => a.id === aulaId);
  // Áreas activas del nivel y las desactivadas que aún tienen notas.
  const areas = useMemo(
    () =>
      (areasPorNivel[aula?.nivel] ?? []).filter((a) => a.activo || registro.cursosConNotas.includes(a.nombre)),
    [areasPorNivel, aula?.nivel, registro.cursosConNotas]
  );
  const area = areas.find((a) => a.nombre === areaNombre) ?? areas[0];

  if (aulas.length === 0) {
    return <AvisoVacio icono={BookOpen}>No hay aulas en el año escolar activo.</AvisoVacio>;
  }

  return (
    <div className="space-y-6">
      <SelectorRegistro
        aulas={aulas}
        aulaId={aulaId}
        onAula={setAulaId}
        bimestre={bimestre}
        onBimestre={setBimestre}
        areas={areas}
        area={area}
        onArea={setAreaNombre}
      />

      <div className="rounded-xl bg-white p-3 shadow-sm sm:p-6">
        {cargando ? (
          <p className="py-8 text-center text-sm text-stone-400">Cargando...</p>
        ) : registro.estudiantes.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No hay estudiantes matriculados en esta aula.</p>
        ) : !area ? (
          <p className="py-8 text-center text-sm text-stone-400">
            Este nivel no tiene áreas con competencias. Agrégalas en Configuración › Cursos.
          </p>
        ) : (
          <>
            <h2 className="font-display text-lg font-semibold text-huellitas-primary">{area.nombre}</h2>
            <div className="mt-3">
              <TablaCompetencias
                area={area}
                estudiantes={registro.estudiantes}
                notas={registro.notas}
                observaciones={registro.observaciones}
              />
            </div>
            <div className="mt-6 border-t border-stone-100 pt-5">
              <DescargasRegistro
                aula={aula}
                datosRegistro={() => ({ anio, bimestre, aula, areas, ...registro })}
                cargarRegistro={async (b) => ({ areas, ...(await registroDelAula(supabase, { aulaId, bimestre: b })) })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
