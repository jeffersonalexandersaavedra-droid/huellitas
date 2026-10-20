import Link from "next/link";
import { FileDown, FileText } from "lucide-react";
import EstadoBadge from "@/components/EstadoBadge";
import EstadoCuentaBadge from "@/components/EstadoCuentaBadge";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import DescuentosEstudiante from "@/components/DescuentosEstudiante";
import { MESES, formatFecha } from "@/lib/fecha";
import { montoACobrar, formatSoles } from "@/lib/cuentas";
import { BIMESTRES } from "@/lib/cursos";

const enlaceInforme = (estudianteId, matriculaId) => `/admin/estudiantes/${estudianteId}/informe?matricula=${matriculaId}`;

function Seccion({ titulo, accion, children }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Vacio({ children }) {
  return <p className="mt-3 text-sm text-stone-400">{children}</p>;
}

function Encabezado({ estudiante, matricula, conDeuda }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
          {estudiante.nombres} {estudiante.apellidos}
        </h1>
        <EstadoBadge estado={estudiante.activo ? "activa" : "retirado"} />
        <EstadoCuentaBadge conDeuda={conDeuda} />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          DNI <span className="font-mono">{estudiante.dni}</span>
          {matricula?.aulas && (
            <>
              {" "}· {matricula.aulas.nombre} ({matricula.aulas.nivel})
            </>
          )}
          {matricula?.anios_escolares && <> · {matricula.anios_escolares.anio}</>}
        </p>
        {matricula && (
          <a
            href={`/api/contrato/${estudiante.id}`}
            className="flex items-center gap-2 rounded-lg bg-huellitas-accent px-3 py-1.5 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
          >
            <FileDown className="h-4 w-4" strokeWidth={2} />
            Descargar contrato
          </a>
        )}
      </div>
    </div>
  );
}

function DatosEstudiante({ estudiante, matricula }) {
  const datos = [
    ["Fecha de nacimiento", estudiante.fecha_nacimiento ? formatFecha(estudiante.fecha_nacimiento) : "—"],
    ["Acceso al portal", estudiante.user_id ? `Ingresa con su DNI (${estudiante.dni})` : "Sin activar"],
    ["Aula / grado", matricula?.aulas?.nombre ?? "—"],
    ["Contraseña personalizada", estudiante.password_cambiado ? "Sí" : "No (usa la del colegio)"],
  ];
  return (
    <Seccion
      titulo="Datos del estudiante"
      accion={<ResetPasswordButton tipo="estudiante" id={estudiante.id} tieneAcceso={Boolean(estudiante.user_id)} />}
    >
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        {datos.map(([dato, valor]) => (
          <div key={dato}>
            <dt className="text-stone-400">{dato}</dt>
            <dd className="text-huellitas-ink">{valor}</dd>
          </div>
        ))}
      </dl>
    </Seccion>
  );
}

function Apoderados({ apoderados }) {
  return (
    <Seccion titulo="Apoderados">
      {apoderados.length === 0 ? (
        <Vacio>No hay apoderados registrados.</Vacio>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {apoderados.map((a) => (
            <div key={a.id} className="rounded-lg border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-huellitas-ink">
                  {a.nombres} {a.apellidos}
                </p>
                {a.esPrincipal && (
                  <span className="rounded-full bg-huellitas-accent px-2 py-0.5 text-xs font-medium text-huellitas-ink">
                    Principal
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm capitalize text-stone-500">{a.parentesco}</p>
              <p className="mt-2 text-sm text-stone-600">{a.telefono || "—"}</p>
              <p className="text-sm text-stone-600">{a.email || "—"}</p>
              <p className="text-sm text-stone-600">{a.direccion || "—"}</p>
            </div>
          ))}
        </div>
      )}
    </Seccion>
  );
}

function Cuotas({ cuotas, anio }) {
  return (
    <Seccion titulo={`Cuotas ${anio ?? ""}`}>
      {cuotas.length === 0 ? (
        <Vacio>No hay cuotas generadas.</Vacio>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <th className="py-2 pr-4 font-medium">Concepto</th>
                <th className="py-2 pr-4 font-medium">Vencimiento</th>
                <th className="py-2 pr-4 font-medium">Monto</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((c) => (
                <tr key={c.id} className="border-b border-stone-50">
                  <td className="py-3 pr-4 text-huellitas-ink">
                    {c.conceptos_cobro?.nombre ?? "Pensión"} {MESES[c.mes]}
                  </td>
                  <td className="py-3 pr-4 text-stone-500">{formatFecha(c.fecha_vencimiento)}</td>
                  <td className="py-3 pr-4 text-huellitas-ink">{formatSoles(montoACobrar(c).monto)}</td>
                  <td className="py-3">
                    <EstadoBadge estado={c.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Seccion>
  );
}

function Notas({ calificadas, informe }) {
  return (
    <Seccion
      titulo="Notas"
      accion={
        informe && (
          <Link
            href={informe}
            className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-3 py-1.5 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
          >
            <FileText className="h-4 w-4" strokeWidth={2} />
            Informe de progreso
          </Link>
        )
      }
    >
      {!informe ? (
        <Vacio>No hay notas registradas.</Vacio>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BIMESTRES.map((b) => (
            <li key={b} className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs text-stone-400">Bimestre {b}</p>
              <p className="text-lg font-semibold text-huellitas-ink">{calificadas[b] ?? 0}</p>
              <p className="text-xs text-stone-500">competencias calificadas</p>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}

function Historico({ historico, estudianteId, primerAnio }) {
  return (
    <Seccion titulo="Histórico">
      <p className="text-sm text-stone-500">Años anteriores en el colegio.</p>
      {historico.length === 0 ? (
        <p className="mt-4 rounded-lg bg-huellitas-cream px-4 py-3 text-sm text-stone-500">
          {primerAnio
            ? `Aún no cuenta con histórico: su primera matrícula registrada es la de ${primerAnio}.`
            : "Aún no cuenta con histórico de matrículas."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {historico.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-huellitas-ink">
                  {h.anio} · {h.aula}
                </p>
                <p className="text-xs text-stone-500">
                  {h.pensiones} pensiones pagadas · Pagado {formatSoles(h.pagado)}
                  {h.deuda > 0 && ` · Deuda ${formatSoles(h.deuda)}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EstadoBadge estado={h.estado} />
                <EstadoCuentaBadge conDeuda={h.deuda > 0} />
                {h.conNotas && (
                  <Link
                    href={enlaceInforme(estudianteId, h.id)}
                    className="flex items-center gap-1 rounded-lg border border-huellitas-primary px-2.5 py-1 text-xs font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                    Informe
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}

// Ficha del estudiante en el panel (datos de lib/ficha.js).
export default function FichaEstudiante({
  estudiante,
  matricula,
  apoderados,
  cuotas,
  descuentos,
  puedeDarDescuentos,
  conDeuda,
  calificadas,
  conNotas,
  historico,
}) {
  const anio = matricula?.anios_escolares?.anio;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Encabezado estudiante={estudiante} matricula={matricula} conDeuda={conDeuda} />
      <DatosEstudiante estudiante={estudiante} matricula={matricula} />
      <Apoderados apoderados={apoderados} />
      {matricula && (
        <Seccion titulo={`Descuentos ${anio ?? ""}`}>
          <DescuentosEstudiante matriculaId={matricula.id} descuentos={descuentos} puedeEditar={puedeDarDescuentos} />
        </Seccion>
      )}
      <Cuotas cuotas={cuotas} anio={anio} />
      <Notas calificadas={calificadas} informe={conNotas ? enlaceInforme(estudiante.id, matricula.id) : null} />
      <Historico historico={historico} estudianteId={estudiante.id} primerAnio={matricula ? (anio ?? "este año") : null} />
    </div>
  );
}
