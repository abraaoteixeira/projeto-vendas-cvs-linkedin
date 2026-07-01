"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LinkedInMockup } from "@/components/LinkedInMockup";
import { Sparkles, ArrowRight, Eye, RefreshCw, X, ShieldCheck } from "lucide-react";

function MockupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get("cvId") || "";
  const cancelStatus = searchParams.get("status") === "cancel";
  const openPaywallParam = searchParams.get("openPaywall") === "true";

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showOriginal, setShowOriginal] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCancelFeedback, setShowCancelFeedback] = useState(cancelStatus);

  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined);
  const [bannerPhoto, setBannerPhoto] = useState<string | undefined>(undefined);

  // Direct access check
  useEffect(() => {
    if (!cvId) {
      router.push("/upload");
    }
  }, [cvId, router]);

  // Load photos from sessionStorage and fetch profile data
  useEffect(() => {
    if (!cvId) return;

    const storedProfile = sessionStorage.getItem("profilePhoto");
    const storedBanner = sessionStorage.getItem("bannerPhoto");
    if (storedProfile) setProfilePhoto(storedProfile);
    if (storedBanner) setBannerPhoto(storedBanner);

    if (openPaywallParam) {
      setIsPaywallOpen(true);
    }

    setIsLoading(true);
    fetch(`/api/profile-rebuild?cvId=${cvId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load profile data");
        }
        return res.json();
      })
      .then((data) => {
        setProfileData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [cvId, openPaywallParam]);

  const handleCheckout = async () => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      // BYPASS DE TESTE: Simula delay de operadora de cartão
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redireciona direto para o painel de entrega (Dashboard)
      router.push(`/dashboard?cvId=${cvId}`);
      
    } catch (err) {
      alert("Erro ao simular pagamento. Tente novamente.");
      setIsCheckingOut(false);
    }
  };

  const toggleView = () => {
    setShowOriginal(!showOriginal);
  };

  const handleAlterRole = () => {
    router.push(`/select-role?cvId=${cvId}`);
  };

  if (!cvId) {
    return null; // Redirecting...
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 relative overflow-hidden bg-dark text-white">
      {/* Background orbs */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-32 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-32 right-1/4 w-96 h-96 bg-green-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-green-300 font-medium mb-6">
            <Eye className="w-4 h-4" />
            Pré-visualização do seu novo perfil
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            🎉 Seu perfil foi <span className="gradient-text">reconstruído!</span>
          </h1>
          <p className="text-white/60 text-lg">
            Veja a comparação e clique em desbloquear para copiar as seções reescritas.
          </p>
        </div>

        {/* Cancel payment feedback */}
        {showCancelFeedback && (
          <div
            data-testid="paywall-feedback"
            className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-sm flex items-center justify-between"
          >
            <span>Pagamento não finalizado. Tente novamente para liberar seu perfil.</span>
            <button onClick={() => setShowCancelFeedback(false)}>
              <X className="w-4 h-4 hover:opacity-85" />
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              data-testid="mockup-toggle-view"
              onClick={toggleView}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              {showOriginal ? "Ver Otimizado" : "Ver Original"}
            </button>
            
            <button
              data-testid="alter-role-btn"
              onClick={handleAlterRole}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold"
            >
              Alterar Cargo
            </button>
          </div>

          <button
            data-testid="paywall-unlock"
            onClick={() => setIsPaywallOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-cta text-white text-sm font-bold hover:scale-[1.02] transition-transform glow-blue animate-pulse"
          >
            <Sparkles className="w-4 h-4" />
            Desbloquear Perfil
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div
            data-testid="mockup-skeleton"
            className="glass rounded-2xl p-8 animate-pulse space-y-6 min-h-[400px] flex flex-col justify-center"
          >
            <div className="h-10 bg-white/10 rounded-xl w-3/4"></div>
            <div className="h-32 bg-white/10 rounded-xl"></div>
            <div className="space-y-3">
              <div className="h-6 bg-white/10 rounded-md w-full"></div>
              <div className="h-6 bg-white/10 rounded-md w-5/6"></div>
              <div className="h-6 bg-white/10 rounded-md w-4/5"></div>
            </div>
          </div>
        ) : showOriginal ? (
          <div
            data-testid="mockup-original-text"
            className="glass p-8 rounded-2xl text-white/80 whitespace-pre-wrap leading-relaxed border border-white/10 font-mono text-sm max-h-[500px] overflow-y-auto"
          >
            {profileData?.original_cv_text || "Currículo original carregado."}
          </div>
        ) : (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white">
            <LinkedInMockup
              data={{
                novo_titulo_linkedin: profileData?.novo_titulo_linkedin || "",
                sobre_persuasivo: profileData?.sobre_persuasivo || "",
                top_3_experiencias_reescritas: profileData?.top_3_experiencias_reescritas || [],
                profilePhotoUrl: profilePhoto,
                bannerPhotoUrl: bannerPhoto,
                nome: profileData?.nome || "Seu Nome Aqui",
              }}
              isBlurred={false}
            />
          </div>
        )}

        {/* Inline Teaser Card */}
        <div className="glass rounded-2xl p-8 text-center border border-white/10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Pronto para dominar as buscas?</h3>
          </div>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Desbloqueie o acesso completo para copiar o título estratégico, o resumo persuasivo e as experiências reescritas.
          </p>
          <button
            onClick={() => setIsPaywallOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 gradient-cta text-white font-bold text-lg rounded-xl hover:scale-105 transition-transform duration-250 glow-blue"
          >
            <Sparkles className="w-5 h-5" />
            Liberar Acesso Completo
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Paywall Overlay Modal (F6-TC1) */}
      {isPaywallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            data-testid="paywall-modal"
            className="relative w-full max-w-md glass border border-white/15 rounded-3xl p-8 shadow-2xl text-center bg-dark"
          >
            {/* Close Button */}
            <button
              data-testid="paywall-close"
              onClick={() => setIsPaywallOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Premium Icon */}
            <div className="w-16 h-16 gradient-cta rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>

            {/* Copywriting Offer */}
            <h2 className="text-2xl font-extrabold mb-3">Desbloqueie o Perfil Premium</h2>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Garanta acesso imediato às melhores palavras-chave e ao resumo otimizado por headhunters.
              Publicar um perfil magnético é sua melhor garantia de novas entrevistas.
            </p>

            {/* Features list */}
            <div className="text-left space-y-3 mb-8 max-w-xs mx-auto text-sm text-white/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Título otimizado para o algoritmo</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Storytelling persuasivo (&quot;Sobre&quot;)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Top 3 Experiências com métricas</span>
              </div>
            </div>

            {/* Price anchoring */}
            <div className="mb-6">
              <span className="text-white/40 line-through text-sm mr-2">De R$ 97,00</span>
              <span className="text-2xl font-black text-white">Por apenas R$ 39,90</span>
            </div>

            {/* Checkout Button */}
            <button
              data-testid="paywall-checkout-btn"
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl gradient-cta text-white font-bold text-lg hover:opacity-90 hover:scale-[1.01] transition-all glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Garantir Acesso Completo
                </>
              )}
            </button>
            <p className="text-[10px] text-white/30 mt-3">🔒 Sem assinaturas recorrentes. Pagamento único com garantia.</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MockupPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <MockupContent />
    </Suspense>
  );
}
