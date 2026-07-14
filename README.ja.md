# APIセキュリティ学習・検証プラットフォーム

脆弱なAPI例と安全な実装例を比較しながら、代表的なAPIセキュリティリスクをローカル環境で安全に学習・検証するためのプラットフォームです。

## 目的

現代のアプリケーションでは、APIがデータアクセスや業務処理の主要な入口となっています。認可不備、認証不備、過剰なデータ公開、レート制限不足、業務フローの悪用、セキュリティ設定不備、旧API管理の不備、安全でない外部リクエスト処理、外部API応答の過信は、重大なセキュリティ事故につながる可能性があります。

このシステムの目的は、API脆弱性がどのように発生し、どのような設計で防止できるのかを、隔離された環境で確認できるようにすることです。

## 公開ショーケース

読み取り専用の学習UI: <https://showcase.api-security-lab-platform.workers.dev/>

公開サイトではライブAPI実行を停止しています。「リクエスト結果を表示」から、APIリクエストを送信せずに、脆弱側と安全側の代表的な結果をブラウザー内で表示できます。ライブAPIの比較実行はローカル限定です。

## 主な機能

- OWASP API Security Top 10の考え方に基づく学習モジュール
- ローカル限定で検証する脆弱なAPI例
- 修正済みの安全なAPI実装例
- BOLAとオブジェクトレベル認可のシナリオ
- 認証とトークン検証のシナリオ
- レート制限と自動化悪用対策のシナリオ
- Broken Function Level Authorizationと管理機能保護のシナリオ
- Sensitive Business Flowsと業務フロー悪用対策のシナリオ
- Mass Assignmentとオブジェクトプロパティ認可のシナリオ
- SSRF対策シナリオ
- Security Misconfigurationと診断情報公開制御のシナリオ
- APIインベントリと旧バージョン管理のシナリオ
- 外部API応答の過信と検証のシナリオ
- 日本語を初期表示とし、全画面共通の言語切替で英語表示に対応
- 共通ヘッダーの太陽・月ボタンによるライト／ダークテーマの切り替えと、選択したテーマの保持
- 学習コンテンツを表示しながら、すべてのライブAPIを停止する読み取り専用の公開ショーケースモード

## 実装済みの内容

- Next.js App Router、TypeScript、React、Zod、Vitest、ESLint、Prettierを設定済みです。
- 学習UIとして、学習テーマ一覧、テーマ概要、脆弱APIと安全APIの比較、実装フローの視覚的な注釈、実装チェックリストを用意しています。
- UI文言と学習モジュールの内容は、画面コンポーネントへ直接埋め込まず、日本語・英語のリソースとして管理しています。
- ヘルスチェック、サンプルデータ、BOLA注文、認証セッション、レート制限検索、管理者招待、業務フロー予約、プロフィール更新、URL取得プレビュー、設定診断、APIインベントリ操作、外部プロフィール連携を `/api/vulnerable/*` と `/api/secure/*` に分けて実装しています。
- 共通APIレスポンス、Zodによるリクエスト検証、ローカルデモ用の合成ユーザーと合成リソースを用意しています。デモの主体情報は有限のシナリオを選ぶための値であり、認証済み主体ではありません。
- OpenAPI仕様は [`docs/api/openapi.json`](docs/api/openapi.json) に配置しています。
- BOLAモジュールでは、所有者確認がない脆弱な注文APIと、所有者確認を行う安全な注文APIを実行して比較できます。
- 認証モジュールでは、不十分なトークン検証を行う脆弱なセッションAPIと、署名状態、期限、失効、権限を検証する安全なセッションAPIを実行して比較できます。
- レート制限、Broken Function Level Authorization、Sensitive Business Flows、Mass Assignment、SSRF、Security Misconfiguration、Improper Inventory Management、Unsafe Consumption of APIsモジュールでは、脆弱APIと安全APIを実行して比較できます。Broken Function Level Authorizationデモは合成した招待プレビューだけを返し、実際のメール送信やアカウント作成は行いません。Security Misconfigurationデモは合成した診断メタデータだけを使い、実際の設定情報、秘密情報、ログを公開しません。Sensitive Business Flowsデモは合成した限定商品データだけを使い、実際の購入や外部決済は行いません。Improper Inventory Managementデモは実際のトークン発行や通知送信を行いません。SSRFデモとUnsafe Consumption of APIsデモは安全なプレビューまたは合成応答だけを返し、実際の外部ネットワークアクセスは行いません。
- 比較画面では、API1からAPI10までの各テーマについて、`/api/vulnerable/*` と `/api/secure/*` のAPIプログラム全体の流れを表示し、問題箇所を赤、改善箇所を青で確認できます。
- セキュリティ検証テストでは、公開環境に相当する設定ですべての脆弱APIが無効化されること、安全APIで各脆弱性が再現しないこと、OpenAPIの脆弱ルート説明がローカル限定であること、UI文言リソースが日英で揃っていることを確認します。
- OpenNextを使用してCloudflare Workers向けにビルドできます。公開ショーケースモードでは学習UIを表示しますが、`/api/vulnerable/*` と `/api/secure/*` の両方をRoute Handlerへ到達する前に拒否します。

## OWASP API Security Top 10参照

OWASP API Security Top 10は、API固有の代表的で影響の大きいセキュリティリスクを整理したコミュニティ管理の分類です。このラボでは2023年版を学習マップとして使い、現在はAPI1からAPI10までを、実行可能な脆弱APIと安全APIの比較として扱います。

公式URL: <https://owasp.org/API-Security/editions/2023/en/0x11-t10/>

| OWASPカテゴリ                                             | ラボ内モジュール                              | 脆弱APIルート                                | 安全APIルート                            |
| --------------------------------------------------------- | --------------------------------------------- | -------------------------------------------- | ---------------------------------------- |
| API1:2023 Broken Object Level Authorization               | BOLAとオブジェクト単位の認可確認              | `/api/vulnerable/orders/{orderId}`           | `/api/secure/orders/{orderId}`           |
| API2:2023 Broken Authentication                           | 認証とトークン検証                            | `/api/vulnerable/auth/session`               | `/api/secure/auth/session`               |
| API3:2023 Broken Object Property Level Authorization      | Mass Assignmentとプロパティ認可               | `/api/vulnerable/profile`                    | `/api/secure/profile`                    |
| API4:2023 Unrestricted Resource Consumption               | レート制限と自動化悪用対策                    | `/api/vulnerable/rate-limit/search`          | `/api/secure/rate-limit/search`          |
| API5:2023 Broken Function Level Authorization             | 機能単位の認可と管理操作の保護                | `/api/vulnerable/admin/invitations`          | `/api/secure/admin/invitations`          |
| API6:2023 Unrestricted Access to Sensitive Business Flows | Sensitive Business Flowsと業務フロー悪用対策  | `/api/vulnerable/business-flow/reservations` | `/api/secure/business-flow/reservations` |
| API7:2023 Server Side Request Forgery                     | SSRFと外部URL取得制御                         | `/api/vulnerable/fetch-url`                  | `/api/secure/fetch-url`                  |
| API8:2023 Security Misconfiguration                       | Security Misconfigurationと診断情報の公開制御 | `/api/vulnerable/config/diagnostics`         | `/api/secure/config/diagnostics`         |
| API9:2023 Improper Inventory Management                   | APIインベントリと旧バージョン管理             | `/api/vulnerable/inventory/operations`       | `/api/secure/inventory/operations`       |
| API10:2023 Unsafe Consumption of APIs                     | 外部API応答の過信と検証                       | `/api/vulnerable/third-party/profile-import` | `/api/secure/third-party/profile-import` |

## 安全性に関する方針

脆弱なAPI例は、制御されたローカル環境での検証専用です。公開環境へデプロイしてはいけません。脆弱なルートと安全なルートは明確に分離し、脆弱シナリオを利用する画面では警告を表示します。

脆弱APIルートは既定で無効です。`LAB_MODE=local`、`NODE_ENV` が厳密に `development` または `test`、かつリクエストURLのhostnameが `localhost`、`127.0.0.1`、`::1` のいずれかである場合にのみ有効化します。`Host` ヘッダーが存在する場合は、ポート指定を含めて同じループバックホストを示す必要があります。不正な `LAB_MODE` 値は安全側へ倒して無効化します。`npm run dev` と `npm run start` は `127.0.0.1` だけで待ち受けます。hostname検査は多層防御であり、開発サーバーを公開転送して安全にするものではありません。安全APIルートは、公開ショーケースモード以外での比較と検証に限って利用できます。

公開環境では `PUBLIC_SHOWCASE=true` と `LAB_MODE=disabled` を設定します。公開ショーケースモードでは、日英の読み取り専用案内とクライアント側のリクエスト結果表示を提供しながら、安全APIを含むすべての `/api/*` リクエストを `403 PUBLIC_SHOWCASE_API_DISABLED` と `Cache-Control: no-store` で拒否します。リクエスト結果の表示操作は静的な合成データから既存の結果パネルを更新し、`fetch` を呼び出しません。`PUBLIC_SHOWCASE` に空でない不正値を指定した場合も、明示的な `false` 以外は安全側へ倒して公開ショーケースモードとして扱います。

SSRFデモと外部API応答デモは、脆弱APIと安全APIのどちらも実際の外部ネットワークアクセスを行わず、検証用のプレビュー情報または合成応答のみを返します。

HTMLとAPIレスポンスには、フレーム埋め込み拒否、Content Security Policy、MIMEスニッフィング防止、リファラー情報の制限、キャッシュ禁止などの共通ヘッダーを適用します。HTMLはリクエストごとに新しいnonceを生成し、Next.jsのscriptへ付与することで、本番の`script-src`では`'unsafe-inline'`と`'unsafe-eval'`を許可しません。nonce付きHTMLは`no-store`とし、APIには`default-src 'none'`を基準とする厳格なCSPを適用します。JSON本文は `application/json` と任意の `charset=utf-8` だけを受け付け、正しいUTF-8とJSONを要求し、宣言サイズと実際のバイト数を16 KiB以下に制限します。単一値のクエリパラメーターを重複指定した場合や、strictなクエリスキーマへ未知のパラメーターを指定した場合は、last-value-winsで処理せず拒否します。

デモの `userId`、`actorUserId`、トークンIDは、有限の合成シナリオを選択するための値であり、セッションやBearer認証情報ではありません。レート制限bucket、累積予約数、在庫、試行回数は単一プロセス内のデモ用インメモリ状態であり、再起動で失われ、本番環境や分散環境の制御としては使用できません。

## 使い方

1. `npm ci` でロックファイルどおりに依存関係をインストールします。
2. `.env.example` を参考に、追跡対象外の `.env.local` を作成します。脆弱APIをローカルで確認する場合だけ `LAB_MODE=local` を明示し、確認後は `disabled` に戻します。
3. `npm run dev` でローカル開発サーバーを起動します。
4. ブラウザーで学習UIを開き、学習テーマを選択します。
5. 比較画面で、脆弱APIと安全APIのルート、リクエスト、レスポンス、赤/青の実装フロー注釈を確認します。
6. 「APIデモを実行」から、脆弱APIと安全APIのレスポンス差分を確認します。

脆弱APIはローカル検証専用です。共有環境や公開環境で実行しないでください。

Cloudflare Workers向け設定は、読み取り専用の公開ショーケースです。学習コンテンツ、リクエスト例、設計差分、実装フロー、合成データによる操作可能なリクエスト結果を表示しますが、ライブAPIデモは提供しません。

## 開発コマンド

- `npm ci`: `package-lock.json` に固定された依存関係を再現可能な形でインストールする。
- `npm run dev`: `127.0.0.1` 限定でローカル開発サーバーを起動する。
- `npm run security:audit`: 依存関係の既知の脆弱性を監査する。
- `npm run lint`: ESLintを実行する。
- `npm run format`: Prettierでフォーマットを確認する。
- `npm run typecheck`: TypeScriptの型チェックを実行する。
- `npm run test`: Vitestのテストを実行する。
- `npm run build`: 本番ビルドを作成する。
- `npm run build:cloudflare`: OpenNextでCloudflare Worker bundleを作成する。
- `npm run preview:cloudflare`: Workerをビルドし、workerdでローカルプレビューする。
- `npm run dry-run:cloudflare`: デプロイせずにWorkerのアップロード内容とbundleサイズを検証する。
- `npm run deploy:cloudflare`: デプロイ環境からWrangler認証情報を渡し、ビルド済みWorkerをデプロイする。

検証コマンドは順番に実行します。`npm run build` と `npm run typecheck` はどちらも `.next/` 配下にNext.jsが生成する型を参照するため、並列実行しないでください。

## ドキュメント

- English README: [`README.md`](README.md)
- 企画書: [`docs/proposal.ja.md`](docs/proposal.ja.md)
- 要件定義書: [`docs/requirements.ja.md`](docs/requirements.ja.md)
- 設計書: [`docs/design.ja.md`](docs/design.ja.md)
- OpenAPI: [`docs/api/openapi.json`](docs/api/openapi.json)

## UI言語方針

UIの初期表示言語は日本語とします。すべての画面に共通の言語切替を配置し、英語に切り替えた場合は表示テキスト全体を英語に統一します。日本語表示時は日本語、英語表示時は英語で統一し、両言語が混在しないようにします。ただし、日本語表示において一般的に英語表記される技術用語やローマ字表現は例外とします。

## 公開時の安全確認

公開前には、秘密情報、認証情報、非公開ログ、ローカルDB、開発者専用ロードマップがGitの追跡対象に含まれていないことを確認します。公開資料では、脆弱なデモがローカル限定であり、公開環境では実行してはいけないことを明記します。CloudflareのAccount IDとAPI Tokenはデプロイ用の秘密情報として扱い、リポジトリ内のファイルには保存しません。
