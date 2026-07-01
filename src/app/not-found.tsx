"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-dark text-white p-6 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-md mx-auto glass p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="w-16 h-16 gradient-cta rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
        
        <h1 data-testid="404-title" className="text-4xl font-extrabold mb-4 tracking-tight">
          Página Não Encontrada
        </h1>
        
        <p className="text-white/60 mb-8 leading-relaxed">
          O caminho que você tentou acessar não existe ou foi movido. Vamos voltar para o início e começar a reconstruir seu perfil?
        </p>

        <Link
          href="/"
          data-testid="404-back-link"
          className="inline-flex items-center gap-2 px-6 py-3 gradient-cta text-white font-semibold rounded-xl hover:scale-105 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Início
        </Link>
      </div>
    </main>
  );
}
