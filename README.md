# I.E.P. Huellitas — sistema de gestión escolar

Portal de la I.E.P. Huellitas (Tocache, San Martín; Inicial y Primaria): página pública,
panel de administración y secretaría, portal del docente y portal del padre.

- **Next.js 16** (App Router, `proxy.js`) + **React 19** + **Tailwind CSS 4**
- **Supabase**: autenticación por rol (`app_metadata.role`: admin, secretaria, docente,
  estudiante), Postgres con RLS y Storage
- **ExcelJS** para los Excel, **docxtemplater** para el contrato

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y completa las claves (ver comentarios del archivo)
npm run dev                  # http://localhost:3000
```

`npm run lint` revisa el código, `npm test` corre las pruebas de las reglas de negocio
(pensiones, recordatorios, roles) y `npm run build` compila para producción (Vercel).

## Dónde está cada cosa

| Carpeta | Contenido |
| --- | --- |
| `app/admin` | Panel de administración y secretaría (cada rol ve solo sus secciones, ver `lib/roles.js`) |
| `app/docente` | Registro de notas por competencias, asistencia, comunicados, incidencias y perfil |
| `app/padre` | Avisos y agenda, pensiones y pagos, asistencia, notas, boleta preventiva y comprobantes |
| `app/api` | Rutas del servidor (cuentas, matrícula, contrato, facturación, reclamaciones) |
| `components` | Componentes de la interfaz |
| `lib` | Reglas y consultas compartidas (sin duplicar en las páginas) |
| `sql_huellitas.sql` | Registro del esquema de la base de datos y sus cambios |
| `tests` | Pruebas automáticas de las reglas de negocio (`npm test`) |

## Base de datos siempre activa

Supabase pausa los proyectos gratuitos tras 7 días sin uso. `vercel.json` programa un ping
diario (8 a. m. de Lima) a `/api/keep-alive`, que hace una consulta mínima. Solo responde si
la petición trae la clave `CRON_SECRET`: créala en Vercel (Settings › Environment Variables)
con un texto largo al azar; Vercel la envía sola en cada ping.

## Notas y SIAGIE

Las notas se registran por competencia del Currículo Nacional (nivel de logro AD, A, B o C
y conclusión descriptiva), igual que el SIAGIE. Las competencias de cada área se editan en
**Configuración › Cursos**.

- **Registro auxiliar (Excel)**: misma estructura del registro de notas del SIAGIE.
- **Completar archivo del SIAGIE**: el docente elige el registro que descargó del SIAGIE y
  recibe el mismo archivo con las notas guardadas en el portal, listo para subirlo.
- **Boleta preventiva**: vista previa del Informe de progreso; el informe oficial con firma
  y sello se solicita en la institución.

## Recordatorios de pago

- **Portal del padre**: aviso de pensiones atrasadas o por vencer (5 días antes), con el
  horario de secretaría que se edita en Menú principal.
- **Pagos › Recordatorios**: familias con deuda o pensión por vencer. El botón WhatsApp es
  gratis ("clic para chatear": abre WhatsApp con el mensaje escrito).
- **Envío automático** (`/api/recordatorios`, días 5 y 25 a las 9 a. m.): por correo (Resend)
  o WhatsApp Business (Meta), solo si esos servicios están configurados.

## Servicios opcionales (listos para activar)

El código ya está en el sistema; cada servicio se activa al crear la cuenta del proveedor,
poner sus claves en Vercel y volver a publicar. Su estado se ve en **Configuración ›
Servicios opcionales**.

| Servicio | Proveedor | Variables |
| --- | --- | --- |
| Boletas y facturas electrónicas automáticas | Nubefact | `NUBEFACT_RUTA`, `NUBEFACT_TOKEN` |
| Correos (recordatorios, reclamaciones) | Resend | `RESEND_API_KEY`, `RESEND_FROM` |
| WhatsApp automático | WhatsApp Business (Meta) | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_PLANTILLA` |
| Autocompletar por DNI/RUC | Decolecta | `DECOLECTA_TOKEN` |
| Contacto de soporte en Ayuda | — | `SOPORTE_NOMBRE`, `SOPORTE_WHATSAPP`, `SOPORTE_CORREO` |

Plantilla sugerida para WhatsApp Business (categoría "Utilidad"): *Hola {{1}}, le saluda la
I.E.P. Huellitas. Le recordamos que {{2}} tiene pendiente {{3}}. Puede pagar desde el portal
de padres o en secretaría. Si ya pagó, ignore este mensaje.*

## Ayuda y capacitación

**Ayuda** (menú del panel y del portal docente) reúne guías paso a paso de cada tarea y el
contacto de soporte técnico.
