"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, Star, Upload, Eye, CreditCard } from "lucide-react";

const testimonials = [
  { text: "Recebi 3 entrevistas na primeira semana.", name: "Rafael M.", role: "Analista de Dados" },
  { text: "Finalmente entendi o que estava errado no meu perfil.", name: "Camila R.", role: "Gerente de Marketing" },
  { text: "Parecia que o meu perfil tinha sido escrito por um recrutador sênior.", name: "Lucas T.", role: "Dev Sênior" },
];

const steps = [
  { icon: Upload, label: "Faça upload do CV", desc: "PDF ou Word, qualquer formato" },
  { icon: Sparkles, label: "IA reconstrói tudo", desc: "Título, resumo e experiências" },
  { icon: Eye, label: "Veja o resultado", desc: "Antes de pagar qualquer coisa" },
  { icon: CreditCard, label: "Destrave e publique", desc: "Por apenas R$ 39,90" },
];

export default function LandingPage() {
  const router = useRouter();

  const handleCtaClick = (e: React.MouseEvent) => {
    const activeCvId = sessionStorage.getItem("activeCvId");
    if (activeCvId) {
      e.preventDefault();
      router.push(`/mockup?cvId=${activeCvId}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-cta flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">TalentHub</span>
        </div>
        <Link
          href="/upload"
          id="nav-cta"
          className="px-4 py-2 text-sm font-semibold gradient-cta text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Começar grátis →
        </Link>
      </nav>

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20 relative text-center">
        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-blue-300 font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Tecnologia de IA para sua carreira
          </div>

          {/* Headline */}
          <h1 data-testid="headline" className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            Seu Perfil no LinkedIn está te{" "}
            <span className="gradient-text">tornando invisível.</span>
            <br />
            Em 3 minutos, vamos{" "}
            <span className="gradient-text">mudar isso.</span>
          </h1>

          {/* Subheadline */}
          <p data-testid="subheadline" className="text-xl md:text-2xl text-white/60 mb-10 leading-relaxed max-w-2xl">
            Faça o upload do seu currículo. Nossa IA analisa o que os recrutadores{" "}
            <em>realmente</em> procuram e reconstrói seu perfil do zero.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <Link
              href="/upload"
              id="hero-cta-primary"
              data-testid="cta-button"
              onClick={handleCtaClick}
              className="group flex items-center gap-3 px-8 py-4 gradient-cta text-white font-bold text-lg rounded-xl glow-blue hover:scale-[1.02] transition-all duration-200"
            >
              <Upload className="w-5 h-5" />
              Reconstruir meu perfil agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="text-sm text-white/30">
            Sem cadastro. Sem cartão de crédito. Só resultado.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">Como funciona</h2>
          <p className="text-white/50 text-center mb-12">Simples, rápido e sem burocracia.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="glass rounded-2xl p-6 flex flex-col items-center text-center hover:border-white/20 transition-colors">
                <div className="w-12 h-12 gradient-cta rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-bold text-blue-400 mb-1">PASSO {i + 1}</div>
                <h3 className="font-semibold text-white mb-1">{step.label}</h3>
                <p className="text-sm text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="py-20 px-4 bg-white/2">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">O que você vai receber</h2>
          <div className="space-y-4 text-left">
            {[
              "Título do LinkedIn otimizado com as palavras-chave que recrutadores buscam",
              "Seção \"Sobre\" reescrita com storytelling persuasivo",
              "Suas 3 experiências mais relevantes transformadas em conquistas mensuráveis",
              "Veja o perfil final antes de pagar qualquer coisa",
              "3 títulos alternativos gerados pela IA para testar A/B no seu perfil",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 glass rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">O que dizem nossos usuários</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:border-white/20 transition-colors">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center glass rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para parar de ser invisível?
          </h2>
          <p className="text-white/60 mb-8">
            Milhares de profissionais já transformaram sua presença no LinkedIn. Agora é a sua vez.
          </p>
          <Link
            href="/upload"
            id="bottom-cta"
            className="inline-flex items-center gap-3 px-8 py-4 gradient-cta text-white font-bold text-lg rounded-xl hover:scale-105 transition-all duration-200"
          >
            <Upload className="w-5 h-5" />
            Começar agora — É grátis para ver
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-white/30 mt-4">Sem cartão de crédito necessário para ver o resultado.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t border-white/5 text-center text-white/30 text-sm">
        <p>© 2024 LinkedUp. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
