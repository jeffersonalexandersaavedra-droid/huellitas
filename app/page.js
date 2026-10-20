import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Link2,
  MessageCircle,
  Baby,
  BookOpen,
  Heart,
  Brain,
  Activity,
  Music,
  Wifi,
  Users,
  FileText,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import EnlacesLegales from "@/components/EnlacesLegales";
import { createClient } from "@/lib/supabase/server";
import { mergeSitio, waLink } from "@/lib/sitioDefaults";

const PROPUESTA_ICONS = [Heart, Brain, Activity, Music, Wifi, Users];

// Página pública del colegio. Los textos se editan en Panel › Página web.
export default async function Home() {
  const supabase = await createClient();

  const [{ data: config }, { data: documentos }] = await Promise.all([
    supabase.from("sitio_config").select("contenido").eq("id", "landing").maybeSingle(),
    supabase
      .from("documentos")
      .select("id, titulo, archivo_url")
      .eq("tipo", "transparencia")
      .eq("publicado", true)
      .order("created_at", { ascending: false }),
  ]);

  const c = mergeSitio(config?.contenido);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <Portada hero={c.hero} niveles={c.niveles} />
      <Nosotros nosotros={c.nosotros} stats={c.stats} propuesta={c.propuesta} />
      {documentos?.length > 0 && <Transparencia documentos={documentos} />}
      <Contacto contacto={c.contacto} directivos={c.directivos} />
      <Pie />
    </div>
  );
}

function Titulo({ children, nivel = "h2" }) {
  const Etiqueta = nivel;
  return (
    <div className="text-center">
      <Etiqueta
        className={`font-display font-semibold text-huellitas-ink ${nivel === "h2" ? "text-4xl" : "text-3xl"}`}
      >
        {children}
      </Etiqueta>
      <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-huellitas-accent" />
    </div>
  );
}

function Portada({ hero, niveles }) {
  const tarjetas = [
    { titulo: "Inicial", icono: Baby, texto: niveles.inicialDesc, etiqueta: niveles.inicialEdades },
    { titulo: "Primaria", icono: BookOpen, texto: niveles.primariaDesc, etiqueta: niveles.primariaGrados },
  ];

  return (
    <section id="inicio" className="relative">
      <div className="relative w-full overflow-hidden">
        <Image
          src="/logos/huellitas-banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[52.8%_25%]"
        />
        <div className="absolute inset-0 bg-huellitas-primary/85" />

        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-6 py-24 text-center md:py-32">
          <Image
            src="/logos/huellitas-escudo-sin-fondo.png"
            alt="Escudo de I.E.P. Huellitas"
            width={99}
            height={120}
            priority
            className="mx-auto h-24 w-auto md:h-32"
          />

          <h1 className="mt-6 max-w-3xl text-balance font-display text-5xl font-semibold text-white md:text-6xl">
            {hero.titulo} <span className="text-huellitas-accent">{hero.tituloAccent}</span>
          </h1>

          <p className="mt-4 text-base text-white/90">{hero.subtitulo}</p>

          <a
            href="#nosotros"
            className="mx-auto mt-8 rounded-lg bg-huellitas-accent px-6 py-3 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-accent-dark"
          >
            Conoce más
          </a>

          <p className="mt-8 text-xs text-white/70">{hero.aniosTexto}</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          {tarjetas.map(({ titulo, icono: Icono, texto, etiqueta }) => (
            <div key={titulo} className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-huellitas-primary-light text-huellitas-accent">
                <Icono className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold text-huellitas-primary">{titulo}</h3>
              <p className="mt-3 text-huellitas-ink/70">{texto}</p>
              <span className="mt-4 inline-flex items-center rounded-full bg-huellitas-accent px-3 py-1 text-xs font-semibold text-huellitas-ink">
                {etiqueta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Nosotros({ nosotros, stats, propuesta }) {
  return (
    <section id="nosotros" className="bg-huellitas-cream px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Titulo>Nosotros</Titulo>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <p className="text-huellitas-ink/70">{nosotros.parrafo1}</p>
            <p className="text-huellitas-ink/70">{nosotros.parrafo2}</p>
          </div>

          <div className="space-y-6 rounded-2xl border-2 border-huellitas-accent bg-huellitas-primary-light/40 p-8 text-center">
            {stats.map((s) => (
              <div key={`${s.valor}-${s.label}`}>
                <p className="font-display text-4xl font-semibold text-huellitas-primary">{s.valor}</p>
                <p className="mt-1 text-sm text-huellitas-ink/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <Titulo nivel="h3">Nuestra Propuesta Educativa</Titulo>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {propuesta.map((p, posicion) => {
            const Icon = PROPUESTA_ICONS[posicion] ?? Heart;
            return (
              <div key={p.titulo} className="rounded-xl bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-huellitas-primary-light text-huellitas-accent">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h4 className="mt-3 font-display text-lg font-semibold text-huellitas-primary">{p.titulo}</h4>
                <p className="mt-1 text-sm text-stone-500">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Solo aparece si hay documentos publicados.
function Transparencia({ documentos }) {
  return (
    <section id="transparencia" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Titulo>Documentos de transparencia</Titulo>
        <p className="mx-auto mt-6 max-w-2xl text-center text-huellitas-ink/70">
          Información pública sobre las condiciones de matrícula y pensiones.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {documentos.map((d) => (
            <a
              key={d.id}
              href={d.archivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-huellitas-accent"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-huellitas-primary-light text-huellitas-primary">
                <FileText className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-huellitas-ink">{d.titulo}</span>
                <span className="text-sm text-huellitas-primary">Descargar</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contacto({ contacto, directivos }) {
  const datos = [
    { titulo: "Ubicación", icono: MapPin, contenido: contacto.ubicacion },
    { titulo: "Horario", icono: Clock, contenido: contacto.horario },
    {
      titulo: "Facebook",
      icono: Link2,
      contenido: (
        <a
          href={contacto.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-huellitas-primary hover:underline"
        >
          {contacto.facebookLabel}
        </a>
      ),
    },
  ];

  return (
    <section id="contacto" className="bg-huellitas-cream px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Titulo>Contáctanos</Titulo>
        <p className="mx-auto mt-6 max-w-2xl text-center text-huellitas-ink/70">
          Estamos para atenderte. Escríbenos directamente por WhatsApp para consultas sobre matrículas,
          pensiones o el proceso académico.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {datos.map(({ titulo, icono: Icono, contenido }) => (
            <div key={titulo} className="rounded-xl border border-stone-200 p-5">
              <Icono className="h-6 w-6 text-huellitas-accent" strokeWidth={2} />
              <h4 className="mt-3 font-semibold text-huellitas-primary">{titulo}</h4>
              <div className="mt-1 text-sm text-stone-600">{contenido}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {directivos.map((d) => (
            <TarjetaDirectivo key={`${d.nombre}-${d.cargo}`} directivo={d} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TarjetaDirectivo({ directivo: d }) {
  return (
    <div className="rounded-xl border-t-4 border-huellitas-accent bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-huellitas-primary font-display text-xl font-semibold text-huellitas-accent">
          {d.inicial || (d.nombre?.[0] ?? "·")}
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-huellitas-primary">{d.nombre}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-huellitas-accent px-2.5 py-0.5 text-xs font-medium text-huellitas-primary-dark">
            {d.cargo}
          </span>
        </div>
      </div>

      <div className="my-4 border-t border-stone-100" />

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm text-huellitas-ink/80">
          <Phone className="h-4 w-4 text-huellitas-primary" strokeWidth={2} />
          {d.telefono}
        </p>
        <p className="flex items-center gap-2 text-sm text-huellitas-ink/80">
          <Mail className="h-4 w-4 text-huellitas-primary" strokeWidth={2} />
          {d.email}
        </p>
      </div>

      <a
        href={waLink(d.telefono, d.nombre?.split(" ")[0])}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-huellitas-primary py-3 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2} />
        Escribir por WhatsApp
      </a>
    </div>
  );
}

function Pie() {
  return (
    <footer className="bg-huellitas-primary-dark px-6 py-16 text-huellitas-cream">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/logos/huellitas-escudo-sin-fondo.png" alt="" width={32} height={39} />
            <p className="font-display text-xl font-semibold text-white">
              Huellitas<span className="text-huellitas-accent">.</span>
            </p>
          </div>
          <p className="mt-2 text-sm italic text-huellitas-cream/70">Educando con Calidad y Calidez</p>
        </div>

        <div>
          <p className="text-sm font-medium text-white">Enlaces rápidos</p>
          <ul className="mt-3 space-y-2 text-sm text-huellitas-cream/70">
            <li>
              <a href="#inicio" className="hover:text-white">Inicio</a>
            </li>
            <li>
              <a href="#nosotros" className="hover:text-white">Nosotros</a>
            </li>
            <li>
              <a href="#contacto" className="hover:text-white">Contacto</a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-white">Sistema de gestión escolar</p>
          <Link
            href="/login"
            className="mt-3 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-cream"
          >
            Ingresar al sistema
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-huellitas-cream/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} I.E.P. Huellitas · Tocache, San Martín · Todos los derechos reservados</p>
        <EnlacesLegales className="text-huellitas-cream/80" />
      </div>
    </footer>
  );
}
