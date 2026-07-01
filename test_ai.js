const fs = require('fs');
const pdfParse = require('pdf-parse');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "INSIRA_SUA_API_KEY_AQUI";
const PDF_PATH = "C:\\Users\\Abraão\\Desktop\\projeto-vendas-cvs-linkedin\\tests\\fixtures\\cv_valid.pdf";

const SYSTEM_PROMPT_TEMPLATE = `
Você é um especialista estratégico em posicionamento de carreira e otimização de perfis do LinkedIn, com 15 anos de experiência como headhunter sênior para empresas Fortune 500 e startups de alto crescimento no Brasil e na América Latina.

Sua missão é analisar o currículo de um profissional e reconstruir completamente seu posicionamento no LinkedIn para maximizar a visibilidade e o magnetismo para recrutadores.

## REGRAS ABSOLUTAS

1. Você DEVE retornar APENAS um objeto JSON válido. Sem texto antes, sem texto depois, sem markdown (sem \`\`\`json), sem comentários.
2. Nunca invente empresas, cargos, datas ou conquistas que não estejam no currículo original. Reescreva os fatos existentes com linguagem mais estratégica.
3. Use português brasileiro, tom profissional mas humano — sem jargão corporativo vazio.
4. Priorize métricas e resultados mensuráveis. Se o currículo não tiver métricas, use frases que impliquem impacto sem inventar números.
5. O campo \`novo_titulo_linkedin\` deve ter entre 60 e 120 caracteres.
6. O campo \`sobre_persuasivo\` deve ter entre 200 e 500 caracteres. Comece com um gancho emocional ou estatística impactante. Termine com uma chamada para ação implícita.
7. Cada item de \`top_3_experiencias_reescritas\` deve ter entre 80 e 200 caracteres. Use a fórmula: VERBO DE IMPACTO + O QUE FEZ + RESULTADO/ESCALA.

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
`;

async function main() {
  try {
    console.log("1. Lendo o PDF...");
    const buffer = fs.readFileSync(PDF_PATH);
    const pdfData = await pdfParse(buffer);
    const cvText = pdfData.text;
    
    console.log("   Texto extraído com sucesso! Tamanho:", cvText.length, "caracteres.");
    console.log("2. Enviando para a IA Gemini...");

    const role = "Desenvolvedor Backend Pleno"; // Cargo de teste
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{{CV_TEXT}}', cvText);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nReconstrua o perfil focado no cargo de ${role}.`
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!res.ok) {
      console.error("Erro na chamada Gemini:", await res.text());
      return;
    }

    const data = await res.json();
    const raw = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(raw);
    
    console.log("\n====== RESULTADO GERADO PELA IA ======\n");
    console.log(JSON.stringify(parsed, null, 2));
    console.log("\n========================================\n");

  } catch (error) {
    console.error("Erro fatal no teste:", error);
  }
}

main();
