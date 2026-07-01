"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Sparkles, ArrowRight, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const startUpload = async (selectedFile: File) => {
    // 1. Validation
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Format not supported. Please upload a PDF file.");
      setFile(null);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      setFile(null);
      return;
    }
    if (selectedFile.size === 0) {
      setError("Empty file. Please upload a valid PDF.");
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
    setIsUploading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Connection lost or upload failed");
      }

      const result = await response.json();
      if (result.id) {
        // Store in sessionStorage to redirect later or check state
        sessionStorage.setItem("activeCvId", result.id);
        sessionStorage.removeItem("profilePhoto");
        sessionStorage.removeItem("bannerPhoto");
        router.push(`/loading?cvId=${result.id}`);
      } else {
        throw new Error("Upload failed, missing ID");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setFile(null);
        setIsUploading(false);
      } else {
        if (err.message && (err.message.includes("NetworkError") || err.message.includes("fetch") || err.message.includes("failed to fetch") || !navigator.onLine)) {
          setError("Connection lost or offline. Please check your network and try again.");
        } else {
          setError(err.message || "Connection lost or upload failed");
        }
        setFile(null);
        setIsUploading(false);
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl.trim()) return;
    if (!linkedinUrl.includes("linkedin.com/")) {
      setError("Por favor, insira um link válido do LinkedIn.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: linkedinUrl.trim() }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Falha ao importar link.");
      }

      const result = await response.json();
      if (result.id) {
        sessionStorage.setItem("activeCvId", result.id);
        sessionStorage.removeItem("profilePhoto");
        sessionStorage.removeItem("bannerPhoto");
        router.push(`/loading?cvId=${result.id}`);
      } else {
        throw new Error("Importação falhou, ID ausente");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar o link.");
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      startUpload(dropped);
    }
  }, [startUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      startUpload(selected);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setFile(null);
    setIsUploading(false);
    setError(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden bg-dark text-white">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-blue-300 font-medium mb-6">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Passo 1 de 3
          </div>
          <h1 className="text-4xl font-black mb-3">Envie seu currículo</h1>
          <p className="text-white/60 text-lg">
            Nossa IA vai ler, analisar e reconstruir tudo. <br />
            Apenas arquivos PDF são aceitos.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          id="cv-upload-zone"
          data-testid="drop-zone"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${isDragging
              ? "border-blue-400 bg-blue-500/10 scale-102"
              : file
              ? "border-green-400/60 bg-green-500/5"
              : "border-white/20 bg-white/3 hover:border-white/40 hover:bg-white/5"
            }`}
        >
          <label htmlFor="cv-file-input" data-testid="upload-input" className="block p-10 text-center cursor-pointer">
            <input
              type="file"
              id="cv-file-input"
              accept="application/pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {file || isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{file?.name || "Enviando currículo..."}</p>
                  {isUploading && (
                    <div data-testid="upload-progress" className="w-full bg-white/10 rounded-full h-2.5 mt-3 overflow-hidden">
                      <div className="bg-blue-500 h-full animate-progress-bar rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  )}
                </div>
                {isUploading && (
                  <button
                    type="button"
                    data-testid="upload-cancel"
                    onClick={(e) => { e.preventDefault(); handleCancel(); }}
                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors mt-2"
                  >
                    <X className="w-4 h-4" /> Cancelar upload
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
                  ${isDragging ? "bg-blue-500/30" : "bg-white/5"}`}>
                  <Upload className={`w-8 h-8 transition-colors ${isDragging ? "text-blue-400" : "text-white/40"}`} />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {isDragging ? "Solte aqui!" : "Arraste seu currículo ou clique para selecionar"}
                  </p>
                  <p className="text-white/40 text-sm mt-1">PDF até 5MB</p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Separador e Input do Link */}
        {!file && !isUploading && (
          <div className="mt-8 animate-slide-up">
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-sm font-semibold uppercase tracking-wider">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-white/60 text-center mb-1">
                Cole o link do seu perfil público do LinkedIn:
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  required
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/seu-nome"
                  className="flex-1 px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-4 rounded-xl gradient-cta text-white font-bold hover:scale-[1.02] transition-transform flex items-center gap-2"
                >
                  Importar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div data-testid="upload-error" className="flex items-center gap-2 mt-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <p className="text-center text-white/30 text-sm mt-6">
          🔒 Seu currículo é processado com segurança e nunca é compartilhado.
        </p>
      </div>
    </main>
  );
}
