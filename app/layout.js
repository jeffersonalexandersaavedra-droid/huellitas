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
  title: "I.E.P. Huellitas",
  description:
    "I.E.P. Huellitas — Educando con Calidad y Calidez. Inicial y Primaria en Tocache, San Martín.",
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
