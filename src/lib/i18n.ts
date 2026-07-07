export type Language = "ja" | "en";

export const defaultLanguage: Language = "ja";

export function isLanguage(value: string | null): value is Language {
  return value === "ja" || value === "en";
}

export const uiText = {
  ja: {
    languageSwitcherLabel: "言語を切り替え",
    languageNames: {
      ja: "日本語",
      en: "English",
    },
    brand: "APIセキュリティ学習・検証プラットフォーム",
    subtitle: "ローカルで安全に学ぶAPI比較環境",
    nav: {
      label: "メインナビゲーション",
      topics: "学習テーマ",
      comparison: "比較ビュー",
      checklist: "チェックリスト",
    },
    routeSeparationLabel: "APIルートの分離",
    hero: {
      eyebrow: "学習UI",
      title: "APIのリスクと防御策を、実行前に理解する。",
      lead: "脆弱なAPI例と安全なAPI例を並べ、リクエスト、レスポンス、設計の違い、確認項目を一連の流れで確認できます。",
    },
    warning: {
      label: "ローカル限定に関する注意",
      text: "脆弱APIはローカルでの学習・検証専用です。外部公開、共有環境、本番環境では実行しないでください。",
    },
    status: {
      heading: "この環境で確認できること",
      items: [
        {
          title: "ルート分離",
          text: "脆弱APIと安全APIを分けて実装し、誤用を防ぎます。",
        },
        {
          title: "安全ガード",
          text: "LAB_MODEと実行環境を確認し、公開環境に相当する設定では脆弱APIを無効化します。",
        },
        {
          title: "言語切替",
          text: "初期表示は日本語です。画面全体を英語表示へ切り替えられます。",
        },
        {
          title: "OWASP API Security Top 10",
          text: "API固有の代表的なセキュリティリスク分類を参照し、公式分類に沿って学習テーマを整理します。",
        },
      ],
    },
    topics: {
      heading: "学習テーマ一覧",
      lead: "各テーマで、リスクの概要、脆弱な例、安全な例、確認項目を同じ流れで確認できます。",
      selectLabel: "このテーマを見る",
      selectedLabel: "選択中",
      difficultyLabel: "難易度",
      progressLabel: "状態",
    },
    detail: {
      heading: "テーマの概要",
      riskCategory: "リスクカテゴリ",
      vulnerableCondition: "脆弱性が生じる条件",
      defensiveDesign: "防御設計",
    },
    comparison: {
      heading: "脆弱な例と安全な例の比較",
      vulnerable: "脆弱な例",
      secure: "安全な例",
      request: "リクエスト例",
      response: "レスポンス例",
      designDifference: "設計上の違い",
      vulnerableBadge: "ローカル限定",
      secureBadge: "対策済み",
      runDemo: "APIデモを実行",
      demoUnavailable: "このテーマの実APIデモは後続フェーズで追加します。",
      demoLoading: "APIを実行しています...",
      vulnerableResult: "脆弱APIの結果",
      secureResult: "安全APIの結果",
      noResult: "まだ実行していません。",
    },
    checklist: {
      heading: "チェックリスト",
      lead: "実装時に確認したい防御観点です。現在、進捗は保存されません。",
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
        {
          title: "OWASP API Security Top 10",
          text: "Learning topics are organized against the official API-specific risk categories.",
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
      lead: "Defensive review points for implementation. Progress is not currently saved.",
    },
  },
} as const;
