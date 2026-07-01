"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, CheckCircle2, Star, ShieldCheck, Download } from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get("cvId") || "";

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!cvId) {
      router.push("/");
      return;
    }

    fetch(`/api/profile-rebuild?cvId=${cvId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfileData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setIsLoading(false);
      });
  }, [cvId, router]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates({ ...copiedStates, [id]: true });
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60 font-medium">Preparando seu perfil desbloqueado...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 relative bg-dark text-white">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-green-900/20 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-sm text-green-400 font-bold mb-6">
            <ShieldCheck className="w-4 h-4" />
            Pagamento Confirmado. Acesso Liberado.
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white leading-tight">
            {profileData?.nome ? `${profileData.nome}, seu` : "Seu"} Novo Perfil Está <span className="text-green-400">Pronto!</span>
          </h1>
          <p className="text-white/60 text-lg">
            Copie os textos abaixo e cole diretamente no seu LinkedIn para ativar a otimização.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Delivery Area */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Headline */}
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Título Estratégico
                </h2>
                <button
                  onClick={() => copyToClipboard(profileData?.novo_titulo_linkedin || "", "title")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                >
                  {copiedStates["title"] ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copiedStates["title"] ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <div className="bg-black/30 p-4 rounded-xl text-lg font-medium text-white/90 leading-snug">
                {profileData?.novo_titulo_linkedin}
              </div>
            </div>

            {/* About */}
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Resumo (Sobre)</h2>
                <button
                  onClick={() => copyToClipboard(profileData?.sobre_persuasivo || "", "about")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                >
                  {copiedStates["about"] ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copiedStates["about"] ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <div className="bg-black/30 p-4 rounded-xl text-base text-white/80 leading-relaxed whitespace-pre-wrap">
                {profileData?.sobre_persuasivo}
              </div>
            </div>

            {/* Experiences */}
            {profileData?.todas_experiencias && profileData.todas_experiencias.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-bold mb-4">Experiências Profissionais</h2>
                <div className="space-y-4">
                  {profileData.todas_experiencias.map((exp: any, idx: number) => (
                    <div key={idx} className="bg-black/30 p-4 rounded-xl flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-white text-lg">{exp.cargo || 'Cargo não informado'}</h3>
                          <p className="text-green-400 text-sm">{exp.empresa || 'Empresa não informada'} {exp.periodo ? `• ${exp.periodo}` : ''}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`Cargo: ${exp.cargo}\nEmpresa: ${exp.empresa}\nPeríodo: ${exp.periodo}\n\nDescrição:\n${exp.descricao}`, `exp-${idx}`)}
                          className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors"
                        >
                          {copiedStates[`exp-${idx}`] ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          {copiedStates[`exp-${idx}`] ? "Copiado!" : "Copiar Tudo"}
                        </button>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{exp.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formação Acadêmica */}
            {profileData?.formacao_academica && profileData.formacao_academica.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Formação Acadêmica</h2>
                  <button
                    onClick={() => copyToClipboard(profileData.formacao_academica.join('\n\n'), "edu")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                  >
                    {copiedStates["edu"] ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copiedStates["edu"] ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <div className="space-y-3">
                  {profileData.formacao_academica.map((item: string, idx: number) => (
                    <div key={idx} className="bg-black/30 p-3 rounded-lg text-sm text-white/80 leading-relaxed">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competências */}
            {profileData?.competencias && profileData.competencias.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Competências (Skills)</h2>
                  <button
                    onClick={() => copyToClipboard(profileData.competencias.join('\n'), "skills")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                  >
                    {copiedStates["skills"] ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copiedStates["skills"] ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.competencias.map((item: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cursos e Certificações */}
            {profileData?.cursos_certificacoes && profileData.cursos_certificacoes.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Cursos e Certificações</h2>
                  <button
                    onClick={() => copyToClipboard(profileData.cursos_certificacoes.join('\n\n'), "certs")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                  >
                    {copiedStates["certs"] ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copiedStates["certs"] ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <div className="space-y-3">
                  {profileData.cursos_certificacoes.map((item: string, idx: number) => (
                    <div key={idx} className="bg-black/30 p-3 rounded-lg text-sm text-white/80 leading-relaxed">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          {/* Sidebar / Upsell / Next Steps */}
          <div className="space-y-6">
            <div className="gradient-cta rounded-2xl p-6 text-center">
              <h3 className="font-bold text-xl mb-2 text-white">Extensão Automática</h3>
              <p className="text-sm text-white/80 mb-6">
                Em breve, você não precisará copiar e colar. Nossa extensão fará isso por você com 1 clique!
              </p>
              <button className="w-full py-3 rounded-xl bg-white text-blue-600 font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                <Download className="w-4 h-4" />
                Em breve
              </button>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-lg mb-4 text-white">Como atualizar seu perfil</h3>
              <ul className="space-y-4 text-sm text-white/70">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">1</span>
                  Abra o linkedin.com em outra aba.
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">2</span>
                  Vá até o seu perfil clicando na sua foto.
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">3</span>
                  Clique no ícone de lápis (editar) nas seções correspondentes.
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">4</span>
                  Copie os textos desta página e cole lá!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <DashboardContent />
    </Suspense>
  );
}
