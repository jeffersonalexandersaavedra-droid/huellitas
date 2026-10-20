import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Quién está conectado, para mostrar páginas. getClaims() verifica el token
// en el propio servidor (sin ir a Supabase cuando el proyecto firma con
// claves asimétricas; si no, consulta como getUser). cache() comparte cada
// resultado entre el layout y la página de una misma visita, así no se
// pregunta dos veces. Las rutas /api que cambian datos usan auth.getUser().
export const usuarioSesion = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;
  return {
    id: claims.sub,
    email: claims.email ?? "",
    app_metadata: claims.app_metadata ?? {},
    user_metadata: claims.user_metadata ?? {},
  };
});

// Ficha del docente conectado.
export const docenteActual = cache(async () => {
  const [usuario, supabase] = await Promise.all([usuarioSesion(), createClient()]);
  if (!usuario) return null;
  const { data } = await supabase
    .from("docentes")
    .select("id, user_id, nombres, apellidos, especialidad, bio, foto_url")
    .eq("user_id", usuario.id)
    .maybeSingle();
  return data;
});

// Estudiante dueño de la sesión (portal del padre).
export const estudianteActual = cache(async () => {
  const [usuario, supabase] = await Promise.all([usuarioSesion(), createClient()]);
  if (!usuario) return null;
  const { data } = await supabase
    .from("estudiantes")
    .select("id, dni, nombres, apellidos, password_cambiado, foto_url")
    .eq("user_id", usuario.id)
    .maybeSingle();
  return data;
});

// Su matrícula activa más reciente.
export const matriculaActual = cache(async () => {
  const [estudiante, supabase] = await Promise.all([estudianteActual(), createClient()]);
  if (!estudiante) return null;
  const { data } = await supabase
    .from("matriculas")
    .select("id, aulas(nombre, nivel, lista_utiles_url), anios_escolares(anio)")
    .eq("estudiante_id", estudiante.id)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
});
