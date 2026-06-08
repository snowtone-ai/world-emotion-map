# World Emotion Map（WEM）

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![BigQuery](https://img.shields.io/badge/BigQuery-GCP-blue?logo=google-cloud)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

> 世界中のニュースから感情シグナルをリアルタイム収集し、国別の「今の感情」を3D地球儀で可視化するウェブアプリ

1時間ごとに自動パイプラインがGDELT（世界最大のニュースデータベース）からデータを収集し、喜び・信頼・恐怖・怒り・悲しみ・驚きの6感情スコアを国ごとに算出して地図上に色分け表示します。異常な感情変化を検知すると自動でXへ投稿する機能も搭載しています。

---

## データフロー

```
GDELT GKG API
    │ hourly cron (GitHub Actions)
    ▼
Google BigQuery
  ├─ partition filter 強制適用（無料枠 1TB/月 守護）
  └─ 6感情 × 国別集計 + z-score 異常検知
    │
    ▼
Supabase (PostgreSQL + RLS)
    │ Realtime WebSocket
    ▼
Next.js 16 (App Router / Server Components)
    │
    ▼
Mapbox GL JS v3 — 3D インタラクティブ地球儀
```

---

## 主な機能

- 3Dインタラクティブ地球儀（Mapbox GL JS）上に国別感情スコアを色分け表示
- 国クリックで感情内訳・過去24時間トレンド・根拠ニュース記事を表示
- GDELT→BigQuery→Supabase の毎時自動パイプライン（GitHub Actions cron）
- 過去7日ベースラインからz-scoreで異常検知し、X（Twitter）にアラート自動投稿
- セクター別・地域別の感情比較、Googleアカウントでお気に入り登録
- 多言語対応（日本語・英語）、PWAとしてモバイルインストール可能

---

## 技術スタック

| カテゴリ | 技術・ツール |
|---|---|
| フロントエンド | Next.js 16, TypeScript, Tailwind CSS v4, Mapbox GL JS v3 |
| データベース | Supabase（PostgreSQL + RLS + Google OAuth） |
| インフラ | Vercel, GitHub Actions（hourly cron pipeline） |
| データ処理 | Google BigQuery, GDELT GKG, X API v2 |

---

## 設計の工夫

- **Server Components ファースト** — データ取得とレンダリングをサーバーで完結、クライアントJS最小化
- **コスト制御** — BigQueryのパーティションフィルタを全クエリに強制適用し、無料枠（月1TB）を超過しない設計
- **地域コード変換** — GDELTのFIPS-10-4体系からMapboxのISO 3166-1形式へ変換する独自マッピングレイヤー（70件超）を実装

---

## セットアップ

必要なツール：Node.js 20+、pnpm 10+、Supabaseアカウント、Mapboxトークン、Google BigQueryプロジェクト

```bash
git clone https://github.com/snowtone-ai/world-emotion-map.git
cd world-emotion-map
pnpm install
cp .env.local.example .env.local
# 必須: NEXT_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, BIGQUERY_PROJECT_ID
pnpm dev   # http://localhost:3000
```

| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm lint` | コード品質チェック |
| `pnpm build` | 本番ビルド |

---

## ライセンス

MIT
