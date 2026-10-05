import Link from "next/link";
import PaginaLegal, { SeccionLegal } from "@/components/PaginaLegal";
import { COLEGIO } from "@/lib/colegio";

export const metadata = { title: "Términos de uso" };

export default function TerminosPage() {
  return (
    <PaginaLegal titulo="Términos de uso" subtitulo={`Última actualización: ${COLEGIO.textosLegalesActualizados}`}>
      <div className="rounded-xl bg-white p-5 shadow-sm sm:p-8">
        <SeccionLegal titulo="1. Qué es este sistema">
          <p>
            Es la plataforma de gestión escolar de {COLEGIO.nombre}, para que las familias consulten notas,
            asistencia, pensiones y comprobantes, y para que docentes y personal administren la información
            académica y de pagos.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="2. Tu cuenta">
          <ul>
            <li>El colegio entrega la cuenta y una contraseña temporal, que debes cambiar por una personal.</li>
            <li>La cuenta es personal: no compartas tu contraseña. Eres responsable de lo que se haga con ella.</li>
            <li>Si sospechas un uso indebido, avisa de inmediato a administración para bloquearla.</li>
          </ul>
        </SeccionLegal>

        <SeccionLegal titulo="3. Información académica">
          <p>
            Las notas del portal y la boleta preventiva provienen del registro auxiliar del docente y son
            referenciales. El documento oficial es el informe de progreso del SIAGIE, que entrega la
            dirección del colegio. El acceso a las notas y a la evaluación no depende de estar al día en
            los pagos.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="4. Pagos y comprobantes">
          <ul>
            <li>Paga solo en las cuentas oficiales que muestra el portal.</li>
            <li>
              Un pago con voucher queda registrado cuando el colegio lo valida; los recibidos después de las
              7:00 p. m. se procesan al día siguiente.
            </li>
            <li>Los comprobantes de pago emitidos quedan disponibles para descargar en el portal.</li>
          </ul>
        </SeccionLegal>

        <SeccionLegal titulo="5. Uso correcto">
          <p>
            No está permitido intentar acceder a información de otras personas, registrar datos o vouchers
            falsos, ni afectar el funcionamiento del sistema. El colegio puede suspender las cuentas que lo
            hagan.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="6. Disponibilidad">
          <p>
            Procuramos que el sistema esté disponible todo el tiempo, pero puede haber interrupciones por
            mantenimiento o fallas de los proveedores. Ante cualquier problema, acércate a administración.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="7. Datos personales, reclamos y cambios">
          <p>
            El tratamiento de tus datos se rige por la{" "}
            <Link href="/privacidad" className="text-huellitas-primary underline">
              política de privacidad
            </Link>
            . Para reclamos o quejas tienes el{" "}
            <Link href="/libro-de-reclamaciones" className="text-huellitas-primary underline">
              Libro de Reclamaciones
            </Link>
            . Estos términos se rigen por las leyes del Perú y pueden actualizarse; la versión vigente es la
            publicada en esta página.
          </p>
        </SeccionLegal>
      </div>
    </PaginaLegal>
  );
}
