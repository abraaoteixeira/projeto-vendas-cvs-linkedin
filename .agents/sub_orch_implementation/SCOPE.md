# Scope: Implementation

## Architecture
- Frontend: Next.js (React) + Tailwind CSS + shadcn/ui.
- Backend: Firebase (Firestore + Storage).
- Decoupled API: `/api/profile-rebuild` outputting AI JSON schema.
- Extension Hooks: comments with `// TODO: V2 Chrome Extension Hook`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Project Setup & Config | Next.js init, Tailwind, shadcn/ui, Firebase config setup | None | IN_PROGRESS |
| 2 | Growth & Copy assets | Create copy_e_growth.md and prompt_mestre.md | None | PLANNED |
| 3 | Core UI Flow Components | Landing Page, Upload, Loading, Job Selection, LinkedInMockup, Paywall, Dashboard | Setup | PLANNED |
| 4 | Firebase Integration | Firestore, Storage upload/status, API route | Core UI, Setup | PLANNED |
| 5 | E2E Suite Verification | Pass 100% E2E tests + adversarial coverage hardening | All above | PLANNED |

## Interface Contracts
### AI Output Schema (JSON)
```json
{
  "novo_titulo_linkedin": "string",
  "sobre_persuasivo": "string",
  "top_3_experiencias_reescritas": [
    "string",
    "string",
    "string"
  ]
}
```

### API Response / Dashboard Hook
- URL: `/api/profile-rebuild`
- Input: `userId` or `cvId`
- Output: The AI JSON schema
- Code Hook: `// TODO: V2 Chrome Extension Hook`
