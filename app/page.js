import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Baby,
  GraduationCap,
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
    desc: "Formamos en civismo, respeto, empatía y convivencia.",
  },
  {
    icon: Brain,
    title: "Departamento de Psicología",
    desc: "Apoyo emocional y desarrollo de la inteligencia emocional.",
  },
  {
    icon: Activity,
    title: "Actividades Deportivas",
    desc: "Formación física, intelectual y social a través del deporte.",
  },
  {
    icon: Music,
    title: "Talleres Artísticos",
    desc: "Música y danza para desarrollar la creatividad y expresión.",
  },
  {
    icon: Wifi,
    title: "Aulas Conectadas",
    desc: "Tecnología al servicio del aprendizaje en cada aula.",
  },
  {
    icon: Users,
    title: "Escuela para Padres",
    desc: "Charlas y talleres para acompañar el proceso educativo en familia.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      {/* HERO */}
      <section
        id="inicio"
        className="relative overflow-hidden bg-gradient-to-b from-huellitas-cream to-white px-6 py-20 md:py-32"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-huellitas-primary/10" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-huellitas-primary/10" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
          <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold tracking-tight text-huellitas-ink sm:text-5xl">
            Educando con Calidad y{" "}
            <span className="text-huellitas-magenta">Calidez</span>
          </h1>
          <p className="mt-4 text-base text-huellitas-ink/70">
            I.E.P. Huellitas · Inicial y Primaria en Tocache
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#propuesta"
              className="rounded-lg bg-huellitas-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark"
            >
              Conoce nuestra propuesta
            </a>
            <a
              href="#contacto"
              className="rounded-lg border border-huellitas-primary px-6 py-3 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light"
            >
              Contáctanos
            </a>
          </div>

          <p className="mt-10 text-xs text-huellitas-ink/50">
            22 años formando estudiantes con amor y compromiso
          </p>
        </div>
      </section>

      {/* NOSOTROS */}
      <section id="nosotros" className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold text-huellitas-ink">
              Nosotros
            </h2>
            <p className="mt-4 text-huellitas-ink/70">
              La I.E.P. Huellitas es una institución educativa privada
              ubicada en la provincia de Tocache, San Martín.
            </p>
            <p className="mt-4 text-huellitas-ink/70">
              Con más de dos décadas de trayectoria, nos hemos consolidado
              como referente educativo en la región, brindando educación de
              calidad en los niveles de Inicial y Primaria.
            </p>
            <p className="mt-4 text-huellitas-ink/70">
              Nuestra propuesta se basa en formar estudiantes íntegros, con
              valores sólidos, capacidad crítica y preparados para los
              desafíos del futuro.
            </p>
          </div>

          <div className="rounded-2xl bg-huellitas-primary-light p-10 text-center">
            <p className="font-display text-5xl font-semibold text-huellitas-primary">
              22 años
            </p>
            <p className="mt-2 text-sm font-medium text-huellitas-accent-dark">
              de trayectoria
            </p>
            <p className="mt-6 text-sm text-huellitas-ink/70">
              +170 estudiantes · Inicial y Primaria
            </p>
          </div>
        </div>
      </section>

      {/* NIVELES */}
      <section id="niveles" className="bg-huellitas-cream px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-semibold text-huellitas-ink">
            Nuestros Niveles
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <Baby
                className="h-10 w-10 text-huellitas-primary"
                strokeWidth={1.5}
              />
              <h3 className="mt-4 font-display text-2xl font-semibold text-huellitas-primary">
                Inicial
              </h3>
              <p className="mt-3 text-huellitas-ink/70">
                Brindamos a nuestros niños los estímulos necesarios para su
                desarrollo psicomotriz, intelectual y emocional en un
                ambiente seguro y afectivo.
              </p>
              <p className="mt-4 text-sm font-medium text-huellitas-accent-dark">
                3, 4 y 5 años
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <GraduationCap
                className="h-10 w-10 text-huellitas-primary"
                strokeWidth={1.5}
              />
              <h3 className="mt-4 font-display text-2xl font-semibold text-huellitas-primary">
                Primaria
              </h3>
              <p className="mt-3 text-huellitas-ink/70">
                Alto nivel académico, formación en libertad y
                responsabilidad. Fomentamos el liderazgo, el pensamiento
                crítico y los valores desde temprana edad.
              </p>
              <p className="mt-4 text-sm font-medium text-huellitas-accent-dark">
                1° a 6° grado
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROPUESTA */}
      <section id="propuesta" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-semibold text-huellitas-ink">
            Nuestra Propuesta Educativa
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROPUESTA.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-stone-200 p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-huellitas-primary-light text-huellitas-accent">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="mt-4 font-medium text-huellitas-primary">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-stone-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="bg-huellitas-cream px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-semibold text-huellitas-ink">
            Contáctanos
          </h2>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0 text-huellitas-primary"
                  strokeWidth={2}
                />
                <span className="text-huellitas-ink/80">
                  Tocache, San Martín, Perú
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone
                  className="mt-0.5 h-5 w-5 shrink-0 text-huellitas-primary"
                  strokeWidth={2}
                />
                <span className="text-huellitas-ink/80">
                  +51 950 617 019
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock
                  className="mt-0.5 h-5 w-5 shrink-0 text-huellitas-primary"
                  strokeWidth={2}
                />
                <span className="text-huellitas-ink/80">
                  Lunes a Viernes · Hasta las 18:00
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-huellitas-primary"
                  strokeWidth={2}
                />
                <span className="text-huellitas-ink/80">
                  @iephuellitastocache
                </span>
              </li>
            </ul>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="font-display text-xl font-semibold text-huellitas-ink">
                ¿Interesado en matricular a tu hijo?
              </h3>
              <p className="mt-3 text-sm text-huellitas-ink/70">
                Comunícate con nosotros para conocer el proceso de admisión
                y nuestras vacantes disponibles.
              </p>
              <a
                href="https://facebook.com/iephuellitastocache"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center rounded-lg bg-huellitas-accent px-5 py-2.5 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
              >
                Escríbenos por Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-huellitas-primary-dark px-6 py-16 text-huellitas-cream">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-xl font-semibold text-white">
              Huellitas<span className="text-huellitas-accent">.</span>
            </p>
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
                <a href="#niveles" className="hover:text-white">
                  Niveles
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
