import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WppAgent — IA que atende pacientes 24/7",
  description:
    "Plataforma de agentes IA para atendimento de pacientes via WhatsApp. Agende, confirme e gerencie consultas automaticamente.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
