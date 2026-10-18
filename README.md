# my-invoice-view

請求書を作成・管理し、A4 の PDF として出力できる Web アプリ「請求書作成システム」です。Excel で作成していた請求書作業をシステム化するためのもので、データは Firebase（Authentication / Cloud Firestore）にユーザーごとに保存します。

**公開 URL**: <https://keigo-hisazumi.github.io/my-invoice-view/>

## 主な機能

- メールアドレスとパスワードによる新規登録・ログイン・ログアウト
- 請求書の一覧表示（請求書番号・請求日・顧客名・合計金額・作成日）と詳細表示・編集・削除
- 請求書の作成（請求日・支払期限・請求先・請求元・明細・消費税率・備考）
- 請求先を選ぶと請求書番号を自動採番（`<顧客コード>-<年月>-<連番>` の形式）
- 明細の追加・削除と、金額・小計・消費税・合計の自動計算
- 請求書を A4 の PDF としてダウンロード（請求元のインボイス登録番号・振込先を記載）
- 請求先・請求元・品目のマスタ管理（請求先には顧客コードを自動採番、品目は並び順を指定可能）
- スマートフォンやタブレットでも使えるレスポンシブデザイン

## 使い方

1. ログイン画面で新規登録またはログインする
2. 右上のメニューから「請求元管理」で自社の情報（住所・インボイス登録番号・振込先など）を登録する
3. 同じメニューの「請求先管理」で請求先を、「品目管理」で品名・単価・単位を登録する
4. 請求書一覧で「+ 新規作成」を押し、請求先と請求元を選択する（請求先を選ぶと請求書番号が自動で入る）
5. 明細の品名を品目から選び、数量を入力する（「+ 明細を追加」で行を追加、「削除」で行を削除）
6. 必要に応じて消費税率と備考を入力し、「保存」を押す
7. 一覧の「詳細」から「PDF出力」を開き、「PDFをダウンロード」を押す

## 技術スタック

- TypeScript
- React
- React Router
- Vite
- Firebase（Authentication / Cloud Firestore）
- jsPDF / html2canvas（PDF 出力）
- GitHub Pages（ホスティング）

## 開発

### 必要な環境

- Node.js 22

### コマンド

```bash
npm ci              # 依存関係のインストール
npm run dev         # 開発サーバーを起動
npm run build       # 型チェック（tsc -b）と dist/ への本番ビルド
npm run preview     # ビルド結果をプレビュー
npm run lint        # ESLint
```

## ディレクトリ構成

```text
src/
  main.tsx          エントリーポイント
  App.tsx           ルーティングとヘッダー、ログイン必須ページの制御
  firebase.ts       Firebase（Authentication / Firestore）の初期化
  pages/            画面（ログイン・請求書一覧 / 作成 / PDF 出力・請求先 / 請求元 / 品目の管理）
  components/       ヘッダーのメニュー、トースト通知
  contexts/         認証状態とトースト通知の Context
  types/            請求書・請求先・請求元・品目の型定義
  style.css         グローバルスタイル
  app.css           画面のスタイル
public/             favicon とアイコン
index.html          HTML テンプレート
vite.config.ts      Vite の設定（GitHub Pages 用の base パス）
```

## デプロイ

- `main` への PR マージ時に `.github/workflows/deploy.yml` が GitHub Pages（`gh-pages` ブランチ）へデプロイします
- PR ごとに `.github/workflows/pr-preview.yml` がプレビューを `gh-pages` の `pr-<番号>/` に公開し、PR に URL をコメントします（PR を閉じると削除）

## 開発ルール

開発ルールは [AGENTS.md](./AGENTS.md) を参照してください。

## ライセンス

MIT
