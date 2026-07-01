# Original User Request

## Initial Request — 2026-06-28T22:45:12Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Criar o MVP completo (arquitetura, código frontend, lógica de backend, prompts de IA e copy) para um SaaS de reconstrução de perfis do LinkedIn (PLG). O público-alvo são profissionais com dificuldade de posicionamento. O fluxo é: Landing Page -> Upload CV -> Carregamento Interativo -> Seleção de Cargo -> Mockup do LinkedIn -> Paywall -> Dashboard de Copiar/Colar.

Working directory: c:/Users/Abraão/Desktop/projeto-vendas-cvs-linkedin
Integrity mode: development

## Contexto e Arquitetura Crítica
O sistema final (pós-paywall) entregará uma tela de "Copiar/Colar" para o MVP. No entanto, a arquitetura deve ser obrigatoriamente desacoplada: o frontend de resultados deve apenas consumir um JSON (novo_titulo_linkedin, sobre_persuasivo, top_3_experiencias_reescritas) gerado por uma API independente. Pontos de integração devem ter comentários `// TODO: V2 Chrome Extension Hook`, garantindo que uma futura Extensão de Chrome possa usar a mesma API sem reescrever o backend. Usem bibliotecas de UI (Tailwind, shadcn/ui) e não reinventem a roda.

## Requirements

### R1. Frontend Flow & Mockup (Next.js + Tailwind)
Criar as páginas e componentes do fluxo PLG: Landing Page, Upload, Carregamento Interativo, e Paywall. Destaca-se a necessidade do componente "Mockup do LinkedIn", que renderiza a foto, banner, título e resumo usando variáveis dinâmicas (props) geradas pela IA.

### R2. Backend Setup (Firebase)
Criar a estrutura base de conexão e banco de dados no Firebase. Coleção de usuários, upload de arquivos (PDFs para o Storage) e status de processamento do CV (Firestore). Deve expor a estrutura para o frontend consumir o JSON da IA de forma desacoplada.

### R3. AI Prompt Engineering
Desenvolver e documentar o "Prompt Mestre de Sistema" para a API da OpenAI/Gemini. O prompt deve instruir a IA a receber o texto extraído de um CV e devolver estritamente o JSON estruturado para o frontend.

### R4. Copywriting & Growth
Fornecer textos focados em conversão e engajamento: Headline, Subheadline e CTA da Landing Page; textos curtos de engajamento para a tela de carregamento; design lógico/gatilhos mentais para o Paywall; e um roteiro curto de anúncio para Instagram Ads focado na dor da invisibilidade.

## Acceptance Criteria

### Compilação e Estrutura
- [ ] O projeto Next.js é gerado e `npm run build` ou `npm run dev` roda sem erros fatais.
- [ ] Bibliotecas de UI (Tailwind) estão configuradas.

### Entregáveis Específicos
- [ ] Existe um componente React reutilizável (ex: `LinkedInMockup.tsx`) que aceita props para renderizar o perfil dinâmico.
- [ ] Existem arquivos/serviços configurando a estrutura do Firebase (Firestore e Storage).
- [ ] Existe um arquivo (ex: `prompt_mestre.md` or na lógica do backend) detalhando o Prompt de IA que exige a saída no formato JSON especificado.
- [ ] Existe um arquivo (ex: `copy_e_growth.md`) contendo a copy da LP, textos de loading, roteiro de Ads e gatilhos mentais do paywall.
- [ ] O código (especialmente na tela de dashboard final/API) possui o comentário obrigatório `// TODO: V2 Chrome Extension Hook` para atestar o desacoplamento.

## Follow-up — 2026-06-29T04:20:38Z

# Teamwork Project Prompt — Retomada

> Status: Retomando
> Goal: Assumir o projeto a partir do ponto em que a equipe anterior parou.

Criar o MVP completo (arquitetura, código frontend, lógica de backend, prompts de IA e copy) para um SaaS de reconstrução de perfis do LinkedIn (PLG). O público-alvo são profissionais com dificuldade de posicionamento. O fluxo é: Landing Page -> Upload CV -> Carregamento Interativo -> Seleção de Cargo -> Mockup do LinkedIn -> Paywall -> Dashboard de Copiar/Colar.

Working directory: c:/Users/Abraão/Desktop/projeto-vendas-cvs-linkedin
Integrity mode: development

## INSTRUÇÕES DE RETOMADA DE PROJETO
O usuário solicitou que a simulação de 5 Agentes fosse restaurada. A equipe anterior parou por limite de cota, mas o projeto não ficou parado. Grande parte do código frontend já foi finalizado nas pastas `src/app` e `src/components`, e os arquivos `copy_e_growth.md` e `prompt_mestre.md` já existem.

Sua missão como a Equipe de Agentes é:
1. Fazer um escaneamento do que já está pronto na pasta do projeto.
2. Assumir seus papéis (Product Manager, Dev Backend, Dev Frontend, IA, Copywriter) e continuar o projeto a partir do ponto atual.
3. Focar no que falta: integração real com Firebase (Storage para os PDFs), lógica da API de reconstrução de fato consumindo IA (conforme o prompt_mestre), ou testes finais.
4. Mantenham o show rolando para o usuário, reportando os status das execuções como a equipe dos 5 agentes.

