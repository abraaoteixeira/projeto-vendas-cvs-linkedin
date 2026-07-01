"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SelectRolePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <SelectRoleContent />
    </Suspense>
  );
}

function SelectRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get("cvId") || "";

  const [roles, setRoles] = useState<{id: string, label: string}[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dynamic roles on mount
  useEffect(() => {
    if (!cvId) return;

    fetch(`/api/suggested-roles?cvId=${cvId}`)
      .then(res => res.json())
      .then(data => {
        if (data.roles && Array.isArray(data.roles)) {
          const dynamicRoles = data.roles.map((r: string, i: number) => ({
            id: `role-${i}`,
            label: r
          }));
          setRoles([...dynamicRoles, { id: "outro", label: "Outro cargo (digitar)" }]);
        }
      })
      .catch(err => {
        console.error("Error fetching roles:", err);
        setRoles([
          { id: "fullstack", label: "Dev Fullstack" },
          { id: "productmanager", label: "Product Manager" },
          { id: "outro", label: "Outro cargo (digitar)" }
        ]);
      })
      .finally(() => {
        setIsLoadingRoles(false);
        const cachedRole = sessionStorage.getItem("selectedRole");
        const cachedCustom = sessionStorage.getItem("customRole");
        if (cachedRole) setSelectedRole(cachedRole);
        if (cachedCustom) setCustomRole(cachedCustom);
      });
  }, [cvId]);

  const handleSelectRole = (roleId: string) => {
    setSelectedRole(roleId);
    sessionStorage.setItem("selectedRole", roleId);
    setShowError(false);
  };

  const handleCustomRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 100);
    setCustomRole(val);
    sessionStorage.setItem("customRole", val);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      setErrorMessage("Por favor, selecione um cargo");
      setShowError(true);
      return;
    }

    const finalRole = selectedRole === "outro" ? customRole.trim() : roles.find(r => r.id === selectedRole)?.label || "";

    if (selectedRole === "outro" && !finalRole) {
      setErrorMessage("Por favor, digite o nome do cargo desejado");
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/rebuild/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, role: finalRole }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar cargo");
      }

      router.push(`/mockup?cvId=${cvId}`);
    } catch (err) {
      setErrorMessage("Erro ao processar sua solicitação. Tente novamente.");
      setShowError(true);
      setIsSubmitting(false);
    }
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
            Passo 2 de 3
          </div>
          <h1 className="text-4xl font-black mb-3">Qual o seu cargo dos sonhos?</h1>
          <p className="text-white/60 text-lg">
            A IA analisou seu currículo e sugere estes cargos em alta:
          </p>
        </div>

        {isLoadingRoles ? (
          <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-4 mb-6 animate-pulse">
             <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-white/80 font-medium">Extraindo sugestões do seu currículo...</p>
          </div>
        ) : (
          <>
            {/* Roles Grid */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border text-left font-semibold text-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                      ${isSelected
                        ? "border-blue-500 bg-blue-500/15 text-white glow-blue"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/80"
                      }`}
                  >
                    <span>{role.label}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            {selectedRole === "outro" && (
              <div className="mb-6 animate-slide-up">
                <label className="block text-sm font-medium text-white/60 mb-2">Digite o cargo desejado:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customRole}
                    onChange={handleCustomRoleChange}
                    placeholder="Ex: Senior Reliability Engineer"
                    maxLength={100}
                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors pr-24"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 font-mono">
                    {customRole.length}/100
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error Toast */}
        {showError && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm animate-fade-in">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/upload")}
            className="flex items-center gap-2 px-6 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-bold text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          
          <button
            onClick={handleContinue}
            disabled={isSubmitting || isLoadingRoles}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl gradient-cta text-white font-bold transition-all hover:scale-[1.02] glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Gerando..." : "Continuar"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
