# BRIEFING — 2026-06-28T19:46:00-03:00

## Mission
Build the LinkedIn Profile Rebuilder SaaS MVP including frontend flow, Firebase setup, AI prompt engineering, and copywriting.

## 🔒 My Identity
- Archetype: Project Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\orchestrator\
- Original parent: parent
- Original parent conversation ID: 87bc756c-d505-4ffa-a4fe-35f180ce5cf6

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\PROJECT.md
1. **Decompose**: Decomposed into 5 implementation milestones and E2E test suite.
2. **Dispatch & Execute**:
   - **Delegate (sub-orchestrator)**: Spawn sub-orchestrators for milestones or parallel tracks.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Project Setup & Config [pending]
  2. Growth & Copy assets [pending]
  3. Core UI Flow Components [pending]
  4. Firebase Integration [pending]
  5. E2E Suite Verification [pending]
- **Current phase**: 1
- **Current focus**: Project Setup & Config

## 🔒 Key Constraints
- CODE_ONLY network mode: No external HTTP client calls.
- DO NOT enable BBR2 (keep CUBIC).
- DO NOT enable Npcap Loopback Adapter.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.

## Current Parent
- Conversation ID: 8b4f67c4-2133-4870-8ed8-ff1f6c280fc9
- Updated: 2026-06-29T04:21:02Z

## Key Decisions Made
- Chose Next.js + Tailwind for frontend, Firebase for backend (Firestore + Storage), OpenAI/Gemini for AI, and standard directory layout.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| Codebase Scanner | teamwork_preview_explorer | Scan codebase and report current implementation status | COMPLETED | bccd38f3-6047-4603-94b3-4f8eddd56b35 |
| Lead Developer | teamwork_preview_worker | Implement all missing/partial MVP pages/APIs and run Playwright E2E verification | IN_PROGRESS | 21b7fb0a-1bbc-4d23-b18f-3c0658f7ce32 |

## Succession Status
- Succession required: no
- Spawn count: 4 / 16
- Pending subagents: 21b7fb0a-1bbc-4d23-b18f-3c0658f7ce32
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 78dc1049-4c05-486a-b44e-29c65580fbcd/task-22
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run manage_task(Action="list") — re-create if missing

## Artifact Index
- c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\PROJECT.md — Project Scope & Architecture
- c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\orchestrator\BRIEFING.md — Briefing & Memory
- c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\orchestrator\progress.md — Heartbeat & Checkpoints
