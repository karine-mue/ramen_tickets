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

## Issue 2 — Domain model and ID policy

### Goal
Define the core domain types and ID generation contracts so all future features share a single, stable vocabulary.

### In scope
- Domain types in `src/domain/types.ts`:
  - `MealUnitOption` — a selectable option within a meal unit (e.g. size, topping).
  - `MealUnit` — a single orderable item composed of options.
  - `TransactionDraft` — an in-progress order before submission (array of `MealUnit`).
  - `OrderResult` — the confirmed result returned after submission.
  - `KitchenTicket` — the kitchen-facing representation of a confirmed order.
- Distinct branded ID types in `src/domain/ids.ts`:
  - `TransactionId` — format `YYYYMMDD-{storeId}-{kioskId}-{seq4}` (e.g. `20260503-S01-K1-0001`).
  - `OrderId` — format `YYYYMMDD-{storeId}-{seq4}` (e.g. `20260503-S01-0001`).
  - `DisplayNo` — 4-digit zero-padded sequence string (e.g. `0042`).
- ID helper functions in `src/domain/ids.ts`:
  - `createTransactionId(date: string, storeId: string, kioskId: string, seq: number): TransactionId`
  - `createOrderId(date: string, storeId: string, seq: number): OrderId`
  - `formatDisplayNo(seq: number): DisplayNo` — zero-pads to 4 digits; seq must be 0–9999.
- Canonicalization utility in `src/domain/canonicalize.ts`:
  - `canonicalize(payload: unknown): string` — returns a stable JSON string with object keys sorted recursively, suitable for idempotency key comparison.
- Tests in `src/test/domain/` covering all helpers and canonicalization edge cases.

### Out of scope
- Payment logic.
- Order server / API calls.
- Kitchen queue management.
- `localStorage` or any other persistence.
- UI changes.

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
