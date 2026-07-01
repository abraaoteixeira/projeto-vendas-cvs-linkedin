# Project: LinkedIn Profile Rebuilder SaaS MVP

## Architecture
This project is a PLG (Product-Led Growth) SaaS for rebuilding LinkedIn profiles.
- **Frontend**: Next.js (React) + Tailwind CSS + shadcn/ui.
- **Backend/Database**: Firebase (Firestore for status & user records, Storage for uploaded CV PDFs).
- **AI API Integration**: OpenAI/Gemini structured JSON generator (prompt-based).
- **Decoupled API**: The dashboard consumes a structured JSON containing:
  - `novo_titulo_linkedin`: string
  - `sobre_persuasivo`: string
  - `top_3_experiencias_reescritas`: array of strings
- **Extension Hooks**: Places where a future Chrome Extension could hook in must contain the comment `// TODO: V2 Chrome Extension Hook`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Project Setup & Config | Initialize Next.js with Tailwind and Firebase configuration | None | IN_PROGRESS |
| 2 | Growth & Copy assets | Create copy_e_growth.md and prompt_mestre.md | None | IN_PROGRESS |
| 3 | Core UI Flow Components | Landing, Upload, Loading, Job Selection, LinkedInMockup, Paywall, Dashboard | Setup | IN_PROGRESS |
| 4 | Firebase Integration | Firestore collections, PDF uploads, processing state, API endpoint | Core UI, Setup | IN_PROGRESS |
| 5 | E2E Suite Verification | Pass E2E tests and complete adversarial hardening | All above | PLANNED |

## Code Layout
- `/src/app` - Next.js App Router pages (layout, landing page, upload, mockup, paywall, dashboard, api)
- `/src/components` - Shared UI components (LinkedInMockup, loading spinner, buttons, etc.)
- `/src/lib` - Firebase initialization and helper functions
- `/copy_e_growth.md` - Sales copy, scripts, and mental triggers
- `/prompt_mestre.md` - AI system prompt and schema definitions

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
The frontend dashboard consumes this JSON from the API route (or Mock function for MVP), with:
- URL: `/api/profile-rebuild`
- Input: `userId` or `cvId`
- Output: The AI JSON schema
- Code Hook: `// TODO: V2 Chrome Extension Hook`
