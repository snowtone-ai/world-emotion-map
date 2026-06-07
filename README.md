# World Emotion Map（WEM）

## 概要

世界中のニュースメディアから感情シグナルをリアルタイムで収集・分析し、国別の「感情の今」をインタラクティブな3D地球儀上に可視化するウェブアプリケーションです。1時間ごとに自動パイプラインがGDELT（世界最大のニュースデータベース）からデータを収集し、喜び・信頼・恐怖・怒り・悲しみ・驚きの6感情スコアを国ごとに算出して地図上に色分け表示します。異常な感情変化を検知すると自動でXへ投稿する機能も搭載しています。

---

## 主な機能

- 3Dインタラクティブ地球儀（Mapbox GL JS）上に国別感情スコアを色分け表示できる
- 国をクリックすると感情スコアの内訳・過去24時間のトレンド・根拠ニュース記事を確認できる
- 毎時自動パイプラインがGDELT→BigQuery→Supabaseの流れでデータを更新し、ページリロードなしで反映される
- 過去7日間のベースラインからz-score（統計的な偏差）で異常を検知し、自動でXへアラートを投稿できる
- 経済・政治・テクノロジーなどセクター別・地域別の感情比較ができる
- Googleアカウントでサインインして国・セクターをお気に入り登録できる
- 日本語・英語の多言語対応（PWAとしてスマートフォンにインストール可能）

---

## 技術スタック

フロントエンド：Next.js 16（Reactベースのウェブアプリフレームワーク）、TypeScript、Tailwind CSS v4、Mapbox GL JS v3（3D地球儀ライブラリ）
データベース：Supabase（PostgreSQL＋Google OAuth認証を提供するクラウドサービス）
インフラ・環境：Vercel（ホスティングプラットフォーム）、GitHub Actions（毎時cronパイプライン・自動デプロイ）
AI・外部API：Google BigQuery（大規模データ集計）、GDELT Global Knowledge Graph（ニュースデータソース）、X API v2（自動投稿・異常アラート）

---

## アーキテクチャの特徴

- Next.jsのServer Componentsをデフォルト採用し、データ取得とレンダリングをサーバーで完結させることでクライアント側の処理を最小化
- BigQueryのパーティションフィルタを全クエリに強制適用し、無料枠（月1TB）超過によるコスト発生を防ぐ設計
- GDELTのFIPS-10-4（地域コード体系）をMapboxのISO 3166-1形式に変換する独自マッピングレイヤー（70件以上）を実装

---

## 開発環境のセットアップ

必要なツール：Node.js 20以上、pnpm 10以上、Supabaseアカウント、Mapboxトークン、Google BigQueryプロジェクト

```bash
git clone https://github.com/souma/world-emotion-map.git
cd world-emotion-map
pnpm install

cp .env.local.example .env.local
# 必須: NEXT_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_SUPABASE_URL,
#       NEXT_PUBLIC_SUPABASE_ANON_KEY, BIGQUERY_PROJECT_ID など

pnpm dev   # http://localhost:3000
```

| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm lint` | コード品質チェック |
| `pnpm build` | 本番ビルド |
