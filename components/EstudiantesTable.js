"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Upload } from "lucide-react";
import EstadoCuentaBadge from "@/components/EstadoCuentaBadge";

export default function EstudiantesTable({ estudiantes }) {
  const router = useRouter();
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

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return estudiantes.filter((e) => {
      if (nivel !== "todos" && e.nivel !== nivel) return false;
      if (aula !== "todas" && e.aula !== aula) return false;
      if (estadoCuenta !== "todos" && e.estadoCuenta !== estadoCuenta) return false;
      if (
        term &&
        !`${e.nombres} ${e.apellidos} ${e.dni}`.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [estudiantes, busqueda, nivel, aula, estadoCuenta]);

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
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20"
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
          value={nivel}
          onChange={(e) => {
            setNivel(e.target.value);
            setAula("todas");
          }}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700"
        >
          <option value="todos">Todos los niveles</option>
          <option value="inicial">Inicial</option>
          <option value="primaria">Primaria</option>
        </select>

        <select
          value={aula}
          onChange={(e) => setAula(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700"
        >
          <option value="todas">Todas las aulas</option>
          {aulasDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={estadoCuenta}
          onChange={(e) => setEstadoCuenta(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700"
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
              <tr
                key={e.id}
                onClick={() => router.push(`/admin/estudiantes/${e.id}`)}
                className="cursor-pointer border-b border-stone-50 last:border-0 hover:bg-huellitas-cream"
              >
                <td className="px-4 py-3 font-medium text-huellitas-ink">
                  {e.nombres} {e.apellidos}
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
