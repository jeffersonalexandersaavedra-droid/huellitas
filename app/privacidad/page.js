import Link from "next/link";
import PaginaLegal, { SeccionLegal } from "@/components/PaginaLegal";
import { COLEGIO } from "@/lib/colegio";

export const metadata = { title: "Política de privacidad" };

// Información que exige el art. 18 de la Ley 29733 (Protección de Datos
// Personales) y su reglamento (D.S. 016-2024-JUS).
export default function PrivacidadPage() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      subtitulo={`Última actualización: ${COLEGIO.textosLegalesActualizados}`}
    >
      <div className="rounded-xl bg-white p-5 shadow-sm sm:p-8">
        <SeccionLegal titulo="1. Quién es responsable de tus datos">
          <p>
            {COLEGIO.nombre} (RUC {COLEGIO.ruc}), con domicilio en {COLEGIO.direccion}, es el titular de
            los bancos de datos personales de este sistema y responsable de su tratamiento. Contacto:{" "}
            <a href={`mailto:${COLEGIO.correo}`} className="text-huellitas-primary underline">
              {COLEGIO.correo}
            </a>
            .
          </p>
          {COLEGIO.registroAnpd && (
            <p>
              Bancos de datos inscritos en el Registro Nacional de Protección de Datos Personales con el
              código {COLEGIO.registroAnpd}.
            </p>
          )}
        </SeccionLegal>

        <SeccionLegal titulo="2. Qué datos tratamos">
          <ul>
            <li>
              <b>Estudiantes:</b> nombres, DNI, fecha de nacimiento, foto de perfil, aula, notas,
              observaciones de los docentes, asistencia e incidencias de tutoría.
            </li>
            <li>
              <b>Padres y apoderados:</b> nombres, DNI, parentesco, teléfono, correo y domicilio.
            </li>
            <li>
              <b>Pagos:</b> pensiones, montos, método de pago, número de operación, vouchers y datos del
              titular de cada comprobante (DNI o RUC).
            </li>
            <li>
              <b>Docentes y personal:</b> nombres, DNI, correo, foto, especialidad y presentación.
            </li>
            <li>
              <b>Libro de Reclamaciones:</b> los datos que se registran en cada hoja.
            </li>
          </ul>
        </SeccionLegal>

        <SeccionLegal titulo="3. Para qué los usamos">
          <ul>
            <li>Prestar el servicio educativo: matrícula, notas, asistencia, boletas y comunicación con las familias.</li>
            <li>Gestionar pensiones y pagos, y emitir comprobantes de pago electrónicos ante SUNAT.</li>
            <li>Cumplir obligaciones legales (Minedu, SUNAT, INDECOPI y demás autoridades).</li>
            <li>Atender reclamos y quejas, y proteger la seguridad del sistema (registro de accesos y cambios).</li>
          </ul>
          <p>
            La base del tratamiento es el contrato de prestación de servicios educativos y el cumplimiento
            de obligaciones legales. Los datos de menores de 14 años se tratan con el consentimiento de sus
            padres o tutores. No vendemos ni usamos tus datos con fines publicitarios.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="4. Con quién los compartimos">
          <p>
            Solo con las autoridades que la ley indica (por ejemplo, SUNAT para los comprobantes o el
            Minedu) y con proveedores tecnológicos que actúan como encargados del tratamiento bajo
            obligación de confidencialidad: alojamiento web y base de datos (servidores que pueden estar
            fuera del Perú, con lo que se realiza un flujo transfronterizo de datos), facturación
            electrónica, consulta de DNI/RUC y envío de correos.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="5. Cuánto tiempo los conservamos">
          <p>
            Mientras dure la relación educativa y, después, durante los plazos que exigen las normas: los
            registros académicos según las disposiciones del Minedu; la información tributaria durante el
            plazo de prescripción (al menos cinco años); las hojas de reclamación y el registro de
            auditoría, al menos dos años.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="6. Cómo los protegemos">
          <p>
            Cada persona entra con su propia cuenta y solo ve lo que su rol permite; la conexión es cifrada
            (HTTPS); los vouchers y comprobantes se guardan en depósitos privados y se abren con enlaces
            temporales, y se registra quién crea, cambia o borra información sensible.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="7. Tus derechos">
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (ARCO) escribiendo
            a {COLEGIO.correo} o en la dirección del colegio, adjuntando copia de tu DNI. Si eres padre o
            tutor, puedes hacerlo por tu hijo o hija menor de edad. Si no estás conforme con la respuesta,
            puedes acudir a la Autoridad Nacional de Protección de Datos Personales del Ministerio de
            Justicia y Derechos Humanos.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="8. Cookies">
          <p>
            El sistema usa solo las cookies necesarias para mantener tu sesión iniciada. No usamos cookies
            de publicidad ni de seguimiento.
          </p>
        </SeccionLegal>

        <SeccionLegal titulo="9. Cambios">
          <p>
            Si cambiamos esta política, publicaremos la nueva versión en esta página. Consulta también los{" "}
            <Link href="/terminos" className="text-huellitas-primary underline">
              términos de uso
            </Link>
            .
          </p>
        </SeccionLegal>
      </div>
    </PaginaLegal>
  );
}
