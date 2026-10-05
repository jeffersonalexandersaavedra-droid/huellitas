import { NextResponse } from "next/server";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { emitirComprobante } from "@/lib/emision";

// Emitir un comprobante (boleta, factura o ticket) o registrar uno emitido
// fuera del sistema. FormData: datos (JSON, ver lib/emision.js) y archivo
// opcional (PDF del comprobante registrado a mano).
export async function POST(request) {
  const usuario = await usuarioConRol("admin", "secretaria");
  if (!usuario) return noAutorizado();

  const formulario = await request.formData().catch(() => null);
  let datos = null;
  try {
    datos = JSON.parse(formulario?.get("datos") ?? "null");
  } catch {
    datos = null;
  }
  if (!datos) return respuestaError("Datos incompletos.");

  const archivo = formulario.get("archivo");
  const resultado = await emitirComprobante(
    datos,
    archivo && archivo.size > 0 ? archivo : null,
    usuario.id
  );
  if (resultado.error) return respuestaError(resultado.error);
  return NextResponse.json(resultado);
}
