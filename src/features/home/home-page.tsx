"use client";

import { useEffect, useState } from "react";
import {
  getImplementationWalkthrough,
  getLearningContextNote,
  getLearningModule,
  learningModules,
  type ImplementationLine,
  type LearningModuleId,
} from "@/data/learning-modules";
import { defaultLanguage, isLanguage, uiText, type Language } from "@/lib/i18n";

const languageStorageKey = "lab-ui-language";

const progressLabels = {
  ja: {
    ready: "実装済み",
    planned: "未実装",
  },
  en: {
    ready: "Foundation ready",
    planned: "Not implemented",
  },
} as const;

const difficultyLabels = {
  ja: {
    Basic: "基礎",
    Intermediate: "中級",
    Advanced: "応用",
  },
  en: {
    Basic: "Basic",
    Intermediate: "Intermediate",
    Advanced: "Advanced",
  },
} as const;

type DemoResult = {
  status: number;
  body: unknown;
};

type ModuleDemoState = {
  loading: boolean;
  vulnerable?: DemoResult;
  secure?: DemoResult;
};

type DemoEnabledModuleId = LearningModuleId;

export function HomePage() {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [selectedModuleId, setSelectedModuleId] =
    useState<LearningModuleId>("bola");
  const [demoState, setDemoState] = useState<
    Record<DemoEnabledModuleId, ModuleDemoState>
  >({
    bola: { loading: false },
    auth: { loading: false },
    "rate-limit": { loading: false },
    "function-auth": { loading: false },
    "business-flow": { loading: false },
    "mass-assignment": { loading: false },
    ssrf: { loading: false },
    "security-config": { loading: false },
    "api-inventory": { loading: false },
    "unsafe-consumption": { loading: false },
  });
  const t = uiText[language];
  const selectedModule = getLearningModule(selectedModuleId);
  const implementationWalkthrough =
    getImplementationWalkthrough(selectedModuleId);
  const learningContextNote = getLearningContextNote(selectedModuleId);
  const selectedDemoModuleId = isDemoEnabledModule(selectedModule.id)
    ? selectedModule.id
    : undefined;

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(languageStorageKey);

    if (isLanguage(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(languageStorageKey, language);
  }, [language]);

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
  }

  function isDemoEnabledModule(
    id: LearningModuleId,
  ): id is DemoEnabledModuleId {
    return learningModules.some(
      (module) => module.id === id && module.progress === "ready",
    );
  }

  function demoRequests(
    moduleId: DemoEnabledModuleId,
  ): [Promise<Response>, Promise<Response>] {
    switch (moduleId) {
      case "bola":
        return [
          fetch("/api/vulnerable/orders/order-demo-002"),
          fetch("/api/secure/orders/order-demo-002?userId=user-demo-alice"),
        ];
      case "auth":
        return [
          fetch("/api/vulnerable/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tokenId: "demo-token-expired-admin",
              requiredPermission: "admin:read",
            }),
          }),
          fetch("/api/secure/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tokenId: "demo-token-expired-admin",
              requiredPermission: "admin:read",
            }),
          }),
        ];
      case "rate-limit":
        return [
          fetch(
            "/api/vulnerable/rate-limit/search?userId=user-demo-alice&q=demo",
          ),
          Promise.all([
            fetch(
              "/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
            ),
            fetch(
              "/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
            ),
            fetch(
              "/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
            ),
            fetch(
              "/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
            ),
          ]).then((responses) => responses[responses.length - 1]),
        ];
      case "function-auth":
        return [
          fetch("/api/vulnerable/admin/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actorUserId: "user-demo-alice",
              targetEmailAlias: "analyst.demo",
              requestedRole: "admin",
            }),
          }),
          fetch("/api/secure/admin/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actorUserId: "user-demo-alice",
              targetEmailAlias: "analyst.demo",
              requestedRole: "admin",
            }),
          }),
        ];
      case "business-flow":
        return [
          fetch("/api/vulnerable/business-flow/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: "user-demo-alice",
              productId: "product-demo-001",
              quantity: 4,
              flowStep: "direct-checkout",
            }),
          }),
          fetch("/api/secure/business-flow/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: "user-demo-alice",
              productId: "product-demo-001",
              quantity: 4,
              flowStep: "direct-checkout",
            }),
          }),
        ];
      case "mass-assignment":
        return [
          fetch("/api/vulnerable/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayLabel: "changed-label",
              ownerId: "user-demo-bob",
              role: "reviewer",
            }),
          }),
          fetch("/api/secure/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayLabel: "changed-label",
              ownerId: "user-demo-bob",
              role: "reviewer",
            }),
          }),
        ];
      case "ssrf":
        return [
          fetch("/api/vulnerable/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: "http://127.0.0.1/admin" }),
          }),
          fetch("/api/secure/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: "https://127.0.0.1/admin" }),
          }),
        ];
      case "security-config":
        return [
          fetch("/api/vulnerable/config/diagnostics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestedOrigin: "https://untrusted.example",
              includeDebugDetails: true,
            }),
          }),
          fetch("/api/secure/config/diagnostics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestedOrigin: "https://untrusted.example",
              includeDebugDetails: true,
            }),
          }),
        ];
      case "unsafe-consumption":
        return [
          fetch("/api/vulnerable/third-party/profile-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              providerResponseId: "partner-response-redirect-admin",
              expectedProvider: "trusted-profile-service",
            }),
          }),
          fetch("/api/secure/third-party/profile-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              providerResponseId: "partner-response-redirect-admin",
              expectedProvider: "trusted-profile-service",
            }),
          }),
        ];
      case "api-inventory":
        return [
          fetch("/api/vulnerable/inventory/operations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpointId: "legacy-token-reset-v1",
              requestedEnvironment: "production",
            }),
          }),
          fetch("/api/secure/inventory/operations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpointId: "legacy-token-reset-v1",
              requestedEnvironment: "production",
            }),
          }),
        ];
    }
  }

  async function handleRunDemo(moduleId: DemoEnabledModuleId) {
    setDemoState((current) => ({ ...current, [moduleId]: { loading: true } }));

    const [vulnerableResponse, secureResponse] = await Promise.all(
      demoRequests(moduleId),
    );

    const [vulnerableBody, secureBody] = await Promise.all([
      vulnerableResponse.json(),
      secureResponse.json(),
    ]);

    setDemoState((current) => ({
      ...current,
      [moduleId]: {
        loading: false,
        vulnerable: {
          status: vulnerableResponse.status,
          body: vulnerableBody,
        },
        secure: {
          status: secureResponse.status,
          body: secureBody,
        },
      },
    }));
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label={t.brand}>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img" focusable="false">
              <path
                className="brand-mark-shield"
                d="M24 4 39 10v12c0 10-6.2 17.3-15 22-8.8-4.7-15-12-15-22V10L24 4Z"
              />
              <path
                className="brand-mark-route"
                d="M16 18h8c4.4 0 8 3.6 8 8v4"
              />
              <path className="brand-mark-route" d="M16 30h7" />
              <circle
                className="brand-mark-node vulnerable-node"
                cx="16"
                cy="18"
                r="2.6"
              />
              <circle
                className="brand-mark-node secure-node"
                cx="16"
                cy="30"
                r="2.6"
              />
              <circle
                className="brand-mark-node secure-node"
                cx="32"
                cy="30"
                r="2.6"
              />
            </svg>
          </span>
          <span className="brand-copy">
            <span className="brand-title">{t.brand}</span>
            <span className="brand-subtitle">{t.subtitle}</span>
          </span>
        </a>
        <nav className="site-nav" aria-label={t.nav.label}>
          <a href="#api-basics">{t.nav.apiBasics}</a>
          <a href="#owasp-basics">{t.nav.owaspBasics}</a>
          <a href="#topics">{t.nav.topics}</a>
          <a href="#comparison">{t.nav.comparison}</a>
          <a href="#checklist">{t.nav.checklist}</a>
        </nav>
        <div className="language-switcher" aria-label={t.languageSwitcherLabel}>
          <button
            type="button"
            aria-pressed={language === "ja"}
            onClick={() => handleLanguageChange("ja")}
          >
            {t.languageNames.ja}
          </button>
          <button
            type="button"
            aria-pressed={language === "en"}
            onClick={() => handleLanguageChange("en")}
          >
            {t.languageNames.en}
          </button>
        </div>
      </header>

      <main className="main-content" id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <span className="eyebrow">{t.hero.eyebrow}</span>
            <h1 id="hero-title">{t.hero.title}</h1>
            <p className="hero-lead">{t.hero.lead}</p>
          </div>
        </section>

        <section
          className="module-section foundation-section"
          id="api-basics"
          aria-labelledby="api-basics-heading"
        >
          <div className="section-copy wide">
            <h2 className="section-heading" id="api-basics-heading">
              {t.apiBasics.heading}
            </h2>
            <p>{t.apiBasics.lead}</p>
          </div>

          <article className="foundation-card">
            <p>{t.apiBasics.text}</p>
            <ul>
              {t.apiBasics.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </section>

        <section
          className="module-section foundation-section"
          id="owasp-basics"
          aria-labelledby="owasp-basics-heading"
        >
          <div className="section-copy wide">
            <h2 className="section-heading" id="owasp-basics-heading">
              {t.owaspBasics.heading}
            </h2>
            <p>{t.owaspBasics.lead}</p>
          </div>

          <article className="foundation-card accent-card">
            <p>{t.owaspBasics.text}</p>
            <ul>
              {t.owaspBasics.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="module-section" aria-labelledby="status-heading">
          <h2 className="section-heading" id="status-heading">
            {t.status.heading}
          </h2>
          <div className="status-grid">
            {t.status.items.map((item) => (
              <article className="status-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="module-section"
          id="topics"
          aria-labelledby="topics-heading"
        >
          <div className="section-copy">
            <h2 className="section-heading" id="topics-heading">
              {t.topics.heading}
            </h2>
            <p>{t.topics.lead}</p>
          </div>

          <div className="learning-layout">
            <div className="topic-list" aria-label={t.topics.heading}>
              {learningModules.map((module) => {
                const isSelected = module.id === selectedModule.id;

                return (
                  <button
                    className="topic-card"
                    data-selected={isSelected}
                    key={module.id}
                    type="button"
                    onClick={() => setSelectedModuleId(module.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="topic-card-topline">
                      <span>{module.riskCategory}</span>
                      <span
                        className="progress-pill"
                        data-progress={module.progress}
                      >
                        {progressLabels[language][module.progress]}
                      </span>
                    </span>
                    <strong>{module.title[language]}</strong>
                    <span className="topic-summary">
                      {module.summary[language]}
                    </span>
                    <span className="topic-meta">
                      {t.topics.difficultyLabel}:{" "}
                      {difficultyLabels[language][module.difficulty]}
                    </span>
                    <span className="topic-action">
                      {isSelected
                        ? t.topics.selectedLabel
                        : t.topics.selectLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <article className="detail-panel" aria-labelledby="detail-heading">
              <span className="eyebrow">{selectedModule.riskCategory}</span>
              <h2 id="detail-heading">{t.detail.heading}</h2>
              <h3>{selectedModule.title[language]}</h3>
              <p>{selectedModule.summary[language]}</p>
              <dl className="detail-list">
                <div>
                  <dt>{t.detail.realWorldContext}</dt>
                  <dd>{learningContextNote[language]}</dd>
                </div>
                <div>
                  <dt>{t.detail.vulnerableCondition}</dt>
                  <dd>{selectedModule.vulnerableCondition[language]}</dd>
                </div>
                <div>
                  <dt>{t.detail.defensiveDesign}</dt>
                  <dd>{selectedModule.defensiveDesign[language]}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>

        <section
          className="module-section"
          id="comparison"
          aria-labelledby="comparison-heading"
        >
          <div className="comparison-heading-row">
            <h2 className="section-heading" id="comparison-heading">
              {t.comparison.heading}
            </h2>
            <aside className="inline-warning" aria-label={t.warning.label}>
              <strong>{t.warning.label}</strong>
              <span>{t.warning.text}</span>
            </aside>
          </div>

          <div className="route-tags" aria-label={t.routeSeparationLabel}>
            <div className="route-explainer vulnerable">
              <code>/vulnerable/*</code>
              <p>{t.routeDescriptions.vulnerable}</p>
            </div>
            <div className="route-explainer secure">
              <code>/secure/*</code>
              <p>{t.routeDescriptions.secure}</p>
            </div>
          </div>

          <div className="comparison-grid">
            <ComparisonPanel
              badge={t.comparison.vulnerableBadge}
              kind="vulnerable"
              note={selectedModule.vulnerable.note[language]}
              request={selectedModule.vulnerable.request}
              response={selectedModule.vulnerable.response[language]}
              route={selectedModule.vulnerable.route}
              title={t.comparison.vulnerable}
              labels={t.comparison}
              implementation={implementationWalkthrough.vulnerable}
              language={language}
              result={
                selectedDemoModuleId
                  ? demoState[selectedDemoModuleId].vulnerable
                  : undefined
              }
              resultTitle={t.comparison.vulnerableResult}
              noResultLabel={t.comparison.noResult}
            />
            <ComparisonPanel
              badge={t.comparison.secureBadge}
              kind="secure"
              note={selectedModule.secure.note[language]}
              request={selectedModule.secure.request}
              response={selectedModule.secure.response[language]}
              route={selectedModule.secure.route}
              title={t.comparison.secure}
              labels={t.comparison}
              implementation={implementationWalkthrough.secure}
              language={language}
              result={
                selectedDemoModuleId
                  ? demoState[selectedDemoModuleId].secure
                  : undefined
              }
              resultTitle={t.comparison.secureResult}
              noResultLabel={t.comparison.noResult}
            />
          </div>

          <div className="demo-action-row">
            {selectedDemoModuleId ? (
              <button
                className="run-demo-button"
                type="button"
                onClick={() => handleRunDemo(selectedDemoModuleId)}
                disabled={demoState[selectedDemoModuleId].loading}
              >
                {demoState[selectedDemoModuleId].loading
                  ? t.comparison.demoLoading
                  : t.comparison.runDemo}
              </button>
            ) : (
              <p>{t.comparison.demoUnavailable}</p>
            )}
          </div>
        </section>

        <section
          className="module-section"
          id="checklist"
          aria-labelledby="checklist-heading"
        >
          <div className="section-copy">
            <h2 className="section-heading" id="checklist-heading">
              {t.checklist.heading}
            </h2>
            <p>{t.checklist.lead}</p>
          </div>
          <div className="checklist-card">
            {selectedModule.checklist[language].map((item) => (
              <label className="checklist-item" key={item}>
                <input type="checkbox" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ComparisonPanel({
  badge,
  kind,
  labels,
  implementation,
  language,
  note,
  noResultLabel,
  request,
  response,
  result,
  resultTitle,
  route,
  title,
}: {
  badge: string;
  kind: "vulnerable" | "secure";
  labels: (typeof uiText)[Language]["comparison"];
  implementation: {
    summary: Record<Language, string>;
    lines: ImplementationLine[];
  };
  language: Language;
  note: string;
  noResultLabel: string;
  request: string;
  response: string;
  result?: DemoResult;
  resultTitle: string;
  route: string;
  title: string;
}) {
  return (
    <article className="comparison-panel" data-kind={kind}>
      <div className="comparison-panel-header">
        <div>
          <span className="comparison-badge">{badge}</span>
          <h3>{title}</h3>
        </div>
        <code>{route}</code>
      </div>
      <div className="request-response-grid">
        <div>
          <span className="mini-label">{labels.request}</span>
          <pre>{request}</pre>
        </div>
        <div>
          <span className="mini-label">{labels.response}</span>
          <p>{response}</p>
        </div>
      </div>
      <div className="design-note">
        <span className="mini-label">{labels.designDifference}</span>
        <p>{note}</p>
      </div>
      <ImplementationWalkthroughBlock
        implementation={implementation}
        kind={kind}
        labels={labels}
        language={language}
      />
      <div className="api-result-box">
        <span className="mini-label">{resultTitle}</span>
        {result ? (
          <>
            <p className="demo-result-explanation">
              <strong>{labels.resultMeaning}: </strong>
              {response}
            </p>
            <pre>{`HTTP ${result.status}\n${JSON.stringify(result.body, null, 2)}`}</pre>
          </>
        ) : (
          <p>{noResultLabel}</p>
        )}
      </div>
    </article>
  );
}

function ImplementationWalkthroughBlock({
  implementation,
  kind,
  labels,
  language,
}: {
  implementation: {
    summary: Record<Language, string>;
    lines: ImplementationLine[];
  };
  kind: "vulnerable" | "secure";
  labels: (typeof uiText)[Language]["comparison"];
  language: Language;
}) {
  return (
    <div className="implementation-walkthrough">
      <span className="mini-label">{labels.implementation}</span>
      <p>{implementation.summary[language]}</p>
      <div className="code-walkthrough" role="list">
        {implementation.lines.map((line, index) => {
          const markerLabel =
            line.highlight === "issue" ? labels.issueLabel : labels.fixLabel;

          return (
            <div
              className="code-line"
              data-highlight={line.highlight ?? "none"}
              key={`${line.code}-${index}`}
              role="listitem"
            >
              <code>{line.code}</code>
              {line.highlight ? (
                <span className="code-comment" data-kind={kind}>
                  <strong>{markerLabel}: </strong>
                  {line.comment?.[language]}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
