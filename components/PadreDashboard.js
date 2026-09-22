"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Smartphone, Building2, X } from "lucide-react";
import EstadoBadge from "@/components/EstadoBadge";
import StepperPago from "@/components/StepperPago";
import NotaBadge from "@/components/NotaBadge";
import ModalPagoYape from "@/components/ModalPagoYape";
import ModalPagoTransferencia from "@/components/ModalPagoTransferencia";
import ModalCambiarPassword from "@/components/ModalCambiarPassword";
import ModalPagoTotal from "@/components/ModalPagoTotal";
import PerfilFoto from "@/components/PerfilFoto";
import { MESES, formatFecha } from "@/lib/fecha";

function getBimestreActual(mes) {
  if (mes <= 5) return 1;
  if (mes <= 7) return 2;
  if (mes <= 9) return 3;
  return 4;
}

function resolverMonto(cuota) {
  const vencimiento = cuota.fecha_vencimiento ? new Date(cuota.fecha_vencimiento) : null;
  const hoy = new Date();
  const descuentoVigente =
    cuota.monto_con_descuento != null && vencimiento != null && hoy <= vencimiento;

  return {
    monto: descuentoVigente ? cuota.monto_con_descuento : cuota.monto,
    descuentoVigente,
  };
}

export default function PadreDashboard({
  estudiante,
  matricula,
  cuotas,
  notas,
  observaciones = [],
}) {
  const router = useRouter();
  const anioActual = matricula.anios_escolares?.anio ?? new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const bimestreActualReal = getBimestreActual(mesActual);

  const cuotaDelMes = cuotas.find((c) => c.mes === mesActual) ?? null;
  const otrasCuotas = cuotas.filter((c) => c.id !== cuotaDelMes?.id);

  const [bannerVisible, setBannerVisible] = useState(estudiante.password_cambiado === false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalPago, setModalPago] = useState(null);
  const [showModalTotal, setShowModalTotal] = useState(false);
  const [bimestreActivo, setBimestreActivo] = useState(bimestreActualReal);
  const [showHistorial, setShowHistorial] = useState(false);
  const [toast, setToast] = useState("");

  // Cuotas que se pueden pagar ahora (pendientes o vencidas). Cada una a su
  // precio real: las vencidas pierden el descuento (S/ 300), las que aún
  // están en fecha mantienen el descuento. El "Pagar todo" suma todas.
  const cuotasPagables = cuotas.filter(
    (c) => c.estado === "pendiente" || c.estado === "vencido"
  );
  const detalleTotal = cuotasPagables.map((c) => {
    const { monto } = resolverMonto(c);
    return {
      id: c.id,
      concepto: `${c.conceptos_cobro?.nombre ?? "Pensión"}${
        c.mes ? ` ${MESES[c.mes]}` : ""
      }`,
      monto,
    };
  });
  const totalPagar = detalleTotal.reduce((s, d) => s + Number(d.monto), 0);

  function mostrarToast(mensaje) {
    setToast(mensaje);
    setTimeout(() => setToast(""), 4000);
  }

  function abrirPago(cuota, metodo) {
    const { monto } = resolverMonto(cuota);
    setModalPago({
      metodo,
      cuota: {
        id: cuota.id,
        matriculaId: matricula.id,
        concepto: cuota.conceptos_cobro?.nombre ?? "Pensión",
        monto,
      },
    });
  }

  function handlePagoEnviado() {
    mostrarToast(
      "Voucher enviado. Recibirás confirmación cuando administración lo verifique."
    );
    router.refresh();
  }

  function handlePasswordCambiado() {
    mostrarToast("Contraseña actualizada correctamente");
    setBannerVisible(false);
    router.refresh();
  }

  const notasPorBimestre = new Map();
  for (const n of notas) {
    if (!notasPorBimestre.has(n.bimestre)) notasPorBimestre.set(n.bimestre, []);
    notasPorBimestre.get(n.bimestre).push(n);
  }
  const notasBimestreActivo = notasPorBimestre.get(bimestreActivo) ?? [];

  const observacionesPorBimestre = new Map();
  for (const o of observaciones) {
    if (!observacionesPorBimestre.has(o.bimestre))
      observacionesPorBimestre.set(o.bimestre, []);
    observacionesPorBimestre.get(o.bimestre).push(o);
  }
  const observacionesBimestreActivo =
    observacionesPorBimestre.get(bimestreActivo) ?? [];

  const estudianteNombre = `${estudiante.nombres} ${estudiante.apellidos}`;

  return (
    <div className="space-y-6">
      {bannerVisible && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-huellitas-accent/40 bg-huellitas-accent/10 p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-huellitas-ink">
            Por tu seguridad, te recomendamos cambiar la contraseña que te
            entregó el colegio por una personal.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="rounded-lg bg-huellitas-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-huellitas-primary-dark"
            >
              Cambiar ahora
            </button>
            <button
              type="button"
              onClick={() => setBannerVisible(false)}
              className="rounded-lg border border-huellitas-primary/30 px-3 py-1.5 text-xs font-medium text-huellitas-primary hover:bg-white"
            >
              Más tarde
            </button>
          </div>
        </div>
      )}

      {/* PERFIL DEL ESTUDIANTE */}
      <PerfilFoto
        estudianteId={estudiante.id}
        nombre={estudianteNombre}
        aula={matricula.aulas?.nombre}
        dni={estudiante.dni}
        fotoUrl={estudiante.foto_url}
      />

      {/* ESTADO DE CUENTA + PAGAR TODO */}
      {totalPagar > 0 && (
        <div className="flex flex-col gap-4 rounded-xl bg-huellitas-primary p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/80">Total pendiente por pagar</p>
            <p className="mt-1 font-display text-3xl font-semibold">
              S/ {totalPagar.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-white/70">
              {detalleTotal.length} cuota(s). Las vencidas van a su precio
              completo; las que están en fecha mantienen su descuento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModalTotal(true)}
            className="shrink-0 rounded-lg bg-huellitas-accent px-6 py-3 text-sm font-semibold text-huellitas-primary transition-colors hover:bg-huellitas-accent-dark hover:text-white"
          >
            Pagar todo lo pendiente
          </button>
        </div>
      )}

      {/* BLOQUE 1: CUOTA DEL MES */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {cuotaDelMes ? (
          <CuotaDelMes cuota={cuotaDelMes} mesActual={mesActual} onPagar={(metodo) => abrirPago(cuotaDelMes, metodo)} />
        ) : (
          <p className="text-sm text-huellitas-ink/60">
            No hay una cuota registrada para este mes.
          </p>
        )}
      </div>

      {/* BLOQUE 2: PRÓXIMAS CUOTAS */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-huellitas-primary">
          Próximas cuotas y otros pagos
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <th className="py-2 pr-4 font-medium">Concepto</th>
                <th className="py-2 pr-4 font-medium">Vencimiento</th>
                <th className="py-2 pr-4 font-medium">Monto</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {otrasCuotas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-stone-400">
                    No hay más cuotas pendientes por mostrar.
                  </td>
                </tr>
              )}
              {otrasCuotas.map((cuota) => {
                const { monto, descuentoVigente } = resolverMonto(cuota);
                return (
                  <tr key={cuota.id} className="border-b border-stone-50">
                    <td className="py-3 pr-4 text-huellitas-ink">
                      {cuota.conceptos_cobro?.nombre ?? "Pensión"}
                      {cuota.mes ? ` ${MESES[cuota.mes]} ${anioActual}` : ""}
                    </td>
                    <td className="py-3 pr-4 text-stone-500">
                      {formatFecha(cuota.fecha_vencimiento)}
                    </td>
                    <td className="py-3 pr-4 text-huellitas-ink">
                      S/ {Number(monto).toFixed(2)}
                      {descuentoVigente && (
                        <span className="ml-1 text-xs text-huellitas-accent-dark">
                          (con descuento)
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <EstadoBadge estado={cuota.estado} />
                    </td>
                    <td className="py-3 text-right">
                      {cuota.estado === "pendiente" && (
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => abrirPago(cuota, "yape")}
                            className="text-xs font-medium text-huellitas-primary hover:underline"
                          >
                            Yape
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirPago(cuota, "transferencia")}
                            className="text-xs font-medium text-huellitas-primary hover:underline"
                          >
                            Transferencia
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => setShowHistorial(true)}
          className="mt-4 text-sm font-medium text-huellitas-accent-dark hover:underline"
        >
          Ver historial completo del año
        </button>
      </div>

      {/* BLOQUE 3: NOTAS */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-huellitas-primary">
          Notas académicas {anioActual}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Notas del año en curso. Para consultar años anteriores acércate a
          administración.
        </p>

        <div className="mt-4 flex gap-2 border-b border-stone-100">
          {[1, 2, 3, 4].map((b) => {
            const disabled = b > bimestreActualReal;
            return (
              <button
                key={b}
                type="button"
                disabled={disabled}
                onClick={() => setBimestreActivo(b)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  disabled
                    ? "cursor-not-allowed border-transparent text-stone-300"
                    : bimestreActivo === b
                      ? "border-huellitas-primary text-huellitas-primary"
                      : "border-transparent text-stone-500 hover:text-huellitas-primary"
                }`}
              >
                Bimestre {b}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {notasBimestreActivo.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-400">
              Las notas del bimestre {bimestreActivo} aún no están disponibles.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-4 font-medium">Curso</th>
                  <th className="py-2 pr-4 font-medium">Nota</th>
                  <th className="py-2 font-medium">Comentario docente</th>
                </tr>
              </thead>
              <tbody>
                {notasBimestreActivo.map((n) => (
                  <tr key={n.id} className="border-b border-stone-50">
                    <td className="py-3 pr-4 text-huellitas-ink">{n.curso}</td>
                    <td className="py-3 pr-4">
                      <NotaBadge nota={n.nota} />
                    </td>
                    <td className="py-3 text-stone-500">{n.comentario || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {observacionesBimestreActivo.length > 0 && (
          <div className="mt-4 rounded-lg bg-huellitas-primary-light/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-huellitas-primary">
              Observaciones del docente
            </p>
            <ul className="mt-2 space-y-1">
              {observacionesBimestreActivo.map((o) => (
                <li key={o.id} className="text-sm text-huellitas-ink/80">
                  {o.texto}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* MODALES */}
      {modalPago?.metodo === "yape" && (
        <ModalPagoYape
          open
          onClose={() => setModalPago(null)}
          cuota={modalPago.cuota}
          estudianteNombre={estudianteNombre}
          onSubmitted={handlePagoEnviado}
        />
      )}

      {modalPago?.metodo === "transferencia" && (
        <ModalPagoTransferencia
          open
          onClose={() => setModalPago(null)}
          cuota={modalPago.cuota}
          estudianteNombre={estudianteNombre}
          onSubmitted={handlePagoEnviado}
        />
      )}

      <ModalPagoTotal
        open={showModalTotal}
        onClose={() => setShowModalTotal(false)}
        matriculaId={matricula.id}
        estudianteNombre={estudianteNombre}
        detalle={detalleTotal}
        total={totalPagar}
        onSubmitted={handlePagoEnviado}
      />

      <ModalCambiarPassword
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordCambiado}
      />

      {showHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-huellitas-ink/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-huellitas-primary">
                Historial de cuotas {anioActual}
              </h3>
              <button
                type="button"
                onClick={() => setShowHistorial(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-4 font-medium">Concepto</th>
                  <th className="py-2 pr-4 font-medium">Vencimiento</th>
                  <th className="py-2 pr-4 font-medium">Monto</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((cuota) => {
                  const { monto } = resolverMonto(cuota);
                  return (
                    <tr key={cuota.id} className="border-b border-stone-50">
                      <td className="py-3 pr-4 text-huellitas-ink">
                        {cuota.conceptos_cobro?.nombre ?? "Pensión"}
                        {cuota.mes ? ` ${MESES[cuota.mes]}` : ""}
                      </td>
                      <td className="py-3 pr-4 text-stone-500">
                        {formatFecha(cuota.fecha_vencimiento)}
                      </td>
                      <td className="py-3 pr-4 text-huellitas-ink">
                        S/ {Number(monto).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <EstadoBadge estado={cuota.estado} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg bg-huellitas-ink px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function CuotaDelMes({ cuota, mesActual, onPagar }) {
  const { monto, descuentoVigente } = resolverMonto(cuota);
  const vencimiento = cuota.fecha_vencimiento ? new Date(cuota.fecha_vencimiento) : null;
  const diasRestantes = vencimiento
    ? Math.ceil(
        (vencimiento.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000
      )
    : null;
  const mostrarAlerta = diasRestantes != null && diasRestantes >= 0 && diasRestantes <= 5;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-display text-xl font-semibold text-huellitas-primary">
            Cuota del mes
          </h2>
          <p className="text-sm text-stone-500">
            {MESES[mesActual]} {new Date().getFullYear()}
          </p>
        </div>

        <div className="text-right">
          {descuentoVigente ? (
            <div>
              <p className="text-sm text-stone-400 line-through">
                S/ {Number(cuota.monto).toFixed(2)}
              </p>
              <p className="font-display text-3xl font-semibold text-huellitas-primary">
                S/ {Number(monto).toFixed(2)}
              </p>
              <span className="mt-1 inline-flex items-center rounded-full bg-huellitas-accent px-2.5 py-0.5 text-xs font-semibold text-huellitas-ink">
                Descuento por pago puntual
              </span>
            </div>
          ) : (
            <p className="font-display text-3xl font-semibold text-huellitas-primary">
              S/ {Number(monto).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {mostrarAlerta && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <span>
            Vence el {formatFecha(cuota.fecha_vencimiento)}. Si pagas después
            perderás el descuento.
          </span>
        </div>
      )}

      <div className="mt-6">
        <StepperPago estado={cuota.estado} />
      </div>

      {cuota.estado === "pendiente" && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPagar("yape")}
            className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
          >
            <Smartphone className="h-4 w-4 text-huellitas-accent" strokeWidth={2} />
            Pagar con Yape
          </button>
          <button
            type="button"
            onClick={() => onPagar("transferencia")}
            className="flex items-center justify-center gap-2 rounded-lg border border-huellitas-primary px-4 py-3 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
          >
            <Building2 className="h-4 w-4" strokeWidth={2} />
            Transferencia bancaria
          </button>
        </div>
      )}
    </div>
  );
}
