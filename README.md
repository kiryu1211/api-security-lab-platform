# API Security Lab Platform

A local-first learning and verification platform for understanding common API security risks through safe comparison between vulnerable examples and secure implementations.

## Purpose

Modern applications often depend on APIs as their main interface for data access and business operations. Authorization mistakes, weak authentication, excessive data exposure, missing rate limits, and unsafe outbound requests can lead to serious security incidents.

This system provides an isolated environment for examining how API vulnerabilities occur and how they can be mitigated through secure design.

## Core Features

- API security learning modules based on OWASP API Security Top 10 concepts
- Vulnerable API examples for local-only demonstration
- Secure API examples that show corrected implementation patterns
- BOLA and function-level authorization scenarios
- Authentication and token handling scenarios
- Rate limiting and abuse prevention scenarios
- Mass assignment and object property authorization scenarios
- SSRF prevention scenario
- Japanese-first interface with a shared English language switcher on every screen

## Safety Policy

The vulnerable examples are for controlled local verification only. They must not be deployed to a public environment. The system should clearly separate vulnerable routes from secure routes and display warnings whenever a vulnerable scenario is used.

Vulnerable API routes are enabled only when `LAB_MODE=local` and the application is not running with `NODE_ENV=production`. Secure routes remain available for comparison and verification.

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

## UI Language Policy

The default UI language is Japanese. Every screen should provide a shared language switcher that changes all visible UI text to English. Japanese and English UI text must not be mixed within the same language mode, except for established technical terms that are commonly written in English.

## Publication Policy

GitHub publication should be considered only after the core implementation and documentation are complete. Public README and `docs/` files are published together with the implemented system, not before implementation is complete. Before publication, verify that no secrets, credentials, private logs, local databases, or developer-only roadmaps are tracked. Public documentation must clearly state that vulnerable demos are local-only and non-public.
