import React from "react";
import { MapPin, Briefcase, GraduationCap, Link as LinkIcon } from "lucide-react";

export interface ExperienciaItem {
  cargo: string;
  empresa: string;
  periodo: string;
  descricao: string;
}

export interface LinkedInProfileData {
  novo_titulo_linkedin: string;
  sobre_persuasivo: string;
  /** New schema: structured experience objects from AI (MUSE prompt) */
  todas_experiencias?: ExperienciaItem[];
  /** Legacy schema: kept for E2E test compatibility */
  top_3_experiencias_reescritas?: string[];
  profilePhotoUrl?: string;
  bannerPhotoUrl?: string;
  nome?: string;
  localizacao?: string;
  conexoes?: string;
}

interface LinkedInMockupProps {
  data: LinkedInProfileData;
  /** When true, applies blur for paywall — user sees shape but not content */
  isBlurred?: boolean;
}

const DEFAULT_BANNER_COLOR = "linear-gradient(135deg, #0073b1 0%, #00a0dc 100%)";
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/personas/svg?seed=destaca&backgroundColor=b6e3f4,c0aede";

/**
 * LinkedInMockup — Renders a pixel-faithful LinkedIn profile preview.
 * All fields are driven by props from the AI-generated JSON payload.
 *
 * TODO: V2 Chrome Extension Hook — The `data` prop structure is the exact
 * JSON contract returned by GET /api/profile-rebuild?cvId={id}.
 * The future Chrome Extension will consume this same endpoint and inject
 * each field directly into the corresponding LinkedIn DOM elements —
 * no backend changes required.
 */
export function LinkedInMockup({ data, isBlurred = false }: LinkedInMockupProps) {
  const {
    novo_titulo_linkedin,
    sobre_persuasivo,
    todas_experiencias,
    top_3_experiencias_reescritas,
    profilePhotoUrl,
    bannerPhotoUrl,
    nome = "Seu Nome",
    localizacao = "São Paulo, Brasil",
    conexoes = "500+",
  } = data;

  // Prefer new structured schema; fall back to legacy string array
  const hasStructuredExp = todas_experiencias && todas_experiencias.length > 0;
  const hasLegacyExp = top_3_experiencias_reescritas && top_3_experiencias_reescritas.length > 0;

  const wrapperClass = `select-none font-sans text-[rgba(0,0,0,0.9)] text-sm leading-[1.33] ${
    isBlurred ? "blur-paywall" : ""
  }`;

  return (
    <div className={wrapperClass} style={{ fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* ── Fake browser chrome ── */}
      <div style={{ background: "#f3f2ef", borderBottom: "1px solid #e0dfdc", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", gap: "5px" }}>
          {["#fc5753", "#fdbc40", "#33c748"].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, background: "white", borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4, border: "1px solid #ddd" }}>
          <LinkIcon style={{ width: 10, height: 10 }} />
          linkedin.com/in/seu-perfil
        </div>
      </div>

      {/* ── LinkedIn top nav ── */}
      <div style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "0 16px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", gap: 24, height: 52 }}>
          {/* LinkedIn logo */}
          <svg viewBox="0 0 84 21" style={{ width: 84, height: 21, flexShrink: 0 }}>
            <rect width="21" height="21" rx="3" fill="#0a66c2" />
            <path d="M4.98 7.5a1.82 1.82 0 1 0 0-3.64 1.82 1.82 0 0 0 0 3.64zM3.37 8.68H6.6v9.32H3.37zM8.65 8.68h3.1v1.27h.04c.43-.82 1.48-1.68 3.05-1.68 3.26 0 3.86 2.14 3.86 4.93V18H15.5v-4.26c0-1.02-.02-2.32-1.41-2.32-1.41 0-1.63 1.1-1.63 2.24V18H9.27l-.62-9.32z" fill="white" />
            <text x="26" y="15.5" fill="#0a66c2" fontSize="11" fontWeight="600" fontFamily="sans-serif">LinkedIn</text>
          </svg>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
            {["Início", "Minha rede", "Vagas", "Mensagens"].map((item) => (
              <div key={item} style={{ padding: "14px 12px", fontSize: 12, color: "#666", cursor: "default", whiteSpace: "nowrap" }}>
                {item}
              </div>
            ))}
            <div style={{ padding: "12px", fontSize: 12, color: "#0a66c2", fontWeight: 600, borderBottom: "2px solid #0a66c2", cursor: "default" }}>
              Perfil
            </div>
          </div>
        </div>
      </div>

      {/* ── Page background ── */}
      <div style={{ background: "#f3f2ef", padding: "24px 0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── CARD 1: Profile header ── */}
          <div style={{ background: "white", borderRadius: 8, overflow: "hidden", boxShadow: "0 0 0 1px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05)" }}>
            {/* Banner */}
            <div style={{ height: 120, overflow: "hidden", position: "relative" }}>
              {bannerPhotoUrl ? (
                <img data-testid="mockup-banner" src={bannerPhotoUrl} alt="Capa" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div data-testid="mockup-banner" style={{ width: "100%", height: "100%", background: DEFAULT_BANNER_COLOR }} />
              )}
            </div>

            {/* Avatar + header content */}
            <div style={{ padding: "0 20px 16px" }}>
              {/* Avatar row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: -38, marginBottom: 12 }}>
                <div style={{ position: "relative" }}>
                  <img
                    data-testid="mockup-avatar"
                    src={profilePhotoUrl || DEFAULT_AVATAR}
                    alt="Foto"
                    style={{ width: 76, height: 76, borderRadius: "50%", border: "3px solid white", background: "white", objectFit: "cover", display: "block" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <button style={{ padding: "5px 14px", border: "1.5px solid #0a66c2", borderRadius: 16, background: "white", color: "#0a66c2", fontSize: 13, fontWeight: 600, cursor: "default" }}>
                    Mensagem
                  </button>
                  <button style={{ padding: "5px 14px", borderRadius: 16, background: "#0a66c2", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "default" }}>
                    + Conectar
                  </button>
                </div>
              </div>

              {/* Name */}
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(0,0,0,.9)", margin: "0 0 2px", lineHeight: 1.25 }}>
                {nome}
              </h1>

              {/* Headline — the AI-generated title */}
              <p data-testid="mockup-headline" style={{ fontSize: 15, color: "rgba(0,0,0,.75)", margin: "0 0 6px", lineHeight: 1.4, fontWeight: 400 }}>
                {novo_titulo_linkedin}
              </p>

              {/* Location + connections */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 13, color: "#666", marginBottom: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin style={{ width: 13, height: 13 }} /> {localizacao}
                </span>
                <span style={{ color: "#0a66c2", fontWeight: 500 }}>{conexoes} conexões</span>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <span style={{ padding: "2px 10px", borderRadius: 12, background: "#dce6f1", color: "#0a66c2", fontSize: 12, fontWeight: 500 }}>
                  ⭐ Destaque da semana
                </span>
                <span style={{ padding: "2px 10px", borderRadius: 12, background: "#f0f9f0", color: "#2d8a2d", fontSize: 12, fontWeight: 500 }}>
                  ✓ Aberto para trabalho
                </span>
              </div>
            </div>
          </div>

          {/* ── CARD 2: Sobre ── */}
          <div style={{ background: "white", borderRadius: 8, padding: "20px 20px 16px", boxShadow: "0 0 0 1px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "rgba(0,0,0,.9)", margin: "0 0 12px" }}>Sobre</h2>
            <p data-testid="mockup-about" style={{ fontSize: 14, color: "rgba(0,0,0,.75)", lineHeight: 1.6, margin: 0 }}>
              {sobre_persuasivo || "Insira uma descrição sobre você"}
            </p>
          </div>

          {/* ── CARD 3: Experiência ── */}
          <div style={{ background: "white", borderRadius: 8, padding: "20px 20px 16px", boxShadow: "0 0 0 1px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "rgba(0,0,0,.9)", margin: "0 0 16px" }}>Experiência</h2>
            <div data-testid="mockup-experience-list" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* NEW SCHEMA: Structured experience objects */}
              {hasStructuredExp && todas_experiencias!.map((exp, i) => (
                <div key={i} data-testid="mockup-experience-item" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 4, background: "#f3f2ef", border: "1px solid #e0dfdc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase style={{ width: 20, height: 20, color: "#999" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 1px", color: "rgba(0,0,0,.9)" }}>{exp.cargo}</p>
                    <p style={{ fontSize: 13, color: "rgba(0,0,0,.6)", margin: "0 0 1px" }}>{exp.empresa}</p>
                    <p style={{ fontSize: 13, color: "rgba(0,0,0,.6)", margin: "0 0 8px" }}>{exp.periodo}</p>
                    <p style={{ fontSize: 14, color: "rgba(0,0,0,.75)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{exp.descricao}</p>
                  </div>
                </div>
              ))}

              {/* LEGACY SCHEMA: Plain string array (E2E test compatibility) */}
              {!hasStructuredExp && hasLegacyExp && top_3_experiencias_reescritas!.map((exp, i) => (
                <div key={i} data-testid="mockup-experience-item" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 4, background: "#f3f2ef", border: "1px solid #e0dfdc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase style={{ width: 20, height: 20, color: "#999" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: "rgba(0,0,0,.75)", lineHeight: 1.5, margin: 0 }}>{exp}</p>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {!hasStructuredExp && !hasLegacyExp && (
                <p style={{ fontSize: 14, color: "rgba(0,0,0,.45)", margin: 0 }}>Experiências serão exibidas após o processamento.</p>
              )}
            </div>
          </div>

          {/* ── CARD 4: Formação (placeholder — real data shown in Dashboard) ── */}
          <div style={{ background: "white", borderRadius: 8, padding: "20px 20px 16px", boxShadow: "0 0 0 1px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "rgba(0,0,0,.9)", margin: "0 0 16px" }}>Formação acadêmica</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 4, background: "#f3f2ef", border: "1px solid #e0dfdc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <GraduationCap style={{ width: 20, height: 20, color: "#999" }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 1px", color: "rgba(0,0,0,.9)" }}>Formação disponível no perfil completo</p>
                <p style={{ fontSize: 13, color: "rgba(0,0,0,.6)", margin: 0 }}>Desbloqueie para ver todos os dados</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
