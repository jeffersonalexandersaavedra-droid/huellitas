"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Smartphone, Building2, X, Lock } from "lucide-react";
import StepperPago from "@/components/StepperPago";
import ModalPagoYape from "@/components/ModalPagoYape";
import ModalPagoTransferencia from "@/components/ModalPagoTransferencia";
import ModalCambiarPassword from "@/components/ModalCambiarPassword";
import ModalPagoTotal from "@/components/ModalPagoTotal";
import PerfilEstudiante from "@/components/PerfilEstudiante";
import MisDocentes from "@/components/MisDocentes";
import ListaCuotas from "@/components/ListaCuotas";
import NotasPadre from "@/components/NotasPadre";
import MisComprobantes from "@/components/MisComprobantes";
import { MESES, formatFecha, aFecha } from "@/lib/fecha";
import { montoACobrar, siguienteCuotaPorPagar, formatSoles } from "@/lib/cuentas";

export default function PadreDashboard({
  estudiante,
  matricula,
  cuotas,
  notas,
  observaciones = [],
  apoderados = [],
  docentes = [],
  comprobantes = [],
}) {
  const router = useRouter();
  const anioActual = matricula.anios_escolares?.anio ?? new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;

  const cuotaDelMes = cuotas.find((c) => c.mes === mesActual) ?? null;
  const otrasCuotas = cuotas.filter((c) => c.id !== cuotaDelMes?.id);

  const [bannerVisible, setBannerVisible] = useState(estudiante.password_cambiado === false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalPago, setModalPago] = useState(null);
  const [showModalTotal, setShowModalTotal] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [toast, setToast] = useState("");

  // Cuotas que se pueden pagar ahora (pendientes o vencidas). Cada una a su
  // precio real: las vencidas pierden el descuento (S/ 300), las que aún
  // están en fecha mantienen el descuento. El "Pagar todo" suma todas.
  const cuotasPagables = cuotas.filter(
    (c) => c.estado === "pendiente" || c.estado === "vencido"
  );
  // Regla de pago en orden: solo se puede pagar la cuota MÁS ANTIGUA que se
  // debe. Las siguientes quedan bloqueadas hasta pagar la anterior. (El botón
  // "Pagar todo" no se ve afectado, para quienes adelantan cuotas.)
  const cuotaPagableId = siguienteCuotaPorPagar(cuotas)?.id ?? null;
  const detalleTotal = cuotasPagables.map((c) => {
    const { monto } = montoACobrar(c);
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
    const { monto } = montoACobrar(cuota);
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

      {/* PERFIL + DOCENTES */}
      <PerfilEstudiante
        estudiante={estudiante}
        aula={matricula.aulas?.nombre}
        anio={anioActual}
        listaUtilesUrl={matricula.aulas?.lista_utiles_url}
      />
      <MisDocentes docentes={docentes} aula={matricula.aulas?.nombre} />

      {/* ESTADO DE CUENTA + PAGAR TODO */}
      {totalPagar > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl bg-huellitas-primary p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm text-white/80">Total pendiente por pagar</p>
            <p className="mt-1 font-display text-3xl font-semibold">
              {formatSoles(totalPagar)}
            </p>
            <p className="mt-1 text-xs text-white/70">
              {detalleTotal.length} cuota(s). Las vencidas van a su precio
              completo; las que están en fecha mantienen su descuento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModalTotal(true)}
            className="w-full shrink-0 rounded-lg bg-huellitas-accent px-6 py-3 text-sm font-semibold text-huellitas-primary transition-colors hover:bg-huellitas-accent-dark hover:text-white sm:w-auto"
          >
            Pagar todo lo pendiente
          </button>
        </div>
      )}

      {/* CUOTA DEL MES */}
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        {cuotaDelMes ? (
          <CuotaDelMes
            cuota={cuotaDelMes}
            mesActual={mesActual}
            bloqueada={
              cuotaDelMes.id !== cuotaPagableId &&
              (cuotaDelMes.estado === "pendiente" || cuotaDelMes.estado === "vencido")
            }
            onPagar={(metodo) => abrirPago(cuotaDelMes, metodo)}
          />
        ) : (
          <p className="text-sm text-huellitas-ink/60">
            No hay una cuota registrada para este mes.
          </p>
        )}
      </div>

      {/* PRÓXIMAS CUOTAS */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-semibold text-huellitas-primary">
          Pensiones del año
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Se pagan en orden: primero la más antigua que debes.
        </p>
        <div className="mt-2">
          <ListaCuotas
            cuotas={otrasCuotas}
            anio={anioActual}
            cuotaPagableId={cuotaPagableId}
            onPagar={abrirPago}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowHistorial(true)}
          className="mt-3 text-sm font-medium text-huellitas-accent-dark hover:underline"
        >
          Ver historial completo del año
        </button>
      </section>

      <MisComprobantes comprobantes={comprobantes} />

      <NotasPadre anio={anioActual} notas={notas} observaciones={observaciones} />

      {/* MODALES */}
      {modalPago?.metodo === "yape" && (
        <ModalPagoYape
          open
          onClose={() => setModalPago(null)}
          cuota={modalPago.cuota}
          estudianteNombre={estudianteNombre}
          apoderados={apoderados}
          onSubmitted={handlePagoEnviado}
        />
      )}

      {modalPago?.metodo === "transferencia" && (
        <ModalPagoTransferencia
          open
          onClose={() => setModalPago(null)}
          cuota={modalPago.cuota}
          estudianteNombre={estudianteNombre}
          apoderados={apoderados}
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
        apoderados={apoderados}
        onSubmitted={handlePagoEnviado}
      />

      <ModalCambiarPassword
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordCambiado}
      />

      {showHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-huellitas-ink/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-lg sm:p-6">
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

            <div className="mt-2">
              <ListaCuotas cuotas={cuotas} anio={anioActual} />
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-50 rounded-lg bg-huellitas-ink px-4 py-3 text-sm text-white shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

function CuotaDelMes({ cuota, mesActual, onPagar, bloqueada = false }) {
  const { monto, descuentoVigente } = montoACobrar(cuota);
  const vencimiento = cuota.fecha_vencimiento ? aFecha(cuota.fecha_vencimiento) : null;
  const diasRestantes = vencimiento
    ? Math.ceil(
        (vencimiento.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000
      )
    : null;
  const mostrarAlerta = diasRestantes != null && diasRestantes >= 0 && diasRestantes <= 5;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-huellitas-primary">
            Cuota del mes
          </h2>
          <p className="text-sm text-stone-500">
            {MESES[mesActual]} {new Date().getFullYear()}
          </p>
        </div>

        <div className="sm:text-right">
          {descuentoVigente ? (
            <div>
              <p className="text-sm text-stone-400 line-through">
                {formatSoles(cuota.monto)}
              </p>
              <p className="font-display text-2xl font-semibold text-huellitas-primary sm:text-3xl">
                {formatSoles(monto)}
              </p>
              <span className="mt-1 inline-flex items-center whitespace-nowrap rounded-full bg-huellitas-accent px-2.5 py-0.5 text-xs font-semibold text-huellitas-ink">
                Descuento por pago puntual
              </span>
            </div>
          ) : (
            <p className="font-display text-2xl font-semibold text-huellitas-primary sm:text-3xl">
              {formatSoles(monto)}
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

      {(cuota.estado === "pendiente" || cuota.estado === "vencido") &&
        (bloqueada ? (
          <div className="mt-6 flex items-start gap-2 rounded-lg bg-huellitas-accent/10 p-3 text-sm text-huellitas-ink/80">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-huellitas-accent-dark" strokeWidth={2} />
            <span>
              Para pagar este mes primero debes pagar las pensiones de los meses
              anteriores. También puedes usar “Pagar todo lo pendiente”.
            </span>
          </div>
        ) : (
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
        ))}
    </div>
  );
}
