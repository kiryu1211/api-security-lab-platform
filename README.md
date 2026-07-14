# API Security Lab Platform

A local-first learning and verification platform for understanding common API security risks by safely comparing vulnerable examples with secure implementations.

## Purpose

Modern applications often depend on APIs as their main interface for data access and business operations. Authorization mistakes, weak authentication, excessive data exposure, missing rate limits, business-flow abuse, security misconfiguration, legacy API inventory gaps, unsafe outbound requests, and overtrusted third-party API responses can lead to serious security incidents.

The purpose of this system is to provide an isolated environment for examining how API vulnerabilities occur and how secure design prevents them.

## Public Showcase

Read-only learning UI: <https://showcase.api-security-lab-platform.workers.dev/>

Live API execution is disabled on the public site. The `Show request results` control renders representative vulnerable and secure results entirely in the browser without sending an API request. Live API comparisons remain local-only.

## Core Features

- API security learning modules based on OWASP API Security Top 10 concepts
- Vulnerable API examples for local-only demonstration
- Secure API examples that show corrected implementation patterns
- BOLA and object-level authorization scenarios
- Authentication and token handling scenarios
- Rate limiting and abuse prevention scenarios
- Broken Function Level Authorization and administrative function protection scenarios
- Sensitive Business Flows and business-flow abuse prevention scenarios
- Mass assignment and object property authorization scenarios
- SSRF prevention scenario
- Security misconfiguration and diagnostic exposure control scenario
- API inventory and legacy version management scenario
- Unsafe Consumption of APIs and third-party response validation scenario
- Japanese-first interface with a shared English language switcher on every screen
- Persistent light and dark themes with sun and moon controls in the shared header
- Read-only public showcase mode that keeps learning content visible while disabling every live API endpoint

## Implemented Capabilities

- Next.js App Router, TypeScript, React, Zod, Vitest, ESLint, and Prettier are configured.
- The learning UI includes a topic list, topic overview, vulnerable/secure comparison view, visual implementation-flow annotations, and implementation checklist.
- UI text and learning module content are managed through Japanese and English resources instead of being embedded directly in the screen component.
- Route separation is implemented across health checks, lab samples, BOLA orders, authentication sessions, rate-limit search, admin invitations, business-flow reservations, profile updates, URL fetch previews, configuration diagnostics, API inventory operations, and third-party profile imports under `/api/vulnerable/*` and `/api/secure/*`.
- Shared API response helpers, Zod request validation, and synthetic local demo users and resources are available. Demo identity fields select finite scenarios; they are not authenticated principals.
- OpenAPI specification is available at [`docs/api/openapi.json`](docs/api/openapi.json).
- The BOLA module includes runnable vulnerable and secure order APIs for comparing missing ownership checks with verified ownership checks.
- The authentication module includes runnable vulnerable and secure session APIs for comparing insufficient token validation with signature, expiration, revocation, and permission validation.
- Rate limiting, Broken Function Level Authorization, Sensitive Business Flows, Mass Assignment, SSRF, Security Misconfiguration, Improper Inventory Management, and Unsafe Consumption of APIs modules include runnable vulnerable and secure APIs. Broken Function Level Authorization demos use synthetic invitation previews only and send no real email or account creation. Security Misconfiguration demos use synthetic diagnostic metadata only and expose no real configuration, secrets, or logs. Sensitive Business Flows demos use synthetic limited-product data only and perform no real purchase or external payment. Improper Inventory Management demos issue no real tokens and send no notifications. SSRF and Unsafe Consumption of APIs demos return safe previews or synthetic responses only and do not perform real outbound network access.
- The comparison view shows the full API program flow for every API1 through API10 topic, highlighting problem areas in `/api/vulnerable/*` in red and improvements in `/api/secure/*` in blue.
- Security verification tests confirm that every vulnerable API is disabled in production-like settings, secure APIs do not reproduce the covered vulnerabilities, OpenAPI vulnerable-route descriptions remain local-only, and Japanese/English UI text resources stay aligned.
- The application can be built for Cloudflare Workers with OpenNext. Public showcase mode displays the learning UI but rejects both `/api/vulnerable/*` and `/api/secure/*` before route handling.

## OWASP API Security Top 10 Reference

OWASP API Security Top 10 is a community-maintained list of the most common and impactful API-specific security risks. This lab uses the 2023 list as a learning map and currently covers API1 through API10 with runnable vulnerable/secure comparisons.

Official reference: <https://owasp.org/API-Security/editions/2023/en/0x11-t10/>

| OWASP category                                            | Lab module                                                 | Vulnerable route                             | Secure route                             |
| --------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------- | ---------------------------------------- |
| API1:2023 Broken Object Level Authorization               | BOLA and Object Ownership Checks                           | `/api/vulnerable/orders/{orderId}`           | `/api/secure/orders/{orderId}`           |
| API2:2023 Broken Authentication                           | Authentication and Token Validation                        | `/api/vulnerable/auth/session`               | `/api/secure/auth/session`               |
| API3:2023 Broken Object Property Level Authorization      | Mass Assignment and Property Authorization                 | `/api/vulnerable/profile`                    | `/api/secure/profile`                    |
| API4:2023 Unrestricted Resource Consumption               | Rate Limiting and Abuse Prevention                         | `/api/vulnerable/rate-limit/search`          | `/api/secure/rate-limit/search`          |
| API5:2023 Broken Function Level Authorization             | Function-Level Authorization for Admin Actions             | `/api/vulnerable/admin/invitations`          | `/api/secure/admin/invitations`          |
| API6:2023 Unrestricted Access to Sensitive Business Flows | Sensitive Business Flows and Abuse Controls                | `/api/vulnerable/business-flow/reservations` | `/api/secure/business-flow/reservations` |
| API7:2023 Server Side Request Forgery                     | SSRF and Outbound URL Controls                             | `/api/vulnerable/fetch-url`                  | `/api/secure/fetch-url`                  |
| API8:2023 Security Misconfiguration                       | Security Misconfiguration and Diagnostic Exposure Controls | `/api/vulnerable/config/diagnostics`         | `/api/secure/config/diagnostics`         |
| API9:2023 Improper Inventory Management                   | API Inventory and Legacy Version Management                | `/api/vulnerable/inventory/operations`       | `/api/secure/inventory/operations`       |
| API10:2023 Unsafe Consumption of APIs                     | Unsafe Consumption of Third-Party APIs                     | `/api/vulnerable/third-party/profile-import` | `/api/secure/third-party/profile-import` |

## Safety Policy

The vulnerable examples are for controlled local verification only. They must not be deployed to a public environment. The system should clearly separate vulnerable routes from secure routes and display warnings whenever a vulnerable scenario is used.

Vulnerable API routes are disabled by default. They are enabled only when `LAB_MODE=local`, `NODE_ENV` is exactly `development` or `test`, and the request URL hostname is `localhost`, `127.0.0.1`, or `::1`. When present, the `Host` header must also identify one of those loopback hosts. Invalid `LAB_MODE` values fail closed. `npm run dev` and `npm run start` bind only to `127.0.0.1`; hostname checks are defense in depth and do not make a publicly forwarded development server safe. Secure routes remain available only outside public showcase mode for comparison and verification.

Public deployments must set `PUBLIC_SHOWCASE=true` and `LAB_MODE=disabled`. Public showcase mode displays a bilingual read-only notice and a client-side request-result control while rejecting every `/api/*` request, including secure routes, with `403 PUBLIC_SHOWCASE_API_DISABLED` and `Cache-Control: no-store`. The control updates the existing result panels from static synthetic data and does not call `fetch`. Any non-empty `PUBLIC_SHOWCASE` value other than the explicit value `false` fails closed into public showcase mode.

SSRF and third-party API response demos do not perform real outbound network access from either vulnerable or secure APIs; they return verification preview metadata or synthetic responses only.

HTML and API responses apply baseline controls such as frame denial, Content Security Policy, MIME-sniffing prevention, referrer restrictions, and cache prevention. HTML receives a fresh nonce per request, which Next.js applies to its scripts; production `script-src` therefore permits neither `'unsafe-inline'` nor `'unsafe-eval'`. Nonce-bearing HTML uses `no-store`, while APIs receive a strict CSP based on `default-src 'none'`. JSON bodies require `application/json`, optionally with `charset=utf-8`, must contain valid UTF-8 and JSON, and are limited to 16 KiB by declared and actual byte size. Repeated scalar query parameters and unknown parameters on strict query schemas are rejected rather than resolved with last-value-wins behavior.

Demo `userId`, `actorUserId`, and token IDs are finite synthetic scenario selectors, not sessions or Bearer credentials. Rate-limit buckets, reservation totals, inventory, and attempt counters are single-process in-memory demo state; they reset on restart and are not production or distributed controls.

## Usage

1. Install the exact locked dependencies with `npm ci`.
2. Use `.env.example` to create an untracked `.env.local`. Set `LAB_MODE=local` explicitly only while verifying vulnerable APIs locally, then return it to `disabled`.
3. Start the local development server with `npm run dev`.
4. Open the learning UI in a browser and select a learning topic.
5. In the comparison view, inspect the vulnerable and secure routes, requests, responses, and red/blue implementation-flow annotations.
6. Use `Run API demo` to inspect the response differences between vulnerable and secure APIs.

Vulnerable APIs are for local verification only. Do not run them in shared or public environments.

The Cloudflare Workers configuration is a read-only public showcase. It exposes learning content, request examples, design differences, implementation flows, and interactive request-result panels backed by synthetic data, but it does not provide live API demos.

## Development Commands

- `npm ci`: reproducibly install dependencies locked in `package-lock.json`.
- `npm run dev`: start the local development server bound only to `127.0.0.1`.
- `npm run security:audit`: audit dependencies for known vulnerabilities.
- `npm run lint`: run ESLint.
- `npm run format`: check formatting with Prettier.
- `npm run typecheck`: run TypeScript type checking.
- `npm run test`: run the Vitest suite.
- `npm run build`: create a production build.
- `npm run build:cloudflare`: create the OpenNext Cloudflare Worker bundle.
- `npm run preview:cloudflare`: build and preview the Worker locally with workerd.
- `npm run dry-run:cloudflare`: validate the Worker upload and report its bundle size without deploying.
- `npm run deploy:cloudflare`: deploy the already built Worker with Wrangler credentials supplied by the deployment environment.

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

Before publication, verify that no secrets, credentials, private logs, local databases, or developer-only roadmaps are tracked by Git. Public documentation must clearly state that vulnerable demos are local-only and must not be run in public environments. Cloudflare account IDs and API tokens are deployment secrets and must not be stored in repository files.
