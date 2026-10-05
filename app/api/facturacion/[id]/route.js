import { NextResponse } from "next/server";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { gestionarComprobante } from "@/lib/emision";

// body: { accion: "enviar" } reintenta o actualiza un comprobante pendiente;
// { accion: "anular", motivo, via: "nota" | "baja" } lo anula (solo admin).
export async function POST(request, { params }) {
  const body = await request.json().catch(() => null);
  const roles = body?.accion === "anular" ? ["admin"] : ["admin", "secretaria"];
  const usuario = await usuarioConRol(...roles);
  if (!usuario) return noAutorizado();

  const { id } = await params;
  const resultado = await gestionarComprobante(id, body ?? {}, usuario.id);
  if (resultado.error) return respuestaError(resultado.error);
  return NextResponse.json(resultado);
}
