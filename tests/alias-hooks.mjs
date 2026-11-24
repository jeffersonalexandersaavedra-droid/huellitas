// "@/lib/cuentas" → <raíz del proyecto>/lib/cuentas.js, como módulo ES.
const RAIZ = new URL("../", import.meta.url);

export async function resolve(especificador, contexto, siguiente) {
  if (!especificador.startsWith("@/")) return siguiente(especificador, contexto);
  const ruta = especificador.slice(2);
  return { url: new URL(ruta.endsWith(".js") ? ruta : `${ruta}.js`, RAIZ).href, format: "module", shortCircuit: true };
}
