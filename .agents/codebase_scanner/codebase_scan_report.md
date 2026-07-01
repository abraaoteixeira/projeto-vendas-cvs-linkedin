# Relatório de Varredura e Análise da Base de Código (Codebase Scan Report)
**Data**: 2026-06-29  
**Status**: Análise Concluída  
**Objetivo**: Analisar o estado atual da implementação do MVP do LinkedIn Profile Rebuilder, comparar com a suíte de testes E2E do Playwright e propor a estratégia de integração do Firebase e da API de reconstrução de IA.

---

## 1. O que está Totalmente Implementado

### A. Configuração e Inicialização do Firebase (`src/lib/firebase.ts`)
*   **SSR Safety**: Inicialização segura para ambientes Server-Side Rendering no Next.js usando `getApps().length === 0`.
*   **Ambiente de Desenvolvimento/Emulador**: Detecção de variáveis de ambiente (`NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'`) e conexão automática aos emuladores de Firestore (porta `8080`) e Storage (porta `9199`).
*   **Prevenção de Dupla Conexão**: Uso de flag global `globalThis._firebase_emulators_connected` para evitar travamentos decorrentes do Hot Module Replacement (HMR) do Next.js.
*   **Validação de Env**: Avisos amigáveis em console (`console.warn`) no caso de falta de chaves em produção.

### B. Arquivos de Regras e Configuração do Firebase
*   **`firebase.json`**: Configuração completa dos emuladores locais (Firestore porta `8080`, Storage porta `9199`, Emulator UI porta `4000`, e ativação do `singleProjectMode`).
*   **`firestore.rules`** & **`storage.rules`**: Regras superpermissivas configuradas (`allow read, write: if true`), ideais para desenvolvimento ágil e testes locais do MVP.

### C. Landing Page (`src/app/page.tsx`)
*   Interface totalmente implementada com Tailwind CSS e ícones do Lucide.
*   Contém todas as propostas de valor, depoimentos reais do arquivo de copy (`copy_e_growth.md`), fluxos explicativos e botões de chamada para ação (CTA) direcionando para `/upload`.
*   Estrutura responsiva (mobile, tablet, desktop).

### D. Layout Global (`src/app/layout.tsx`)
*   Configuração da fonte Inter do Google, metadados de SEO personalizados em português, palavras-chave e suporte à internacionalização (`lang="pt-BR"`).

### E. Ativos de Copywriting e Prompt de IA
*   **`copy_e_growth.md`**: Textos otimizados da Landing Page, frases de carregamento, script de anúncio de vídeo para Instagram Ads, gatilhos de paywall (ancoragem, aversão à perda, urgência suave) e copy pós-pagamento.
*   **`prompt_mestre.md`**: Definição completa do System Prompt para LLMs (OpenAI/Gemini), regras de geração e o JSON schema obrigatório para o output da IA.

### F. Suíte de Testes Playwright (`tests/`)
*   Suíte E2E detalhada com arquivos separados para cada funcionalidade (Landing Page, Upload, Loading, Cargo, Mockup, Paywall, Dashboard) e testes transversais/combinações (`cross_scenarios.spec.ts`).
*   Configuração do Playwright pronta em `playwright.config.ts`, fixtures de teste (`cv_valid.pdf`, `cv_too_large.pdf`, `cv_corrupted.pdf`, `ai_mock_response.json`) e rotina de limpeza do banco (`tests/helpers/db_cleaner.ts`).

---

## 2. O que está Parcialmente Implementado

### A. Página de Upload (`src/app/upload/page.tsx`)
*   **O que há**: Interface de drag-and-drop e input clássico de arquivo PDF, com validação básica de formato.
*   **O que falta**: Em vez de fazer upload real do PDF para o Firebase Storage e iniciar a chamada de criação, ela possui um timeout estático de `1.2s` e redireciona direto para `/loading` sem passar parâmetros cruciais como `cvId` na URL.

### B. Página de Carregamento Interativo (`src/app/loading/page.tsx`)
*   **O que há**: Exibição cíclica das frases persuasivas de loading a cada ~2 segundos e barra de progresso visual. Área para o usuário fazer upload opcional de foto de perfil e banner (salvos em `sessionStorage` como Blob URL temporário).
*   **O que falta**: O progresso visual e a transição dependem de um timer estático de `14s` (`PROCESSING_DURATION_MS`). Não há integração real de consulta ao banco de dados ou status de processamento da IA. Ao final do tempo, o usuário clica para ir direto ao `/mockup`, ignorando a etapa de seleção de cargo.

### C. Página do Mockup (`src/app/mockup/page.tsx`)
*   **O que há**: Layout que renderiza o componente de visualização.
*   **O que falta**: Consome uma constante estática e mockada de perfil (`MOCK_PROFILE_DATA`). Não realiza nenhuma requisição de dados baseada em `cvId` ou `userId`. Direciona o usuário para a rota `/paywall` via página, quando a suíte de testes E2E espera que o Paywall apareça como um **modal/overlay** no próprio `/mockup`.

### D. Componente LinkedIn Mockup (`src/components/LinkedInMockup.tsx`)
*   **O que há**: Renderiza com precisão o visual de um perfil do LinkedIn (Banner, Foto de Perfil, Nome, Conexões, Badges, seções "Sobre", "Experiência" e "Formação"). Suporta a prop `isBlurred` para a tela de paywall.
*   **O que falta**: Não possui nenhum atributo `data-testid` necessário para as asserções e manipulações do Playwright.

### E. Página do Paywall (`src/app/paywall/page.tsx`)
*   **O que há**: Exibe a oferta comercial, depoimentos rápidos e o mockup borrado.
*   **O que falta**: O botão de pagamento apenas dispara um timeout estático de `1.5s` e joga o usuário para o `/dashboard`. Não há comunicação com a API de checkout de pagamento real/simulado.

### F. Dashboard de Cópia (`src/app/dashboard/page.tsx`)
*   **O que há**: Cards contendo o Título Reconstruído, a Bio persuasiva e as Experiências. Permite copiar individualmente os blocos usando a API de Clipboard do navegador.
*   **O que falta**: Os dados exibidos são puramente estáticos/mockados. A cópia exibe "Copiado!" no próprio botão, mas não renderiza a notificação Toast exigida pelos testes (`data-testid="copy-toast"`). Não há validação se o usuário de fato realizou o pagamento (permitindo acesso direto via URL).

### G. Rotas de API (`src/app/api/`)
*   **`api/upload/route.ts`**: Apenas gera um ID aleatório (`test-cv-XXXXXX`) e retorna `201`, sem salvar arquivo ou criar registro.
*   **`api/profile-rebuild/route.ts`**: Contém regras básicas de validação (rejeita injeções simples SQL/HTML e IDs não existentes) para simular os testes, mas retorna uma estrutura estática.
*   **`api/payment-webhook/route.ts`**: Armazena pagamentos efetuados em um `Set` em memória, o que causa perda de estado se a aplicação Next.js reiniciar.

---

## 3. O que está Completamente Ausente, Incorreto ou Mockado

### A. Telas Ausentes no Fluxo Frontend
1.  **Página de Seleção de Cargo (`/select-role`)**:
    *   **Ausência**: Total. Não há pasta `src/app/select-role` no projeto.
    *   **Impacto**: Os testes `F4_role_selection.spec.ts` e `cross_scenarios.spec.ts` falham imediatamente ao tentar navegar para `/select-role?cvId=...`.
    *   **Comportamento esperado**: Deve carregar uma lista/grid de cargos comuns, com opção "Outro" que abra um input de cargo customizado (com limite de 100 caracteres e contador de caracteres). Ao confirmar, chama `POST /api/rebuild/select-role` e avança para `/mockup?cvId=...`.
2.  **Página Customizada de Erro 404 (`src/app/not-found.tsx`)**:
    *   **Ausência**: O projeto utiliza a página 404 padrão do Next.js.
    *   **Impacto**: O teste `F1-TC7: Clean 404 Routing` falha pois busca `data-testid="404-title"` e `data-testid="404-back-link"` para retornar à Home.

### B. Rotas de API Ausentes ou Parciais
1.  **`POST /api/rebuild/select-role`** *(Ausente)*: Recebe o cargo selecionado (`role`) e o `cvId`, persistindo a escolha no banco para disparar a reconstrução do perfil pela IA.
2.  **`GET /api/rebuild/status`** *(Ausente)*: Chamado pela página de loading via polling para verificar o status do processamento no Firestore (`uploaded` -> `processing` -> `ready`/`processed` -> `failed`).
3.  **`POST /api/checkout`** *(Ausente)*: Responsável por criar a sessão de pagamento (via Stripe ou simulado) e retornar a URL de checkout.
4.  **Integração real de IA com OpenAI/Gemini** *(Ausente/Mockada)*: O arquivo `src/app/api/profile-rebuild/route.ts` não possui chamada ativa a modelos de IA. O backend de extração de texto em PDF via `pdf-parse` também não está implementado na rota `/api/upload`.

### C. Falha Crítica de Seletores de Testes (`data-testid`)
Os arquivos de testes do Playwright dependem fortemente de atributos `data-testid` específicos no HTML para simular cliques e validar textos. **A base de código atual não possui quase nenhum destes seletores**. 
Abaixo está a tabela de correspondência dos seletores esperados pelos testes vs. o estado atual no código:

| Rota / Componente | Elemento Esperado no Teste | `data-testid` Esperado | Estado Atual no Código |
| :--- | :--- | :--- | :--- |
| **Landing Page** | Headline | `headline` | Ausente (apenas `h1`) |
| **Landing Page** | Subheadline | `subheadline` | Ausente (apenas `p`) |
| **Landing Page** | Botão CTA principal | `cta-button` | Ausente (usa `id="hero-cta-primary"`) |
| **Página 404** | Título de erro | `404-title` | Ausente (página padrão Next.js) |
| **Página 404** | Link para voltar | `404-back-link` | Ausente (página padrão Next.js) |
| **Upload Page** | Input invisível de arquivo | `upload-input` | Ausente (usa `id="cv-file-input"`) |
| **Upload Page** | Área de drop do arquivo | `drop-zone` | Ausente (usa `id="cv-upload-zone"`) |
| **Upload Page** | Mensagem de erro | `upload-error` | Ausente (apenas div com cor vermelha) |
| **Upload Page** | Barra de progresso | `upload-progress` | Ausente |
| **Upload Page** | Botão Cancelar upload | `upload-cancel` | Ausente |
| **Loading Page** | Spinner animado | `loading-spinner` | Ausente (apenas classes CSS) |
| **Loading Page** | Texto rotativo de status | `loading-status-text` | Ausente (usa `id="loading-message"`) |
| **Loading Page** | Mensagem de erro de falha | `processing-error` | Ausente |
| **Loading Page** | Botão tentar novamente | `retry-button` | Ausente |
| **Loading Page** | Alerta de lentidão/timeout | `loading-latency-warning`| Ausente |
| **Select Role Page**| Card de cargo customizado ("Outro")| `role-card-outro` | Rota inteira e cartões ausentes |
| **Select Role Page**| Input de cargo digitado | `custom-role-input` | Rota inteira e input ausentes |
| **Select Role Page**| Contador de caracteres | `char-counter` | Rota inteira e contador ausentes |
| **Select Role Page**| Botão Continuar | `continue-button` | Rota inteira e botão ausentes |
| **Select Role Page**| Card de cargo Fullstack | `role-card-fullstack` | Rota inteira e cartões ausentes |
| **Select Role Page**| Card de cargo Product Manager| `role-card-productmanager`| Rota inteira e cartões ausentes |
| **Select Role Page**| Botão de voltar | `back-button` | Rota inteira e botão ausentes |
| **Select Role Page**| Toast de erro de validação | `error-toast` | Rota inteira e toast ausentes |
| **LinkedInMockup** | Imagem de Banner/Capa | `mockup-banner` | Ausente |
| **LinkedInMockup** | Avatar do usuário | `mockup-avatar` | Ausente |
| **LinkedInMockup** | Título do perfil | `mockup-headline` | Ausente |
| **LinkedInMockup** | Descrição "Sobre" | `mockup-about` | Ausente |
| **LinkedInMockup** | Lista de experiências | `mockup-experience-list` | Ausente |
| **LinkedInMockup** | Item individual de experiência | `mockup-experience-item` | Ausente |
| **Mockup Page** | Botão para alternar visualização | `mockup-toggle-view` | Ausente |
| **Mockup Page** | Texto do CV original | `mockup-original-text` | Ausente |
| **Mockup Page** | Skeleton de carregamento | `mockup-skeleton` | Ausente |
| **Mockup Page** | Botão para redefinir cargo | `alter-role-btn` | Ausente |
| **Mockup Page** | Botão para abrir o Paywall | `paywall-unlock` | Ausente (usa `id="mockup-cta-paywall"`) |
| **Mockup/Paywall** | Elemento do Modal de Paywall | `paywall-modal` | Ausente (o Paywall é uma rota separada no código) |
| **Mockup/Paywall** | Botão de checkout do Stripe | `paywall-checkout-btn` | Ausente (usa `id="paywall-payment-btn"`) |
| **Mockup/Paywall** | Botão de fechar modal | `paywall-close` | Ausente |
| **Mockup/Paywall** | Feedback de pagamento cancelado| `paywall-feedback` | Ausente |
| **Dashboard Page** | Botão Copiar Título | `copy-title-btn` | Ausente (usa `id="copy-titulo"`) |
| **Dashboard Page** | Botão Copiar Sobre | `copy-about-btn` | Ausente (usa `id="copy-sobre"`) |
| **Dashboard Page** | Botão Copiar Experiências | `copy-experiences-btn` | Ausente (usa `id="copy-experiencia-X"`) |
| **Dashboard Page** | Toast de confirmação | `copy-toast` | Ausente (usa estado interno "Copiado!" no botão) |
| **Dashboard Page** | Skeleton de carregamento | `dashboard-skeleton` | Ausente |

---

## 4. Arquitetura de Fluxos e Estados

### Fluxo de Navegação e Transições de Estado no Frontend
Para atender à suíte de testes E2E do Playwright, as rotas e os parâmetros de consulta (`query params`) devem seguir a risca o modelo abaixo:

```
[Landing Page (/)]
        │ (Clique no cta-button)
        ▼
[Upload Page (/upload)] 
        │ (Upload do PDF -> chama POST /api/upload -> retorna { id: cvId })
        ▼
[Loading Page (/loading?cvId=...)]
        │ (Polling ativo para GET /api/rebuild/status?cvId=... a cada 1s)
        │ (Se status == 'processed' ou 'ready' -> Redireciona)
        ▼
[Role Selection Page (/select-role?cvId=...)]
        │ (Escolha/Digitação do Cargo -> chama POST /api/rebuild/select-role)
        ▼
[Mockup Page (/mockup?cvId=...)]
        ├── (Exibe visualização com base em GET /api/profile-rebuild?cvId=...)
        ├── (Se o usuário clica em paywall-unlock -> Abre paywall-modal)
        │         ├── (paywall-close -> Fecha modal e permanece em /mockup)
        │         └── (paywall-checkout-btn -> chama POST /api/checkout -> redireciona para Stripe)
        ▼
[Stripe Checkout Page]
        ├── (Sucesso -> Webhook atualiza status do usuário no Firestore para 'paid')
        │   └── (Stripe redireciona para /dashboard?cvId=...)
        └── (Cancelamento -> Stripe redireciona para /paywall?cvId=...&status=cancel)
              └── (Exibe alerta de erro paywall-feedback e permite reabrir pagamento)
```

#### Persistência e Recuperação de Imagens no Loading
*   As fotos de perfil e banner carregadas pelo usuário na tela de `/loading` devem ser salvas no `sessionStorage` (como DataURLs Base64 ou Object URLs locais) nas chaves `"profilePhoto"` e `"bannerPhoto"`. 
*   A página de `/mockup` deve verificar e extrair essas chaves para renderizar o avatar e o banner correspondentes, mantendo a experiência personalizada enquanto a IA gera o conteúdo de texto.

---

## 5. Estratégia de Integração e Desacoplamento

### A. Integração com Firebase Storage e Firestore
1.  **Firebase Storage**:
    *   Destino de upload dos currículos: `cvs/{userId}/{fileName}`.
    *   No ambiente local, integra-se ao Emulador de Storage na porta `9199`.
2.  **Firestore**:
    *   Documento do usuário em `users/{userId}`:
        ```typescript
        interface UserDocument {
          email?: string;
          createdAt: any; // Timestamp do Firestore
          status: "uploaded" | "processing" | "ready" | "paid" | "failed";
          cvStoragePath?: string;      // ex: "cvs/{userId}/curriculum.pdf"
          targetRole?: string;         // Preenchido após seleção de cargo
          originalCvText?: string;     // Texto extraído pelo pdf-parse
          profile?: {                  // Preenchido pela IA após reconstrução
            novo_titulo_linkedin: string;
            sobre_persuasivo: string;
            top_3_experiencias_reescritas: string[];
            titulos_alternativos?: string[]; // Bônus gerado pela IA
          }
        }
        ```

### B. Pipeline do Backend e Integração de IA
1.  **Processamento do Upload (`POST /api/upload`)**:
    *   Recebe o arquivo PDF via request body (ArrayBuffer/Blob).
    *   Gera um `userId` / `cvId` exclusivo (ou utiliza o ID do Firebase Auth Anônimo).
    *   Salva o arquivo no Firebase Storage.
    *   Cria o documento `users/{userId}` com `status: "uploaded"`.
    *   Executa server-side a extração do texto do PDF usando a biblioteca `pdf-parse`.
    *   Atualiza o documento do Firestore com `originalCvText` e define o status para `"processing"`.
2.  **Seleção de Cargo (`POST /api/rebuild/select-role`)**:
    *   Recebe `{ cvId, role }`.
    *   Salva o cargo selecionado em `targetRole` no documento correspondente.
    *   Dispara o processamento da IA de forma assíncrona ou síncrona rápida (definindo status como `"reescrevendo"` e depois `"ready"` ao finalizar).
3.  **Chamada à IA com o `prompt_mestre.md`**:
    *   Monta o prompt substituindo a variável `{{CV_TEXT}}` pelo texto extraído do currículo.
    *   Instrui o modelo (GPT-4o via biblioteca `openai` ou Gemini-1.5-pro via `@google/generative-ai`) a agir como Headhunter sênior e retornar estritamente o JSON contendo os campos:
        *   `novo_titulo_linkedin` (60-120 caracteres)
        *   `sobre_persuasivo` (200-500 caracteres)
        *   `top_3_experiencias_reescritas` (Array de 3 strings, 80-200 caracteres cada)
    *   *Nota*: Para maior robustez e garantir que o JSON retornado seja parseável, utilize a propriedade `response_format: { type: 'json_object' }` (OpenAI) ou `generationConfig: { responseMimeType: 'application/json' }` (Gemini).
4.  **Retorno da Reconstrução (`GET /api/profile-rebuild`)**:
    *   **Desacoplamento Crítico**: Esta rota atua como a única fonte de dados para o perfil reconstruído. Ela lê o nó `profile` no documento do Firestore.
    *   **Comentário Obrigatório**: Deve incluir o comentário `// TODO: V2 Chrome Extension Hook` no topo da rota.
    *   **Segurança**: O Dashboard valida se o status do usuário no Firestore é `'paid'` antes de exibir a tela. A rota `/api/profile-rebuild` também deve rejeitar requisições de leitura de dados sensíveis se o usuário não for verificado ou bloqueado (exceto as props básicas exigidas pela tela pública de mockup).

---

## 6. Próximos Passos Recomendados para Implementação

1.  **Criar a página `/select-role`**: Desenvolver a interface visual com grid de cartões e suporte a inputs customizados conforme a especificação do Playwright.
2.  **Criar a página `/not-found`**: Adicionar a página customizada de erro 404 contendo os `data-testid` apropriados.
3.  **Adicionar todos os `data-testid`**: Fazer uma varredura em `src/components/LinkedInMockup.tsx` e nas páginas de `/upload`, `/loading`, `/mockup`, `/paywall` e `/dashboard` para injetar os atributos de testes exigidos pelo Playwright.
4.  **Criar as rotas de API em falta**:
    *   `src/app/api/rebuild/status/route.ts` (polling de progresso do Firestore)
    *   `src/app/api/rebuild/select-role/route.ts` (salva o cargo e inicia a IA)
    *   `src/app/api/checkout/route.ts` (simulação ou checkout real do Stripe)
5.  **Aprimorar o pipeline de upload e IA**: Integrar o `pdf-parse` na rota de upload e injetar a chamada OpenAI/Gemini na rota de seleção de cargo utilizando as diretrizes de regras absolutas do `prompt_mestre.md`.
