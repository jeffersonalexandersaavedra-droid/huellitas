"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Upload, Download, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";

// Busca el valor de una fila por varios posibles nombres de columna.
function campo(fila, claves) {
  for (const k of Object.keys(fila)) {
    const norm = k.toString().trim().toLowerCase();
    if (claves.some((c) => norm.includes(c))) return fila[k];
  }
  return "";
}

export default function ImportarEstudiantes({ aulas }) {
  const router = useRouter();
  const [aulaId, setAulaId] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [filas, setFilas] = useState([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  async function leerArchivo(file) {
    if (!file) return;
    setError("");
    setResultado(null);
    setNombreArchivo(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const hoja = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(hoja, { defval: "" });

      const parsed = json
        .map((row) => {
          const apellidos = String(campo(row, ["apellido"])).trim();
          const nombres = String(campo(row, ["nombre"])).trim();
          const dni = String(campo(row, ["dni", "documento"])).replace(/\D/g, "");
          let fecha = campo(row, ["fecha", "nacimiento"]);
          if (fecha instanceof Date) fecha = fecha.toISOString().slice(0, 10);
          else fecha = String(fecha).trim();
          return {
            apellidos,
            nombres,
            dni,
            fechaNacimiento: fecha,
            valido: /^\d{8}$/.test(dni) && Boolean(apellidos) && Boolean(nombres),
          };
        })
        .filter((f) => f.apellidos || f.nombres || f.dni);

      if (parsed.length === 0) {
        setError("No se encontraron filas. Revisa que el archivo tenga las columnas Apellidos, Nombres y DNI.");
      }
      setFilas(parsed);
    } catch {
      setError("No se pudo leer el archivo. Debe ser un Excel (.xlsx) o CSV.");
      setFilas([]);
    }
  }

  const validas = filas.filter((f) => f.valido);

  async function importar() {
    if (!aulaId || validas.length === 0) return;
    setImportando(true);
    setError("");
    setResultado(null);
    try {
      const res = await fetch("/api/admin/importar-estudiantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aulaId,
          estudiantes: validas.map((f) => ({
            apellidos: f.apellidos,
            nombres: f.nombres,
            dni: f.dni,
            fechaNacimiento: f.fechaNacimiento || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo importar.");
      } else {
        setResultado(data);
        setFilas([]);
        setNombreArchivo("");
        router.refresh();
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setImportando(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-huellitas-primary">
              Cargar estudiantes desde Excel
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Descarga la plantilla, llénala (o pide a una IA que ordene tus
              datos en ese formato) y súbela. Se importa un aula a la vez.
            </p>
          </div>
          <a
            href="/plantilla_carga_estudiantes.xlsx"
            download
            className="flex shrink-0 items-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Descargar plantilla
          </a>
        </div>

        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">
              1. Aula de destino
            </span>
            <select value={aulaId} onChange={(e) => setAulaId(e.target.value)} className={inputClass}>
              <option value="">Selecciona un aula...</option>
              {aulas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} ({a.nivel})
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-1 block text-sm font-medium text-stone-700">
              2. Sube el archivo Excel o CSV
            </span>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-stone-300 p-6 text-center transition-colors hover:border-huellitas-accent">
              <FileSpreadsheet className="h-7 w-7 text-huellitas-accent" strokeWidth={2} />
              <span className="text-sm text-stone-600">
                {nombreArchivo || "Haz clic para elegir tu archivo (.xlsx o .csv)"}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => leerArchivo(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
      </div>

      {/* Vista previa */}
      {filas.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-huellitas-primary">
              Vista previa ({validas.length} válidos de {filas.length})
            </h3>
            <button
              type="button"
              onClick={importar}
              disabled={importando || !aulaId || validas.length === 0}
              className="flex items-center gap-2 rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" strokeWidth={2} />
              {importando ? "Importando..." : `Importar ${validas.length}`}
            </button>
          </div>
          {!aulaId && (
            <p className="mt-2 text-sm text-amber-700">Selecciona un aula antes de importar.</p>
          )}

          <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-huellitas-cream text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Apellidos</th>
                  <th className="px-3 py-2 font-medium">Nombres</th>
                  <th className="px-3 py-2 font-medium">DNI</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="px-3 py-2 text-stone-400">{i + 1}</td>
                    <td className="px-3 py-2 text-huellitas-ink">{f.apellidos || "—"}</td>
                    <td className="px-3 py-2 text-huellitas-ink">{f.nombres || "—"}</td>
                    <td className="px-3 py-2 font-mono text-stone-600">{f.dni || "—"}</td>
                    <td className="px-3 py-2">
                      {f.valido ? (
                        <span className="text-emerald-600">✓ OK</span>
                      ) : (
                        <span className="text-rose-600">✕ revisar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 font-medium text-emerald-700">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
            {resultado.creados} estudiante(s) importado(s) correctamente.
          </p>
          {resultado.omitidos?.length > 0 && (
            <div className="mt-3">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                {resultado.omitidos.length} omitido(s):
              </p>
              <ul className="mt-2 space-y-1 text-sm text-stone-600">
                {resultado.omitidos.map((o, i) => (
                  <li key={i}>
                    Fila {o.fila} (DNI {o.dni || "—"}): {o.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
