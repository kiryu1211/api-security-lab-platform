"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
const openingStorageKey = "api-security-lab-opening-seen";

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
  failed?: boolean;
  vulnerable?: DemoResult;
  secure?: DemoResult;
};

type DemoEnabledModuleId = LearningModuleId;

export function HomePage() {
  const openingAutoCloseTimerRef = useRef<number | null>(null);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [openingChecked, setOpeningChecked] = useState(false);
  const [openingVisible, setOpeningVisible] = useState(false);
  const [openingLeaving, setOpeningLeaving] = useState(false);
  const [openingCompleted, setOpeningCompleted] = useState(false);
  const [contentRevealReady, setContentRevealReady] = useState(false);
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
  const openingActive = !openingChecked || openingVisible;

  useEffect(() => {
    let cancelled = false;
    let savedLanguage: string | null = null;
    let openingSeen = false;

    try {
      savedLanguage = window.localStorage.getItem(languageStorageKey);
      openingSeen = window.sessionStorage.getItem(openingStorageKey) === "seen";
    } catch {
      // Storage is optional; privacy settings must not block the application.
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (isLanguage(savedLanguage)) {
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }

    if (reduceMotion || openingSeen) {
      setOpeningChecked(true);
      setContentRevealReady(true);
      return;
    }

    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    void fontsReady.then(() => {
      if (cancelled) {
        return;
      }

      setOpeningVisible(true);
      setOpeningChecked(true);

      openingAutoCloseTimerRef.current = window.setTimeout(() => {
        openingAutoCloseTimerRef.current = null;
        setOpeningLeaving(true);
        setOpeningCompleted(true);
      }, 5000);
    });

    return () => {
      cancelled = true;

      if (openingAutoCloseTimerRef.current !== null) {
        window.clearTimeout(openingAutoCloseTimerRef.current);
        openingAutoCloseTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (openingChecked && !openingVisible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openingChecked, openingVisible]);

  useEffect(() => {
    if (!openingLeaving) {
      return;
    }

    const closeTimer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(openingStorageKey, "seen");
      } catch {
        // The opening remains session-only when storage is unavailable.
      }

      setOpeningVisible(false);
      setOpeningLeaving(false);
    }, 520);

    return () => window.clearTimeout(closeTimer);
  }, [openingLeaving]);

  useEffect(() => {
    if (!openingCompleted) {
      return;
    }

    const titleCharacterCount = Array.from(t.hero.title).length;
    const heroSequenceDuration =
      860 + Math.max(titleCharacterCount - 1, 0) * 38 + 680;
    const contentRevealTimer = window.setTimeout(() => {
      setContentRevealReady(true);
    }, heroSequenceDuration);

    return () => window.clearTimeout(contentRevealTimer);
  }, [openingCompleted, t.hero.title]);

  useEffect(() => {
    if (!contentRevealReady) {
      return;
    }

    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      revealTargets.forEach((target) => {
        target.dataset.inView = "true";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-in-view", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.16 },
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [contentRevealReady, language, selectedModuleId]);

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;

    try {
      window.localStorage.setItem(languageStorageKey, nextLanguage);
    } catch {
      // Keep the in-memory selection when persistence is unavailable.
    }
  }

  function handleSkipOpening() {
    if (openingAutoCloseTimerRef.current !== null) {
      window.clearTimeout(openingAutoCloseTimerRef.current);
      openingAutoCloseTimerRef.current = null;
    }

    setOpeningLeaving(true);
    setOpeningCompleted(true);
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
          fetch("/api/secure/rate-limit/search?userId=user-demo-alice&q=demo")
            .then(() =>
              fetch(
                "/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
              ),
            )
            .then(() =>
              fetch(
                "/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
              ),
            )
            .then(() =>
              fetch(
                "/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
              ),
            ),
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

    try {
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
    } catch {
      setDemoState((current) => ({
        ...current,
        [moduleId]: { loading: false, failed: true },
      }));
    }
  }

  return (
    <div
      className="app-shell"
      data-entry={
        !openingChecked || (openingVisible && !openingLeaving)
          ? "opening"
          : openingCompleted
            ? "opening-exit"
            : undefined
      }
    >
      {!openingChecked || openingVisible ? (
        <OpeningAnimation
          ready={openingChecked}
          leaving={openingLeaving}
          onSkip={handleSkipOpening}
          text={t.opening}
        />
      ) : null}
      <header
        className="site-header"
        aria-hidden={openingActive ? true : undefined}
        inert={openingActive ? true : undefined}
      >
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

      <main
        className="main-content"
        id="top"
        aria-hidden={openingActive ? true : undefined}
        inert={openingActive ? true : undefined}
      >
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <span className="eyebrow">{t.hero.eyebrow}</span>
            <h1 id="hero-title" aria-label={t.hero.title}>
              <span className="hero-title-characters" aria-hidden="true">
                {Array.from(t.hero.title).map((character, index) => (
                  <span
                    className="hero-title-character"
                    key={`${character}-${index}`}
                    style={
                      {
                        "--character-delay": `${440 + index * 38}ms`,
                      } as CSSProperties
                    }
                  >
                    {character === " " ? "\u00a0" : character}
                  </span>
                ))}
              </span>
            </h1>
            <p
              className="hero-lead"
              style={
                {
                  "--hero-lead-delay": `${
                    860 + Math.max(Array.from(t.hero.title).length - 1, 0) * 38
                  }ms`,
                } as CSSProperties
              }
            >
              {t.hero.lead}
            </p>
          </div>
        </section>

        <section
          className="module-section foundation-section"
          id="api-basics"
          aria-labelledby="api-basics-heading"
          data-reveal
        >
          <div className="section-copy wide">
            <h2 className="section-heading" id="api-basics-heading">
              {t.apiBasics.heading}
            </h2>
            <p>{t.apiBasics.lead}</p>
          </div>

          <article className="foundation-card" data-reveal>
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
          data-reveal
        >
          <div className="section-copy wide">
            <h2 className="section-heading" id="owasp-basics-heading">
              {t.owaspBasics.heading}
            </h2>
            <p>{t.owaspBasics.lead}</p>
          </div>

          <article className="foundation-card accent-card" data-reveal>
            <p>{t.owaspBasics.text}</p>
            <ul>
              {t.owaspBasics.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </section>

        <section
          className="module-section"
          aria-labelledby="status-heading"
          data-reveal
        >
          <h2 className="section-heading" id="status-heading">
            {t.status.heading}
          </h2>
          <div className="status-grid">
            {t.status.items.map((item) => (
              <article className="status-card" key={item.title} data-reveal>
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
          data-reveal
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
                    data-reveal
                    key={module.id}
                    type="button"
                    onClick={() => setSelectedModuleId(module.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="topic-card-topline">
                      <span>{module.riskCategory}</span>
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

            <article
              className="detail-panel"
              aria-labelledby="detail-heading"
              data-reveal
              key={selectedModule.id}
            >
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
          data-reveal
        >
          <div className="comparison-heading-row">
            <div>
              <h2 className="section-heading" id="comparison-heading">
                {t.comparison.heading}
              </h2>
              <article className="selected-topic-summary" data-reveal>
                <span className="mini-label">{t.comparison.selectedTopic}</span>
                <h3>{selectedModule.title[language]}</h3>
                <p>{selectedModule.riskCategory}</p>
                <div className="selected-topic-meta">
                  <span>
                    {t.topics.difficultyLabel}:{" "}
                    {difficultyLabels[language][selectedModule.difficulty]}
                  </span>
                </div>
              </article>
            </div>
            <aside
              className="inline-warning"
              aria-label={t.warning.label}
              data-reveal
            >
              <strong>{t.warning.label}</strong>
              <span>{t.warning.text}</span>
            </aside>
          </div>

          <div className="comparison-grid">
            <ComparisonPanel
              badge={t.comparison.vulnerableBadge}
              kind="vulnerable"
              routeDescription={t.routeDescriptions.vulnerable}
              routePattern="/api/vulnerable/*"
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
              key={`vulnerable-${selectedModule.id}`}
            />
            <ComparisonPanel
              badge={t.comparison.secureBadge}
              kind="secure"
              routeDescription={t.routeDescriptions.secure}
              routePattern="/api/secure/*"
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
              key={`secure-${selectedModule.id}`}
            />
          </div>

          <div
            className="demo-action-row"
            data-reveal
            aria-busy={
              selectedDemoModuleId
                ? demoState[selectedDemoModuleId].loading
                : undefined
            }
            aria-live="polite"
          >
            {selectedDemoModuleId ? (
              <>
                <p className="demo-safety-reminder" id="demo-local-warning">
                  <strong>{t.warning.label}: </strong>
                  {t.warning.shortText}
                </p>
                <button
                  className="run-demo-button"
                  type="button"
                  aria-describedby="demo-local-warning"
                  onClick={() => handleRunDemo(selectedDemoModuleId)}
                  disabled={demoState[selectedDemoModuleId].loading}
                >
                  {demoState[selectedDemoModuleId].loading
                    ? t.comparison.demoLoading
                    : t.comparison.runDemo}
                </button>
                {demoState[selectedDemoModuleId].failed ? (
                  <p className="demo-error" role="alert">
                    {t.comparison.demoError}
                  </p>
                ) : null}
              </>
            ) : (
              <p>{t.comparison.demoUnavailable}</p>
            )}
          </div>
        </section>

        <section
          className="module-section"
          id="checklist"
          aria-labelledby="checklist-heading"
          data-reveal
        >
          <div className="section-copy">
            <h2 className="section-heading" id="checklist-heading">
              {t.checklist.heading}
            </h2>
            <p>{t.checklist.lead}</p>
          </div>
          <div className="checklist-card" data-reveal key={selectedModule.id}>
            {selectedModule.checklist[language].map((item) => (
              <label className="checklist-item" key={item} data-reveal>
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

function OpeningAnimation({
  ready,
  leaving,
  onSkip,
  text,
}: {
  ready: boolean;
  leaving: boolean;
  onSkip: () => void;
  text: (typeof uiText)[Language]["opening"];
}) {
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ready && !leaving) {
      skipButtonRef.current?.focus();
    }
  }, [leaving, ready]);

  return (
    <section
      className="opening-overlay"
      data-state={leaving ? "leaving" : ready ? "visible" : "pending"}
      aria-label={text.title}
      aria-modal="true"
      role="dialog"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onSkip();
        }

        if (event.key === "Tab") {
          event.preventDefault();
          skipButtonRef.current?.focus();
        }
      }}
    >
      <div className="opening-grid" aria-hidden="true" />
      <div className="opening-card">
        <div className="opening-copy">
          <span className="opening-badge">{text.badge}</span>
          <h2>{text.title}</h2>
          <p>{text.lead}</p>
        </div>

        <div className="api-opening-diagram" aria-hidden="true">
          <div className="api-node client-a-node">
            <span>{text.clientA}</span>
          </div>
          <div className="api-node api-bridge-node">
            <span>{text.api}</span>
          </div>
          <div className="api-node client-b-node">
            <span>{text.clientB}</span>
          </div>
          <div className="api-node attacker-node">
            <span>{text.attacker}</span>
          </div>
          <div className="opening-lane vulnerable-lane">
            <span>{text.vulnerable}</span>
          </div>
          <div className="opening-lane secure-lane">
            <span>{text.secure}</span>
          </div>
          <div className="api-line client-a-line" />
          <div className="api-line client-b-line" />
          <div className="api-line attack-line" />
          <div className="api-line rejected-line" />
          <div className="api-packet request-packet">{text.request}</div>
          <div className="api-packet response-packet">{text.response}</div>
          <div className="api-packet attack-packet">Attack</div>
          <div className="defense-shield">
            <span>{text.blocked}</span>
          </div>
        </div>

        <div className="opening-progress" aria-hidden="true">
          <span />
        </div>
        <button
          className="opening-skip"
          ref={skipButtonRef}
          type="button"
          onClick={onSkip}
        >
          {text.skip}
        </button>
      </div>
    </section>
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
  routeDescription,
  routePattern,
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
  routeDescription: string;
  routePattern: string;
  title: string;
}) {
  return (
    <article className="comparison-panel" data-kind={kind} data-reveal>
      <div className="comparison-panel-header">
        <div>
          <span className="comparison-badge">{badge}</span>
          <h3>{title}</h3>
        </div>
        <code>{route}</code>
      </div>
      <div className={`route-explainer ${kind}`}>
        <code>{routePattern}</code>
        <p>{routeDescription}</p>
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
      <div
        className="api-result-box"
        data-has-result={result ? "true" : "false"}
      >
        <span className="mini-label">{resultTitle}</span>
        {result ? (
          <div className="demo-result-content">
            <p className="demo-result-explanation">
              <strong>{labels.resultMeaning}: </strong>
              {response}
            </p>
            <pre>{`HTTP ${result.status}\n${JSON.stringify(result.body, null, 2)}`}</pre>
          </div>
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
