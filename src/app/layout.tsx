import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Cuchara",
  description: "Sistema de gestión para restaurante La Cuchara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
