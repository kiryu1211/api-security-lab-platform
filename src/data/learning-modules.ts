import type { Language } from "@/lib/i18n";

export type LearningModuleId =
  | "bola"
  | "auth"
  | "rate-limit"
  | "business-flow"
  | "mass-assignment"
  | "ssrf"
  | "api-inventory"
  | "unsafe-consumption";

export type LearningModule = {
  id: LearningModuleId;
  riskCategory: string;
  difficulty: "Basic" | "Intermediate" | "Advanced";
  progress: "ready" | "planned";
  title: Record<Language, string>;
  summary: Record<Language, string>;
  vulnerableCondition: Record<Language, string>;
  defensiveDesign: Record<Language, string>;
  vulnerable: {
    route: string;
    request: string;
    response: Record<Language, string>;
    note: Record<Language, string>;
  };
  secure: {
    route: string;
    request: string;
    response: Record<Language, string>;
    note: Record<Language, string>;
  };
  checklist: Record<Language, string[]>;
};

export const learningModules: LearningModule[] = [
  {
    id: "bola",
    riskCategory: "OWASP API1:2023 BOLA",
    difficulty: "Basic",
    progress: "ready",
    title: {
      ja: "BOLAとオブジェクト単位の認可確認",
      en: "BOLA and Object Ownership Checks",
    },
    summary: {
      ja: "他ユーザーのリソースIDを指定したときに、APIが所有者を確認するかどうかを比較します。",
      en: "Compare whether the API checks resource ownership when another user's resource ID is supplied.",
    },
    vulnerableCondition: {
      ja: "リソースIDだけで注文を取得し、認証済みユーザーと所有者の関係を確認していない。",
      en: "The API fetches an order by resource ID only and does not verify the relationship between the authenticated user and the owner.",
    },
    defensiveDesign: {
      ja: "注文ID、ユーザーID、所有者IDを照合し、所有者ではないユーザーからのリクエストを拒否する。",
      en: "Compare the order ID, signed-in user ID, and owner ID, then reject requests from non-owners.",
    },
    vulnerable: {
      route: "/api/vulnerable/orders/{orderId}",
      request: "GET /api/vulnerable/orders/order-demo-002",
      response: {
        ja: "所有者を確認せず、IDに一致する注文情報を返します。",
        en: "Expected to return order data fetched by ID only.",
      },
      note: {
        ja: "ローカル限定の脆弱な例として、安全ガードを通過した場合だけ動作します。",
        en: "This route is treated as a local-only vulnerable example.",
      },
    },
    secure: {
      route: "/api/secure/orders/{orderId}",
      request: "GET /api/secure/orders/order-demo-002?userId=user-demo-alice",
      response: {
        ja: "所有者が一致しない場合は403を返します。",
        en: "Expected to return 403 when the owner does not match.",
      },
      note: {
        ja: "安全APIでは、API層で所有者確認を行います。",
        en: "The secure API always performs ownership checks in the API layer.",
      },
    },
    checklist: {
      ja: [
        "リソースIDだけでアクセス可否を判断していない。",
        "認証済みユーザーとリソース所有者をAPI層で照合している。",
        "拒否時に過剰なリソース情報を返していない。",
      ],
      en: [
        "Access decisions are not based on resource ID alone.",
        "The API layer compares the authenticated user with the resource owner.",
        "Rejected responses do not expose excessive resource information.",
      ],
    },
  },
  {
    id: "auth",
    riskCategory: "OWASP API2:2023 Broken Authentication",
    difficulty: "Intermediate",
    progress: "ready",
    title: {
      ja: "認証とトークン検証",
      en: "Authentication and Token Validation",
    },
    summary: {
      ja: "不十分な認証やトークン検証が、API利用者のなりすましにつながる流れを確認します。",
      en: "Review how weak authentication and improper token validation can lead to API user impersonation.",
    },
    vulnerableCondition: {
      ja: "署名、期限、失効状態、権限を十分に確認しないままトークンを受け入れている。",
      en: "The API accepts a token without sufficiently validating signature, expiration, revocation state, and permissions.",
    },
    defensiveDesign: {
      ja: "署名、期限、失効状態、権限を検証し、検証に失敗した場合は一貫したエラーで拒否する。",
      en: "Validate signature, expiration, revocation, and permissions, then reject failures with consistent errors.",
    },
    vulnerable: {
      route: "/api/vulnerable/auth/session",
      request:
        'POST /api/vulnerable/auth/session\n{\n  "tokenId": "demo-token-expired-admin",\n  "requiredPermission": "admin:read"\n}',
      response: {
        ja: "トークンIDの存在だけを見て、セッションを受け入れます。",
        en: "Expected to accept a session with weak validation.",
      },
      note: {
        ja: "実トークンや秘密情報はサンプルに含めません。",
        en: "Real tokens and secrets are not included in samples.",
      },
    },
    secure: {
      route: "/api/secure/auth/session",
      request:
        'POST /api/secure/auth/session\n{\n  "tokenId": "demo-token-expired-admin",\n  "requiredPermission": "admin:read"\n}',
      response: {
        ja: "検証に失敗したトークンを拒否します。",
        en: "Expected to reject tokens that fail validation.",
      },
      note: {
        ja: "安全APIでは、署名状態、期限、失効状態、権限を明示的に確認します。",
        en: "The secure API explicitly checks expiration, revocation, and permissions.",
      },
    },
    checklist: {
      ja: [
        "署名と期限を検証している。",
        "失効状態を確認している。",
        "権限不足を安全に拒否している。",
      ],
      en: [
        "Signature and expiration are validated.",
        "Revocation state is checked.",
        "Insufficient permissions are safely rejected.",
      ],
    },
  },
  {
    id: "rate-limit",
    riskCategory: "OWASP API4:2023 Unrestricted Resource Consumption",
    difficulty: "Intermediate",
    progress: "ready",
    title: {
      ja: "レート制限と自動化悪用対策",
      en: "Rate Limiting and Abuse Prevention",
    },
    summary: {
      ja: "過剰なリクエストを制限しないAPIと、利用者・送信元・ルート単位で制御するAPIを比較します。",
      en: "Compare APIs without request limits against APIs controlled per user, IP address, and route.",
    },
    vulnerableCondition: {
      ja: "短時間に大量のリクエストを受けても制限せず、処理資源を消費し続ける。",
      en: "The API continues consuming resources even when many requests are sent in a short time.",
    },
    defensiveDesign: {
      ja: "利用者や送信元ごとに回数と時間枠を管理し、上限を超えた場合は429を返す。",
      en: "Track counts and windows per user or source, then return 429 when limits are exceeded.",
    },
    vulnerable: {
      route: "/api/vulnerable/rate-limit/search",
      request: "GET /api/vulnerable/rate-limit/search?q=demo",
      response: {
        ja: "リクエスト回数を制限せずに処理を続けます。",
        en: "Expected to continue processing without limits.",
      },
      note: {
        ja: "ローカル検証でも高負荷にならないよう、デモ用の軽い処理だけを行います。",
        en: "The lab design avoids high-load execution even during local verification.",
      },
    },
    secure: {
      route: "/api/secure/rate-limit/search",
      request: "GET /api/secure/rate-limit/search?q=demo",
      response: {
        ja: "上限を超えた場合は429を返します。",
        en: "Expected to return 429 when the limit is exceeded.",
      },
      note: {
        ja: "安全APIでは、上限を超えた場合に明確なエラーを返します。",
        en: "The secure API makes limits and errors explicit.",
      },
    },
    checklist: {
      ja: [
        "ルートごとの上限を定義している。",
        "ユーザーまたは送信元単位で制限している。",
        "上限超過時に安全なエラーを返している。",
      ],
      en: [
        "Per-route limits are defined.",
        "Limits are applied per user or source.",
        "Safe errors are returned when limits are exceeded.",
      ],
    },
  },
  {
    id: "business-flow",
    riskCategory: "OWASP API6:2023 Sensitive Business Flows",
    difficulty: "Advanced",
    progress: "ready",
    title: {
      ja: "Sensitive Business Flowsと業務フロー悪用対策",
      en: "Sensitive Business Flows and Abuse Controls",
    },
    summary: {
      ja: "限定在庫の予約フローを例に、業務上重要なAPIが自動化やフロー飛ばしを制御できるかを比較します。",
      en: "Use a limited-stock reservation flow to compare whether a business-critical API controls automation and skipped workflow steps.",
    },
    vulnerableCondition: {
      ja: "購入や予約などの重要な業務フローで、フロー順序、ユーザー単位上限、在庫制約を確認していない。",
      en: "A sensitive purchase or reservation flow does not verify workflow order, per-user limits, or stock constraints.",
    },
    defensiveDesign: {
      ja: "業務上重要な操作を特定し、フロー順序、数量上限、在庫確認、自動化の兆候をAPI層で検証する。",
      en: "Identify business-critical operations and validate workflow order, quantity limits, stock state, and automation signals in the API layer.",
    },
    vulnerable: {
      route: "/api/vulnerable/business-flow/reservations",
      request:
        'POST /api/vulnerable/business-flow/reservations\n{\n  "userId": "user-demo-alice",\n  "productId": "product-demo-001",\n  "quantity": 4,\n  "flowStep": "direct-checkout"\n}',
      response: {
        ja: "フロー順序やユーザー単位上限を確認せず、過剰な予約を受け入れます。",
        en: "Expected to accept excessive reservations without workflow or per-user limit checks.",
      },
      note: {
        ja: "合成した限定商品データのみを使い、実際の購入や外部決済は行いません。",
        en: "The demo uses synthetic limited-product data only and performs no real purchase or external payment.",
      },
    },
    secure: {
      route: "/api/secure/business-flow/reservations",
      request:
        'POST /api/secure/business-flow/reservations\n{\n  "userId": "user-demo-alice",\n  "productId": "product-demo-001",\n  "quantity": 4,\n  "flowStep": "direct-checkout"\n}',
      response: {
        ja: "フロー順序違反やユーザー単位上限超過を403で拒否します。",
        en: "Expected to return 403 for skipped workflow steps or exceeded per-user limits.",
      },
      note: {
        ja: "安全APIでは、業務フロー固有のルールを認可・不正利用対策として扱います。",
        en: "The secure API treats business-flow rules as authorization and abuse-prevention controls.",
      },
    },
    checklist: {
      ja: [
        "業務上重要なAPI操作を特定している。",
        "フロー順序と状態遷移をAPI層で検証している。",
        "ユーザー単位の数量上限や在庫制約を確認している。",
        "自動化による過剰利用を検知・制限する観点を持っている。",
      ],
      en: [
        "Business-critical API operations are identified.",
        "Workflow order and state transitions are validated in the API layer.",
        "Per-user quantity limits and stock constraints are checked.",
        "Automated excessive use is considered and constrained.",
      ],
    },
  },
  {
    id: "mass-assignment",
    riskCategory: "OWASP API3:2023 Broken Object Property Level Authorization",
    difficulty: "Intermediate",
    progress: "ready",
    title: {
      ja: "Mass Assignmentとプロパティ認可",
      en: "Mass Assignment and Property Authorization",
    },
    summary: {
      ja: "許可していないプロパティ更新を受け入れるAPIと、許可リストで更新項目を制限するAPIを比較します。",
      en: "Compare APIs that accept unauthorized property updates against APIs that restrict updates with allowlists.",
    },
    vulnerableCondition: {
      ja: "リクエストボディ全体をそのまま更新処理に渡し、roleやownerIdなどの項目まで変更できてしまう。",
      en: "The full request body is passed into update logic, allowing fields such as role or ownerId to be changed.",
    },
    defensiveDesign: {
      ja: "更新できる項目だけをスキーマと許可リストで受け取り、権限が必要な項目は通常の更新処理から分離する。",
      en: "Accept only allowed fields through schemas and allowlists, then separately authorize sensitive fields.",
    },
    vulnerable: {
      route: "/api/vulnerable/profile",
      request:
        'PATCH /api/vulnerable/profile\n{\n  "displayLabel": "changed-label",\n  "ownerId": "user-demo-bob",\n  "role": "reviewer"\n}',
      response: {
        ja: "許可していない項目まで更新対象として受け入れます。",
        en: "Expected to update fields that should not be accepted.",
      },
      note: {
        ja: "サンプルには実在する個人情報を含めません。",
        en: "Samples do not include real personal data.",
      },
    },
    secure: {
      route: "/api/secure/profile",
      request:
        'PATCH /api/secure/profile\n{\n  "displayLabel": "changed-label",\n  "ownerId": "user-demo-bob",\n  "role": "reviewer"\n}',
      response: {
        ja: "許可リストにない項目を拒否します。",
        en: "Expected to reject fields outside the allowlist.",
      },
      note: {
        ja: "安全APIでは、Zodスキーマと許可リストで更新項目を絞り込みます。",
        en: "The secure API narrows input with Zod schemas.",
      },
    },
    checklist: {
      ja: [
        "更新可能なプロパティを明示している。",
        "許可リスト外の値を保存していない。",
        "権限が必要な項目を通常更新から分離している。",
      ],
      en: [
        "Updatable properties are explicit.",
        "Values outside the allowlist are not stored.",
        "Privileged fields are separated from normal updates.",
      ],
    },
  },
  {
    id: "ssrf",
    riskCategory: "OWASP API7:2023 Server Side Request Forgery",
    difficulty: "Advanced",
    progress: "ready",
    title: {
      ja: "SSRFと外部URL取得制御",
      en: "SSRF and Outbound URL Controls",
    },
    summary: {
      ja: "任意URLを受け入れる危険性と、許可リスト、プライベートIP拒否、リダイレクト制御による防御を比較します。",
      en: "Compare arbitrary URL fetching risks with defenses using allowlists, private IP rejection, and redirect controls.",
    },
    vulnerableCondition: {
      ja: "利用者が指定したURLを検証せず、サーバー側の処理対象として受け入れてしまう。",
      en: "The server fetches a user-supplied URL without validation.",
    },
    defensiveDesign: {
      ja: "許可したホストだけを対象にし、プライベートIP、リダイレクト、タイムアウトを制御する。",
      en: "Fetch only allowed hosts while controlling private IP ranges, redirects, and timeouts.",
    },
    vulnerable: {
      route: "/api/vulnerable/fetch-url",
      request:
        'POST /api/vulnerable/fetch-url\n{\n  "url": "http://127.0.0.1/admin"\n}',
      response: {
        ja: "任意URLを受け入れたことを示すプレビューを返します。実ネットワークアクセスは行いません。",
        en: "Expected to accept arbitrary URLs for preview without performing real network access.",
      },
      note: {
        ja: "ローカル限定でも、内部ネットワークへの実アクセスは行いません。",
        en: "The lab avoids real access to internal networks even in local-only mode.",
      },
    },
    secure: {
      route: "/api/secure/fetch-url",
      request:
        'POST /api/secure/fetch-url\n{\n  "url": "https://127.0.0.1/admin"\n}',
      response: {
        ja: "許可されていないURLを拒否します。",
        en: "Expected to reject URLs that are not allowed.",
      },
      note: {
        ja: "安全APIでは、許可リスト、IP範囲、リダイレクト、タイムアウトを確認します。",
        en: "The secure API checks allowlists, IP ranges, redirects, and timeouts.",
      },
    },
    checklist: {
      ja: [
        "許可リストにないホストを拒否している。",
        "プライベートIP範囲を拒否している。",
        "リダイレクト回数とタイムアウトを制御している。",
      ],
      en: [
        "Hosts outside the allowlist are rejected.",
        "Private IP ranges are rejected.",
        "Redirect counts and timeouts are controlled.",
      ],
    },
  },
  {
    id: "unsafe-consumption",
    riskCategory: "OWASP API10:2023 Unsafe Consumption of APIs",
    difficulty: "Advanced",
    progress: "ready",
    title: {
      ja: "外部API応答の過信と検証",
      en: "Unsafe Consumption of Third-Party APIs",
    },
    summary: {
      ja: "外部APIから返る合成応答を例に、提供元、リダイレクト先、応答スキーマ、権限フィールドを検証する重要性を比較します。",
      en: "Use synthetic third-party API responses to compare validation of provider identity, redirect targets, response schema, and privileged fields.",
    },
    vulnerableCondition: {
      ja: "信頼済みの外部APIから返ったデータだとみなし、リダイレクト先や権限に関わるフィールドを検証せずに取り込んでいる。",
      en: "The API assumes third-party data is trusted and imports redirect targets or privileged fields without validation.",
    },
    defensiveDesign: {
      ja: "外部API応答も利用者入力と同じ信頼境界の外側として扱い、提供元、TLS前提、リダイレクト許可先、応答サイズ、スキーマ、許可フィールドを検証する。",
      en: "Treat third-party API responses as outside the trust boundary and validate provider identity, TLS assumptions, redirect allowlists, payload size, schema, and allowed fields.",
    },
    vulnerable: {
      route: "/api/vulnerable/third-party/profile-import",
      request:
        'POST /api/vulnerable/third-party/profile-import\n{\n  "providerResponseId": "partner-response-redirect-admin",\n  "expectedProvider": "trusted-profile-service"\n}',
      response: {
        ja: "合成外部応答のリダイレクト先やadminロールを検証せずに受け入れます。",
        en: "Expected to accept the synthetic partner redirect target and admin role without validation.",
      },
      note: {
        ja: "実際の外部API通信は行わず、合成した外部応答だけを使用します。",
        en: "The demo performs no real third-party API calls and uses synthetic external responses only.",
      },
    },
    secure: {
      route: "/api/secure/third-party/profile-import",
      request:
        'POST /api/secure/third-party/profile-import\n{\n  "providerResponseId": "partner-response-redirect-admin",\n  "expectedProvider": "trusted-profile-service"\n}',
      response: {
        ja: "許可されていないリダイレクト先や権限フィールドを検出して403で拒否します。",
        en: "Expected to return 403 when an unallowed redirect target or privileged field is detected.",
      },
      note: {
        ja: "安全APIでは、外部API応答を信頼境界外の入力として検証します。",
        en: "The secure API validates third-party responses as untrusted input outside the trust boundary.",
      },
    },
    checklist: {
      ja: [
        "外部API応答を利用者入力と同じように検証している。",
        "リダイレクト先を許可リストで制限している。",
        "外部応答から権限フィールドを取り込まない。",
        "応答サイズ、スキーマ、提供元をAPI層で確認している。",
      ],
      en: [
        "Third-party API responses are validated like user input.",
        "Redirect targets are constrained with allowlists.",
        "Privileged fields are not imported from external responses.",
        "Payload size, schema, and provider identity are checked in the API layer.",
      ],
    },
  },
  {
    id: "api-inventory",
    riskCategory: "OWASP API9:2023 Improper Inventory Management",
    difficulty: "Advanced",
    progress: "ready",
    title: {
      ja: "APIインベントリと旧バージョン管理",
      en: "API Inventory and Legacy Version Management",
    },
    summary: {
      ja: "退役済みの旧API操作を例に、バージョン、公開範囲、所有者、保護策の管理が欠けるリスクを比較します。",
      en: "Use a retired legacy API operation to compare risks caused by missing version, exposure, owner, and protection inventory controls.",
    },
    vulnerableCondition: {
      ja: "旧APIや管理外エンドポイントが残り、退役状態、公開範囲、所有者、保護策の差分を確認しないまま利用できる。",
      en: "Legacy or unmanaged endpoints remain usable without checking lifecycle state, exposure, ownership, or protection parity.",
    },
    defensiveDesign: {
      ja: "APIインベントリで環境、バージョン、公開範囲、所有者、文書の鮮度、保護策の適用状況を管理し、退役済みや管理外の操作を拒否する。",
      en: "Use an API inventory to track environment, version, exposure, owner, documentation freshness, and protection parity, then reject retired or unmanaged operations.",
    },
    vulnerable: {
      route: "/api/vulnerable/inventory/operations",
      request:
        'POST /api/vulnerable/inventory/operations\n{\n  "endpointId": "legacy-token-reset-v1",\n  "requestedEnvironment": "production"\n}',
      response: {
        ja: "退役済みの旧API操作でも、状態や保護策を確認せずにプレビューを作成します。",
        en: "Expected to create a preview for a retired legacy API operation without lifecycle or protection checks.",
      },
      note: {
        ja: "実トークン発行や通知送信は行わず、合成した操作結果だけを返します。",
        en: "The demo issues no real token and sends no notification; it returns synthetic operation results only.",
      },
    },
    secure: {
      route: "/api/secure/inventory/operations",
      request:
        'POST /api/secure/inventory/operations\n{\n  "endpointId": "legacy-token-reset-v1",\n  "requestedEnvironment": "production"\n}',
      response: {
        ja: "インベントリ上で退役済みのAPI操作を403で拒否します。",
        en: "Expected to return 403 for an API operation marked as retired in the inventory.",
      },
      note: {
        ja: "安全APIでは、APIの状態と保護策を処理前に確認します。",
        en: "The secure API checks inventory state and protection controls before processing.",
      },
    },
    checklist: {
      ja: [
        "APIの環境、バージョン、公開範囲を管理している。",
        "退役済みAPIを実行経路から除外している。",
        "API所有者と文書の鮮度を確認している。",
        "旧バージョンにも現行APIと同等の保護策を適用している。",
      ],
      en: [
        "API environment, version, and exposure are inventoried.",
        "Retired APIs are excluded from executable paths.",
        "API ownership and documentation freshness are checked.",
        "Legacy versions receive protection parity with current APIs.",
      ],
    },
  },
];

export function getLearningModule(id: LearningModuleId): LearningModule {
  const learningModule = learningModules.find((item) => item.id === id);

  if (!learningModule) {
    return learningModules[0];
  }

  return learningModule;
}
