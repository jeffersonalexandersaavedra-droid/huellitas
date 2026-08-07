import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "I.E.P. Huellitas · Educando con Calidad y Calidez",
    template: "%s | I.E.P. Huellitas",
  },
  description:
    "Institución Educativa Privada Huellitas — Inicial y Primaria en Tocache, San Martín. Más de 22 años formando estudiantes con calidad y calidez.",
  keywords: [
    "Huellitas",
    "colegio Tocache",
    "inicial primaria",
    "IEP Huellitas",
    "San Martín Perú",
  ],
  authors: [{ name: "I.E.P. Huellitas" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "I.E.P. Huellitas · Educando con Calidad y Calidez",
    description:
      "Institución Educativa Privada de Inicial y Primaria en Tocache, San Martín.",
    images: ["/logos/huellitas-banner.png"],
    locale: "es_PE",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-huellitas-cream text-huellitas-ink">
        {children}
      </body>
    </html>
  );
}
