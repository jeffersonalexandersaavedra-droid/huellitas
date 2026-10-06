"use client";

import { useRef, useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { descargarArchivo, descargarRegistroAuxiliar, TIPO_XLSX } from "@/lib/excel";
import { completarRegistroSiagie } from "@/lib/siagie";
import { cantidad } from "@/lib/ui";

const boton =
  "flex items-center justify-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2.5 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light disabled:cursor-not-allowed disabled:opacity-50";

// Descargas del registro de notas:
// - Registro auxiliar en Excel (mismo formato del SIAGIE, ver lib/excel.js).
// - Completar el archivo que se descarga del SIAGIE con las notas guardadas
//   en el portal, listo para subirlo (ver lib/siagie.js).
// datosRegistro(): datos para el Excel; cargarRegistro(bimestre): notas
// guardadas del aula; bloqueado: motivo para no completar el SIAGIE aún.
export default function DescargasRegistro({ aula, datosRegistro, cargarRegistro, bloqueado = "" }) {
  const archivo = useRef(null);
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState(null); // { error } | { resumen }

  async function completar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setTrabajando(true);
    setResultado(null);
    try {
      const { datos, nombre, resumen } = await completarRegistroSiagie(file, { nivel: aula.nivel, cargarRegistro });
      descargarArchivo(nombre, datos, TIPO_XLSX);
      setResultado({ resumen });
    } catch (error) {
      setResultado({ error: error.message });
    } finally {
      setTrabajando(false);
    }
  }

  const resumen = resultado?.resumen;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => descargarRegistroAuxiliar(datosRegistro())} className={boton}>
          <Download className="h-4 w-4" strokeWidth={2} />
          Registro auxiliar (Excel)
        </button>
        <button
          type="button"
          onClick={() => archivo.current?.click()}
          disabled={trabajando || Boolean(bloqueado)}
          title={bloqueado || "Elige el registro de notas que descargaste del SIAGIE"}
          className={boton}
        >
          {trabajando ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <FileUp className="h-4 w-4" strokeWidth={2} />
          )}
          Completar archivo del SIAGIE
        </button>
        <input ref={archivo} type="file" accept=".xlsx" onChange={completar} className="hidden" />
      </div>
      <p className="text-xs text-stone-500">
        {bloqueado ||
          "Descarga del SIAGIE el registro de notas del aula y elígelo aquí: se devuelve el mismo archivo con los niveles de logro y conclusiones guardados en el portal, listo para subirlo."}
      </p>

      {resultado?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{resultado.error}</p>}
      {resumen && (
        <div
          className={`space-y-1 rounded-lg px-3 py-2 text-sm ${
            resumen.notas ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
          }`}
        >
          <p>
            {resumen.notas
              ? `Listo: se completaron ${cantidad(resumen.notas, "nivel", "niveles")} de logro y ${cantidad(resumen.conclusiones, "conclusión", "conclusiones")} en ${cantidad(resumen.areas.length, "área")} (${resumen.periodo}). Sube el archivo descargado al SIAGIE.`
              : `No había notas guardadas del ${resumen.periodo.toLowerCase()} para los estudiantes del archivo.`}
          </p>
          <p className="text-xs opacity-80">
            {resumen.encontrados} de {cantidad(resumen.estudiantesArchivo, "estudiante")} del archivo están en {aula.nombre}.
            {resumen.sinCoincidencia.length > 0 &&
              ` Sin coincidencia (revisa nombre o DNI): ${resumen.sinCoincidencia.join(", ")}.`}
          </p>
        </div>
      )}
    </div>
  );
}
