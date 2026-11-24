// Permite que las pruebas (node --test) importen con el alias "@/" igual que
// la app (jsconfig.json). Se carga con: node --test --import ./tests/registrar-alias.mjs
import { register } from "node:module";

register("./alias-hooks.mjs", import.meta.url);
