import { NextResponse } from "next/server";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";

// Autocompleta el nombre (DNI, RENIEC) o la razón social y dirección (RUC,
// SUNAT) del cliente. Usa el servicio Decolecta si DECOLECTA_TOKEN está
// configurado (100 consultas gratis al mes). ?tipo=dni|ruc&numero=...
const SERVICIOS = {
  dni: { ruta: "reniec/dni", patron: /^\d{8}$/ },
  ruc: { ruta: "sunat/ruc", patron: /^\d{11}$/ },
};

export async function GET(request) {
  if (!(await usuarioConRol("admin", "secretaria"))) return noAutorizado();
  if (!process.env.DECOLECTA_TOKEN) return respuestaError("La consulta de documentos no está configurada.", 501);

  const { searchParams } = new URL(request.url);
  const servicio = SERVICIOS[searchParams.get("tipo")];
  const numero = searchParams.get("numero") ?? "";
  if (!servicio || !servicio.patron.test(numero)) return respuestaError("Número de documento inválido.");

  try {
    const res = await fetch(`https://api.decolecta.com/v1/${servicio.ruta}?numero=${numero}`, {
      headers: { Authorization: `Bearer ${process.env.DECOLECTA_TOKEN}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const d = await res.json().catch(() => null);
    if (!res.ok || !d) return respuestaError("No se encontró el documento.", 404);

    if (searchParams.get("tipo") === "dni") {
      return NextResponse.json({
        nombre: [d.first_name, d.first_last_name, d.second_last_name].filter(Boolean).join(" "),
      });
    }
    const direccion = [d.direccion, d.distrito, d.provincia, d.departamento]
      .filter((parte) => parte && parte !== "-")
      .join(", ");
    return NextResponse.json({
      nombre: d.razon_social,
      direccion,
      aviso: d.estado !== "ACTIVO" || d.condicion !== "HABIDO" ? `RUC ${d.estado} / ${d.condicion}` : null,
    });
  } catch {
    return respuestaError("El servicio de consulta no respondió.", 504);
  }
}
