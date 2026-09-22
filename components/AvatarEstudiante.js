// Avatar del estudiante: muestra su foto si tiene, o sus iniciales sobre un
// círculo morado (predeterminado profesional, sin imagen, muy liviano).
function iniciales(nombre) {
  const partes = (nombre || "").trim().split(/\s+/);
  const ini = (partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "");
  return ini.toUpperCase() || "?";
}

export default function AvatarEstudiante({ nombre, fotoUrl, size = 48, className = "" }) {
  const estilo = { width: size, height: size };

  if (fotoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={fotoUrl}
        alt={nombre || "Foto de perfil"}
        style={estilo}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...estilo, fontSize: size * 0.4 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-huellitas-primary-light font-display font-semibold text-huellitas-primary ${className}`}
    >
      {iniciales(nombre)}
    </div>
  );
}
