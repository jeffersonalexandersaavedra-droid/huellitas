// Llamadas del navegador a las rutas del servidor (/api/...).
//
// Devuelve el JSON de la respuesta. Si el servidor respondió con un error
// (4xx/5xx) o no hubo conexión devuelve { error } con un mensaje listo para
// mostrar: así ninguna pantalla toma un error del servidor como un éxito.
// cuerpo: objeto que se envía como JSON · formulario: FormData (archivos).
export async function pedir(url, { metodo = "GET", cuerpo, formulario } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method: metodo,
      ...(formulario
        ? { body: formulario }
        : cuerpo !== undefined && {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cuerpo),
          }),
    });
  } catch {
    return { error: "No se pudo conectar con el servidor. Revisa tu internet e inténtalo de nuevo." };
  }

  if (!res.ok) {
    const fallo = await res.json().catch(() => null);
    return { error: fallo?.error || `El servidor respondió con un error (${res.status}). Inténtalo de nuevo.` };
  }
  return (await res.json().catch(() => null)) ?? {};
}
