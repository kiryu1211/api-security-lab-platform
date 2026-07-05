import type { Language } from "@/lib/i18n";

export type LearningModuleId =
  "bola" | "auth" | "rate-limit" | "mass-assignment" | "ssrf";

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
      ja: "BOLAとオブジェクト所有者確認",
      en: "BOLA and Object Ownership Checks",
    },
    summary: {
      ja: "他ユーザーのリソースIDを指定したとき、APIが所有者確認を行うかを比較します。",
      en: "Compare whether the API checks resource ownership when another user's resource ID is supplied.",
    },
    vulnerableCondition: {
      ja: "リソースIDだけで注文を取得し、認証済みユーザーと所有者の関係を確認しない。",
      en: "The API fetches an order by resource ID only and does not verify the relationship between the authenticated user and the owner.",
    },
    defensiveDesign: {
      ja: "注文ID、ログインユーザーID、所有者IDを照合し、所有者でない場合は拒否する。",
      en: "Compare the order ID, signed-in user ID, and owner ID, then reject requests from non-owners.",
    },
    vulnerable: {
      route: "/api/vulnerable/orders/{orderId}",
      request: "GET /api/vulnerable/orders/order-demo-002",
      response: {
        ja: "IDのみで取得した注文情報を返してしまう想定です。",
        en: "Expected to return order data fetched by ID only.",
      },
      note: {
        ja: "このルートはローカル限定の脆弱例として扱います。",
        en: "This route is treated as a local-only vulnerable example.",
      },
    },
    secure: {
      route: "/api/secure/orders/{orderId}",
      request: "GET /api/secure/orders/order-demo-002",
      response: {
        ja: "所有者が一致しない場合は403を返す想定です。",
        en: "Expected to return 403 when the owner does not match.",
      },
      note: {
        ja: "安全APIでは、API層で所有者確認を必ず実施します。",
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
    progress: "planned",
    title: {
      ja: "認証とトークン検証",
      en: "Authentication and Token Validation",
    },
    summary: {
      ja: "弱い認証や不適切なトークン検証が、API利用者のなりすましにつながる流れを確認します。",
      en: "Review how weak authentication and improper token validation can lead to API user impersonation.",
    },
    vulnerableCondition: {
      ja: "署名、期限、失効状態、権限を十分に検証しないままトークンを受け入れる。",
      en: "The API accepts a token without sufficiently validating signature, expiration, revocation state, and permissions.",
    },
    defensiveDesign: {
      ja: "署名、期限、失効、権限を検証し、失敗時は一貫したエラーで拒否する。",
      en: "Validate signature, expiration, revocation, and permissions, then reject failures with consistent errors.",
    },
    vulnerable: {
      route: "/api/vulnerable/auth/session",
      request: "POST /api/vulnerable/auth/session",
      response: {
        ja: "弱い検証でセッションを受け入れる想定です。",
        en: "Expected to accept a session with weak validation.",
      },
      note: {
        ja: "実トークンや秘密情報はサンプルに含めません。",
        en: "Real tokens and secrets are not included in samples.",
      },
    },
    secure: {
      route: "/api/secure/auth/session",
      request: "POST /api/secure/auth/session",
      response: {
        ja: "検証に失敗したトークンを拒否する想定です。",
        en: "Expected to reject tokens that fail validation.",
      },
      note: {
        ja: "安全APIでは期限、失効、権限を明示的に確認します。",
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
    progress: "planned",
    title: {
      ja: "レート制限と自動化悪用対策",
      en: "Rate Limiting and Abuse Prevention",
    },
    summary: {
      ja: "過剰リクエストを制限しないAPIと、ユーザー・IP・ルート単位で制御するAPIを比較します。",
      en: "Compare APIs without request limits against APIs controlled per user, IP address, and route.",
    },
    vulnerableCondition: {
      ja: "短時間に大量のリクエストを送っても制限せず、処理資源を消費し続ける。",
      en: "The API continues consuming resources even when many requests are sent in a short time.",
    },
    defensiveDesign: {
      ja: "利用者や送信元ごとに回数と時間枠を管理し、上限超過時は429を返す。",
      en: "Track counts and windows per user or source, then return 429 when limits are exceeded.",
    },
    vulnerable: {
      route: "/api/vulnerable/rate-limit/search",
      request: "GET /api/vulnerable/rate-limit/search?q=demo",
      response: {
        ja: "制限なく処理を続ける想定です。",
        en: "Expected to continue processing without limits.",
      },
      note: {
        ja: "ローカル検証でも高負荷な実行は避ける設計にします。",
        en: "The lab design avoids high-load execution even during local verification.",
      },
    },
    secure: {
      route: "/api/secure/rate-limit/search",
      request: "GET /api/secure/rate-limit/search?q=demo",
      response: {
        ja: "上限超過時に429を返す想定です。",
        en: "Expected to return 429 when the limit is exceeded.",
      },
      note: {
        ja: "安全APIでは制限値とエラーを明確にします。",
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
    id: "mass-assignment",
    riskCategory: "OWASP API3:2023 Broken Object Property Level Authorization",
    difficulty: "Intermediate",
    progress: "planned",
    title: {
      ja: "Mass Assignmentとプロパティ認可",
      en: "Mass Assignment and Property Authorization",
    },
    summary: {
      ja: "許可していないプロパティ更新を受け入れるAPIと、許可リストで制限するAPIを比較します。",
      en: "Compare APIs that accept unauthorized property updates against APIs that restrict updates with allowlists.",
    },
    vulnerableCondition: {
      ja: "リクエストボディ全体をそのまま更新処理に渡し、roleやownerIdなども変更できてしまう。",
      en: "The full request body is passed into update logic, allowing fields such as role or ownerId to be changed.",
    },
    defensiveDesign: {
      ja: "更新可能な項目だけをスキーマと許可リストで受け取り、権限が必要な項目は別途確認する。",
      en: "Accept only allowed fields through schemas and allowlists, then separately authorize sensitive fields.",
    },
    vulnerable: {
      route: "/api/vulnerable/profile",
      request: "PATCH /api/vulnerable/profile",
      response: {
        ja: "許可していない項目まで更新される想定です。",
        en: "Expected to update fields that should not be accepted.",
      },
      note: {
        ja: "サンプルには実在する個人情報を含めません。",
        en: "Samples do not include real personal data.",
      },
    },
    secure: {
      route: "/api/secure/profile",
      request: "PATCH /api/secure/profile",
      response: {
        ja: "許可リスト外の項目を拒否する想定です。",
        en: "Expected to reject fields outside the allowlist.",
      },
      note: {
        ja: "安全APIではZodスキーマで入力を絞り込みます。",
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
    progress: "planned",
    title: {
      ja: "SSRFと外部URL取得制御",
      en: "SSRF and Outbound URL Controls",
    },
    summary: {
      ja: "任意URL取得の危険性と、許可リスト、プライベートIP拒否、リダイレクト制御による防御を比較します。",
      en: "Compare arbitrary URL fetching risks with defenses using allowlists, private IP rejection, and redirect controls.",
    },
    vulnerableCondition: {
      ja: "利用者が指定したURLを検証せずにサーバー側から取得する。",
      en: "The server fetches a user-supplied URL without validation.",
    },
    defensiveDesign: {
      ja: "許可したホストだけを取得し、プライベートIP、リダイレクト、タイムアウトを制御する。",
      en: "Fetch only allowed hosts while controlling private IP ranges, redirects, and timeouts.",
    },
    vulnerable: {
      route: "/api/vulnerable/fetch-url",
      request: "POST /api/vulnerable/fetch-url",
      response: {
        ja: "任意URLへアクセスしてしまう想定です。",
        en: "Expected to access arbitrary URLs.",
      },
      note: {
        ja: "ローカル限定でも内部ネットワークへの実アクセスは避けます。",
        en: "The lab avoids real access to internal networks even in local-only mode.",
      },
    },
    secure: {
      route: "/api/secure/fetch-url",
      request: "POST /api/secure/fetch-url",
      response: {
        ja: "許可されていないURLを拒否する想定です。",
        en: "Expected to reject URLs that are not allowed.",
      },
      note: {
        ja: "安全APIでは許可リスト、IP範囲、リダイレクト、タイムアウトを確認します。",
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
];

export function getLearningModule(id: LearningModuleId): LearningModule {
  const learningModule = learningModules.find((item) => item.id === id);

  if (!learningModule) {
    return learningModules[0];
  }

  return learningModule;
}
