"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Camera, Image as ImageIcon, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

const LOADING_MESSAGES = [
  "Lendo as entrelinhas do seu currículo...",
  "Identificando o que os recrutadores mais valorizam no seu setor...",
  "Traduzindo responsabilidades em resultados mensuráveis...",
  "Encontrando as palavras-chave que abrem portas no LinkedIn...",
  "Construindo um título que para o scroll e chama a atenção...",
  "Reescrevendo sua trajetória com o idioma dos recrutadores...",
  "Finalizando seu perfil reconstruído...",
];

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get("cvId") || "";

  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [bannerPhoto, setBannerPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("processing");
  const [showLatencyWarning, setShowLatencyWarning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Load photos from sessionStorage on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
    const storedProfile = sessionStorage.getItem("profilePhoto");
    const storedBanner = sessionStorage.getItem("bannerPhoto");
    if (storedProfile) setProfilePhoto(storedProfile);
    if (storedBanner) setBannerPhoto(storedBanner);
  }, []);

  // Cycle messages
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(msgInterval);
  }, []);

  // Incremental visual progress simulation
  useEffect(() => {
    const progInterval = setInterval(() => {
      setProgress((p) => {
        if (status === "processed" || status === "ready") {
          return 100;
        }
        if (status === "failed") {
          return p;
        }
        // slow progress until finished
        if (p < 95) {
          return p + 1;
        }
        return p;
      });
    }, 150);
    return () => clearInterval(progInterval);
  }, [status]);

  // Polling status and latency timer
  useEffect(() => {
    if (!cvId) return;

    // Latency warning after 2000ms of non-ready status
    const latencyTimer = setTimeout(() => {
      setShowLatencyWarning(true);
    }, 2000);

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/rebuild/status?cvId=${cvId}`);
        if (!res.ok) {
          // If status fails, ignore and retry (resilience)
          return;
        }
        const data = await res.json();
        
        // Update status state (accepting invalid/unknown statuses without crashing)
        if (data.status) {
          setStatus(data.status);
        }

        if (data.status === "processed" || data.status === "ready") {
          // Force at least 1500ms UX delay before showing button
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = 1500 - elapsed;
          if (remaining > 0) {
            setTimeout(() => {
              setIsReady(true);
            }, remaining);
          } else {
            setIsReady(true);
          }
        }
      } catch (err) {
        // Ignore network errors and continue polling (F3-TC8 recovery)
      }
    };

    // Initial poll and set interval
    pollStatus();
    const interval = setInterval(pollStatus, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(latencyTimer);
    };
  }, [cvId]);

  // Auto-avanço se o usuário submeteu ambas as fotos E a IA já concluiu a análise
  useEffect(() => {
    if (profilePhoto && bannerPhoto && isReady && cvId) {
      const timer = setTimeout(() => {
        router.push(`/select-role?cvId=${cvId}`);
      }, 1500); // 1.5s de delay para uma transição suave e para garantir o processamento
      return () => clearTimeout(timer);
    }
  }, [profilePhoto, bannerPhoto, isReady, cvId, router]);

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "profilePhoto" | "bannerPhoto",
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setter(base64String);
      sessionStorage.setItem(key, base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRetry = () => {
    router.push("/upload");
  };

  // If status is reescrevendo/experiências (polling test F3-TC3)
  const getStatusText = () => {
    if (status === "reescrevendo") return "Reescrevendo experiências...";
    return LOADING_MESSAGES[messageIndex];
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden bg-dark text-white">
      {/* Background orbs */}
      <div className="absolute top-1/3 left-1/5 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/5 w-80 h-80 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-blue-300 font-medium mb-6">
            <Sparkles className="w-4 h-4 animate-pulse" />
            IA analisando seu currículo...
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Enquanto a IA trabalha, personalize seu visual
          </h1>
          <p className="text-white/60 text-lg">
            Adicione suas fotos agora — você tem tempo, a IA ainda está processando.
          </p>
        </div>

        {/* Photo Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Profile Photo */}
          <div
            id="profile-photo-upload"
            className={`glass rounded-2xl p-6 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300
              ${profilePhoto ? "border-green-400/40 bg-green-500/5" : "hover:border-white/30"}`}
            onClick={() => profileInputRef.current?.click()}
          >
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handlePhotoUpload(e, "profilePhoto", setProfilePhoto)}
            />
            {profilePhoto ? (
              <>
                <div className="relative">
                  <img
                    src={profilePhoto}
                    alt="Foto de perfil"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-green-500/40"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-400 text-sm">✓ Foto adicionada</p>
                  <p className="text-white/40 text-xs mt-1">Clique para trocar</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white/30" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white">Foto de Perfil</p>
                  <p className="text-white/40 text-sm mt-1">Clique para adicionar</p>
                </div>
              </>
            )}
          </div>

          {/* Banner Photo */}
          <div
            id="banner-photo-upload"
            className={`glass rounded-2xl p-6 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300
              ${bannerPhoto ? "border-green-400/40 bg-green-500/5" : "hover:border-white/30"}`}
            onClick={() => bannerInputRef.current?.click()}
          >
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handlePhotoUpload(e, "bannerPhoto", setBannerPhoto)}
            />
            {bannerPhoto ? (
              <>
                <div className="relative w-full">
                  <img
                    src={bannerPhoto}
                    alt="Banner"
                    className="w-full h-20 rounded-xl object-cover ring-2 ring-green-500/40"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-400 text-sm">✓ Banner adicionado</p>
                  <p className="text-white/40 text-xs mt-1">Clique para trocar</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-full h-20 rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white/30" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white">Foto de Capa (Banner)</p>
                  <p className="text-white/40 text-sm mt-1">Clique para adicionar</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Processing Box */}
        <div className="glass rounded-2xl p-8">
          {status === "failed" ? (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-400">
                <AlertCircle className="w-9 h-9" />
              </div>
              <div data-testid="processing-error">
                <p className="text-white font-bold text-xl mb-1">Falha no processamento</p>
                <p className="text-white/50 text-sm">
                  Ocorreu um erro ao extrair as informações do seu currículo.
                </p>
              </div>
              <button
                data-testid="retry-button"
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-cta text-white font-bold hover:scale-[1.02] transition-transform"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Spinner or Success Checkmark */}
              <div className="flex justify-center mb-6">
                {isReady ? (
                  <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 animate-scale-in">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="relative w-14 h-14">
                    <div className="w-14 h-14 rounded-full border-4 border-white/10 absolute" />
                    <div
                      data-testid="loading-spinner"
                      className="w-14 h-14 rounded-full border-4 border-t-blue-500 border-r-green-500 border-b-transparent border-l-transparent animate-spin absolute"
                    />
                  </div>
                )}
              </div>

              {/* Status Message */}
              <p
                data-testid="loading-status-text"
                className="text-center text-white/80 text-base font-medium mb-5 min-h-[28px]"
              >
                {isReady ? "Análise do currículo concluída!" : getStatusText()}
              </p>

              {/* Progress bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full gradient-cta rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Latency warning */}
              {!isReady && showLatencyWarning && (
                <div
                  data-testid="loading-latency-warning"
                  className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 text-xs animate-fade-in justify-center"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>O processamento pode demorar mais do que o comum. Por favor, aguarde...</span>
                </div>
              )}

              {/* Manual Continue Button */}
              {isReady && (
                <button
                  data-testid="continue-to-select-role"
                  onClick={() => router.push(`/select-role?cvId=${cvId}`)}
                  className="w-full mt-6 py-4 rounded-xl gradient-cta text-white font-bold text-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                >
                  {!profilePhoto && !bannerPhoto ? "Continuar sem fotos" : "Continuar com foto"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <LoadingContent />
    </Suspense>
  );
}
