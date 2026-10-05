"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Campo from "@/components/Campo";
import { controlClass } from "@/lib/ui";
import { TIPOS_CORTOS } from "@/lib/facturacion";

const PREFIJO = { boleta: "B001", factura: "F001", nota_credito: "BC01", ticket: "T001" };

// Series de numeración (solo admin). Al pasar al sistema desde otro
// facturador, se usa una serie nueva en el proveedor o se indica aquí el
// último número ya usado para continuar la correlación.
export default function SeriesComprobantes({ series }) {
  const router = useRouter();
  const [nueva, setNueva] = useState({ serie: "", tipo: "boleta" });
  const [error, setError] = useState("");

  async function guardar(serie, cambios) {
    setError("");
    const { error: e } = await createClient().from("comprobante_series").update(cambios).eq("serie", serie);
    if (e) return setError(e.message);
    router.refresh();
  }

  async function agregar(event) {
    event.preventDefault();
    setError("");
    const { error: e } = await createClient()
      .from("comprobante_series")
      .insert({ serie: nueva.serie.trim().toUpperCase(), tipo: nueva.tipo });
    if (e) {
      return setError(
        e.code === "23514"
          ? "Serie no válida: 4 caracteres; boletas con B, facturas con F, notas de crédito con B o F y tickets sin B ni F."
          : e.message
      );
    }
    setNueva({ serie: "", tipo: "boleta" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
              <th className="px-4 py-3 font-medium">Serie</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Último número</th>
              <th className="px-4 py-3 font-medium">Activa</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.serie} className="border-b border-stone-50">
                <td className="px-4 py-3 font-medium text-huellitas-ink">{s.serie}</td>
                <td className="px-4 py-3 text-stone-600">{TIPOS_CORTOS[s.tipo]}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    defaultValue={s.ultimo_numero}
                    onBlur={(e) => {
                      const valor = Number(e.target.value);
                      if (Number.isInteger(valor) && valor >= 0 && valor !== s.ultimo_numero) {
                        guardar(s.serie, { ultimo_numero: valor });
                      }
                    }}
                    className={`${controlClass} w-28 text-center`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={s.activa}
                    onChange={(e) => guardar(s.serie, { activa: e.target.checked })}
                    className="h-4 w-4 accent-huellitas-primary"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={agregar} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
        <Campo label="Nueva serie">
          <input
            value={nueva.serie}
            onChange={(e) => setNueva({ ...nueva, serie: e.target.value.toUpperCase() })}
            maxLength={4}
            placeholder={PREFIJO[nueva.tipo]}
            className={`${controlClass} w-28`}
          />
        </Campo>
        <Campo label="Tipo">
          <select value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })} className={controlClass}>
            {Object.entries(TIPOS_CORTOS).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </Campo>
        <button
          type="submit"
          disabled={nueva.serie.trim().length !== 4}
          className="flex items-center gap-1 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Agregar
        </button>
      </form>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <p className="text-xs text-stone-500">
        Se usa la primera serie activa de cada tipo (en orden alfabético). Las series deben estar dadas
        de alta en el proveedor de facturación electrónica. No retrocedas un número ya usado: SUNAT
        rechaza comprobantes repetidos.
      </p>
    </div>
  );
}
