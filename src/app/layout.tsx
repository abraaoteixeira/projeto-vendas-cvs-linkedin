import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TalentHub — Reconstrua Seu Perfil do LinkedIn com IA",
  description: "Faça upload do seu currículo e nossa IA reconstrói seu perfil do LinkedIn em minutos. Título magnético, resumo que converte e experiências que impressionam recrutadores.",
  keywords: "LinkedIn, perfil, otimização, IA, currículo, recrutadores, carreira, TalentHub",
  openGraph: {
    title: "TalentHub — Reconstrua Seu Perfil do LinkedIn com IA",
    description: "Seu LinkedIn está te tornando invisível. Em 3 minutos, vamos mudar isso.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
