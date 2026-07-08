import type { Language } from "@/lib/i18n";

export type LearningModuleId =
  | "bola"
  | "auth"
  | "rate-limit"
  | "function-auth"
  | "business-flow"
  | "mass-assignment"
  | "ssrf"
  | "security-config"
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

export type ImplementationLine = {
  code: string;
  highlight?: "issue" | "fix";
  comment?: Record<Language, string>;
};

export type ImplementationWalkthrough = {
  vulnerable: {
    summary: Record<Language, string>;
    lines: ImplementationLine[];
  };
  secure: {
    summary: Record<Language, string>;
    lines: ImplementationLine[];
  };
};

export type LearningContextNote = Record<Language, string>;

const learningModuleDefinitions: LearningModule[] = [
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
      ja: "注文IDやレポートIDのようなオブジェクトIDを利用者が指定できるAPIで、認証済みであることだけを確認し、対象リソースの所有者まで確認しないと、他人のデータを読めてしまいます。このテーマでは、IDを差し替えたときに所有者確認が行われるかを比較します。",
      en: "When an API lets clients supply object IDs such as order IDs or report IDs, authentication alone is not enough. If the API does not verify the owner of the target object, another user's data can be accessed by changing the ID. This topic compares whether ownership is checked after an ID is supplied.",
    },
    vulnerableCondition: {
      ja: "リソースIDだけで注文を取得し、認証済みユーザーと注文所有者の関係を確認していない。攻撃者は連番や推測可能なIDを試し、他ユーザーの注文情報に到達できる可能性があります。",
      en: "The API fetches an order by resource ID only and does not verify the relationship between the authenticated user and the owner. An attacker can try sequential or guessable IDs to reach another user's order data.",
    },
    defensiveDesign: {
      ja: "注文IDで取得した後に、サーバー側で認証済みユーザーIDと所有者IDを照合し、一致しない場合は403で拒否します。リソースが存在するかどうかを過剰に教えないエラー設計も確認します。",
      en: "After loading the order by ID, the server compares the authenticated user ID with the owner ID and rejects mismatches with 403. The secure design also avoids revealing excessive information about whether the resource exists.",
    },
    vulnerable: {
      route: "/api/vulnerable/orders/{orderId}",
      request: "GET /api/vulnerable/orders/order-demo-002",
      response: {
        ja: "HTTP 200で注文データが返る場合、APIが所有者確認をせず、IDに一致した他ユーザーの注文をそのまま公開していることを表します。",
        en: "HTTP 200 with order data means the API returned another user's order by ID without verifying ownership.",
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
        ja: "HTTP 403は、注文自体が存在しても、リクエストしたユーザーが所有者ではないためAPI層で拒否されたことを表します。",
        en: "HTTP 403 means the order may exist, but the requester is not the owner and the API rejected access.",
      },
      note: {
        ja: "安全APIでは、API層で所有者確認を行います。",
        en: "The secure API always performs ownership checks in the API layer.",
      },
    },
    checklist: {
      ja: [
        "利用者が指定したリソースIDだけでアクセスを許可せず、必ず認証済みユーザーの情報と照合している。",
        "注文、請求書、文書、予約など、IDで取得するすべてのAPIで所有者または利用権限を確認している。",
        "読み取り、更新、削除など、操作の種類ごとに権限を確認している。読み取り可能でも削除できるとは限らない設計にしている。",
        "所有者ではないユーザーからのアクセスはAPI層で403などの安全なエラーとして拒否している。",
        "拒否時に、対象リソースの詳細や他ユーザーの情報をレスポンスへ含めていない。",
        "連番IDや推測しやすいIDだけに依存せず、推測されても権限確認で守れる設計にしている。",
        "一覧取得APIでも、自分が閲覧できるリソースだけを返すようにサーバー側で絞り込んでいる。",
        "他ユーザーのIDに差し替えるテストを用意し、BOLAが再発しないことを継続的に確認している。",
      ],
      en: [
        "Access is never allowed by resource ID alone; the ID is checked against the authenticated user.",
        "Every API that loads orders, invoices, documents, reservations, or other ID-based objects verifies ownership or access rights.",
        "Authorization is checked per operation, such as read, update, and delete. Being able to read an object does not automatically allow deletion.",
        "Requests from non-owners are rejected in the API layer with safe errors such as 403.",
        "Rejected responses do not include target-resource details or another user's information.",
        "The design does not rely on unguessable IDs alone; authorization still protects the object even if an ID is guessed.",
        "List APIs also filter results on the server so users only receive resources they are allowed to view.",
        "Tests replace IDs with another user's IDs to continuously confirm that BOLA does not return.",
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
      ja: "APIはブラウザ画面だけでなくモバイルアプリや他サービスからも呼ばれるため、アクセストークンやセッション情報の検証が入口になります。署名、期限、失効、権限を確認しないと、期限切れトークンや権限不足のトークンで他ユーザーや管理者になりすませます。",
      en: "APIs are called by browsers, mobile apps, and other services, so access tokens and session data are often the entry point. If signature, expiration, revocation, and permissions are not checked, expired or under-authorized tokens can be used for impersonation.",
    },
    vulnerableCondition: {
      ja: "トークンIDが存在することだけを見て、署名の真正性、期限切れ、失効済み状態、要求された操作に必要な権限を十分に確認していない。",
      en: "The API only checks that a token ID exists and does not sufficiently validate signature integrity, expiration, revocation state, or the permission required for the requested operation.",
    },
    defensiveDesign: {
      ja: "トークンを信頼する前に、発行者、署名、期限、失効状態、対象APIで必要な権限を順に検証します。失敗時は理由を詳しく漏らしすぎない一貫したエラーで拒否します。",
      en: "Before trusting a token, validate issuer, signature, expiration, revocation state, and permissions required by the target API. Failures are rejected with consistent errors that avoid excessive detail.",
    },
    vulnerable: {
      route: "/api/vulnerable/auth/session",
      request:
        'POST /api/vulnerable/auth/session\n{\n  "tokenId": "demo-token-expired-admin",\n  "requiredPermission": "admin:read"\n}',
      response: {
        ja: "HTTP 200で受け入れられる場合、期限切れ・失効済み・署名不正の合成トークンでも、IDの存在だけでセッションを認めていることを表します。",
        en: "HTTP 200 means the synthetic expired, revoked, or invalidly signed token was accepted because the API trusted token existence only.",
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
        ja: "HTTP 401は、署名、期限、失効状態、権限のいずれかが検証に失敗し、本人確認として使えないトークンを拒否したことを表します。",
        en: "HTTP 401 means the token failed signature, expiration, revocation, or permission validation and cannot be used for authentication.",
      },
      note: {
        ja: "安全APIでは、署名状態、期限、失効状態、権限を明示的に確認します。",
        en: "The secure API explicitly checks expiration, revocation, and permissions.",
      },
    },
    checklist: {
      ja: [
        "ログイン、パスワード再設定、トークン更新、メール変更など、本人確認に関わるAPIをすべて把握している。",
        "アクセストークンの署名、発行者、対象利用者、期限を検証してから信頼している。",
        "失効済みトークン、ログアウト済みセッション、期限切れトークンを拒否している。",
        "管理操作や重要操作では、トークンの存在だけでなく必要な権限やスコープを確認している。",
        "パスワード再設定やログイン試行には、レート制限、アカウントロック、再試行制限などの総当たり対策を入れている。",
        "パスワード、トークン、APIキーなどの秘密情報をURL、ログ、エラー本文に出していない。",
        "メールアドレス変更、パスワード変更、MFA設定変更などでは再認証を要求している。",
        "認証失敗時のエラーは、アカウントの存在や検証失敗の詳細を過剰に教えない表現にしている。",
        "JWTのnoneアルゴリズムや弱い署名方式など、既知の危険な設定を受け入れない。",
      ],
      en: [
        "All identity-related APIs are inventoried, including login, password reset, token refresh, and email change.",
        "Access tokens are trusted only after validating signature, issuer, audience, and expiration.",
        "Revoked tokens, logged-out sessions, and expired tokens are rejected.",
        "Administrative or sensitive operations check required permissions or scopes, not just token existence.",
        "Login and recovery flows include anti-brute-force controls such as rate limits, lockouts, or retry limits.",
        "Secrets such as passwords, tokens, and API keys are not placed in URLs, logs, or error bodies.",
        "Sensitive changes such as email, password, or MFA updates require re-authentication.",
        "Authentication errors avoid revealing excessive details such as whether an account exists or exactly which validation failed.",
        "Known-dangerous settings such as JWT none algorithm or weak signing methods are not accepted.",
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
      ja: "検索、画像処理、通知送信、外部API連携などは、1回のリクエストでもCPU、メモリ、帯域、外部サービス費用を消費します。回数やサイズを制限しないAPIは、意図的な連打や自動化によってサービス停止や想定外コストにつながります。",
      en: "Search, image processing, notifications, and third-party integrations consume CPU, memory, bandwidth, or provider costs even for a single request. Without limits on frequency or size, repeated or automated calls can cause service degradation or unexpected cost.",
    },
    vulnerableCondition: {
      ja: "短時間に大量のリクエストを受けても、利用者、送信元、ルート、時間枠ごとの上限を確認せず、処理資源を消費し続ける。",
      en: "The API continues consuming resources under bursts of requests without checking limits per user, source, route, or time window.",
    },
    defensiveDesign: {
      ja: "利用者、送信元、APIルートごとに回数と時間枠を管理し、上限超過時は429で拒否します。高コスト処理にはサイズ制限、タイムアウト、外部サービス呼び出し回数の制限も組み合わせます。",
      en: "Track request counts and windows per user, source, and API route, then reject excess traffic with 429. High-cost operations should also use payload limits, timeouts, and caps on third-party calls.",
    },
    vulnerable: {
      route: "/api/vulnerable/rate-limit/search",
      request: "GET /api/vulnerable/rate-limit/search?q=demo",
      response: {
        ja: "HTTP 200で検索結果が返る場合、短時間の連続リクエストでも利用者・送信元・ルート単位の制限を行わず処理していることを表します。",
        en: "HTTP 200 means repeated requests are still processed without per-user, per-source, or per-route limits.",
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
        ja: "HTTP 429は、同じ利用者・同じ検索APIへの連続実行が上限を超えたため、処理を始める前に拒否されたことを表します。",
        en: "HTTP 429 means repeated calls to the same search API exceeded the limit and were rejected before work started.",
      },
      note: {
        ja: "安全APIでは、上限を超えた場合に明確なエラーを返します。",
        en: "The secure API makes limits and errors explicit.",
      },
    },
    checklist: {
      ja: [
        "CPU、メモリ、帯域、ストレージ、外部サービス費用を消費するAPIを洗い出している。",
        "APIルートごとに、通常利用で必要な回数、サイズ、時間の上限を決めている。",
        "利用者、IPアドレス、APIキー、組織IDなど、悪用を止めやすい単位でレート制限している。",
        "検索件数、ページサイズ、配列要素数、アップロードサイズ、リクエスト本文サイズを制限している。",
        "重い処理にはタイムアウトを設定し、長時間CPUやメモリを占有しないようにしている。",
        "GraphQLや一括処理のように、1リクエスト内で多数の操作を実行できる仕組みを制限している。",
        "SMS、メール、決済、画像処理など有料外部サービスには利用上限や請求アラートを設定している。",
        "上限超過時は429や413など意味のあるステータスを返し、再試行の目安を示している。",
        "負荷テストや連続実行テストで、DoSや想定外コストが起きにくいことを確認している。",
      ],
      en: [
        "APIs that consume CPU, memory, bandwidth, storage, or third-party cost are identified.",
        "Each route defines practical limits for request frequency, size, and processing time.",
        "Rate limits are applied by useful abuse-control keys such as user, IP address, API key, or organization ID.",
        "Search result count, page size, array length, upload size, and request body size are constrained.",
        "Expensive operations have timeouts so they cannot hold CPU or memory indefinitely.",
        "Batch-style features such as GraphQL or bulk operations limit how much work one request can trigger.",
        "Paid external services such as SMS, email, payment, or image processing have usage caps or billing alerts.",
        "Limit violations return meaningful status codes such as 429 or 413 and provide safe retry guidance.",
        "Load and repeated-call tests confirm that DoS and unexpected cost are unlikely.",
      ],
    },
  },
  {
    id: "function-auth",
    riskCategory: "OWASP API5:2023 Broken Function Level Authorization",
    difficulty: "Intermediate",
    progress: "ready",
    title: {
      ja: "機能単位の認可と管理操作の保護",
      en: "Function-Level Authorization for Admin Actions",
    },
    summary: {
      ja: "管理画面にリンクを出さないだけでは、管理APIを守ったことにはなりません。利用者がURLやリクエスト本文を直接組み立てると、画面上では見えない管理操作を呼び出せる場合があります。このテーマでは、機能ごとの権限確認がAPI層にあるかを比較します。",
      en: "Hiding an admin link in the UI does not protect an admin API. A caller can build the URL and request body directly and invoke functions that are not visible on screen. This topic compares whether function-level permissions are enforced in the API layer.",
    },
    vulnerableCondition: {
      ja: "URLや画面上では管理機能に見えていても、API層で必要権限を確認せず、ログイン済みであれば一般ユーザーの直接リクエストも受け入れている。",
      en: "The operation looks administrative in the UI or URL, but the API accepts direct requests from regular authenticated users without checking the required permission.",
    },
    defensiveDesign: {
      ja: "APIごとに必要な機能権限を定義し、認証済みユーザーのロールと権限を処理前に検証します。未定義の機能、権限不足、ロールの不一致はdeny-by-defaultで拒否します。",
      en: "Define the required permission for each API function and validate the authenticated user's role and permissions before processing. Undefined functions, missing permissions, and role mismatches are rejected by default.",
    },
    vulnerable: {
      route: "/api/vulnerable/admin/invitations",
      request:
        'POST /api/vulnerable/admin/invitations\n{\n  "actorUserId": "user-demo-alice",\n  "targetEmailAlias": "analyst.demo",\n  "requestedRole": "admin"\n}',
      response: {
        ja: "HTTP 200で招待プレビューが返る場合、一般ユーザーでも管理者招待機能を直接呼び出せていることを表します。",
        en: "HTTP 200 with an invitation preview means a regular user can directly invoke an administrative function.",
      },
      note: {
        ja: "合成した招待プレビューのみを返し、実メール送信や実アカウント作成は行いません。",
        en: "The demo returns a synthetic invitation preview only and sends no real email or account creation.",
      },
    },
    secure: {
      route: "/api/secure/admin/invitations",
      request:
        'POST /api/secure/admin/invitations\n{\n  "actorUserId": "user-demo-alice",\n  "targetEmailAlias": "analyst.demo",\n  "requestedRole": "admin"\n}',
      response: {
        ja: "HTTP 403は、ログイン済みであっても管理者招待に必要な機能権限がないため、処理前に拒否されたことを表します。",
        en: "HTTP 403 means the user is authenticated but lacks the function permission required for admin invitations.",
      },
      note: {
        ja: "安全APIでは、管理操作ごとの権限をAPI層で確認し、未定義または不足している権限を既定で拒否します。",
        en: "The secure API checks per-function permissions in the API layer and rejects missing or undefined authorization by default.",
      },
    },
    checklist: {
      ja: [
        "管理者向け、運用者向け、サポート担当者向けなど、特別な権限が必要なAPI機能を一覧化している。",
        "画面のメニュー非表示やURLの分かりにくさだけに頼らず、API層で機能ごとの権限を確認している。",
        "一般ユーザー、管理者、サポート担当者、読み取り専用担当者など、ロールごとの許可操作を明確にしている。",
        "未定義の機能、権限不足、想定外のロールは既定で拒否するdeny-by-defaultにしている。",
        "GET、POST、PATCH、DELETEなどHTTPメソッドを変えても、権限チェックを迂回できない。",
        "管理APIや一括操作APIは、通常APIと同じコントローラー内にあっても必ず権限を確認している。",
        "権限不足で拒否するとき、管理機能の内部情報や存在しないはずのデータを過剰に返していない。",
        "各ロールで許可される操作と拒否される操作を自動テストしている。",
        "権限変更や管理操作は監査ログに残し、後から誰が何をしたか確認できるようにしている。",
      ],
      en: [
        "APIs that require special privileges, such as admin, operator, or support functions, are inventoried.",
        "Authorization does not rely on hidden menus or obscure URLs; each function is checked in the API layer.",
        "Allowed operations are explicit for roles such as regular user, admin, support, and read-only reviewer.",
        "Undefined functions, missing permissions, and unexpected roles are denied by default.",
        "Changing HTTP methods such as GET, POST, PATCH, or DELETE cannot bypass authorization checks.",
        "Administrative and bulk-operation APIs check permissions even when they live beside regular APIs.",
        "Forbidden responses do not expose excessive details about admin functions or protected data.",
        "Automated tests cover both allowed and denied operations for every role.",
        "Permission changes and administrative actions are audit logged so later review is possible.",
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
      ja: "チケット予約、限定商品の購入、投稿、投票のような業務フローは、個々のAPIが正しく動いていても、自動化や順序飛ばしによって不公平な利用や在庫枯渇を引き起こします。このテーマでは、実装バグだけでなく業務上の悪用可能性をAPIで制御できるかを確認します。",
      en: "Business flows such as ticket reservations, limited-product purchases, comments, or votes can be abused through automation or skipped steps even when each endpoint works as coded. This topic checks whether the API controls business abuse, not only implementation bugs.",
    },
    vulnerableCondition: {
      ja: "購入や予約などの重要な業務フローで、フロー順序、状態遷移、ユーザー単位上限、在庫制約、自動化の兆候を確認していない。",
      en: "A sensitive purchase or reservation flow does not verify workflow order, state transitions, per-user limits, stock constraints, or automation signals.",
    },
    defensiveDesign: {
      ja: "業務上重要な操作を特定し、サーバー側で状態遷移を管理します。数量上限、在庫状態、同一利用者の連続実行、想定外のフロー順序を検証し、画面側の順序制御だけに依存しません。",
      en: "Identify business-critical operations and manage state transitions on the server. Validate quantity limits, stock state, repeated activity by the same user, and unexpected workflow order instead of relying on frontend sequencing.",
    },
    vulnerable: {
      route: "/api/vulnerable/business-flow/reservations",
      request:
        'POST /api/vulnerable/business-flow/reservations\n{\n  "userId": "user-demo-alice",\n  "productId": "product-demo-001",\n  "quantity": 4,\n  "flowStep": "direct-checkout"\n}',
      response: {
        ja: "HTTP 200で予約プレビューが返る場合、direct-checkoutのような順序飛ばしや数量上限超過をAPI側で止めていないことを表します。",
        en: "HTTP 200 with a reservation preview means the API did not stop skipped workflow steps or excessive quantity.",
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
        ja: "HTTP 403は、業務フローの順序違反またはユーザー単位上限超過を検出し、予約処理を拒否したことを表します。",
        en: "HTTP 403 means the API detected a skipped workflow step or exceeded per-user limit and rejected the reservation.",
      },
      note: {
        ja: "安全APIでは、業務フロー固有のルールを認可・不正利用対策として扱います。",
        en: "The secure API treats business-flow rules as authorization and abuse-prevention controls.",
      },
    },
    checklist: {
      ja: [
        "購入、予約、投稿、投票、紹介、クーポン利用など、過剰利用されると事業被害が出るAPIを特定している。",
        "フロントエンドの画面遷移だけに頼らず、API層で現在の業務状態と次に許可される操作を確認している。",
        "在庫、座席、予約枠、利用回数、クーポン残数など、業務上の上限をサーバー側で検証している。",
        "1ユーザー、1端末、1組織、1支払い手段など、業務に合った単位で数量や頻度の上限を設定している。",
        "direct-checkoutのようなフロー飛ばしや、未完了ステップを飛ばした直接API呼び出しを拒否している。",
        "短時間の大量実行、同じ操作の反復、通常ではあり得ない速度など、自動化の兆候を検知している。",
        "必要に応じてCAPTCHA、端末確認、追加認証、人間らしい操作確認などを組み合わせている。",
        "不正利用対策が正規利用者の体験を壊しすぎないよう、ビジネス要件と安全性のバランスを確認している。",
        "買い占め、予約枠占有、紹介プログラム悪用などのシナリオをテストしている。",
      ],
      en: [
        "APIs that can harm the business when overused are identified, such as purchase, reservation, posting, voting, referral, and coupon flows.",
        "The API layer checks the current business state and the next allowed action instead of trusting frontend navigation.",
        "Business limits such as stock, seats, reservation slots, usage counts, and coupon availability are validated server-side.",
        "Quantity and frequency limits are defined by business-relevant keys such as user, device, organization, or payment method.",
        "Skipped flows such as direct-checkout or direct calls to later workflow steps are rejected.",
        "Automation signals such as bursts, repeated actions, and impossible user speed are detected.",
        "Controls such as CAPTCHA, device checks, additional authentication, or human-interaction checks are used when appropriate.",
        "Abuse controls are balanced against legitimate user experience and business requirements.",
        "Tests cover scenarios such as scalping, reservation hoarding, and referral-program abuse.",
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
      ja: "JSONのリクエスト本文には、画面に表示されていない項目も追加できます。APIが本文全体をそのまま保存処理へ渡すと、表示名の更新だけのつもりが、role、ownerId、isAdminのような権限や所有者に関わる項目まで変更される可能性があります。",
      en: "A JSON request body can include properties that are not shown in the UI. If the API passes the entire body into update logic, a simple display-name update can become an unauthorized change to fields such as role, ownerId, or isAdmin.",
    },
    vulnerableCondition: {
      ja: "リクエストボディ全体をそのまま更新処理に渡し、利用者が変更してよい項目と、管理者だけが変更できる項目を区別していない。",
      en: "The full request body is passed into update logic without separating fields that users may edit from fields that only administrators may change.",
    },
    defensiveDesign: {
      ja: "通常ユーザーが更新できるプロパティをスキーマと許可リストで明示し、許可外の項目は保存しません。権限や所有者に関わる項目は別APIまたは別権限で扱います。",
      en: "Explicitly define user-editable properties with schemas and allowlists, and never persist fields outside that list. Privileged or ownership-related fields are handled by separate APIs or separate permissions.",
    },
    vulnerable: {
      route: "/api/vulnerable/profile",
      request:
        'PATCH /api/vulnerable/profile\n{\n  "displayLabel": "changed-label",\n  "ownerId": "user-demo-bob",\n  "role": "reviewer"\n}',
      response: {
        ja: "HTTP 200で更新結果が返る場合、displayLabel以外にownerIdやroleのような権限に関わる項目まで更新対象に入っていることを表します。",
        en: "HTTP 200 means fields beyond displayLabel, such as ownerId or role, were accepted for update.",
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
        ja: "HTTP 400または403は、許可リスト外の項目や権限が必要な項目を検出し、通常のプロフィール更新として保存しなかったことを表します。",
        en: "HTTP 400 or 403 means fields outside the allowlist or privileged fields were detected and not saved as a normal profile update.",
      },
      note: {
        ja: "安全APIでは、Zodスキーマと許可リストで更新項目を絞り込みます。",
        en: "The secure API narrows input with Zod schemas.",
      },
    },
    checklist: {
      ja: [
        "APIが返すレスポンスに、利用者へ見せる必要のない内部プロパティや個人情報を含めていない。",
        "更新APIでは、利用者が変更してよいプロパティを許可リストとして明示している。",
        "リクエスト本文全体をそのまま保存処理へ渡さず、必要な項目だけを取り出している。",
        "role、ownerId、isAdmin、price、statusなど、権限や業務状態に関わる項目を通常更新から分離している。",
        "入力スキーマで型、形式、長さ、列挙値を検証し、想定外のプロパティを拒否している。",
        "レスポンスにもスキーマやDTOを使い、返してよい項目だけを選んでいる。",
        "GraphQLなどクライアントが返却フィールドを選べる仕組みでも、プロパティ単位の認可を確認している。",
        "プロパティ追加時に、読み取り可能か、更新可能か、誰に許可するかをレビューしている。",
        "許可外プロパティを混ぜたリクエストや、非公開項目の取得を試すテストを用意している。",
      ],
      en: [
        "Responses do not include internal properties or personal data that the user does not need to see.",
        "Update APIs explicitly allowlist the properties users may change.",
        "The full request body is not passed directly into persistence; only required fields are selected.",
        "Fields related to privilege or business state, such as role, ownerId, isAdmin, price, or status, are separated from normal updates.",
        "Input schemas validate type, format, length, enum values, and reject unexpected properties.",
        "Responses use schemas or DTOs so only approved fields are returned.",
        "Property-level authorization is checked even in GraphQL or other APIs where clients can choose returned fields.",
        "When a property is added, the team reviews who can read it, who can update it, and why.",
        "Tests send extra unauthorized properties and request private fields to confirm they are rejected.",
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
      ja: "サーバーが利用者指定URLを取得する機能は、画像取得、Webhook検証、URLプレビューなどで使われます。しかし検証しないと、攻撃者がサーバーを代理にして内部ネットワーク、メタデータサービス、管理画面へリクエストさせるSSRFにつながります。",
      en: "Server-side URL fetching is common for image imports, webhook validation, and URL previews. Without validation, an attacker can make the server request internal networks, metadata services, or admin panels, resulting in SSRF.",
    },
    vulnerableCondition: {
      ja: "利用者が指定したURLを検証せず、スキーム、ホスト、IP範囲、リダイレクト先、タイムアウトを確認しないままサーバー側の処理対象として受け入れてしまう。",
      en: "The server accepts a user-supplied URL without validating scheme, host, IP range, redirect target, or timeout behavior.",
    },
    defensiveDesign: {
      ja: "許可したスキームとホストだけを対象にし、名前解決後のプライベートIP、localhost、リンクローカルアドレスを拒否します。リダイレクト回数、応答サイズ、タイムアウトも制限します。",
      en: "Allow only approved schemes and hosts, then reject private IPs, localhost, and link-local addresses after resolution. Redirect count, response size, and timeouts are also constrained.",
    },
    vulnerable: {
      route: "/api/vulnerable/fetch-url",
      request:
        'POST /api/vulnerable/fetch-url\n{\n  "url": "http://127.0.0.1/admin"\n}',
      response: {
        ja: "HTTP 200でプレビューが返る場合、127.0.0.1のような内部向けURLでも取得対象として受け入れていることを表します。このラボでは実ネットワークアクセスは行いません。",
        en: "HTTP 200 with a preview means an internal-looking URL such as 127.0.0.1 was accepted as a fetch target without performing real network access in this lab.",
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
        ja: "HTTP 400または403は、許可されていないホスト、内部IP、危険なリダイレクト候補を検出し、取得処理を拒否したことを表します。",
        en: "HTTP 400 or 403 means the API detected an unallowed host, internal IP, or unsafe redirect candidate and rejected the fetch.",
      },
      note: {
        ja: "安全APIでは、許可リスト、IP範囲、リダイレクト、タイムアウトを確認します。",
        en: "The secure API checks allowlists, IP ranges, redirects, and timeouts.",
      },
    },
    checklist: {
      ja: [
        "利用者が指定したURLへサーバーがアクセスする機能をすべて洗い出している。例: 画像取得、Webhookテスト、URLプレビュー、外部ファイル取得。",
        "許可するURLスキームをhttpsなど必要なものに限定し、file、gopher、ftpなど不要なスキームを拒否している。",
        "許可するホストやドメインを許可リストで管理し、任意の外部ホストを受け入れない。",
        "DNS解決後のIPアドレスを確認し、localhost、プライベートIP、リンクローカル、クラウドメタデータIPを拒否している。",
        "リダイレクト先も同じ基準で再検証し、許可外の内部URLへ誘導されないようにしている。",
        "タイムアウト、最大レスポンスサイズ、最大リダイレクト回数を設定している。",
        "取得した外部レスポンスをそのまま利用者へ返さず、必要なメタデータだけに制限している。",
        "URLパーサーの差異やURLエンコードの抜け道を考慮し、信頼できるURL解析を使っている。",
        "127.0.0.1、169.254.169.254、社内ホスト名などを指定したテストで拒否されることを確認している。",
      ],
      en: [
        "All features where the server accesses user-supplied URLs are inventoried, such as image import, webhook tests, URL previews, and external file fetching.",
        "Allowed URL schemes are limited to required schemes such as https, and unnecessary schemes such as file, gopher, or ftp are rejected.",
        "Allowed hosts or domains are controlled with allowlists; arbitrary external hosts are not accepted.",
        "Resolved IP addresses are checked, and localhost, private IPs, link-local addresses, and cloud metadata IPs are rejected.",
        "Redirect targets are revalidated with the same rules so redirects cannot lead to internal URLs.",
        "Timeouts, maximum response size, and maximum redirect count are configured.",
        "Fetched external responses are not returned raw to users; only required metadata is exposed.",
        "Trusted URL parsing is used to avoid bypasses caused by parser differences or URL encoding tricks.",
        "Tests confirm that URLs such as 127.0.0.1, 169.254.169.254, and internal hostnames are rejected.",
      ],
    },
  },
  {
    id: "security-config",
    riskCategory: "OWASP API8:2023 Security Misconfiguration",
    difficulty: "Intermediate",
    progress: "ready",
    title: {
      ja: "Security Misconfigurationと診断情報の公開制御",
      en: "Security Misconfiguration and Diagnostic Exposure Controls",
    },
    summary: {
      ja: "APIはアプリケーション本体だけでなく、CORS、HTTPヘッダー、エラー出力、診断エンドポイント、キャッシュ制御など周辺設定にも守られています。設定が緩いと、コード上の処理が正しくても、内部情報の露出、ブラウザ保護の低下、意図しないOriginからの呼び出しにつながります。",
      en: "APIs are protected not only by application code but also by surrounding configuration such as CORS, HTTP headers, error output, diagnostics endpoints, and cache controls. Weak configuration can expose internals, weaken browser protections, or allow unintended origins even when business logic is correct.",
    },
    vulnerableCondition: {
      ja: "診断や設定確認のAPIが、デバッグ情報、内部パス、合成スタックトレース、過度に広いCORS、キャッシュやセキュリティヘッダー不足を利用者に見せている。",
      en: "A diagnostics or configuration API exposes debug details, internal paths, synthetic stack traces, overly broad CORS behavior, missing cache controls, or missing security headers.",
    },
    defensiveDesign: {
      ja: "公開してよい設定だけを返し、許可Origin、no-store、Content-Type、nosniffなどのヘッダー、詳細エラー抑制をAPI層で適用します。診断APIも通常APIと同じ保護対象として扱います。",
      en: "Return only approved public configuration while applying origin allowlists, no-store caching, Content-Type, nosniff, and suppressed verbose errors in the API layer. Diagnostics endpoints are protected like normal APIs.",
    },
    vulnerable: {
      route: "/api/vulnerable/config/diagnostics",
      request:
        'POST /api/vulnerable/config/diagnostics\n{\n  "requestedOrigin": "https://untrusted.example",\n  "includeDebugDetails": true\n}',
      response: {
        ja: "HTTP 200で診断情報が返る場合、デバッグ状態、合成スタックトレース、広すぎるCORSメタデータなど、本来公開しない情報を返していることを表します。",
        en: "HTTP 200 with diagnostics means debug state, a synthetic stack trace, and overly broad CORS metadata are exposed.",
      },
      note: {
        ja: "返す値は合成メタデータだけで、実設定、秘密情報、実ログは含めません。",
        en: "The response uses synthetic metadata only and contains no real configuration, secrets, or logs.",
      },
    },
    secure: {
      route: "/api/secure/config/diagnostics",
      request:
        'POST /api/secure/config/diagnostics\n{\n  "requestedOrigin": "https://untrusted.example",\n  "includeDebugDetails": true\n}',
      response: {
        ja: "HTTP 403は、許可されていないOriginからの診断要求を拒否し、内部パスや詳細エラーを返さない制御が働いたことを表します。",
        en: "HTTP 403 means the diagnostics request came from an unallowed origin and internal paths or verbose errors were not returned.",
      },
      note: {
        ja: "安全APIでは、診断情報の公開範囲を最小化し、詳細エラーや内部パスを返しません。",
        en: "The secure API minimizes diagnostic disclosure and does not return verbose errors or internal paths.",
      },
    },
    checklist: {
      ja: [
        "本番相当のAPIでデバッグモード、開発用エンドポイント、サンプル管理画面を有効にしていない。",
        "エラー応答にスタックトレース、内部パス、環境変数名、ライブラリ詳細、秘密情報を含めていない。",
        "CORSは必要なOriginだけを許可し、認証付きAPIで安易にワイルドカードを使っていない。",
        "Cache-Control、Content-Type、X-Content-Type-Optionsなど、APIに必要なヘッダーを返している。",
        "機密データを返すAPIでは、ブラウザや中間キャッシュに保存されないようno-storeなどを設定している。",
        "不要なHTTPメソッド、不要な管理ポート、不要な診断APIを公開していない。",
        "TLSを前提にし、平文通信や安全でない内部通信に依存していない。",
        "依存ライブラリ、ランタイム、コンテナ、クラウド設定を定期的に更新・確認している。",
        "設定ミスを検出する自動テストやスキャンをCI/CDや運用監視に組み込んでいる。",
      ],
      en: [
        "Production-like APIs do not enable debug mode, development endpoints, or sample admin consoles.",
        "Error responses do not include stack traces, internal paths, environment variable names, library details, or secrets.",
        "CORS allows only required origins, and authenticated APIs do not casually use wildcards.",
        "Required API headers such as Cache-Control, Content-Type, and X-Content-Type-Options are returned.",
        "APIs returning sensitive data use no-store or equivalent controls so browsers and intermediaries do not cache it.",
        "Unnecessary HTTP methods, management ports, and diagnostics endpoints are not exposed.",
        "TLS is required, and the design does not depend on cleartext or unsafe internal communication.",
        "Dependencies, runtimes, containers, and cloud settings are reviewed and updated regularly.",
        "Automated tests or scans for misconfiguration are included in CI/CD or operational monitoring.",
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
      ja: "外部APIやパートナーAPIから返るデータは、便利であっても自システムの信頼境界の外側にあります。提供元のなりすまし、想定外のリダイレクト、過大なレスポンス、スキーマ違反、権限フィールドの混入を検証しないと、外部サービス側の問題が自分のAPIの脆弱性になります。",
      en: "Data returned by third-party or partner APIs is useful, but it still comes from outside your trust boundary. Without validation of provider identity, redirects, payload size, schema, and privileged fields, a weakness in an integrated service can become a vulnerability in your own API.",
    },
    vulnerableCondition: {
      ja: "信頼済みの外部APIから返ったデータだとみなし、提供元、リダイレクト先、レスポンスサイズ、スキーマ、権限に関わるフィールドを検証せずに取り込んでいる。",
      en: "The API assumes third-party data is trusted and imports it without validating provider identity, redirect targets, response size, schema, or privileged fields.",
    },
    defensiveDesign: {
      ja: "外部API応答も利用者入力と同じく信頼境界外の入力として扱い、提供元、TLS前提、リダイレクト許可先、応答サイズ、スキーマ、取り込み可能フィールドを検証します。権限やロールは外部応答から直接採用しません。",
      en: "Treat third-party API responses as untrusted input outside the trust boundary and validate provider identity, TLS assumptions, redirect allowlists, payload size, schema, and allowed fields. Roles and permissions are never accepted directly from external responses.",
    },
    vulnerable: {
      route: "/api/vulnerable/third-party/profile-import",
      request:
        'POST /api/vulnerable/third-party/profile-import\n{\n  "providerResponseId": "partner-response-redirect-admin",\n  "expectedProvider": "trusted-profile-service"\n}',
      response: {
        ja: "HTTP 200で取り込み結果が返る場合、合成外部応答に含まれる未許可リダイレクト先やadminロールを検証せず受け入れていることを表します。",
        en: "HTTP 200 means the synthetic third-party response was imported without validating the unallowed redirect target or admin role.",
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
        ja: "HTTP 403は、外部API応答内の未許可リダイレクト先や権限フィールドを検出し、信頼境界外の入力として拒否したことを表します。",
        en: "HTTP 403 means an unallowed redirect target or privileged field was detected in the third-party response and rejected as untrusted input.",
      },
      note: {
        ja: "安全APIでは、外部API応答を信頼境界外の入力として検証します。",
        en: "The secure API validates third-party responses as untrusted input outside the trust boundary.",
      },
    },
    checklist: {
      ja: [
        "自システムが呼び出す外部API、パートナーAPI、SaaS連携を一覧化している。",
        "外部API応答も利用者入力と同じく信頼境界外のデータとして扱っている。",
        "外部APIとの通信はTLSを使い、想定した提供元、証明書、エンドポイントを確認している。",
        "外部応答のスキーマ、型、必須項目、列挙値、最大サイズを検証している。",
        "外部応答に含まれるrole、isAdmin、ownerIdなどの権限フィールドをそのまま採用していない。",
        "外部APIのリダイレクトを無条件に追従せず、許可したリダイレクト先だけに制限している。",
        "外部API呼び出しにはタイムアウト、再試行回数、サーキットブレーカーなどの障害対策を設定している。",
        "外部データをSQL、HTML、コマンド、ログなどへ渡す前に、用途に応じた検証やエスケープを行っている。",
        "外部サービスが侵害・誤設定された場合に備え、拒否、隔離、監査ログ、アラートの運用を決めている。",
      ],
      en: [
        "External APIs, partner APIs, and SaaS integrations called by the system are inventoried.",
        "Third-party API responses are treated as untrusted data outside the trust boundary, just like user input.",
        "Calls to external APIs use TLS and verify the expected provider, certificate assumptions, and endpoint.",
        "External responses are validated for schema, types, required fields, enum values, and maximum size.",
        "Privileged fields such as role, isAdmin, or ownerId are not trusted directly from external responses.",
        "Redirects from external APIs are not followed blindly; only allowed redirect targets are accepted.",
        "External API calls have timeouts, retry limits, circuit breakers, or similar resilience controls.",
        "External data is validated or escaped before it is used in SQL, HTML, commands, logs, or other sinks.",
        "Operational plans exist for compromised or misconfigured providers, including rejection, isolation, audit logs, and alerts.",
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
      ja: "APIは画面より多くのエンドポイント、バージョン、環境、管理用ルートを持ちやすく、古いAPIが残ったままになることがあります。管理台帳がないと、退役済みAPI、テスト用API、保護策が古いバージョンが外部から使える状態に気づけません。",
      en: "APIs often have more endpoints, versions, environments, and administrative routes than the visible UI. Without an inventory, retired APIs, test endpoints, or legacy versions with weaker protections can remain reachable.",
    },
    vulnerableCondition: {
      ja: "旧APIや管理外エンドポイントが残り、退役状態、公開範囲、所有者、ドキュメント鮮度、現行APIとの保護策差分を確認しないまま利用できる。",
      en: "Legacy or unmanaged endpoints remain usable without checking lifecycle state, exposure, owner, documentation freshness, or protection parity with current APIs.",
    },
    defensiveDesign: {
      ja: "APIインベントリで環境、バージョン、公開範囲、所有者、文書の鮮度、必要な保護策を管理します。退役済み、管理外、保護策不足の操作は処理前に拒否します。",
      en: "Use an API inventory to track environment, version, exposure, owner, documentation freshness, and required protections. Retired, unmanaged, or under-protected operations are rejected before processing.",
    },
    vulnerable: {
      route: "/api/vulnerable/inventory/operations",
      request:
        'POST /api/vulnerable/inventory/operations\n{\n  "endpointId": "legacy-token-reset-v1",\n  "requestedEnvironment": "production"\n}',
      response: {
        ja: "HTTP 200で操作プレビューが返る場合、退役済みAPIや保護策不足の操作でもインベントリ状態を確認せず実行経路に残っていることを表します。",
        en: "HTTP 200 with an operation preview means a retired or under-protected API operation remains executable without inventory checks.",
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
        ja: "HTTP 403は、インベントリ上で退役済み、管理外、または保護策不足と判断された操作を処理前に拒否したことを表します。",
        en: "HTTP 403 means the operation was identified as retired, unmanaged, or under-protected in the inventory and rejected before processing.",
      },
      note: {
        ja: "安全APIでは、APIの状態と保護策を処理前に確認します。",
        en: "The secure API checks inventory state and protection controls before processing.",
      },
    },
    checklist: {
      ja: [
        "すべてのAPIホスト、エンドポイント、バージョン、環境をインベントリとして管理している。",
        "各APIについて、所有者、用途、公開範囲、認証方式、扱うデータの機密度を記録している。",
        "本番、ステージング、開発、betaなどの環境が外部からどう見えるかを把握している。",
        "古いバージョンや退役予定APIに終了日、移行先、削除計画を設定している。",
        "旧バージョンにも現行APIと同等の認証、認可、レート制限、監視を適用している。",
        "APIドキュメント、OpenAPI仕様、実装、デプロイ済みルートが食い違っていないか確認している。",
        "テスト環境や開発環境で本番データを使わない。避けられない場合は本番相当の保護策を適用している。",
        "外部パートナーや第三者サービスへ渡すデータフローを台帳化し、共有理由と範囲を確認している。",
        "インベントリにないAPIや退役済みAPIが呼び出された場合に拒否・通知できる仕組みを用意している。",
      ],
      en: [
        "All API hosts, endpoints, versions, and environments are managed in an inventory.",
        "Each API records owner, purpose, exposure, authentication method, and data sensitivity.",
        "The team understands how production, staging, development, and beta environments are exposed.",
        "Legacy and retiring APIs have retirement dates, migration targets, and removal plans.",
        "Older versions receive protection parity with current APIs, including authentication, authorization, rate limits, and monitoring.",
        "API documentation, OpenAPI specs, implementation, and deployed routes are checked for drift.",
        "Production data is not used in test or development environments; if unavoidable, production-equivalent protections are applied.",
        "Data flows to external partners and third-party services are inventoried with business justification and scope.",
        "Uninventoried or retired API calls can be rejected or alerted on.",
      ],
    },
  },
];

function owaspApiSortNumber(riskCategory: string) {
  const match = riskCategory.match(/API(\d+):2023/);

  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export const learningModules = [...learningModuleDefinitions].sort(
  (left, right) =>
    owaspApiSortNumber(left.riskCategory) -
    owaspApiSortNumber(right.riskCategory),
);

export function getLearningModule(id: LearningModuleId): LearningModule {
  const learningModule = learningModules.find((item) => item.id === id);

  if (!learningModule) {
    return learningModules[0];
  }

  return learningModule;
}

export const implementationWalkthroughs: Record<
  LearningModuleId,
  ImplementationWalkthrough
> = {
  bola: {
    vulnerable: {
      summary: {
        ja: "注文IDだけで注文を検索し、リクエストしたユーザーが所有者かどうかを確認しない実装です。",
        en: "The route finds an order by order ID only and does not verify whether the requester owns it.",
      },
      lines: [
        { code: "export async function GET(request, { params }) {" },
        { code: "  assertVulnerableApiEnabled();" },
        {
          code: "  const order = findOrderById(params.orderId);",
          highlight: "issue",
          comment: {
            ja: "問題: 利用者が指定したIDだけで対象データを取得しています。",
            en: "Issue: the user-supplied ID is enough to load the object.",
          },
        },
        {
          code: "  return json({ order });",
          highlight: "issue",
          comment: {
            ja: "問題: 所有者確認なしで他ユーザーの注文を返します。",
            en: "Issue: the order is returned without an ownership check.",
          },
        },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "注文を取得した後、認証済みユーザーIDと注文の所有者IDを照合してから返す実装です。",
        en: "The route loads the order, then compares the authenticated user ID with the order owner before returning it.",
      },
      lines: [
        { code: "export async function GET(request, { params }) {" },
        { code: "  const userId = requireUserId(request);" },
        { code: "  const order = findOrderById(params.orderId);" },
        {
          code: "  if (order.ownerId !== userId) return forbidden();",
          highlight: "fix",
          comment: {
            ja: "改善: 所有者でない利用者をAPI層で拒否します。",
            en: "Fix: non-owners are rejected in the API layer.",
          },
        },
        { code: "  return json({ order: safeOrderView(order) });" },
        { code: "}" },
      ],
    },
  },
  auth: {
    vulnerable: {
      summary: {
        ja: "トークンIDが登録済みかだけを見て、署名、期限、失効状態、権限を十分に確認しない実装です。",
        en: "The route only checks whether the token ID exists and does not fully validate signature, expiration, revocation, or permissions.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const body = await readJsonBody(request);" },
        {
          code: "  const token = findTokenById(body.tokenId);",
          highlight: "issue",
          comment: {
            ja: "問題: トークンの存在だけを信頼しています。",
            en: "Issue: token existence is treated as trust.",
          },
        },
        {
          code: "  return json({ accepted: Boolean(token), user: token?.subject });",
          highlight: "issue",
          comment: {
            ja: "問題: 期限切れや失効済みでもセッションを受け入れます。",
            en: "Issue: expired or revoked tokens can still be accepted.",
          },
        },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "トークンを信頼する前に、署名状態、期限、失効状態、要求権限を検証する実装です。",
        en: "The route validates signature state, expiration, revocation, and required permissions before trusting the token.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  const body = await readJsonBody(request);" },
        { code: "  const token = findTokenById(body.tokenId);" },
        {
          code: "  validateSignatureExpirationAndRevocation(token);",
          highlight: "fix",
          comment: {
            ja: "改善: 署名、期限、失効状態をまとめて検証します。",
            en: "Fix: signature, expiration, and revocation are validated together.",
          },
        },
        {
          code: "  requirePermission(token, body.requiredPermission);",
          highlight: "fix",
          comment: {
            ja: "改善: 対象APIに必要な権限を確認します。",
            en: "Fix: the permission required by the API is checked.",
          },
        },
        { code: "  return json({ accepted: true, user: token.subject });" },
        { code: "}" },
      ],
    },
  },
  "mass-assignment": {
    vulnerable: {
      summary: {
        ja: "リクエスト本文をそのままプロフィール更新に使い、利用者が変更してはいけない項目まで受け入れる実装です。",
        en: "The route applies the whole request body to profile updates, including fields the user should not control.",
      },
      lines: [
        { code: "export async function PATCH(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const body = await readJsonBody(request);" },
        {
          code: "  const updated = updateProfile({ ...body });",
          highlight: "issue",
          comment: {
            ja: "問題: roleやownerIdなどの許可外プロパティも保存対象になります。",
            en: "Issue: fields such as role or ownerId can be persisted.",
          },
        },
        { code: "  return json({ profile: updated });" },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "スキーマと許可リストで更新可能な項目だけを受け取り、権限項目を通常更新から除外する実装です。",
        en: "The route accepts only allowlisted fields through a schema and excludes privileged fields from normal updates.",
      },
      lines: [
        { code: "export async function PATCH(request) {" },
        {
          code: "  const body = profileUpdateSchema.parse(await readJsonBody(request));",
        },
        {
          code: '  const allowed = pick(body, ["displayLabel"]);',
          highlight: "fix",
          comment: {
            ja: "改善: 通常更新で受け入れる項目を明示します。",
            en: "Fix: fields accepted by normal updates are explicit.",
          },
        },
        {
          code: "  rejectIfPrivilegedFieldsPresent(body);",
          highlight: "fix",
          comment: {
            ja: "改善: roleやownerIdなどを通常更新から分離します。",
            en: "Fix: fields such as role and ownerId are separated from normal updates.",
          },
        },
        { code: "  return json({ profile: updateProfile(allowed) });" },
        { code: "}" },
      ],
    },
  },
  "rate-limit": {
    vulnerable: {
      summary: {
        ja: "検索リクエストの回数や時間枠を確認せず、連続実行をそのまま処理する実装です。",
        en: "The route processes repeated search requests without checking counts or time windows.",
      },
      lines: [
        { code: "export async function GET(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const query = getSearchQuery(request);" },
        {
          code: "  const results = runSearch(query);",
          highlight: "issue",
          comment: {
            ja: "問題: 利用者や送信元ごとの上限確認がありません。",
            en: "Issue: no per-user or per-source limit is checked.",
          },
        },
        { code: "  return json({ results });" },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "利用者とルートごとの回数を時間枠で管理し、上限を超えた場合は429で拒否する実装です。",
        en: "The route tracks counts per user and route in a time window, then rejects excess requests with 429.",
      },
      lines: [
        { code: "export async function GET(request) {" },
        { code: '  const key = rateLimitKey(request, "search");' },
        {
          code: "  if (isRateLimited(key)) return tooManyRequests();",
          highlight: "fix",
          comment: {
            ja: "改善: 上限超過時は処理前に429で拒否します。",
            en: "Fix: excess requests are rejected with 429 before work starts.",
          },
        },
        { code: "  const results = runSearch(getSearchQuery(request));" },
        { code: "  return json({ results });" },
        { code: "}" },
      ],
    },
  },
  "function-auth": {
    vulnerable: {
      summary: {
        ja: "ログイン済みであることを前提に、管理者招待機能の権限を確認せずに受け入れる実装です。",
        en: "The route assumes an authenticated caller is enough and accepts an administrative invitation without checking function permission.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const body = await readJsonBody(request);" },
        {
          code: "  const preview = createInvitationPreview(body);",
          highlight: "issue",
          comment: {
            ja: "問題: 管理機能に必要な権限を確認していません。",
            en: "Issue: the permission required for the admin function is not checked.",
          },
        },
        { code: "  return json({ preview });" },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "管理者招待に必要な機能権限を定義し、権限不足なら処理前に403で拒否する実装です。",
        en: "The route defines the permission required for admin invitations and rejects missing permission with 403 before processing.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  const body = await readJsonBody(request);" },
        {
          code: '  requireFunctionPermission(body.actorUserId, "admin:invite");',
          highlight: "fix",
          comment: {
            ja: "改善: 管理操作ごとの必要権限をAPI層で確認します。",
            en: "Fix: the API layer checks the permission required by the admin action.",
          },
        },
        { code: "  return json({ preview: createInvitationPreview(body) });" },
        { code: "}" },
      ],
    },
  },
  "business-flow": {
    vulnerable: {
      summary: {
        ja: "予約フローの順序、数量上限、在庫制約を確認せず、直接チェックアウトを受け入れる実装です。",
        en: "The route accepts direct checkout without validating workflow order, quantity limits, or stock constraints.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const body = await readJsonBody(request);" },
        {
          code: "  const reservation = reserveProduct(body.productId, body.quantity);",
          highlight: "issue",
          comment: {
            ja: "問題: フロー順序やユーザー単位上限を確認していません。",
            en: "Issue: workflow order and per-user limits are not checked.",
          },
        },
        { code: "  return json({ reservation });" },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "業務フローの状態遷移、数量上限、在庫状態を確認してから予約を作成する実装です。",
        en: "The route validates workflow state, quantity limits, and stock state before creating a reservation.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        {
          code: "  const body = reservationSchema.parse(await readJsonBody(request));",
        },
        {
          code: "  requireExpectedFlowStep(body.userId, body.flowStep);",
          highlight: "fix",
          comment: {
            ja: "改善: 画面任せにせずAPI層で状態遷移を確認します。",
            en: "Fix: workflow state is validated in the API layer, not only in the UI.",
          },
        },
        {
          code: "  enforcePerUserLimitAndStock(body);",
          highlight: "fix",
          comment: {
            ja: "改善: 数量上限と在庫制約を処理前に確認します。",
            en: "Fix: quantity limits and stock constraints are checked before processing.",
          },
        },
        { code: "  return json({ reservation: reserveProduct(body) });" },
        { code: "}" },
      ],
    },
  },
  ssrf: {
    vulnerable: {
      summary: {
        ja: "利用者が指定したURLをそのまま取得対象として扱い、内部向けURLも受け入れる実装です。",
        en: "The route treats the user-supplied URL as a fetch target and accepts internal destinations.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const { url } = await readJsonBody(request);" },
        {
          code: "  const preview = buildFetchPreview(url);",
          highlight: "issue",
          comment: {
            ja: "問題: スキーム、ホスト、IP範囲、リダイレクト先を検証していません。",
            en: "Issue: scheme, host, IP range, and redirects are not validated.",
          },
        },
        { code: "  return json({ preview });" },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "許可リスト、プライベートIP拒否、リダイレクト制御、タイムアウト前提を確認する実装です。",
        en: "The route validates allowlists, rejects private IP destinations, controls redirects, and applies timeout assumptions.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        {
          code: "  const { url } = fetchUrlSchema.parse(await readJsonBody(request));",
        },
        {
          code: "  requireAllowedHostAndScheme(url);",
          highlight: "fix",
          comment: {
            ja: "改善: 許可したスキームとホストだけを対象にします。",
            en: "Fix: only approved schemes and hosts are allowed.",
          },
        },
        {
          code: "  rejectPrivateIpAndUnsafeRedirects(url);",
          highlight: "fix",
          comment: {
            ja: "改善: 内部ネットワークや危険なリダイレクトを拒否します。",
            en: "Fix: internal networks and unsafe redirects are rejected.",
          },
        },
        { code: "  return json({ preview: buildSafeFetchPreview(url) });" },
        { code: "}" },
      ],
    },
  },
  "security-config": {
    vulnerable: {
      summary: {
        ja: "診断APIがデバッグ情報、内部パス、広すぎるCORSメタデータを返す実装です。",
        en: "The diagnostics route returns debug details, internal paths, and overly broad CORS metadata.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const body = await readJsonBody(request);" },
        {
          code: '  return json({ debug: true, stackTrace, cors: "*", internalPath });',
          highlight: "issue",
          comment: {
            ja: "問題: 公開不要な診断情報と広すぎるCORS設定を返しています。",
            en: "Issue: unnecessary diagnostics and overly broad CORS settings are exposed.",
          },
        },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "許可Originと公開可能なメタデータだけを返し、詳細エラーや内部情報を抑制する実装です。",
        en: "The route returns only approved public metadata for allowed origins and suppresses verbose errors and internals.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        {
          code: "  const body = diagnosticsSchema.parse(await readJsonBody(request));",
        },
        {
          code: "  requireAllowedOrigin(body.requestedOrigin);",
          highlight: "fix",
          comment: {
            ja: "改善: 許可Origin以外からの診断要求を拒否します。",
            en: "Fix: diagnostics requests from unallowed origins are rejected.",
          },
        },
        {
          code: "  return json(publicDiagnostics(), { headers: securityHeaders });",
          highlight: "fix",
          comment: {
            ja: "改善: 公開可能な情報とセキュリティヘッダーだけを返します。",
            en: "Fix: only public metadata and security headers are returned.",
          },
        },
        { code: "}" },
      ],
    },
  },
  "api-inventory": {
    vulnerable: {
      summary: {
        ja: "退役済みAPIや保護策不足のAPI操作でも、インベントリ状態を確認せずにプレビューを作成する実装です。",
        en: "The route creates previews for retired or under-protected API operations without checking inventory state.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const body = await readJsonBody(request);" },
        {
          code: "  const operation = findOperationById(body.endpointId);",
          highlight: "issue",
          comment: {
            ja: "問題: 退役状態、公開範囲、保護策の差分を確認していません。",
            en: "Issue: lifecycle state, exposure, and protection parity are not checked.",
          },
        },
        {
          code: "  return json({ preview: buildOperationPreview(operation) });",
        },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "APIインベントリを参照し、退役済み、管理外、保護策不足の操作を処理前に拒否する実装です。",
        en: "The route checks API inventory and rejects retired, unmanaged, or under-protected operations before processing.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        {
          code: "  const body = inventorySchema.parse(await readJsonBody(request));",
        },
        { code: "  const operation = findOperationById(body.endpointId);" },
        {
          code: "  requireActiveManagedOperation(operation, body.requestedEnvironment);",
          highlight: "fix",
          comment: {
            ja: "改善: 退役済みAPIや管理外APIを拒否します。",
            en: "Fix: retired or unmanaged APIs are rejected.",
          },
        },
        {
          code: "  requireProtectionParity(operation);",
          highlight: "fix",
          comment: {
            ja: "改善: 現行APIと同等の保護策があるか確認します。",
            en: "Fix: protection parity with current APIs is checked.",
          },
        },
        {
          code: "  return json({ preview: buildOperationPreview(operation) });",
        },
        { code: "}" },
      ],
    },
  },
  "unsafe-consumption": {
    vulnerable: {
      summary: {
        ja: "外部API応答を信頼済みとして扱い、リダイレクト先や権限フィールドを検証せずに取り込む実装です。",
        en: "The route treats third-party responses as trusted and imports redirect targets or privileged fields without validation.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  assertVulnerableApiEnabled();" },
        { code: "  const partner = loadSyntheticPartnerResponse(request);" },
        {
          code: "  const profile = importProfile(partner.responseBody);",
          highlight: "issue",
          comment: {
            ja: "問題: 外部応答のスキーマ、提供元、権限フィールドを検証していません。",
            en: "Issue: schema, provider identity, and privileged fields are not validated.",
          },
        },
        { code: "  return json({ profile });" },
        { code: "}" },
      ],
    },
    secure: {
      summary: {
        ja: "外部API応答も信頼境界外の入力として扱い、提供元、スキーマ、許可フィールドを検証する実装です。",
        en: "The route treats third-party API responses as untrusted input and validates provider identity, schema, and allowed fields.",
      },
      lines: [
        { code: "export async function POST(request) {" },
        { code: "  const partner = loadSyntheticPartnerResponse(request);" },
        {
          code: "  requireExpectedProvider(partner);",
          highlight: "fix",
          comment: {
            ja: "改善: 想定した提供元の応答か確認します。",
            en: "Fix: the provider identity is validated.",
          },
        },
        {
          code: "  const profile = thirdPartyProfileSchema.parse(partner.responseBody);",
          highlight: "fix",
          comment: {
            ja: "改善: スキーマと許可フィールドで取り込み対象を制限します。",
            en: "Fix: schema and allowed fields constrain what is imported.",
          },
        },
        { code: "  return json({ profile: safeProfile(profile) });" },
        { code: "}" },
      ],
    },
  },
};

export function getImplementationWalkthrough(
  id: LearningModuleId,
): ImplementationWalkthrough {
  return implementationWalkthroughs[id];
}

export const learningContextNotes: Record<
  LearningModuleId,
  LearningContextNote
> = {
  bola: {
    ja: "注文詳細、請求書、診療予約、車両操作、クラウド上の文書など、URLやJSONに含まれるIDで個別データを扱うAPIで頻出します。OWASP公式例でも、ショップ売上データ、車両VIN、文書IDの差し替えが挙げられています。実害としては、他人の個人情報や売上情報の閲覧、他人の文書削除、所有していない機器の操作などが起こり得ます。このラボでは、他人の注文IDを指定したときに、脆弱APIが注文を返し、安全APIが403で拒否する差を確認します。",
    en: "This appears in APIs that use IDs in URLs or JSON to access individual data, such as orders, invoices, appointments, vehicle controls, or cloud documents. OWASP examples include shop revenue data, vehicle VINs, and document IDs. Real impact can include disclosure of personal or business data, deletion of another user's documents, or control of assets the user does not own. In this lab, the vulnerable API returns another user's order, while the secure API rejects it with 403.",
  },
  auth: {
    ja: "ログイン、パスワード再設定、メールアドレス変更、モバイルアプリのセッション更新など、本人確認の入口になるAPIで問題になります。OWASP公式では、ブルートフォース、GraphQLバッチによるレート制限回避、再認証なしのメール変更が例示されています。実害としては、アカウント乗っ取り、個人情報の閲覧、本人になりすました操作が発生します。このラボでは、期限切れ・失効済み・署名不正の合成トークンを脆弱APIが受け入れ、安全APIが拒否することを確認します。",
    en: "This appears in login, password reset, email-change, mobile session refresh, and other identity entry points. OWASP examples include brute force, bypassing rate limits with GraphQL batching, and changing email without re-authentication. Real impact can include account takeover, personal data access, and actions performed as the victim. In this lab, the vulnerable API accepts a synthetic expired/revoked/invalid token, while the secure API rejects it.",
  },
  "mass-assignment": {
    ja: "プロフィール更新、予約承認、動画公開状態、アカウント設定など、JSON本文でオブジェクトの一部を更新するAPIで起きます。OWASP公式例では、予約金額の改ざんやブロック済み動画の解除が示されています。実害としては、権限昇格、所有者変更、料金改ざん、非公開情報の露出が起こり得ます。このラボでは、脆弱APIがroleやownerIdを受け入れ、安全APIが許可リスト外の項目を拒否する差を確認します。",
    en: "This appears in APIs that update object properties from JSON bodies, such as profile edits, booking approval, video visibility, and account settings. OWASP examples include changing booking prices and unblocking restricted videos. Real impact can include privilege escalation, ownership changes, price manipulation, or sensitive data exposure. In this lab, the vulnerable API accepts role and ownerId changes, while the secure API rejects fields outside the allowlist.",
  },
  "rate-limit": {
    ja: "検索、画像処理、パスワード再設定、SMS送信、ファイル変換、外部API連携など、処理資源や外部サービス費用を消費するAPIで重要です。OWASP公式では、SMS送信費用の急増、GraphQLバッチによる画像処理DoS、大容量ファイル配信によるクラウド費用増が例示されています。実害としては、サービス停止、レスポンス低下、クラウドや外部サービスの請求増が起こります。このラボでは、脆弱APIが連続検索を処理し、安全APIが上限超過を429で拒否する差を確認します。",
    en: "This matters for APIs that consume compute or third-party cost, such as search, image processing, password reset, SMS delivery, file conversion, and external integrations. OWASP examples include SMS cost spikes, image-processing DoS through GraphQL batching, and cloud cost increases from large downloads. Real impact includes outages, degraded response times, and unexpected provider bills. In this lab, the vulnerable API processes repeated searches, while the secure API rejects excess requests with 429.",
  },
  "function-auth": {
    ja: "管理者招待、ユーザー一覧のエクスポート、ロール変更、監査ログ閲覧など、管理者や特定ロールだけが使うべきAPIで問題になります。OWASP公式では、通常ユーザーが管理者招待APIや全ユーザー一覧APIを直接呼び出す例が示されています。実害としては、管理者アカウント作成、全ユーザー情報の取得、データ改ざん、サービス停止につながります。このラボでは、脆弱APIが一般ユーザーの管理者招待プレビューを受け入れ、安全APIが403で拒否する差を確認します。",
    en: "This appears in APIs intended only for administrators or specific roles, such as invitations, user export, role changes, and audit-log access. OWASP examples include regular users directly invoking admin invitation or all-users APIs. Real impact can include admin account creation, user-data exposure, data corruption, or service disruption. In this lab, the vulnerable API accepts an admin invitation preview from a regular user, while the secure API rejects it with 403.",
  },
  "business-flow": {
    ja: "限定商品の購入、チケット予約、座席予約、投稿、投票、紹介キャンペーンなど、過剰利用が事業上の損害につながるフローで問題になります。OWASP公式では、ゲーム機の買い占め、航空券の大量予約と直前キャンセル、紹介プログラムの自動化が例示されています。実害としては、正規利用者の購入機会喪失、価格操作、在庫枯渇、不正なポイント獲得が起こります。このラボでは、脆弱APIがdirect-checkoutを受け入れ、安全APIがフロー順序や数量上限で拒否する差を確認します。",
    en: "This appears in business flows where excessive use harms the business, such as limited-product purchases, ticket booking, seat reservations, posting, voting, and referral programs. OWASP examples include console scalping, mass airline booking and cancellation, and referral automation. Real impact includes loss of fair access, price manipulation, stock exhaustion, and fraudulent credits. In this lab, the vulnerable API accepts direct-checkout, while the secure API rejects skipped workflow steps or excessive quantity.",
  },
  ssrf: {
    ja: "画像URL取り込み、Webhookテスト、URLプレビュー、外部ファイル取得、カスタムSSO連携など、サーバーが利用者指定URLへアクセスするAPIで起きます。OWASP公式では、内部ポートスキャンやクラウドメタデータサービスからの認証情報取得が例示されています。実害としては、内部サービス探索、ファイアウォール回避、クラウド認証情報漏えい、サーバーの踏み台化があります。このラボでは実通信は行わず、脆弱APIが内部向けURLを受け入れるプレビューを返し、安全APIが許可外URLを拒否する差を確認します。",
    en: "This appears when a server accesses user-supplied URLs, such as image imports, webhook tests, URL previews, external file fetching, or custom SSO integrations. OWASP examples include internal port scanning and retrieving cloud metadata credentials. Real impact includes internal service discovery, firewall bypass, credential exposure, or using the server as a proxy. This lab performs no real network access; the vulnerable API accepts an internal URL preview, while the secure API rejects unallowed URLs.",
  },
  "security-config": {
    ja: "CORS、キャッシュ、HTTPヘッダー、エラー出力、診断API、ログ設定、TLS、不要なHTTPメソッドなど、API周辺の設定で発生します。OWASP公式では、ログ設定の危険な既定値や、Cache-Control不足によるプライベートメッセージのブラウザキャッシュが例示されています。実害としては、内部情報の漏えい、ブラウザ保護の無効化、機密データのキャッシュ、既知脆弱性の悪用があります。このラボでは、脆弱APIが合成デバッグ情報と広すぎるCORSメタデータを返し、安全APIが許可Originと公開可能情報だけに制限する差を確認します。",
    en: "This appears in API-adjacent configuration such as CORS, caching, HTTP headers, error output, diagnostics APIs, logging settings, TLS, and unnecessary HTTP methods. OWASP examples include unsafe default logging behavior and missing Cache-Control for private messages. Real impact includes internal information disclosure, weakened browser protections, sensitive data caching, and exploitation of known weaknesses. In this lab, the vulnerable API returns synthetic debug and broad CORS metadata, while the secure API limits output to allowed origins and public information.",
  },
  "api-inventory": {
    ja: "複数バージョン、beta環境、旧ホスト、開発・検証環境、パートナー連携APIが残り続ける組織で問題になります。OWASP公式では、beta APIにレート制限がなくパスワードリセットを突破される例や、外部アプリ連携で想定以上の友人情報が共有される例が示されています。実害としては、古いAPI経由の認証突破、保護されていない本番データアクセス、第三者への過剰なデータ共有があります。このラボでは、脆弱APIが退役済み操作をプレビューし、安全APIがインベントリ状態で拒否する差を確認します。",
    en: "This appears in organizations with multiple versions, beta environments, legacy hosts, development/staging deployments, and partner APIs. OWASP examples include a beta API missing rate limits for password reset and third-party app integrations sharing more friend data than intended. Real impact includes authentication bypass through old APIs, access to production data through under-protected environments, and excessive data sharing with third parties. In this lab, the vulnerable API previews a retired operation, while the secure API rejects it based on inventory state.",
  },
  "unsafe-consumption": {
    ja: "住所補完、医療情報保管、決済、配送、ID確認、リポジトリ連携など、外部APIの応答を自システムに取り込む場面で起きます。OWASP公式では、外部サービス由来のSQLインジェクション、第三者APIのリダイレクト追従による機密データ送信、リポジトリ名を安全だと誤信したSQLインジェクションが例示されています。実害としては、注入攻撃、機密データ漏えい、DoS、権限やリダイレクト先の不正取り込みがあります。このラボでは、脆弱APIが合成外部応答のadminロールや未許可リダイレクトを受け入れ、安全APIが提供元、スキーマ、許可フィールドで拒否する差を確認します。",
    en: "This appears when your system imports responses from third-party APIs, such as address enrichment, medical record storage, payments, shipping, identity verification, and repository integrations. OWASP examples include SQL injection from external service data, sensitive data leakage through followed redirects, and trusting repository names as safe input. Real impact includes injection, sensitive data exposure, denial of service, or importing unauthorized roles and redirects. In this lab, the vulnerable API accepts a synthetic admin role and unallowed redirect from a partner response, while the secure API validates provider, schema, and allowed fields.",
  },
};

export function getLearningContextNote(
  id: LearningModuleId,
): LearningContextNote {
  return learningContextNotes[id];
}
