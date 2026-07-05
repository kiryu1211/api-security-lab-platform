"use client";

import { useEffect, useState } from "react";

type Language = "ja" | "en";

const content = {
  ja: {
    brand: "APIセキュリティ学習・検証プラットフォーム",
    subtitle: "ローカル限定の比較学習環境",
    eyebrow: "初期実装: 安全ガードとUI基盤",
    title: "脆弱なAPIと安全なAPIを、同じ画面で比較する。",
    lead: "BOLA、認証不備、レート制限不足、Mass Assignment、SSRFを段階的に検証するための基盤です。脆弱なデモはローカル環境でのみ扱い、公開環境では有効化しません。",
    warningLabel: "ローカル限定の警告",
    warning:
      "脆弱APIは学習目的のローカル検証専用です。外部公開、共有環境、本番環境では実行しないでください。",
    statusHeading: "現在の基盤",
    routeSeparation: "ルート分離",
    routeSeparationText: "脆弱APIと安全APIを明確に分け、誤利用を避けます。",
    safetyGuard: "安全ガード",
    safetyGuardText:
      "LAB_MODEと実行環境を確認し、公開環境相当では脆弱APIを無効化します。",
    language: "言語切替",
    languageText: "日本語を初期表示とし、画面全体を英語へ切り替えます。",
    modulesHeading: "学習モジュール計画",
    ready: "基盤準備中",
    planned: "今後追加",
  },
  en: {
    brand: "API Security Lab Platform",
    subtitle: "Local-only comparative learning environment",
    eyebrow: "Initial implementation: safety guard and UI foundation",
    title: "Compare vulnerable and secure APIs on the same screen.",
    lead: "This foundation supports staged verification of BOLA, broken authentication, missing rate limits, Mass Assignment, and SSRF. Vulnerable demos are local-only and are not enabled in public environments.",
    warningLabel: "Local-only warning",
    warning:
      "Vulnerable APIs are for local learning and verification only. Do not run them in public, shared, or production environments.",
    statusHeading: "Current Foundation",
    routeSeparation: "Route separation",
    routeSeparationText:
      "Vulnerable and secure APIs stay separated to reduce accidental misuse.",
    safetyGuard: "Safety guard",
    safetyGuardText:
      "LAB_MODE and runtime environment checks disable vulnerable APIs in public-like environments.",
    language: "Language switching",
    languageText:
      "Japanese is the default, with a shared switcher for English UI text.",
    modulesHeading: "Learning Module Plan",
    ready: "Foundation ready",
    planned: "Planned",
  },
} as const;

const modules = [
  { id: "bola", title: "BOLA", state: "ready" },
  { id: "auth", title: "Authentication / Token Handling", state: "planned" },
  { id: "rate", title: "Rate Limiting", state: "planned" },
  { id: "mass-assignment", title: "Mass Assignment", state: "planned" },
  { id: "ssrf", title: "SSRF", state: "planned" },
] as const;

export function HomePage() {
  const [language, setLanguage] = useState<Language>("ja");
  const t = content[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("lab-ui-language");

    if (savedLanguage === "ja" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("lab-ui-language", language);
  }, [language]);

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand" aria-label={t.brand}>
          <span className="brand-title">{t.brand}</span>
          <span className="brand-subtitle">{t.subtitle}</span>
        </div>
        <div
          className="language-switcher"
          aria-label={language === "ja" ? "言語切替" : "Language switcher"}
        >
          <button
            type="button"
            aria-pressed={language === "ja"}
            onClick={() => handleLanguageChange("ja")}
          >
            日本語
          </button>
          <button
            type="button"
            aria-pressed={language === "en"}
            onClick={() => handleLanguageChange("en")}
          >
            English
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <span className="eyebrow">{t.eyebrow}</span>
            <h1 id="hero-title">{t.title}</h1>
            <p className="hero-lead">{t.lead}</p>
            <div className="route-tags" aria-label="API route separation">
              <span className="route-tag vulnerable">/vulnerable/*</span>
              <span className="route-tag secure">/secure/*</span>
            </div>
          </div>

          <aside className="safety-card" aria-labelledby="safety-warning-title">
            <p className="card-label" id="safety-warning-title">
              {t.warningLabel}
            </p>
            <p>{t.warning}</p>
          </aside>
        </section>

        <section className="module-section" aria-labelledby="status-heading">
          <h2 className="section-heading" id="status-heading">
            {t.statusHeading}
          </h2>
          <div className="status-grid">
            <article className="status-card">
              <strong>{t.routeSeparation}</strong>
              <p>{t.routeSeparationText}</p>
            </article>
            <article className="status-card">
              <strong>{t.safetyGuard}</strong>
              <p>{t.safetyGuardText}</p>
            </article>
            <article className="status-card">
              <strong>{t.language}</strong>
              <p>{t.languageText}</p>
            </article>
          </div>
        </section>

        <section className="module-section" aria-labelledby="modules-heading">
          <h2 className="section-heading" id="modules-heading">
            {t.modulesHeading}
          </h2>
          <div className="module-grid">
            {modules.map((module) => (
              <article
                className="module-card"
                data-state={module.state}
                key={module.id}
              >
                <strong>{module.title}</strong>
                <p>{module.state === "ready" ? t.ready : t.planned}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
