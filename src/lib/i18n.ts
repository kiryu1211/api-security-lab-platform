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
    subtitle: "ローカルで安全に学ぶAPIセキュリティ",
    nav: {
      label: "メインナビゲーション",
      apiBasics: "APIとは？",
      owaspBasics: "OWASPとは？",
      topics: "学習テーマ",
      comparison: "比較ビュー",
      checklist: "チェックリスト",
    },
    routeSeparationLabel: "APIルートの分離",
    routeDescriptions: {
      vulnerable:
        "意図的に防御を弱くしたローカル専用のデモAPIです。所有者確認不足、弱い認証、設定不備など、問題が起きる条件を安全な合成データで観察するために使います。公開環境では無効化されます。",
      secure:
        "同じシナリオに対する安全なAPI実装例です。認可、入力検証、レート制限、セキュリティヘッダー、外部入力の検証など、防御策を脆弱APIと比較できます。",
    },
    hero: {
      eyebrow: "OWASP API Security Top 10対応",
      title: "APIセキュリティリスクラボ",
      lead: "脆弱なAPI例と安全なAPI例を並べ、リクエスト、レスポンス、設計の違い、確認項目を一連の流れで確認できます。",
    },
    apiBasics: {
      heading: "APIとは？",
      lead: "APIセキュリティを理解する前に、APIが何を公開し、どのようにアプリケーション同士をつなぎ、なぜ攻撃面になりやすいのかを確認します。",
      text: "APIは、アプリケーション同士が決められた形式でリクエストとレスポンスをやり取りするためのインターフェースです。Web APIでは、クライアントがHTTPメソッド、URL、ヘッダー、本文を使ってサーバーに要求を送り、サーバーはJSONなどのデータとステータスコードで結果を返します。画面操作の裏側で注文、プロフィール更新、検索、外部サービス連携などを動かす入口になるため、APIエンドポイントは機能そのものだけでなく、データ、権限、業務フローへの入口にもなります。",
      points: [
        "APIは画面とは別に直接呼び出せるため、フロントエンドの表示制御だけでは防御になりません。",
        "各エンドポイントでは、誰が、どのリソースに、どの操作を、どの条件で行えるかをサーバー側で確認する必要があります。",
        "REST APIでは、標準的なHTTPメソッド、適切なステータスコード、入力検証、アクセス制御、監査しやすいエラー設計が重要です。",
      ],
    },
    owaspBasics: {
      heading: "OWASP API Security Top 10とは？",
      lead: "APIで特に起きやすい代表的なセキュリティリスクを整理し、設計・実装・テストで見落としやすい観点を確認するための分類です。",
      text: "OWASP API Security Top 10は、APIで特に起きやすい代表的なセキュリティリスクを整理した分類です。2023年版では、オブジェクト単位の認可不足、認証の不備、プロパティ単位の認可不足、リソース消費、機能単位の認可、業務フローの悪用、SSRF、設定不備、APIインベントリ管理、外部API応答の過信が扱われます。これはチェックリストを暗記するためのものではなく、APIを設計・実装・テストするときに、どの信頼境界と悪用パターンを見落としやすいかを考えるための地図です。",
      points: [
        "APIはID、トークン、JSONプロパティ、URL、外部API応答など、画面より細かい単位で入力を受け取るため、リスクも細かい粒度で現れます。",
        "同じログイン済みユーザーでも、リソース所有者、ロール、業務状態、リクエスト頻度、APIバージョンによって許可すべき操作は変わります。",
        "このラボではAPI1からAPI10までを、ローカル限定の脆弱APIと安全APIの比較で確認し、実データ、実秘密情報、実外部通信を使わずに学習できます。",
      ],
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
      ],
    },
    topics: {
      heading: "学習テーマ一覧",
      lead: "各テーマでは、どのような設計ミスで脆弱性が生じるのか、攻撃者が何を悪用できるのか、安全なAPIではどの確認を追加するのかを同じ流れで確認できます。",
      selectLabel: "このテーマを見る",
      selectedLabel: "選択中",
      difficultyLabel: "難易度",
      progressLabel: "状態",
    },
    detail: {
      heading: "テーマの概要",
      riskCategory: "リスクカテゴリ",
      realWorldContext: "実際の利用場面と実害の例",
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
      implementation: "実装の流れ",
      issueLabel: "問題箇所",
      fixLabel: "改善箇所",
      vulnerableBadge: "ローカル限定",
      secureBadge: "対策済み",
      runDemo: "APIデモを実行",
      demoUnavailable: "このテーマでは実行可能なAPIデモが定義されていません。",
      demoLoading: "APIを実行しています...",
      vulnerableResult: "脆弱APIの結果",
      secureResult: "安全APIの結果",
      resultMeaning: "この結果が表すこと",
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
    subtitle: "Local-first API security learning",
    nav: {
      label: "Main navigation",
      apiBasics: "API Basics",
      owaspBasics: "OWASP Top 10",
      topics: "Topics",
      comparison: "Comparison",
      checklist: "Checklist",
    },
    routeSeparationLabel: "API route separation",
    routeDescriptions: {
      vulnerable:
        "Local-only demo APIs with intentionally weakened defenses. They use safe synthetic data to show where issues such as missing ownership checks, weak authentication, or misconfiguration appear, and are disabled in public-like environments.",
      secure:
        "Secure API examples for the same scenarios. Compare authorization, input validation, rate limiting, security headers, and external-input checks against the vulnerable behavior.",
    },
    hero: {
      eyebrow: "OWASP API Security Top 10 aligned",
      title: "API Security Risk Lab",
      lead: "Compare vulnerable and secure API examples side by side, then review requests, responses, design differences, and implementation checklist items in one learning flow.",
    },
    apiBasics: {
      heading: "What Is an API?",
      lead: "Before learning API security, review what APIs expose, how they connect applications, and why they become important attack surfaces.",
      text: "An API is an interface that lets applications exchange requests and responses through agreed rules. In a Web API, a client sends an HTTP method, URL, headers, and body to a server, and the server returns data such as JSON plus a status code. Because APIs power actions such as orders, profile updates, search, and service integrations behind the UI, an API endpoint is also an entry point to data, permissions, and business workflows.",
      points: [
        "APIs can be called directly outside the visible UI, so frontend display rules are not a security boundary.",
        "Each endpoint must verify who is calling, which resource is targeted, which operation is requested, and under what conditions it is allowed.",
        "For REST APIs, standard HTTP methods, meaningful status codes, input validation, access control, and auditable error handling are core security concerns.",
      ],
    },
    owaspBasics: {
      heading: "What Is OWASP API Security Top 10?",
      lead: "It is a classification for common API-specific security risks and a guide to what API design, implementation, and testing often miss.",
      text: "OWASP API Security Top 10 is a classification of common security risks that are especially relevant to APIs. The 2023 edition covers object-level authorization, authentication, object-property authorization, resource consumption, function-level authorization, sensitive business flows, SSRF, security misconfiguration, inventory management, and unsafe consumption of third-party APIs. It is not a list to memorize; it is a map for thinking about trust boundaries and abuse patterns that API design, implementation, and testing often miss.",
      points: [
        "APIs accept IDs, tokens, JSON properties, URLs, and third-party responses, so failures often appear at finer granularity than page-level access control.",
        "Even for an authenticated user, the allowed operation changes by resource ownership, role, workflow state, request rate, and API version.",
        "This lab maps API1 through API10 to local-only vulnerable and secure comparisons without real data, real secrets, or real external calls.",
      ],
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
      lead: "Each topic explains what design mistake creates the weakness, what an attacker can abuse, and what checks the secure API adds.",
      selectLabel: "Show topic",
      selectedLabel: "Selected",
      difficultyLabel: "Difficulty",
      progressLabel: "Status",
    },
    detail: {
      heading: "Learning Detail",
      riskCategory: "Risk category",
      realWorldContext: "Where this appears and why it matters",
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
      implementation: "Implementation flow",
      issueLabel: "Problem area",
      fixLabel: "Improvement area",
      vulnerableBadge: "Local only",
      secureBadge: "Mitigated",
      runDemo: "Run API demo",
      demoUnavailable: "No runnable API demo is defined for this topic.",
      demoLoading: "Running APIs...",
      vulnerableResult: "Vulnerable API result",
      secureResult: "Secure API result",
      resultMeaning: "What this result means",
      noResult: "Not run yet.",
    },
    checklist: {
      heading: "Checklist",
      lead: "Defensive review points for implementation. Progress is not currently saved.",
    },
  },
} as const;
