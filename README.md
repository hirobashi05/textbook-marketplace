# 教科書売買プラットフォーム

慶應義塾大学内の学生同士で不要になった教科書を売買する学内リユース MVP です。慶應メールアドレス限定の登録、JWT 認証、教科書マスタ、画像付き出品、検索、取り下げ、ポイント決済、発送依頼、購入履歴、マイページを実装しています。

## 使用技術

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, lucide-react
- Backend: Node.js, Express, TypeScript, Zod, JWT, bcryptjs
- Database: SQLite, Prisma ORM
- Test: Vitest, Supertest

## プロジェクト構成

```text
textbook-marketplace/
  backend/
    prisma/
      migrations/20260624000000_init/migration.sql
      schema.prisma
      seed.ts
    src/
      app.ts
      server.ts
      config/
      controllers/
      middlewares/
      routes/
      services/
      types/
      utils/
      validators/
    tests/
      api.test.ts
    package.json
    .env.example
  frontend/
    src/
      components/
      hooks/
      lib/
      pages/
      types/
    package.json
    .env.example
  README.md
```

## セットアップ手順

### 1. バックエンド

```bash
cd backend
cp .env.example .env
corepack enable
pnpm install
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:seed
pnpm run dev
```

バックエンドは `http://localhost:4000` で起動します。

### 2. フロントエンド

別ターミナルで実行します。

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## 環境変数

### backend/.env

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-secret-at-least-32-characters"
UNIVERSITY_EMAIL_DOMAINS="keio.jp,keio.ac.jp,*.keio.ac.jp"
CORS_ORIGIN="http://localhost:5173"
PORT=4000
```

### frontend/.env

```env
VITE_API_BASE_URL="http://localhost:4000"
```

`UNIVERSITY_EMAIL_DOMAINS` に設定したドメインだけがユーザー登録できます。初期設定では `student@keio.jp`、`student@keio.ac.jp`、`student@appi.keio.ac.jp` のような慶應義塾大学のメールアドレスだけが許可されます。`student@example.ac.jp` など、他大学を含む一般の大学メールは許可されません。

## Prisma migration

```bash
cd backend
pnpm run prisma:migrate
```

生成済み migration は `backend/prisma/migrations/20260624000000_init/migration.sql` にあります。

## Seed データ投入

```bash
cd backend
pnpm run prisma:seed
```

Seed には以下が含まれます。

- ユーザー 3件
- 教科書マスタ 5件
- 出品 8件
- `available`, `sold`, `cancelled` の出品状態
- `sold` 出品に対応する注文履歴

Seed ユーザーのパスワードはすべて `password123` です。

## API エンドポイント

| Method | Path | 認証 | 内容 |
| --- | --- | --- | --- |
| GET | `/health` | 不要 | ヘルスチェック |
| POST | `/users` | 不要 | ユーザー登録 |
| GET | `/users/me` | 必須 | 自分の登録情報 |
| POST | `/users/me/points/purchase` | 必須 | ポイント購入 |
| GET | `/users/me/point-purchases` | 必須 | 自分のポイント購入履歴 |
| POST | `/auth/login` | 不要 | ログイン |
| GET | `/textbooks` | 不要 | 教科書マスタ一覧・検索 |
| POST | `/textbooks` | 必須 | 教科書マスタ登録 |
| GET | `/textbooks/:id` | 不要 | 教科書マスタ詳細 |
| GET | `/listings` | 不要 | 出品一覧・検索 |
| GET | `/listings/:id` | 任意 | 出品詳細 |
| POST | `/listings` | 必須 | 教科書の出品 |
| DELETE | `/listings/:id` | 必須 | 出品取り下げ |
| GET | `/listings/me` | 必須 | 自分の出品一覧 |
| POST | `/orders` | 必須 | 購入 |
| GET | `/orders/me` | 必須 | 自分の購入履歴 |
| GET | `/orders/sales/me` | 必須 | 自分が売った注文・発送依頼 |
| PATCH | `/orders/:id/shipping` | 必須 | 発送状況更新 |

API エラーは以下の形式で返します。

```json
{
  "error": {
    "code": "LISTING_NOT_AVAILABLE",
    "message": "この教科書は現在購入できません"
  }
}
```

## API 動作確認

### ユーザー登録

```bash
curl -X POST http://localhost:4000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"student@keio.jp","name":"山田太郎","password":"password123"}'
```

### ログイン

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@keio.jp","password":"password123"}'
```

### 出品一覧検索

```bash
curl "http://localhost:4000/listings?faculty=経済学部&courseName=ミクロ経済学"
```

### 出品作成

```bash
curl -X POST http://localhost:4000/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"masterId":"<textbook_master_id>","sellingPrice":1200,"condition":"good","imageUrl":"/images/textbooks/microeconomics.jpg","description":"少し書き込みがあります"}'
```

### ポイント購入

```bash
curl -X POST http://localhost:4000/users/me/points/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount":5000,"paymentMethod":"credit_card"}'
```

### 購入

```bash
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"listingId":"<listing_id>","shippingAddress":"東京都千代田区1-1-1","shippingFee":300}'
```

### 発送状況更新

```bash
curl -X PATCH http://localhost:4000/orders/<order_id>/shipping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seller_token>" \
  -d '{"shippingStatus":"shipped"}'
```

## テスト実行

```bash
cd backend
pnpm test
```

テストでは一時 SQLite DB に migration SQL を適用し、以下を検証します。

- 大学メールの登録成功
- 大学メール以外の登録失敗
- 同一 email の登録失敗
- 短すぎる password の登録失敗
- ポイント購入の成功
- ログイン済みユーザーの出品成功
- 未ログインユーザーの出品失敗
- 負数価格の出品失敗
- 画像なし出品の失敗
- available 出品の購入成功
- ポイント不足時の購入失敗
- sold / cancelled 出品の購入失敗
- 自分の出品の購入失敗
- 購入成功時の listing.status 更新
- 同じ listing の二重購入防止

## 購入処理のトランザクション仕様

`POST /orders` は `backend/src/services/orderService.ts` の `purchaseListing` で Prisma `$transaction` を使用します。MVP では外部決済ではなく、事前購入したアプリ内ポイントで決済します。

処理は以下の順序です。

1. `listingId` から出品を取得
2. 出品が存在しない場合は `LISTING_NOT_FOUND`
3. `Listings.status` が `available` でない場合は `LISTING_NOT_AVAILABLE`
4. 購入者と出品者が同じ場合は `CANNOT_BUY_OWN_LISTING`
5. 購入者が `active` でない場合は `USER_NOT_ACTIVE`
6. `shippingFee` が負数の場合は `INVALID_SHIPPING_FEE`
7. `totalAmount = sellingPrice + shippingFee` を計算
8. 購入者のポイント残高が不足していれば `INSUFFICIENT_POINTS`
9. `Order` を `paid`、`paymentMethod=points`、`shippingStatus=requested` で作成
10. `Listing` を `where: { id, status: available }` の条件付き `updateMany` で `sold` に更新
11. 購入者ポイントを減算し、出品者ポイントを加算
12. 更新件数が 1 件でなければ `PURCHASE_CONFLICT`

`orders.listingId` には一意制約を付けています。これにより、同時購入時に複数の注文が作られることを DB レベルでも防ぎます。

## 主要な設計判断

- パスワードは bcryptjs でハッシュ化し、API レスポンスには `passwordHash` を含めません。
- 許可する慶應メールドメインは `UNIVERSITY_EMAIL_DOMAINS` で管理します。
- `suspended` / `deleted` ユーザーは出品・購入できません。
- 出品には `imageUrl` を必須にし、一覧・詳細・履歴に商品画像を表示します。
- 教科書マスタの ISBN と画像は任意です。画像なしのマスタを選んだ場合も、出品時の商品画像は必須です。
- 学科は各学部の所属学科に加え、学部共通科目向けの「学科共通」と「その他学科」から選択できます。
- ポイント購入は `credit_card` / `convenience_store` / `campus_coop` のモック決済として実装しています。
- 購入後は注文の `shippingStatus` を `requested` にし、売り手のマイページに配送先住所を表示します。
- 出品取り下げは物理削除せず `cancelled` へ更新します。
- `GET /listings` はデフォルトで `available` のみ返します。
- 教科書マスタ登録 API を用意し、フロントエンドでは出品作成画面から追加できます。
- 決済連携は MVP 対象外のため、購入成功時に注文を `paid` として作成します。

## 今後の改善点

- 大学 SSO やメール認証による本人確認
- 本番向けオブジェクトストレージと画像配信 CDN
- 受け渡し場所や取引メッセージ
- ポイント決済や学内決済との連携
- 管理者向けの不正出品確認
- ページネーションと全文検索
## 取引ステータスとポイント履歴（2026-07-15追加）

注文には決済状態とは別に `orders.transactionStatus` を持たせています。新規購入時は「出品者確認待ち」となり、出品者が「発送準備中」「発送済み」へ、購入者が「受け取り完了」へ更新します。発送前は購入者・出品者の双方が「キャンセル申請中」へ更新できます。

取引状態は `purchased`、`awaiting_seller_confirmation`、`preparing_shipment`、`shipped`、`completed`、`cancellation_requested` の6種類です。更新APIは `PATCH /orders/:id/transaction-status` です。

ポイント増減は `point_transactions` に処理後残高とともに保存します。種別は `point_purchase`（ポイント購入）、`textbook_purchase`（教科書購入）、`textbook_sale`（教科書販売による獲得）、`cancellation_refund`（キャンセル返金）、`admin_adjustment`（管理者調整）です。履歴取得APIは `GET /users/me/point-history` です。

追加migrationの適用後は Prisma Client を再生成してください。

```bash
cd backend
pnpm run prisma:migrate
pnpm run prisma:generate
```

## Render への無料デプロイ

このリポジトリの `render.yaml` は、Render の無料 Web Service と無料 Static Site だけを使用します。Render の Persistent Disk や有料データベース、GitHub の有料機能は使用しません。無料 Web Service のローカルファイルは再起動時に消えるため、本番データと支払い設定は Turso Free のリモート SQLite に保存します。商品画像もブラウザで WebP に圧縮し、Data URL として同じ DB に保存します。

1. GitHub の無料リポジトリへ、このプロジェクトを push します。
2. Turso Free で DB を作成し、DB URL と認証トークンを発行します。
3. Render Dashboard の `New > Blueprint` で GitHub リポジトリを選択します。
4. `render.yaml` が検出されたら、`TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` を入力して Blueprint を作成します。
5. デプロイ後、`https://keio-textbook-api.onrender.com/health` が `{"ok":true}` を返すことを確認します。Render 上で同名が使われていた場合は、実際に割り当てられた URL を使用してください。

バックエンドは起動のたびに `pnpm run turso:migrate` を実行し、未適用の `backend/prisma/migrations` だけを Turso に適用します。初期サンプルデータが必要な場合は、ローカルで次を一度だけ実行します。seed は既存データを初期化するため、運用開始後には実行しないでください。

```powershell
cd backend
$env:TURSO_DATABASE_URL="libsql://your-database.turso.io"
$env:TURSO_AUTH_TOKEN="your-token"
pnpm run prisma:seed
```

Render 無料 Web Service は一定時間アクセスがないと休止するため、最初の API 応答に時間がかかる場合があります。ローカル開発では `TURSO_DATABASE_URL` を設定せず、`DATABASE_URL=file:./dev.db` と `UPLOAD_STORAGE=filesystem` を使用します。
