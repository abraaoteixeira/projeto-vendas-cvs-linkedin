const fs = require('fs');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "INSIRA_SUA_NVIDIA_API_KEY_AQUI";

const SYSTEM_PROMPT = `
Você é um especialista estratégico em posicionamento de carreira e otimização de perfis do LinkedIn, com 15 anos de experiência como headhunter sênior.

Sua missão é analisar o currículo de um profissional e reconstruir completamente seu posicionamento no LinkedIn para maximizar a visibilidade.

## REGRAS ABSOLUTAS
1. Você DEVE retornar APENAS um objeto JSON válido.
2. Nunca invente empresas, cargos, datas ou conquistas que não estejam no currículo original.
3. Use português brasileiro.
4. O campo \`novo_titulo_linkedin\` deve ter entre 60 e 120 caracteres.
5. O campo \`sobre_persuasivo\` deve ter entre 200 e 500 caracteres.
6. Cada item de \`top_3_experiencias_reescritas\` deve ter entre 80 e 200 caracteres.

## SCHEMA DE SAÍDA (JSON obrigatório)
{
  "novo_titulo_linkedin": "string",
  "sobre_persuasivo": "string",
  "top_3_experiencias_reescritas": ["string","string","string"]
}

## ANÁLISE DO CURRÍCULO
--- INÍCIO DO CURRÍCULO ---
Abraão Teixeira da Silva
Técnico em Informática
Tecnologia em Redes de Computadores
HavanLabs - Analista de Suporte TI - I
Principal atividades: Fornecer Suporte Técnico, Gerenciamento de Usuários (Active Directory, Microsoft 365), Executar análises e Monitoramento (Grafana, Zabbix, Cisco DNA center), Resolver problemas técnicos de redes.
--- FIM DO CURRÍCULO ---

Retorne APENAS o JSON.
`;

async function main() {
  try {
    console.log("Enviando para a IA NVIDIA LLaMA 3.1 70B...");
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: 'Reconstrua o perfil focado no cargo de Engenheiro de Redes. Lembre-se, RETORNE APENAS JSON VÁLIDO.' }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    if (!res.ok) {
      console.error("Erro na chamada NVIDIA:", await res.text());
      return;
    }

    const data = await res.json();
    let raw = data.choices[0].message.content ?? '{}';
    
    // Clean up markdown if any
    if (raw.includes('```json')) {
      raw = raw.split('```json')[1].split('```')[0].trim();
    } else if (raw.includes('```')) {
      raw = raw.split('```')[1].trim();
    }

    const parsed = JSON.parse(raw);
    console.log("\n====== RESULTADO GERADO ======\n");
    console.log(JSON.stringify(parsed, null, 2));
    console.log("\n================================\n");

  } catch (error) {
    console.error("Erro fatal:", error);
  }
}

main();
