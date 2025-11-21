import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Winefy - Trazabilidad Verificable de Vinos en Blockchain",
  description: "Plataforma de trazabilidad blockchain para vinos premium. Certifica lotes, registra eventos y verifica autenticidad con Wine Traceability Tokens (WTT) en Stellar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
