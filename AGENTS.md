# AGENTS.md - Frontend AI Collaboration Guide

## Purpose
This repository is part of an interview challenge. Use AI to speed up delivery while keeping decisions explicit, testable, and production-oriented.

## Project Context
- App: `refinery_po_frontend`
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest
- Main goals: buyer workflow clarity, supplier-rule correctness, stable routing/state, clean UX

## Agent Behavior
- Start by reading `README.md` and only the files needed for the task.
- Prefer minimal, focused edits over broad refactors.
- Keep UI behavior consistent with existing flow patterns.
- Explain assumptions when requirements are ambiguous.

## Frontend Quality Gates
Before finishing any change, run:
- `npm run lint`
- `npm run test`
- `npm run build` for routing/runtime-impacting changes

If a command cannot run, state exactly why and what remains unverified.

## Implementation Rules
- Keep TypeScript types strict; avoid `any` unless justified.
- Preserve supplier-enforcement and draft-flow logic.
- Maintain URL state behavior for search/filter/sort.
- Add tests when changing business logic, reducers/state helpers, or validation.
- Keep accessibility basics: labels, keyboard support, and semantic elements.

## AI Usage Evidence (Interview Transparency)
For substantial tasks, append a short note in your PR/summary using this template:

```md
### AI Activity Log
- Task:
- Files changed:
- AI-assisted parts:
- Human decisions/review performed:
- Verification run (lint/test/build):
```

## Non-Goals
- Do not invent new product scope.
- Do not silently change API contracts.
- Do not weaken validation, auth flow, or route protection.
