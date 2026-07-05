# APIセキュリティ学習・検証プラットフォーム 設計書

## 技術選定方針

初期実装では、API仕様の明確化、リクエスト検証、認証・認可、レート制限、脆弱デモの隔離を重視します。候補構成は以下です。

- Frontend: TypeScript + React / Next.js
- Backend: Next.js API Routes または Node.js API
- Database: PostgreSQL または SQLite
- ORM: Prisma
- Validation: Zod
- API Documentation: OpenAPI

TypeScriptを採用する理由は、APIリクエスト、レスポンス、認可対象リソース、学習モジュールを型で管理し、脆弱例と安全例の差分を明確にしやすいためです。OpenAPIを併用することで、API仕様と検証観点を文書化しやすくします。

## アーキテクチャ

```mermaid
flowchart LR
    U[User Browser] --> UI[Learning UI]
    UI --> API[API Layer]
    API --> Safe[Secure API Modules]
    API --> Vuln[Vulnerable API Modules]
    API --> Guard[Safety Guard]
    Safe --> DB[(Local Database)]
    Vuln --> DB
    Guard --> API
```

## モジュール構成

```mermaid
classDiagram
    class LearningModule {
        +id
        +title
        +riskCategory
        +overview
        +warning
    }
    class VulnerableScenario {
        +route
        +requestExample
        +expectedIssue
    }
    class SecureScenario {
        +route
        +requestExample
        +mitigation
    }
    class ReviewChecklist {
        +items
        +completionState
    }

    LearningModule "1" --> "1" VulnerableScenario
    LearningModule "1" --> "1" SecureScenario
    LearningModule "1" --> "1" ReviewChecklist
```

## BOLA検証シーケンス

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant VulnAPI
    participant SafeAPI
    participant DB

    User->>UI: 他ユーザーのリソースIDを指定
    UI->>VulnAPI: GET /vulnerable/orders/{id}
    VulnAPI->>DB: IDのみで注文を取得
    DB-->>VulnAPI: 注文データ
    VulnAPI-->>UI: 認可不備のレスポンス
    UI->>SafeAPI: GET /secure/orders/{id}
    SafeAPI->>DB: 注文と所有者を確認
    DB-->>SafeAPI: 所有者情報
    SafeAPI-->>UI: 権限がなければ拒否
```

## データモデル

```mermaid
erDiagram
    USER ||--o{ LAB_RESOURCE : owns
    LEARNING_MODULE ||--o{ LAB_SCENARIO : contains
    LEARNING_MODULE ||--o{ CHECKLIST_ITEM : has

    USER {
        uuid id PK
        string name
        string role
    }
    LAB_RESOURCE {
        uuid id PK
        uuid owner_id FK
        string resource_type
        json data
    }
    LEARNING_MODULE {
        string id PK
        string title
        string risk_category
        text overview
    }
    LAB_SCENARIO {
        string id PK
        string module_id FK
        string scenario_type
        string route
        text explanation
    }
    CHECKLIST_ITEM {
        string id PK
        string module_id FK
        text label
        int sort_order
    }
```

## セキュリティ設計

- 脆弱APIは `/vulnerable/*`、安全APIは `/secure/*` のように明確に分離する。
- `LAB_MODE=local` を前提とし、脆弱APIは本番環境で有効化しない。
- 脆弱APIを操作する画面には、ローカル限定であることを常に表示する。
- 安全APIでは、ユーザーID、ロール、対象リソース所有者をAPI層で検証する。
- SSRF対策では、許可リスト、プライベートIP範囲拒否、リダイレクト制限、タイムアウトを設計に含める。
- レート制限はユーザー単位、IP単位、APIルート単位で検討する。

## 多言語UI設計

初期表示は日本語とし、すべての画面で共通ヘッダーまたは共通ナビゲーション内に言語切替を配置します。言語設定はアプリケーション全体で共有し、画面遷移後も選択状態を維持します。

```mermaid
flowchart TD
    A[初回アクセス] --> B[日本語UIを表示]
    B --> C{言語切替}
    C -- 日本語 --> D[全UIテキストを日本語で表示]
    C -- English --> E[全UIテキストを英語で表示]
    D --> F[画面遷移後も日本語を維持]
    E --> G[画面遷移後も英語を維持]
```

- 学習モジュール名、警告、リクエスト説明、レスポンス説明、防御策、確認項目を翻訳対象に含める。
- 日本語設定では日本語、英語設定では英語に統一する。
- API、BOLA、SSRF、Mass Assignment、OWASPなどの一般的な技術用語は日本語設定でも英語表記を許容する。

## 画面設計

- 学習テーマ一覧: リスクカテゴリ、難易度、進捗、注意事項を表示する。
- 学習詳細: 概要、攻撃条件、防御方針、比較デモを表示する。
- 比較ビュー: 脆弱APIと安全APIのリクエスト・レスポンスを並べて表示する。
- チェックリスト: 実装時に確認すべき防御観点を表示する。
