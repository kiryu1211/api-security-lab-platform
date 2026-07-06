export type Language = "ja" | "en";

export const defaultLanguage: Language = "ja";

export function isLanguage(value: string | null): value is Language {
  return value === "ja" || value === "en";
}

export const uiText = {
  ja: {
    languageSwitcherLabel: "言語切替",
    languageNames: {
      ja: "日本語",
      en: "English",
    },
    brand: "APIセキュリティ学習・検証プラットフォーム",
    subtitle: "ローカル限定の比較学習環境",
    nav: {
      label: "メインナビゲーション",
      topics: "学習テーマ",
      comparison: "比較ビュー",
      checklist: "チェックリスト",
    },
    routeSeparationLabel: "APIルート分離",
    hero: {
      eyebrow: "UI/UX基盤",
      title: "APIのリスクと防御策を、操作前に理解できる画面へ。",
      lead: "脆弱なAPI例と安全なAPI例を並べて確認し、リクエスト、レスポンス、設計差分、確認項目をひと続きの流れで学習します。",
    },
    warning: {
      label: "ローカル限定の警告",
      text: "脆弱APIは学習目的のローカル検証専用です。外部公開、共有環境、本番環境では実行しないでください。",
    },
    status: {
      heading: "現在の基盤",
      items: [
        {
          title: "ルート分離",
          text: "脆弱APIと安全APIを明確に分け、誤利用を避けます。",
        },
        {
          title: "安全ガード",
          text: "LAB_MODEと実行環境を確認し、公開環境相当では脆弱APIを無効化します。",
        },
        {
          title: "言語切替",
          text: "日本語を初期表示とし、画面全体を英語へ切り替えます。",
        },
      ],
    },
    topics: {
      heading: "学習テーマ一覧",
      lead: "各テーマは、リスク概要、脆弱例、安全例、チェックリストを同じ構造で確認できるようにします。",
      selectLabel: "テーマを表示",
      selectedLabel: "選択中",
      difficultyLabel: "難易度",
      progressLabel: "状態",
    },
    detail: {
      heading: "学習詳細",
      riskCategory: "リスクカテゴリ",
      vulnerableCondition: "問題が発生する条件",
      defensiveDesign: "防御方針",
    },
    comparison: {
      heading: "比較ビュー",
      vulnerable: "脆弱な実装",
      secure: "安全な実装",
      request: "リクエスト例",
      response: "レスポンス例",
      designDifference: "設計差分",
      vulnerableBadge: "ローカル限定",
      secureBadge: "防御済み",
      runDemo: "APIデモを実行",
      demoUnavailable: "このテーマの実APIデモは後続フェーズで追加します。",
      demoLoading: "APIを実行中...",
      vulnerableResult: "脆弱APIの結果",
      secureResult: "安全APIの結果",
      noResult: "まだ実行していません。",
    },
    checklist: {
      heading: "チェックリスト",
      lead: "実装時に確認すべき防御観点です。後続フェーズで進捗保存を追加します。",
    },
  },
  en: {
    languageSwitcherLabel: "Language switcher",
    languageNames: {
      ja: "Japanese",
      en: "English",
    },
    brand: "API Security Lab Platform",
    subtitle: "Local-only comparative learning environment",
    nav: {
      label: "Main navigation",
      topics: "Topics",
      comparison: "Comparison",
      checklist: "Checklist",
    },
    routeSeparationLabel: "API route separation",
    hero: {
      eyebrow: "UI/UX foundation",
      title: "Understand API risks and defenses before running demos.",
      lead: "Compare vulnerable and secure API examples side by side, then review requests, responses, design differences, and implementation checklist items in one learning flow.",
    },
    warning: {
      label: "Local-only warning",
      text: "Vulnerable APIs are for local learning and verification only. Do not run them in public, shared, or production environments.",
    },
    status: {
      heading: "Current Foundation",
      items: [
        {
          title: "Route separation",
          text: "Vulnerable and secure APIs stay separated to reduce accidental misuse.",
        },
        {
          title: "Safety guard",
          text: "LAB_MODE and runtime environment checks disable vulnerable APIs in public-like environments.",
        },
        {
          title: "Language switching",
          text: "Japanese is the default, with a shared switcher for English UI text.",
        },
      ],
    },
    topics: {
      heading: "Learning Topics",
      lead: "Each topic uses the same structure for risk overview, vulnerable example, secure example, and checklist review.",
      selectLabel: "Show topic",
      selectedLabel: "Selected",
      difficultyLabel: "Difficulty",
      progressLabel: "Status",
    },
    detail: {
      heading: "Learning Detail",
      riskCategory: "Risk category",
      vulnerableCondition: "Vulnerable condition",
      defensiveDesign: "Defensive design",
    },
    comparison: {
      heading: "Comparison View",
      vulnerable: "Vulnerable implementation",
      secure: "Secure implementation",
      request: "Request example",
      response: "Response example",
      designDifference: "Design difference",
      vulnerableBadge: "Local only",
      secureBadge: "Mitigated",
      runDemo: "Run API demo",
      demoUnavailable:
        "Live API demo for this topic will be added in a later phase.",
      demoLoading: "Running APIs...",
      vulnerableResult: "Vulnerable API result",
      secureResult: "Secure API result",
      noResult: "Not run yet.",
    },
    checklist: {
      heading: "Checklist",
      lead: "Defensive review points for implementation. Progress persistence will be added in a later phase.",
    },
  },
} as const;
