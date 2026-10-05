"use client";

import { useState } from "react";
import { Banknote, CheckCircle2, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MESES, formatFecha } from "@/lib/fecha";
import { montoACobrar, formatSoles } from "@/lib/cuentas";
import { METODOS_PAGO } from "@/lib/pagoInfo";
import { apoderadosDe } from "@/lib/consultas";
import { inputClass } from "@/lib/ui";
import Campo from "@/components/Campo";
import EstadoBadge from "@/components/EstadoBadge";
import BuscadorEstudiante from "@/components/BuscadorEstudiante";
import { ModalComprobante, AvisoComprobante } from "@/components/FormularioComprobante";

const METODOS_CAJA = ["efectivo", "yape", "plin", "transferencia", "deposito"];

// Pago recibido en dirección/secretaría. Se cobran las pensiones en orden
// (desde la más antigua), queda registrado como pagado al instante y se
// ofrece emitir su comprobante a nombre de quien pagó.
export default function RegistrarPagoCaja({ estudiantes, usuarioId, anio, configurado, consultaHabilitada }) {
  const supabase = createClient();
  const [seleccion, setSeleccion] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [apoderados, setApoderados] = useState([]);
  const [cantidad, setCantidad] = useState(1);
  const [metodo, setMetodo] = useState("efectivo");
  const [pagadoPor, setPagadoPor] = useState("");
  const [operacion, setOperacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  // Pago recién registrado, listo para emitir su comprobante.
  const [porFacturar, setPorFacturar] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comprobante, setComprobante] = useState(null);

  async function cargar(estudiante) {
    const [{ data: cuotasData }, porEstudiante] = await Promise.all([
      supabase
        .from("cuotas")
        .select("id, mes, monto, monto_con_descuento, fecha_vencimiento, estado, conceptos_cobro(nombre)")
        .eq("matricula_id", estudiante.matriculaId)
        .order("mes", { ascending: true }),
      apoderadosDe(supabase, [estudiante.estudianteId]),
    ]);
    const lista = porEstudiante.get(estudiante.estudianteId) ?? [];
    setCuotas(cuotasData ?? []);
    setApoderados(lista);
    setPagadoPor(lista[0] ? `${lista[0].nombres} ${lista[0].apellidos}` : "");
    setCantidad(1);
  }

  // Solo se cobran pendientes/vencidas, siempre desde la más antigua.
  const porPagar = cuotas.filter((c) => c.estado === "pendiente" || c.estado === "vencido");
  const aCobrar = porPagar.slice(0, cantidad);
  const total = aCobrar.reduce((s, c) => s + montoACobrar(c).monto, 0);

  function elegir(estudiante) {
    setSeleccion(estudiante);
    setMensaje(null);
    setPorFacturar(null);
    setComprobante(null);
    cargar(estudiante);
  }

  async function registrar(event) {
    event.preventDefault();
    if (!aCobrar.length) return;
    setGuardando(true);
    setMensaje(null);

    const ahora = new Date().toISOString();
    const ids = aCobrar.map((c) => c.id);
    const apoderado = apoderados.find((a) => `${a.nombres} ${a.apellidos}` === pagadoPor);

    const { data: pago, error: pagoError } = await supabase
      .from("pagos")
      .insert({
        matricula_id: seleccion.matriculaId,
        cuota_id: ids[0],
        cuotas_ids: ids,
        monto: total,
        metodo,
        numero_operacion: operacion.trim() || null,
        estado: "pagado",
        fecha_pago: ahora,
        fecha_validacion: ahora,
        validado_por: usuarioId,
        pagado_por: pagadoPor.trim() || null,
        pagado_por_parentesco: apoderado?.parentesco ?? null,
      })
      .select("id, monto, metodo, fecha_pago, cuota_id, cuotas_ids, pagado_por")
      .single();

    const { error: cuotasError } = pagoError
      ? { error: null }
      : await supabase.from("cuotas").update({ estado: "pagado" }).in("id", ids);

    setGuardando(false);
    const error = pagoError || cuotasError;
    if (error) {
      setMensaje({ tipo: "error", texto: `No se pudo registrar: ${error.message}` });
      return;
    }

    const meses = aCobrar.map((c) => MESES[c.mes]).join(", ");
    setMensaje({ tipo: "ok", texto: `Pago de ${formatSoles(total)} registrado (${meses}).` });
    setPorFacturar({
      ...pago,
      cuotas: aCobrar,
      alumno: seleccion.nombre,
      aula: seleccion.aula,
      anio,
    });
    setModalAbierto(true);
    setOperacion("");
    cargar(seleccion);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <BuscadorEstudiante estudiantes={estudiantes} onElegir={elegir} />
      </div>

      {mensaje && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm ${
            mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          <p className="flex items-center gap-2">
            {mensaje.tipo === "ok" && <CheckCircle2 className="h-4 w-4" strokeWidth={2} />}
            {mensaje.texto}
          </p>
          {porFacturar && !comprobante && (
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="flex items-center gap-1 rounded-lg bg-huellitas-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-huellitas-primary-dark"
            >
              <Receipt className="h-4 w-4" strokeWidth={2} />
              Emitir comprobante
            </button>
          )}
        </div>
      )}

      {comprobante && <AvisoComprobante resultado={comprobante} onCerrar={() => setComprobante(null)} />}

      {seleccion && (
        <form onSubmit={registrar} className="rounded-xl bg-white p-5 shadow-sm">
          <p className="font-medium text-huellitas-ink">{seleccion.nombre}</p>
          <p className="text-xs text-stone-500">
            DNI {seleccion.dni} · {seleccion.aula}
          </p>

          {porPagar.length === 0 ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              No tiene pensiones pendientes.
            </p>
          ) : (
            <>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-stone-400">
                Marca hasta qué mes paga (se cobra en orden)
              </p>
              <ul className="mt-2 space-y-1">
                {porPagar.map((c, i) => {
                  const marcada = i < cantidad;
                  const { monto, descuentoVigente } = montoACobrar(c);
                  return (
                    <li key={c.id}>
                      <label
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                          marcada
                            ? "border-huellitas-primary bg-huellitas-primary-light"
                            : "border-stone-200"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={marcada}
                            onChange={() => setCantidad(marcada ? i : i + 1)}
                            className="accent-huellitas-primary"
                          />
                          Pensión {MESES[c.mes]}
                          <span className="text-xs text-stone-400">
                            vence {formatFecha(c.fecha_vencimiento)}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          {descuentoVigente && (
                            <span className="text-xs text-huellitas-accent-dark">con descuento</span>
                          )}
                          <EstadoBadge estado={c.estado} />
                          <b className="text-huellitas-ink">{formatSoles(monto)}</b>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Campo label="Método">
                  <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={inputClass}>
                    {METODOS_CAJA.map((m) => (
                      <option key={m} value={m}>
                        {METODOS_PAGO[m]}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Pagado por">
                  <input
                    type="text"
                    list="apoderados-caja"
                    value={pagadoPor}
                    onChange={(e) => setPagadoPor(e.target.value)}
                    className={inputClass}
                  />
                  <datalist id="apoderados-caja">
                    {apoderados.map((a) => (
                      <option key={`${a.nombres}${a.apellidos}`} value={`${a.nombres} ${a.apellidos}`} />
                    ))}
                  </datalist>
                </Campo>
                <Campo label="N.° de recibo u operación">
                  <input
                    type="text"
                    value={operacion}
                    onChange={(e) => setOperacion(e.target.value)}
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </Campo>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-stone-500">
                  Total a cobrar:{" "}
                  <span className="font-display text-2xl font-semibold text-huellitas-primary">
                    {formatSoles(total)}
                  </span>
                </p>
                <button
                  type="submit"
                  disabled={guardando || !aCobrar.length}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Banknote className="h-4 w-4" strokeWidth={2} />
                  {guardando ? "Registrando..." : "Registrar pago"}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {modalAbierto && porFacturar && (
        <ModalComprobante
          titulo="Comprobante del pago"
          subtitulo={`${porFacturar.alumno} · ${formatSoles(porFacturar.monto)}`}
          pago={porFacturar}
          apoderados={apoderados}
          configurado={configurado}
          consultaHabilitada={consultaHabilitada}
          onEmitido={(r) => {
            setComprobante(r);
            setPorFacturar(null);
            setModalAbierto(false);
          }}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
