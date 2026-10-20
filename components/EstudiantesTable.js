"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Upload } from "lucide-react";
import EstadoCuentaBadge from "@/components/EstadoCuentaBadge";
import { coincide, controlClass, inputClass } from "@/lib/ui";

export default function EstudiantesTable({ estudiantes }) {
  const [busqueda, setBusqueda] = useState("");
  const [nivel, setNivel] = useState("todos");
  const [aula, setAula] = useState("todas");
  const [estadoCuenta, setEstadoCuenta] = useState("todos");

  const aulasDisponibles = useMemo(() => {
    const nombres = new Set(
      estudiantes
        .filter((e) => nivel === "todos" || e.nivel === nivel)
        .map((e) => e.aula)
        .filter(Boolean)
    );
    return Array.from(nombres).sort();
  }, [estudiantes, nivel]);

  const filtrados = useMemo(
    () =>
      estudiantes.filter(
        (e) =>
          (nivel === "todos" || e.nivel === nivel) &&
          (aula === "todas" || e.aula === aula) &&
          (estadoCuenta === "todos" || e.estadoCuenta === estadoCuenta) &&
          coincide(busqueda, `${e.nombres} ${e.apellidos}`, e.dni)
      ),
    [estudiantes, busqueda, nivel, aula, estadoCuenta]
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            strokeWidth={2}
          />
          <input
            type="search"
            aria-label="Buscar estudiante por nombre o DNI"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href="/admin/estudiantes/importar"
            className="flex items-center justify-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
          >
            <Upload className="h-4 w-4" strokeWidth={2} />
            Importar
          </Link>
          <Link
            href="/admin/estudiantes/nuevo"
            className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Registrar
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          aria-label="Nivel"
          value={nivel}
          onChange={(e) => {
            setNivel(e.target.value);
            setAula("todas");
          }}
          className={controlClass}
        >
          <option value="todos">Todos los niveles</option>
          <option value="inicial">Inicial</option>
          <option value="primaria">Primaria</option>
        </select>

        <select aria-label="Aula" value={aula} onChange={(e) => setAula(e.target.value)} className={controlClass}>
          <option value="todas">Todas las aulas</option>
          {aulasDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          aria-label="Estado de cuenta"
          value={estadoCuenta}
          onChange={(e) => setEstadoCuenta(e.target.value)}
          className={controlClass}
        >
          <option value="todos">Todos los estados</option>
          <option value="al-dia">Al día</option>
          <option value="con-deuda">Con deuda</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
              <th className="px-4 py-3 font-medium">Nombres y apellidos</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Aula</th>
              <th className="px-4 py-3 font-medium">Apoderado principal</th>
              <th className="px-4 py-3 font-medium">Estado de cuenta</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-stone-400">
                  No se encontraron estudiantes.
                </td>
              </tr>
            )}
            {filtrados.map((e) => (
              <tr key={e.id} className="border-b border-stone-50 last:border-0 hover:bg-huellitas-cream">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/estudiantes/${e.id}`} className="text-huellitas-ink hover:text-huellitas-primary hover:underline">
                    {e.nombres} {e.apellidos}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-stone-600">{e.dni}</td>
                <td className="px-4 py-3 text-stone-600">{e.aula || "—"}</td>
                <td className="px-4 py-3 text-stone-600">{e.apoderadoPrincipal || "—"}</td>
                <td className="px-4 py-3">
                  <EstadoCuentaBadge conDeuda={e.estadoCuenta === "con-deuda"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
