# APIセキュリティ学習・検証プラットフォーム 要件定義書

## 機能要件

| ID    | 要件                     | 概要                                                                                                                        |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | 学習テーマ一覧           | APIセキュリティの学習テーマを一覧表示できる。                                                                               |
| FR-02 | 脆弱APIデモ              | ローカル限定で脆弱なAPI例を実行できる。                                                                                     |
| FR-03 | 安全APIデモ              | 同じテーマに対する安全な実装例を実行できる。                                                                                |
| FR-04 | 比較表示                 | 脆弱な例と安全な例のリクエスト、レスポンス、設計差分、APIプログラム全体の流れ、実装フローの問題箇所と改善箇所を比較できる。 |
| FR-05 | BOLAシナリオ             | オブジェクトレベル認可不備の例と対策を確認できる。                                                                          |
| FR-06 | 認証シナリオ             | 認証不備やトークン管理の問題と対策を確認できる。                                                                            |
| FR-07 | レート制限シナリオ       | 過剰リクエストを制限する設計を確認できる。                                                                                  |
| FR-08 | 機能単位認可シナリオ     | 機能権限なしで管理機能を実行できる問題と対策を確認できる。                                                                  |
| FR-09 | 業務フローシナリオ       | 重要な予約・購入フローの過剰利用やフロー飛ばしの問題と対策を確認できる。                                                    |
| FR-10 | Mass Assignmentシナリオ  | 許可されていないプロパティ更新の問題と対策を確認できる。                                                                    |
| FR-11 | SSRFシナリオ             | 外部URL取得時の危険性と防御策を確認できる。                                                                                 |
| FR-12 | セキュリティ設定シナリオ | 診断情報公開、過度に広いCORS、セキュリティヘッダー不足の問題と対策を確認できる。                                            |
| FR-13 | APIインベントリシナリオ  | 旧APIや管理外APIを実行可能な状態で残す問題と対策を確認できる。                                                              |
| FR-14 | 外部API応答シナリオ      | 外部API応答を過信する問題と、信頼境界で検証する対策を確認できる。                                                           |
| FR-15 | 言語切替                 | すべての画面で日本語と英語を切り替えられる。初期表示は日本語とする。                                                        |

## 非機能要件

- 脆弱なAPIはローカル実行限定とする。
- 脆弱なAPIと安全なAPIはルート、表示、説明で明確に分離する。
- 公開環境へのデプロイを前提にしない。
- 学習画面はデスクトップとモバイルで閲覧できる。
- 警告、エラー、成功状態を利用者が理解しやすい形で表示する。

## セキュリティ要件

| ID    | 要件             | 内容                                                                                                                            |
| ----- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| SR-01 | ローカル限定     | 脆弱APIを公開環境へデプロイしてはいけないことをREADMEと画面に明記する。                                                         |
| SR-02 | ルート分離       | 脆弱APIと安全APIを明確に分離し、誤利用を防ぐ。                                                                                  |
| SR-03 | 認可検証         | 安全APIではユーザーと対象リソースの関係を必ず検証する。                                                                         |
| SR-04 | 入力検証         | リクエストボディ、クエリ、URLをスキーマで検証する。                                                                             |
| SR-05 | レート制限       | 安全APIでは過剰リクエストを制限する。                                                                                           |
| SR-06 | 機能単位認可     | 安全APIでは管理機能に必要な権限を確認し、権限不足をdeny-by-defaultで拒否する。                                                  |
| SR-07 | 業務フロー制御   | 安全APIでは重要な業務フローの順序、ユーザー単位上限、在庫制約を検証する。                                                       |
| SR-08 | SSRF対策         | 実ネットワークアクセスは行わず、URL検証プレビューで許可リスト、プライベートホスト拒否、リダイレクト方針を確認できるようにする。 |
| SR-09 | セキュリティ設定 | 安全APIではデバッグ情報を抑制し、CORSを許可リストで制御し、セキュリティヘッダーとキャッシュ無効化を診断APIにも適用する。        |
| SR-10 | API管理          | 安全APIではAPIの環境、バージョン、公開範囲、所有者、退役状態、保護策の適用状況を確認する。                                      |
| SR-11 | 外部応答検証     | 外部API応答を信頼境界外の入力として扱い、提供元、リダイレクト先、応答スキーマ、権限フィールドを検証する。                       |
| SR-12 | 秘密情報管理     | `.env`、鍵、トークンをGit管理対象に含めない。                                                                                   |
| SR-13 | リクエスト境界   | JSON本文は`application/json`に限定し、構文を検証し、16 KiBを超える本文を拒否する。                                              |
| SR-14 | ブラウザー防御   | CSP、フレーム埋め込み拒否、MIME sniffing拒否、Referrer制御、機能制限を共通レスポンスへ適用する。                                |
| SR-15 | 安全な開発工程   | 脆弱APIを既定無効かつloopback待受とし、CIで依存監査、整形、lint、テスト、型検査、ビルドを実行する。                             |

## 検証要件

- 公開環境相当の設定では、すべての脆弱APIが無効化されることをテストで確認する。
- 安全APIでは、BOLA、認証不備、レート制限不足、機能単位認可不備、業務フロー悪用、Mass Assignment、SSRF、セキュリティ設定不備、旧API管理不備、外部API応答の過信が再現しないことを確認する。
- OWASP API Security Top 10 2023をリスク分類の参照元として使用する。公式URL: <https://owasp.org/API-Security/editions/2023/en/0x11-t10/>。
- SSRFデモでは、脆弱APIと安全APIのどちらも実際の外部ネットワークアクセスを行わないことを確認する。
- Security Misconfigurationデモでは、脆弱APIと安全APIのどちらも実設定、秘密情報、個人情報、実ログを公開しないことを確認する。
- APIインベントリデモでは、脆弱APIと安全APIのどちらも実トークン発行や通知送信を行わないことを確認する。
- 外部API応答デモでは、脆弱APIと安全APIのどちらも実際の外部API通信を行わないことを確認する。
- OpenAPI仕様に、実装済みAPIのルート、入力、エラーレスポンス、安全上の注意が記述されていることを確認する。
- 日本語表示と英語表示で、画面内の文言が同じ言語に統一されていることを確認する。
- 未設定の`LAB_MODE`で脆弱APIが無効となり、明示的なローカル設定でのみ有効になることを確認する。
- 不正JSON、非JSON Content-Type、16 KiBを超える本文が統一した400、415、413レスポンスで拒否されることを確認する。
- HTMLとAPIに共通セキュリティヘッダーが適用され、APIレスポンスが`no-store`となることを確認する。

### 要件と検証のトレーサビリティ

次の図は、代表的な安全要件と、それを満たす実装要素または検証要素の関係を示します。要件の完全な一覧と詳細は、上の要件表を正とします。

```mermaid
requirementDiagram
    requirement local_only {
        id: "SR-01"
        text: "脆弱APIはローカル限定で実行する"
        risk: High
        verifymethod: Test
    }

    requirement route_separation {
        id: "SR-02"
        text: "脆弱APIと安全APIのルートを分離する"
        risk: High
        verifymethod: Inspection
    }

    functionalRequirement secure_controls {
        id: "SR-03..SR-11"
        text: "安全APIに各リスクへの防御を適用する"
        risk: High
        verifymethod: Test
    }

    designConstraint secret_exclusion {
        id: "SR-12"
        text: "環境変数、鍵、トークンをGit管理から除外する"
        risk: High
        verifymethod: Inspection
    }

    designConstraint platform_hardening {
        id: "SR-13..SR-15"
        text: "入力境界、ブラウザー防御、安全な開発工程を適用する"
        risk: High
        verifymethod: Test
    }

    functionalRequirement bilingual_ui {
        id: "FR-15"
        text: "日本語と英語のUIを一貫して提供する"
        risk: Medium
        verifymethod: Test
    }

    element security_tests {
        type: "Vitestテストスイート"
        docref: "src/lib/security-verification.test.ts"
    }

    element openapi_contract {
        type: "OpenAPI仕様と検証"
        docref: "docs/api/openapi.json / src/lib/openapi.test.ts"
    }

    element route_handlers {
        type: "Next.js Route Handlers"
        docref: "src/app/api/secure / src/app/api/vulnerable"
    }

    element repository_exclusions {
        type: "Git除外設定"
        docref: ".gitignore"
    }

    element ui_resources {
        type: "日英UIリソース"
        docref: "src/lib/i18n.ts"
    }

    element shared_security_pipeline {
        type: "共通入力処理、レスポンスヘッダー、CI"
        docref: "src/lib/request-validation.ts / next.config.ts / .github/workflows"
    }

    security_tests - verifies -> local_only
    security_tests - verifies -> secure_controls
    openapi_contract - verifies -> route_separation
    route_handlers - satisfies -> route_separation
    route_handlers - satisfies -> secure_controls
    repository_exclusions - satisfies -> secret_exclusion
    ui_resources - satisfies -> bilingual_ui
    shared_security_pipeline - satisfies -> platform_hardening
```

## 学習モジュール状態遷移

```mermaid
stateDiagram-v2
    [*] --> NotStarted
    NotStarted --> Reading: 概要を開く
    Reading --> RunningVulnerableDemo: 脆弱APIを実行
    RunningVulnerableDemo --> Comparing: 安全APIと比較
    Comparing --> Reviewed: 防御策を確認
    Reviewed --> Completed: 確認項目を確認
```

## UI/UX要件

- 脆弱なAPIを実行する画面には明確な警告を表示する。
- 脆弱な例と安全な例は色、ラベル、説明で区別する。
- リクエスト例とレスポンス例は比較しやすいレイアウトにする。
- 全画面共通の言語切替を配置する。
- 日本語表示時は画面内のUIテキストを日本語に統一する。
- 英語表示時は画面内のUIテキストを英語に統一する。
- API、BOLA、SSRF、CVSS、CWE、OWASPなど、日本語表示でも一般的に英語で使われる技術用語は英語表記を許容する。
