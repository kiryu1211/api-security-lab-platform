# API Security Lab Platform

A local-first learning and verification platform for understanding common API security risks by safely comparing vulnerable examples with secure implementations.

## Purpose

Modern applications often depend on APIs as their main interface for data access and business operations. Authorization mistakes, weak authentication, excessive data exposure, missing rate limits, and unsafe outbound requests can lead to serious security incidents.

The purpose of this system is to provide an isolated environment for examining how API vulnerabilities occur and how secure design prevents them.

## Core Features

- API security learning modules based on OWASP API Security Top 10 concepts
- Vulnerable API examples for local-only demonstration
- Secure API examples that show corrected implementation patterns
- BOLA and object-level authorization scenarios
- Authentication and token handling scenarios
- Rate limiting and abuse prevention scenarios
- Mass assignment and object property authorization scenarios
- SSRF prevention scenario
- Japanese-first interface with a shared English language switcher on every screen

## Implemented Capabilities

- Next.js App Router, TypeScript, React, Zod, Vitest, ESLint, and Prettier are configured.
- The learning UI includes a topic list, topic overview, vulnerable/secure comparison view, and implementation checklist.
- UI text and learning module content are managed through Japanese and English resources instead of being embedded directly in the screen component.
- Route separation is implemented across health checks, lab samples, BOLA orders, authentication sessions, rate-limit search, profile updates, and URL fetch previews under `/api/vulnerable/*` and `/api/secure/*`.
- Shared API response helpers, Zod request validation, and safe local sample users/resources are available.
- OpenAPI specification is available at [`docs/api/openapi.json`](docs/api/openapi.json).
- The BOLA module includes runnable vulnerable and secure order APIs for comparing missing ownership checks with verified ownership checks.
- The authentication module includes runnable vulnerable and secure session APIs for comparing insufficient token validation with signature, expiration, revocation, and permission validation.
- Rate limiting, Mass Assignment, and SSRF modules include runnable vulnerable and secure APIs. SSRF demos return safe previews only and do not perform real outbound network access.
- Security verification tests confirm that every vulnerable API is disabled in production-like settings, secure APIs do not reproduce the covered vulnerabilities, OpenAPI vulnerable-route descriptions remain local-only, and Japanese/English UI text resources stay aligned.

## Safety Policy

The vulnerable examples are for controlled local verification only. They must not be deployed to a public environment. The system should clearly separate vulnerable routes from secure routes and display warnings whenever a vulnerable scenario is used.

Vulnerable API routes are enabled only when `LAB_MODE=local` and the application is not running with `NODE_ENV=production`. Secure routes remain available for comparison and verification.

SSRF demos do not perform real outbound network access from either vulnerable or secure APIs; they return verification preview metadata only.

## Usage

1. Install dependencies with `npm install`.
2. Use `.env.example` as a reference for local environment variables. Use `LAB_MODE=local` when verifying vulnerable APIs locally.
3. Start the local development server with `npm run dev`.
4. Open the learning UI in a browser and select a learning topic.
5. Use `Run API demo` in the comparison view to inspect the response differences between vulnerable and secure APIs.

Vulnerable APIs are for local verification only. Do not run them in shared or public environments.

## Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local development server.
- `npm run lint`: run ESLint.
- `npm run format`: check formatting with Prettier.
- `npm run typecheck`: run TypeScript type checking.
- `npm run test`: run the Vitest suite.
- `npm run build`: create a production build.

Run verification commands sequentially. `npm run build` and `npm run typecheck` both read Next.js generated type files under `.next/`, so they should not be run in parallel.

## Documentation

- Japanese README: [`README.ja.md`](README.ja.md)
- Proposal: [`docs/proposal.en.md`](docs/proposal.en.md)
- Requirements: [`docs/requirements.en.md`](docs/requirements.en.md)
- Design: [`docs/design.en.md`](docs/design.en.md)
- OpenAPI: [`docs/api/openapi.json`](docs/api/openapi.json)

## UI Language Policy

The default UI language is Japanese. Every screen should provide a shared language switcher that changes all visible UI text to English. Japanese and English UI text must not be mixed within the same language mode, except for established technical terms that are commonly written in English.

## Publication Safety Check

Before publication, verify that no secrets, credentials, private logs, local databases, or developer-only roadmaps are tracked by Git. Public documentation must clearly state that vulnerable demos are local-only and must not be run in public environments.
