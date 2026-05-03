# MVP Scope

This document defines the minimum viable product (MVP) scope for **ramen_tickets**.

## Issue 0 — Frontend scaffold

### Goal
Create a TypeScript React app scaffold with Vite so the project has a runnable UI baseline.

### In scope
- Vite + React + TypeScript project setup.
- Root HTML shell.
- App bootstrap (`src/main.tsx`).
- Starter `App` component with clear MVP messaging.

### Out of scope
- Backend/API integration.
- Authentication.
- Persistence.
- Styling system beyond basic inline/CSS defaults.

## Issue 1 — Basic UI contract

### Goal
Provide a first-pass user-facing screen that confirms MVP boundaries and next steps.

### In scope
- App title and concise MVP description.
- Checklist of near-term implementation targets.
- Deterministic copy suitable for unit testing.

### Out of scope
- Ticket CRUD features.
- Routing.
- Complex state management.

## CI changes

### Goal
Add a GitHub Actions workflow that verifies install, lint, typecheck, and tests.

### In scope
- Node.js matrix for active LTS versions.
- `npm ci` for deterministic installs.
- `npm run lint`, `npm run typecheck`, `npm run test`.

### Out of scope
- Deployment.
- E2E/browser automation.
