import { test } from "node:test";
import assert from "node:assert/strict";
import { puedeVerRuta, rutaInicio } from "@/lib/roles";

test("cada rol entra a su portal", () => {
  assert.equal(rutaInicio("admin"), "/admin/dashboard");
  assert.equal(rutaInicio("secretaria"), "/admin/dashboard");
  assert.equal(rutaInicio("docente"), "/docente");
  assert.equal(rutaInicio("estudiante"), "/padre");
  assert.equal(rutaInicio("desconocido"), null);
});

test("la secretaria solo abre sus secciones del panel", () => {
  assert.equal(puedeVerRuta("secretaria", "/admin/pagos"), true);
  assert.equal(puedeVerRuta("secretaria", "/admin/ayuda"), true);
  assert.equal(puedeVerRuta("secretaria", "/admin/configuracion"), false);
  assert.equal(puedeVerRuta("secretaria", "/admin/notas"), false);
});

test("nadie entra al portal de otro rol", () => {
  assert.equal(puedeVerRuta("estudiante", "/admin/dashboard"), false);
  assert.equal(puedeVerRuta("docente", "/padre"), false);
  assert.equal(puedeVerRuta("estudiante", "/padre"), true);
});
