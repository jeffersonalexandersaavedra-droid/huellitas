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

`npm run lint` revisa el código y `npm run build` compila para producción (Vercel).

## Dónde está cada cosa

| Carpeta | Contenido |
| --- | --- |
| `app/admin` | Panel de administración y secretaría (cada rol ve solo sus secciones, ver `lib/roles.js`) |
| `app/docente` | Registro de notas por competencias, asistencia, incidencias y perfil |
| `app/padre` | Pensiones y pagos, notas, boleta preventiva y comprobantes |
| `app/api` | Rutas del servidor (cuentas, matrícula, contrato, facturación, reclamaciones) |
| `components` | Componentes de la interfaz |
| `lib` | Reglas y consultas compartidas (sin duplicar en las páginas) |
| `sql_huellitas.sql` | Registro del esquema de la base de datos y sus cambios |

## Notas y SIAGIE

Las notas se registran por competencia del Currículo Nacional (nivel de logro AD, A, B o C
y conclusión descriptiva), igual que el SIAGIE. Las competencias de cada área se editan en
**Configuración › Cursos**.

- **Registro auxiliar (Excel)**: misma estructura del registro de notas del SIAGIE.
- **Completar archivo del SIAGIE**: el docente elige el registro que descargó del SIAGIE y
  recibe el mismo archivo con las notas guardadas en el portal, listo para subirlo.
- **Boleta preventiva**: vista previa del Informe de progreso; el informe oficial con firma
  y sello se solicita en la institución.
