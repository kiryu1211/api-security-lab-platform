# Security Policy

Japanese version: [`SECURITY.ja.md`](SECURITY.ja.md)

## Supported Version

Security fixes are applied to the latest revision of `main`. Older commits and local modifications are not separately supported.

## Reporting a Vulnerability

Use **Security > Report a vulnerability** in the GitHub repository when private vulnerability reporting is available. Do not include secrets, credentials, personal data, real tokens, private logs, or exploit details in a public issue.

If private reporting is unavailable, open a minimal public issue asking the maintainer to provide a private contact channel. Do not include vulnerability details in that issue.

Useful reports include:

- a way to execute an API on the public showcase;
- a way to reach a vulnerable API through a non-loopback connection;
- exposure of real secrets, configuration, personal data, tokens, or logs;
- a bypass of the public-showcase, request-validation, response-header, or repository-safety boundaries; or
- a vulnerable dependency or build/deployment issue with a concrete impact on this project.

## Intended Vulnerable Behavior

The `/api/vulnerable/*` routes intentionally demonstrate insecure API behavior. That behavior is not a reportable vulnerability when all documented local-only controls remain intact: explicit local lab mode, development or test runtime, loopback URL and `Host`, and loopback-only server binding.

A bypass of any of those controls is in scope.

## Safe Research

- Test vulnerable examples only in your own local clone.
- Do not probe the public showcase, third-party systems, or infrastructure you do not own.
- Use only the synthetic data included in this repository.
- Do not submit real credentials, tokens, personal data, or logs as evidence.

Reports are reviewed as availability permits. No response or remediation deadline is guaranteed.
