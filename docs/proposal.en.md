# API Security Lab Platform Proposal

## Background

Web services and mobile applications often rely on APIs as the center of their functionality. Since APIs are directly consumed by frontends, mobile clients, and external services, authorization flaws, weak authentication, excessive data exposure, missing rate limits, business-flow abuse, legacy API inventory gaps, and overtrusted third-party API responses can directly affect user data and business operations.

This system is designed as an environment for examining representative API security issues by comparing vulnerable examples with secure implementations. The goal is not merely to demonstrate attacks, but to make it clear why each issue occurs and which design decisions prevent it.

## Objectives

- Understand representative risks related to the OWASP API Security Top 10 at the implementation level.
- Compare vulnerable APIs and secure APIs to clarify defensive design differences.
- Verify authorization, authentication, rate limiting, business-flow controls, API inventory management, input validation, outbound request control, and third-party API response validation.
- Define an isolation model for safely handling vulnerable demos in a local-only environment.

## Target Users

- API developer: reviews secure API design and implementation patterns.
- Security learner: understands causes and mitigations of API vulnerabilities through comparison.
- Security reviewer: organizes API security review perspectives.

## Scope

- Covers BOLA, authentication and token validation, rate limiting, Sensitive Business Flows, Mass Assignment, SSRF, Improper Inventory Management, and Unsafe Consumption of APIs as learning topics.
- Separates `/api/vulnerable/*` and `/api/secure/*` so vulnerable and secure behavior can be compared for the same topic.
- SSRF and third-party API response demos return verification preview metadata or synthetic responses only and do not perform real outbound network access.
- The UI defaults to Japanese and can be switched to English through a shared language switcher.

## Development Process Decision

An agile process is appropriate because each verification topic, such as BOLA, broken authentication, missing rate limits, Sensitive Business Flows, mass assignment, SSRF, Improper Inventory Management, and Unsafe Consumption of APIs, can be added as an independent learning module.

However, because vulnerable API examples are included, local-only execution, non-public deployment, route separation, and warning displays must be defined from the beginning.

## Learning Flow

```mermaid
flowchart TD
    A[Select learning topic] --> B[Review risk overview]
    B --> C[Run vulnerable API locally]
    C --> D[Observe vulnerable conditions]
    D --> E[Compare with secure implementation]
    E --> F[Review mitigations and design decisions]
    F --> G[Implementation checklist]
```

## UI/UX Direction

Each learning module should provide a comparison screen for the vulnerable implementation, secure implementation, request example, response example, and mitigation guidance. Screens that operate vulnerable APIs must clearly state that they are local-only and must not be publicly deployed.

The default UI language is Japanese, and every screen should include a shared language switcher. When English mode is selected, all visible UI text should be consistently displayed in English.
