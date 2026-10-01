// Subida de archivos a Supabase Storage. Cada función devuelve la URL
// pública del archivo o lanza un Error con un mensaje para mostrar.

const MB = 1024 * 1024;

function extension(file) {
  return file.name.split(".").pop().toLowerCase();
}

// Foto de perfil en el bucket "perfiles", dentro de la carpeta del usuario.
export async function subirFotoPerfil(supabase, file) {
  if (!file?.type?.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");
  if (file.size > 3 * MB) throw new Error("La imagen supera los 3 MB.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");

  const path = `${user.id}/perfil-${Date.now()}.${extension(file)}`;
  const { error } = await supabase.storage.from("perfiles").upload(path, file, { upsert: true });
  if (error) throw new Error("No se pudo subir la foto.");

  return supabase.storage.from("perfiles").getPublicUrl(path).data.publicUrl;
}

// Documento (PDF, Word, imagen) en el bucket público "documentos".
export async function subirDocumento(supabase, carpeta, file) {
  if (!file) throw new Error("Elige un archivo.");
  if (file.size > 10 * MB) throw new Error("El archivo supera los 10 MB.");

  const path = `${carpeta}/${Date.now()}.${extension(file)}`;
  const { error } = await supabase.storage.from("documentos").upload(path, file);
  if (error) throw new Error(error.message || "No se pudo subir el archivo.");

  return supabase.storage.from("documentos").getPublicUrl(path).data.publicUrl;
}
