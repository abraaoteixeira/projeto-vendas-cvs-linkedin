# Prompt Mestre de Sistema — LinkedIn Profile Rebuilder

> Agente 3: Engenheiro de Backend e IA
> Última atualização: 2026-06-28

---

## Visão Geral

Este documento define o **Prompt Mestre de Sistema** utilizado na chamada à API da OpenAI (GPT-4o) ou Google Gemini. O prompt recebe o texto bruto extraído de um CV em PDF e retorna **estritamente um JSON** com o perfil do LinkedIn reconstruído.

---

## Sistema de Extração de Texto do PDF

Antes de chamar a IA, o texto do PDF deve ser extraído server-side. Recomendamos a biblioteca `pdf-parse` no ambiente Node.js.

```typescript
// src/lib/extractPdfText.ts
import pdfParse from 'pdf-parse';

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
```

---

## Prompt Mestre de Sistema (System Prompt)

Utilize este texto como o `system` message na chamada à API. Nunca o exponha no frontend.

```
Você é um especialista estratégico em posicionamento de carreira e otimização de perfis do LinkedIn, com 15 anos de experiência como headhunter sênior para empresas Fortune 500 e startups de alto crescimento no Brasil e na América Latina.

Sua missão é analisar o currículo de um profissional e reconstruir completamente seu posicionamento no LinkedIn para maximizar a visibilidade e o magnetismo para recrutadores.

## REGRAS ABSOLUTAS

1. Você DEVE retornar APENAS um objeto JSON válido. Sem texto antes, sem texto depois, sem markdown (sem ```json```), sem comentários.
2. Nunca invente empresas, cargos, datas ou conquistas que não estejam no currículo original. Reescreva os fatos existentes com linguagem mais estratégica.
3. Use português brasileiro, tom profissional mas humano — sem jargão corporativo vazio.
4. Priorize métricas e resultados mensuráveis. Se o currículo não tiver métricas, use frases que impliquem impacto sem inventar números.
5. O campo `novo_titulo_linkedin` deve ter entre 60 e 120 caracteres.
6. O campo `sobre_persuasivo` deve ter entre 200 e 500 caracteres. Comece com um gancho emocional ou estatística impactante. Termine com uma chamada para ação implícita.
7. Cada item de `top_3_experiencias_reescritas` deve ter entre 80 e 200 caracteres. Use a fórmula: VERBO DE IMPACTO + O QUE FEZ + RESULTADO/ESCALA.

## SCHEMA DE SAÍDA (JSON obrigatório)

{
  "novo_titulo_linkedin": "string",
  "sobre_persuasivo": "string",
  "top_3_experiencias_reescritas": [
    "string",
    "string",
    "string"
  ]
}

## ANÁLISE DO CURRÍCULO

A seguir está o texto extraído do currículo do profissional. Analise profundamente antes de gerar a saída:

--- INÍCIO DO CURRÍCULO ---
{{CV_TEXT}}
--- FIM DO CURRÍCULO ---

Retorne APENAS o JSON. Nenhum outro texto.
```

---

## Implementação na API Route

```typescript
// src/app/api/profile-rebuild/route.ts (versão com IA real)
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT_TEMPLATE = `
[Cole o System Prompt acima aqui, sem os delimitadores de código]
`;

export async function POST(request: Request) {
  const { cvText, userId } = await request.json();

  if (!cvText || !userId) {
    return NextResponse.json({ error: 'cvText and userId are required' }, { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{{CV_TEXT}}', cvText);

  // TODO: V2 Chrome Extension Hook — Este payload JSON é o contrato de dados
  // que a extensão do Chrome consumirá para injetar diretamente no DOM do LinkedIn.
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analise o currículo e retorne o JSON.' },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const profile = JSON.parse(raw);

  // Salvar no Firestore (userId -> profileData) para acesso pós-pagamento
  // await saveProfileToFirestore(userId, profile);

  return NextResponse.json(profile);
}
```

---

## Alternativa: Google Gemini

Para usar o Gemini em vez do OpenAI, adapte o cliente:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: { responseMimeType: 'application/json' },
});

const result = await model.generateContent(systemPrompt);
const profile = JSON.parse(result.response.text());
```

---

## Estrutura do Firestore

### Coleção: `users`
```
users/
  {userId}/
    email: string
    createdAt: timestamp
    status: "uploaded" | "processing" | "ready" | "paid"
    cvStoragePath: string   // ex: "cvs/{userId}/curriculum.pdf"
    profile: {              // preenchido após processamento da IA
      novo_titulo_linkedin: string
      sobre_persuasivo: string
      top_3_experiencias_reescritas: string[]
    }
```

### Regras de Segurança (Firestore)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Regras de Storage
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cvs/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow write: if resource == null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

---

## Exemplos de Saída Esperada

### Input (CV resumido)
```
João Silva
Analista de TI — Empresa XYZ (2019-2024)
- Gerenciei projetos de migração
- Trabalhei com equipes
- Melhorei processos internos
```

### Output esperado (JSON)
```json
{
  "novo_titulo_linkedin": "Analista de TI Sênior | Migração de Sistemas & Transformação Digital | Gestão de Equipes",
  "sobre_persuasivo": "Profissionais de TI que gerenciam migrações complexas são raros. Sou um deles. Com 5 anos transformando infraestruturas legadas em operações modernas e eficientes, conecto tecnologia com resultados de negócio. Aberto a novas oportunidades.",
  "top_3_experiencias_reescritas": [
    "Liderou migração de sistemas críticos para cloud, eliminando gargalos que impactavam toda a operação.",
    "Coordenou equipes multidisciplinares em projetos de transformação digital de ponta a ponta.",
    "Reestruturou processos internos de TI, aumentando a eficiência operacional do departamento."
  ]
}
```
