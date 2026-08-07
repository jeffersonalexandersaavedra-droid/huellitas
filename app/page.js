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
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

const PROPUESTA = [
  {
    icon: Heart,
    title: "Educación en Valores",
    desc: "Formamos en respeto, empatía y convivencia.",
  },
  {
    icon: Brain,
    title: "Departamento de Psicología",
    desc: "Apoyo emocional e inteligencia emocional.",
  },
  {
    icon: Activity,
    title: "Actividades Deportivas",
    desc: "Formación física e integral a través del deporte.",
  },
  {
    icon: Music,
    title: "Talleres Artísticos",
    desc: "Música y danza para la expresión creativa.",
  },
  {
    icon: Wifi,
    title: "Aulas Conectadas",
    desc: "Tecnología al servicio del aprendizaje.",
  },
  {
    icon: Users,
    title: "Escuela para Padres",
    desc: "Charlas y talleres para la familia.",
  },
];

const DIRECTIVOS = [
  {
    inicial: "D",
    nombre: "Daysi Reátegui Peláez",
    cargo: "Promotora",
    telefono: "942 608 498",
    email: "daysireategui@gmail.com",
    whatsapp:
      "https://wa.me/51942608498?text=Hola%20Daysi%2C%20me%20comunico%20desde%20la%20web%20de%20Huellitas",
  },
  {
    inicial: "R",
    nombre: "Richter Henry Salas Rivera",
    cargo: "Administrador",
    telefono: "950 617 019",
    email: "richterhenrysalas@gmail.com",
    whatsapp:
      "https://wa.me/51950617019?text=Hola%20Richter%2C%20me%20comunico%20desde%20la%20web%20de%20Huellitas",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      {/* SECCIÓN 1: HERO + NIVELES */}
      <section id="inicio" className="relative">
        <div className="relative overflow-hidden">
          <Image
            src="/logos/huellitas-banner.png"
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-huellitas-primary/85" />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center md:py-32">
            <Image
              src="/logos/huellitas-escudo.png"
              alt="Escudo de I.E.P. Huellitas"
              width={99}
              height={120}
              priority
              className="h-24 w-auto"
            />

            <h1 className="mt-6 max-w-3xl text-balance font-display text-5xl font-semibold text-white md:text-6xl">
              Educando con Calidad y{" "}
              <span className="text-huellitas-accent">Calidez</span>
            </h1>

            <p className="mt-4 text-base text-white/90">
              I.E.P. Huellitas · Inicial y Primaria en Tocache, San Martín
            </p>

            <a
              href="#nosotros"
              className="mt-8 rounded-lg bg-huellitas-accent px-6 py-3 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-accent-dark"
            >
              Conoce más
            </a>

            <p className="mt-8 text-xs text-white/70">
              Más de 22 años formando estudiantes
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-6 pb-16">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-huellitas-primary-light text-huellitas-accent">
                <Baby className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold text-huellitas-primary">
                Inicial
              </h3>
              <p className="mt-3 text-huellitas-ink/70">
                Estímulos para el desarrollo psicomotriz, intelectual y
                emocional en un ambiente seguro y afectivo.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full bg-huellitas-accent px-3 py-1 text-xs font-semibold text-huellitas-ink">
                3, 4 y 5 años
              </span>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-huellitas-primary-light text-huellitas-accent">
                <BookOpen className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold text-huellitas-primary">
                Primaria
              </h3>
              <p className="mt-3 text-huellitas-ink/70">
                Alto nivel académico con formación en libertad, liderazgo,
                pensamiento crítico y valores.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full bg-huellitas-accent px-3 py-1 text-xs font-semibold text-huellitas-ink">
                1° a 6° grado
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: NOSOTROS + PROPUESTA */}
      <section id="nosotros" className="bg-huellitas-cream px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-display text-4xl font-semibold text-huellitas-ink">
              Nosotros
            </h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-huellitas-accent" />
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              <p className="text-huellitas-ink/70">
                La I.E.P. Huellitas es una institución educativa privada
                ubicada en la provincia de Tocache, San Martín. Con más de
                dos décadas de trayectoria, nos hemos consolidado como
                referente educativo en la región.
              </p>
              <p className="text-huellitas-ink/70">
                Brindamos educación de calidad en los niveles de Inicial y
                Primaria, formando estudiantes íntegros, con valores
                sólidos, capacidad crítica y preparados para los desafíos
                del futuro.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border-2 border-huellitas-accent bg-huellitas-primary-light/40 p-8 text-center">
              <div>
                <p className="font-display text-4xl font-semibold text-huellitas-primary">
                  22+
                </p>
                <p className="mt-1 text-sm text-huellitas-ink/60">
                  años de trayectoria
                </p>
              </div>
              <div>
                <p className="font-display text-4xl font-semibold text-huellitas-primary">
                  170+
                </p>
                <p className="mt-1 text-sm text-huellitas-ink/60">
                  estudiantes matriculados
                </p>
              </div>
              <div>
                <p className="font-display text-4xl font-semibold text-huellitas-primary">
                  2
                </p>
                <p className="mt-1 text-sm text-huellitas-ink/60">
                  niveles educativos
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h3 className="font-display text-3xl font-semibold text-huellitas-ink">
              Nuestra Propuesta Educativa
            </h3>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-huellitas-accent" />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROPUESTA.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-huellitas-primary-light text-huellitas-accent">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h4 className="mt-3 font-display text-lg font-semibold text-huellitas-primary">
                  {title}
                </h4>
                <p className="mt-1 text-sm text-stone-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: CONTACTO */}
      <section id="contacto" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-display text-4xl font-semibold text-huellitas-ink">
              Contáctanos
            </h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-huellitas-accent" />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-huellitas-ink/70">
            Estamos para atenderte. Escríbenos directamente por WhatsApp
            para consultas sobre matrículas, pensiones o el proceso
            académico.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-stone-200 p-5">
              <MapPin className="h-6 w-6 text-huellitas-accent" strokeWidth={2} />
              <h4 className="mt-3 font-semibold text-huellitas-primary">
                Ubicación
              </h4>
              <p className="mt-1 text-sm text-stone-600">
                Tocache, San Martín, Perú
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 p-5">
              <Clock className="h-6 w-6 text-huellitas-accent" strokeWidth={2} />
              <h4 className="mt-3 font-semibold text-huellitas-primary">
                Horario
              </h4>
              <p className="mt-1 text-sm text-stone-600">
                Lun a Vie · Hasta 18:00
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 p-5">
              <Link2 className="h-6 w-6 text-huellitas-accent" strokeWidth={2} />
              <h4 className="mt-3 font-semibold text-huellitas-primary">
                Facebook
              </h4>
              <a
                href="https://www.facebook.com/iephuellitastocache"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-huellitas-primary hover:underline"
              >
                @iephuellitastocache
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {DIRECTIVOS.map((d) => (
              <div
                key={d.nombre}
                className="rounded-xl border-t-4 border-huellitas-accent bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-huellitas-primary font-display text-xl font-semibold text-huellitas-accent">
                    {d.inicial}
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-huellitas-primary">
                      {d.nombre}
                    </p>
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
                  href={d.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-huellitas-primary py-3 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                  Escribir por WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-huellitas-primary-dark px-6 py-16 text-huellitas-cream">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/logos/huellitas-escudo-sin-fondo.png"
                alt=""
                width={32}
                height={39}
              />
              <p className="font-display text-xl font-semibold text-white">
                Huellitas<span className="text-huellitas-accent">.</span>
              </p>
            </div>
            <p className="mt-2 text-sm italic text-huellitas-cream/70">
              Educando con Calidad y Calidez
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-white">Enlaces rápidos</p>
            <ul className="mt-3 space-y-2 text-sm text-huellitas-cream/70">
              <li>
                <a href="#inicio" className="hover:text-white">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#nosotros" className="hover:text-white">
                  Nosotros
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-white">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-white">
              Sistema de gestión escolar
            </p>
            <Link
              href="/login"
              className="mt-3 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-cream"
            >
              Ingresar al sistema
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-huellitas-cream/50">
          © 2026 I.E.P. Huellitas · Tocache, San Martín · Todos los derechos
          reservados
        </div>
      </footer>
    </div>
  );
}
