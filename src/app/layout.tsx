import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datos del Expositor | ExpoRed 2027",
  description: "Completá los datos de tu empresa para continuar con la gestión de tu participación en ExpoRed 2027.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#03326C", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
