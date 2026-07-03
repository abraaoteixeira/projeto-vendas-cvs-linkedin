# Histórico Mestre de Edições (Contexto para Agentes)

> **Última atualização:** 2026-07-01
> **Objetivo deste arquivo:** Manter o contexto de todas as edições e correções críticas feitas no projeto, para que qualquer nova instância de IA (em novos computadores) saiba exatamente o estado atual do código.

## 🐛 Bugs Resolvidos (Versão 0.1)

### 1. Erro de Build: `Module not found: Can't resolve 'firebase/firestore'`
- **Problema:** O Next.js (App Router) falhava ao compilar rotas de API do lado do servidor (`/api/upload`) tentando empacotar a SDK Client do Firebase.
- **Solução Mestre:** O arquivo `next.config.mjs` foi alterado. O pacote `firebase` foi adicionado à lista de `serverComponentsExternalPackages`.
- **Status:** Resolvido. O servidor agora inicia perfeitamente.

### 2. Falha de Parsing do JSON da Inteligência Artificial
- **Problema:** O modelo Llama 3 70B (via NVIDIA NIM) às vezes retornava texto adicional ao redor do JSON na rota `api/suggested-roles/route.ts` (ex: "Aqui está a resposta:..."), gerando o erro 500: `SyntaxError: Unexpected non-whitespace character after JSON`.
- **Solução Mestre:** A lógica de parsing foi reescrita para localizar estritamente os caracteres `{` e `}` e extrair o conteúdo entre eles via `raw.slice(jsonStart, jsonEnd + 1)`, garantindo robustez na deserialização do JSON.
- **Status:** Resolvido.

### 3. Seção de Experiências "Em Branco" no Mockup
- **Problema:** A rota de geração de perfil (`select-role`) produzia as experiências estruturadas na propriedade `todas_experiencias`, mas o arquivo `src/app/mockup/page.tsx` não repassava essa propriedade para o componente visual `<LinkedInMockup />`. O resultado visual parecia "muito ruim" e quebrado.
- **Solução Mestre:** Atualizada a passagem de props em `mockup/page.tsx` para incluir `todas_experiencias: profileData?.todas_experiencias || []`.
- **Status:** Resolvido. O visual do perfil reconstruído agora é fiel e exibe as experiências.

### 4. Paywall (Blur) Desativado
- **Problema:** A estratégia de PLG de exibir o mockup borrado para incentivar a conversão estava bypassada (`isBlurred={false}`).
- **Solução Mestre:** Ajustado para `isBlurred={true}` no `mockup/page.tsx`, forçando o modal de Paywall e respeitando os gatilhos mentais definidos no copy de vendas.
- **Status:** Resolvido.

## 🚀 Estado Atual e Próximos Passos (Milestones 4 e 5)

1. **Inteligência Artificial (Ativa):** O sistema está usando a chave `NVIDIA_API_KEY` com sucesso. O motor MUSE está gerando os JSONs perfeitamente.
2. **Meios de Pagamento (Pendente):** O `api/checkout/route.ts` ainda é apenas um Mock (retorna um link falso do Stripe). Precisa ser integrado com a SDK oficial do Stripe.
3. **Extensão do Chrome (Futuro):** O payload final de dados (`Dashboard`) já foi validado e pronto para consumo via injeção DOM.
