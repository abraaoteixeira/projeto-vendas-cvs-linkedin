import { NextResponse } from 'next/server';
import { db, runFirestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getRecord, updateRecord } from '@/lib/fileStore';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Motor MUSE 2026 (LinkedIn Recruiter Algorithm)
// Engineered from: "Otimização Do Algoritmo Do LinkedIn.txt" research document
// Last updated: 2026-07-01
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT_TEMPLATE = `Você é um Especialista de Elite em Aquisição de Talentos e Cientista de Dados do Algoritmo do LinkedIn Recruiter (Motor MUSE - Busca Semântica 2026).
Sua missão é ler os dados brutos de um currículo e reconstruir um Perfil LinkedIn nível "All-Star", maximizando a conversão em entrevistas e a recuperação na camada L1/L2 do algoritmo.

═══════════════════════════════════════════
PROMPTS NEGATIVOS — BLOQUEIOS ABSOLUTOS
═══════════════════════════════════════════
1. NUNCA gere caracteres Unicode personalizados (letras cursivas, negritos matemáticos ⓐⓑⓒ𝗔𝗕𝗖). Apenas UTF-8 padrão. Símbolos permitidos: - • |
2. NUNCA gere tabelas ou formatos bidimensionais.
3. NUNCA use "ChatGPT-isms": "mergulhar", "desbravar", "navegar pelas águas", "uma tapeçaria de".
4. NUNCA use jargões vazios: "apaixonado", "visionário", "sinergia", "proativo", "jogador de equipe". Toda soft skill deve ser INFERIDA pelas realizações concretas.
5. NUNCA invente empresas, cargos, datas ou conquistas que não existam no currículo original.
6. A linguagem deve ser seca, cirúrgica, acionável e orientada a negócios.

═══════════════════════════════════════════
CARGO ALVO: {targetRole}
═══════════════════════════════════════════

1. TÍTULO ESTRATÉGICO (SEO MÁXIMO — Fórmula ICP):
   Formato: [Identidade Profissional] | [2-3 Hard Skills / Ferramentas Técnicas do Cargo] | [Métrica de Impacto ou Proposta de Valor única]
   Limite: máximo 220 caracteres.
   Exemplo: "Analista de Infraestrutura de TI | Zabbix, Cisco DNA & Active Directory | Garantindo 99.9% de Uptime em Ambientes Corporativos"

2. RESUMO PERSUASIVO (1500-2000 caracteres — Estrutura obrigatória):
   a) GANCHO (primeiras 2 linhas): Dado quantitativo impressionante ou contraste de autoridade que PARE o scroll.
   b) TRAJETÓRIA (2 parágrafos em 1ª pessoa): Como você resolve os problemas centrais do {targetRole}.
   c) CLUSTER SEMÂNTICO: Lista "Especialidades incluem:" com 6-8 palavras-chave técnicas (Topic DNA) do {targetRole}.
   d) CALL TO ACTION: Convite direto para conexão ou conversa.

3. EXPERIÊNCIAS PROFISSIONAIS (Framework C-A-R — Challenge, Action, Result):
   Para CADA experiência no currículo:
   - Escreva 1-2 frases de contexto (tamanho da equipe, escopo do ambiente).
   - Escreva 3-5 bullet points começando com VERBO DE AÇÃO FORTE (Implementou, Reduziu, Liderou, Automatizou, Escalou, Garantiu...).
   - Cada bullet: [Verbo] + [Ferramenta/Tecnologia específica] + [Resultado mensurável ou impacto de negócio].
   - Se não há métrica no currículo, use linguagem de impacto implícito (ex: "eliminando gargalo crítico de...").

4. FORMAÇÃO ACADÊMICA:
   Liste EXATAMENTE o que está no currículo. Não invente nem omita.

5. COMPETÊNCIAS (até 15 hard skills):
   Extraia skills que conectam o histórico do candidato com o {targetRole}.
   Foco no "Topic DNA" técnico que atrai o algoritmo MUSE.
   Priorize ferramentas e tecnologias concretas (ex: "Zabbix", "Cisco DNA Center") sobre categorias vagas (ex: "Monitoramento de Redes").

6. CURSOS E CERTIFICAÇÕES:
   Liste EXATAMENTE o que está no currículo. Não invente nem omita.

═══════════════════════════════════════════
SAÍDA OBRIGATÓRIA — JSON PURO
═══════════════════════════════════════════
Retorne APENAS JSON válido. Zero texto antes ou depois. Zero markdown. Zero comentários.

{
  "nome": "Nome completo extraído do currículo",
  "novo_titulo_linkedin": "Título usando a Fórmula ICP (máx 220 chars)",
  "sobre_persuasivo": "Gancho + Trajetória + Cluster Semântico + CTA (1500-2000 chars)",
  "todas_experiencias": [
    {
      "cargo": "Cargo exato do currículo",
      "empresa": "Empresa exata do currículo",
      "periodo": "MM/AAAA - MM/AAAA ou Presente",
      "descricao": "Contexto em 1-2 frases.\\n• Verbo + Ferramenta + Resultado\\n• Verbo + Ferramenta + Resultado\\n• Verbo + Ferramenta + Resultado"
    }
  ],
  "formacao_academica": ["Curso - Instituição (Ano)", "Curso - Instituição (Ano em andamento)"],
  "competencias": ["Ferramenta/Skill 1", "Ferramenta/Skill 2"],
  "cursos_certificacoes": ["Certificação - Emissor (Ano)", "Certificação - Emissor (Ano)"]
}

═══════════════════════════════════════════
CURRÍCULO DO CANDIDATO:
═══════════════════════════════════════════
--- INÍCIO ---
{{CV_TEXT}}
--- FIM ---

RETORNE APENAS O JSON. NENHUM OUTRO TEXTO.`;

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL FALLBACK — only used if NVIDIA_API_KEY is missing
// ─────────────────────────────────────────────────────────────────────────────
function generateLocalFallback(role: string, cvText: string): any {
  // Parse what we can from the CV text to make the fallback less generic
  const lines = cvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const nome = lines[0] || 'Profissional';

  return {
    nome,
    novo_titulo_linkedin: `${role} | Suporte Técnico & Infraestrutura de TI | Garantindo Disponibilidade e Performance`,
    sobre_persuasivo: `[MODO OFFLINE - Configure NVIDIA_API_KEY para geração real]\n\nCom experiência em ${role}, atuo na interseção entre suporte técnico e infraestrutura de TI, garantindo que a operação nunca pare.\n\nEspecialidades incluem: Suporte Técnico N1/N2, Redes, Active Directory, Microsoft 365, Monitoramento de Infraestrutura, Linux, Windows Server.`,
    todas_experiencias: [
      {
        cargo: role,
        empresa: "Empresa (configure a chave NVIDIA para dados reais)",
        periodo: "2024 - Presente",
        descricao: "Configure a variável NVIDIA_API_KEY no arquivo .env.local para que a IA processe o currículo real e gere experiências no formato C-A-R."
      }
    ],
    formacao_academica: ["Configure NVIDIA_API_KEY para extrair formação real do currículo"],
    competencias: ["Suporte Técnico", "Infraestrutura de TI", "Configure NVIDIA_API_KEY"],
    cursos_certificacoes: ["Configure NVIDIA_API_KEY para extrair certificações reais"]
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { cvId, role, overrideCvText } = await request.json();

    if (!cvId || !role) {
      return NextResponse.json({ error: 'cvId and role are required' }, { status: 400 });
    }

    // 1. Fetch CV text — override > fileStore > Firestore
    let cvText = overrideCvText || '';

    if (!cvText) {
      const fileDoc = getRecord(cvId);
      if (fileDoc) {
        cvText = fileDoc.originalCvText || '';
      } else {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const userDocRef = doc(db, 'users', cvId);
          const docSnap = await runFirestore(getDoc(userDocRef));
          if (docSnap.exists()) {
            cvText = docSnap.data().originalCvText || '';
          }
        } catch (e) {
          console.warn('Firestore read skipped/failed:', e);
        }
      }
    }

    if (!cvText) {
      return NextResponse.json({ error: 'CV not found for this ID' }, { status: 404 });
    }

    // 2. Mark as processing
    updateRecord(cvId, { status: 'reescrevendo', targetRole: role });

    let profile: any = null;

    // 3. NVIDIA NIM (Primary AI Provider)
    if (process.env.NVIDIA_API_KEY) {
      try {
        const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{{CV_TEXT}}', cvText).replace(/\{targetRole\}/g, role);
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
          },
          body: JSON.stringify({
            model: 'meta/llama-3.1-70b-instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Reconstrua o perfil para o cargo de "${role}". Retorne APENAS JSON válido, sem markdown.` }
            ],
            temperature: 0.65,
            max_tokens: 2048,
          })
        });

        if (res.ok) {
          const data = await res.json();
          let raw: string = data.choices?.[0]?.message?.content ?? '';

          // Strip markdown code fences if model wraps output
          if (raw.includes('```json')) {
            raw = raw.split('```json')[1].split('```')[0].trim();
          } else if (raw.includes('```')) {
            raw = raw.split('```')[1].trim();
          }

          // Find JSON boundaries in case model prepends/appends text
          const jsonStart = raw.indexOf('{');
          const jsonEnd = raw.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            raw = raw.slice(jsonStart, jsonEnd + 1);
          }

          console.log('[NVIDIA] Raw output preview:', raw.slice(0, 200));

          try {
            profile = JSON.parse(raw);
          } catch (parseErr) {
            console.error('[NVIDIA] JSON parse failed. Raw output:', raw);
            // Don't crash — fall through to local fallback
          }
        } else {
          const errText = await res.text();
          console.error('[NVIDIA] API error:', res.status, errText);
        }
      } catch (err) {
        console.warn('[NVIDIA] Request failed, using local fallback:', err);
      }
    } else {
      console.warn('[AI] NVIDIA_API_KEY not configured. Using local fallback.');
      // To enable OpenAI: uncomment and set OPENAI_API_KEY in .env.local
    }

    // 4. Fallback if AI unavailable or failed
    if (!profile) {
      profile = generateLocalFallback(role, cvText);
    }

    // 5. Add alternative titles for A/B testing (paywall bonus)
    profile.titulos_alternativos = [
      `${role} Sênior | ${profile.competencias?.[0] || 'Infraestrutura'} & ${profile.competencias?.[1] || 'Suporte'} | Resultados Mensuráveis`,
      `Especialista em ${role} | Alta Disponibilidade & Eficiência Operacional`,
      `${role} | Transformação Digital e Suporte Estratégico`
    ];

    // 6. Persist complete profile to file store
    updateRecord(cvId, {
      status: 'processed',
      targetRole: role,
      profile: {
        nome: profile.nome,
        novo_titulo_linkedin: profile.novo_titulo_linkedin,
        sobre_persuasivo: profile.sobre_persuasivo,
        todas_experiencias: profile.todas_experiencias || [],
        formacao_academica: profile.formacao_academica || [],
        competencias: profile.competencias || [],
        cursos_certificacoes: profile.cursos_certificacoes || [],
        titulos_alternativos: profile.titulos_alternativos || []
      }
    });

    // 7. Also try Firestore (non-blocking)
    try {
      const userDocRef = doc(db, 'users', cvId);
      await runFirestore(updateDoc(userDocRef, {
        status: 'processed',
        targetRole: role,
        profile: {
          nome: profile.nome,
          novo_titulo_linkedin: profile.novo_titulo_linkedin,
          sobre_persuasivo: profile.sobre_persuasivo,
          todas_experiencias: profile.todas_experiencias || [],
          formacao_academica: profile.formacao_academica || [],
          competencias: profile.competencias || [],
          cursos_certificacoes: profile.cursos_certificacoes || [],
          titulos_alternativos: profile.titulos_alternativos || []
        }
      }));
    } catch (e) {
      // Non-critical — file store already saved
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Select Role API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
