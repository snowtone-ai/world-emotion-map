# World Emotion Map (WEM)

世界中のニュースメディアから感情シグナルをリアルタイムで収集・分析し、国別の「感情の今」をインタラクティブな地球儀上に可視化するWebアプリケーション。

※進捗状況９割ほどなので、一部実装待ちの機能もあります。下記のURLは参考用のデモサイトです。
https://world-emotion-map.vercel.app/ja
---

## プロダクト概要

WEMが答える問いは「*いま、世界は何を感じているか？*」です。

1時間ごとに自動パイプラインが [GDELT Global Knowledge Graph](https://www.gdeltproject.org/) のニュース記事データをGoogle BigQueryで集計し、国別の感情スコア（Joy / Trust / Fear / Anger / Sadness / Surprise）をSupabaseに保存します。フロントエンドはそのスコアをMapbox GL JSのWebGLグローブ上に色分け表示し、ページリロードなしで自動更新されます。

国をクリックするとサイドパネルが開き、感情スコアの内訳・過去24時間のトレンド・スコアの根拠となったニュース記事が確認できます。

---

## アーキテクチャ

```
GDELT GKG（ニュースコーパス）
        │
        ▼ 毎時実行（GitHub Actions cron）
Google BigQuery ──► aggregate.ts ──► Supabase（PostgreSQL）
                                          │
                                          ▼
                          Next.js 16 App Router（Vercel）
                                          │
                         ┌────────────────┴──────────────────┐
                         ▼                                   ▼
               Server Components                     API Routes
               （初期レンダリング）           （/api/emotions, /api/og）
                         │                                   │
                         └────────────────┬──────────────────┘
                                          ▼
                              Mapbox GL JS（WebGLグローブ）
                              国詳細パネル
                              セクタービュー
```

**主な設計上の判断：**
- **Server Components をデフォルト採用** — データ取得とレンダリングをサーバーで完結させ、"use client" は末端コンポーネントのみに限定
- **BigQuery パーティションフィルタを全クエリに強制** — 無料枠（1TB/月）超過を防ぐコスト管理
- **FIPS-10-4 → ISO 3166-1 変換**（70件以上のマッピング）— GDELTはFIPSコード、MapboxはISO形式のため独自変換レイヤーを実装
- **異常検知（z-score）** がパイプラインと並列で毎時実行され、7日間ベースラインから大きく逸脱した国を検出すると即時X投稿

---

## 技術スタック

| レイヤー | 使用技術 |
|---|---|
| フロントエンド | Next.js 16（App Router）、React 19、TypeScript（strict）、Tailwind CSS v4 |
| 地図 | Mapbox GL JS v3 |
| 認証 | Supabase Auth（Google OAuth） |
| データベース | Supabase（PostgreSQL） |
| データウェアハウス | Google BigQuery |
| データソース | GDELT Global Knowledge Graph |
| 自動化 | GitHub Actions（cronパイプライン + 異常検知） |
| SNS連携 | X API v2（定期投稿 + 異常アラート） |
| デプロイ | Vercel |
| 多言語対応 | next-intl（日本語 / 英語） |

---

## 機能一覧

| 機能 | 状態 |
|---|---|
| インタラクティブMapboxグローブ・感情カラーレイヤー | 完成 |
| 国詳細パネル（感情バーチャート・24hトレンド・根拠ニュース） | 完成 |
| Google OAuth サインイン | 完成 |
| お気に入り（国・セクターの保存） | 完成 |
| 毎時 GDELT → BigQuery → Supabase パイプライン | 完成 |
| X 自動投稿（6時間定期 + 異常アラート） | 完成 |
| 異常検知（z-score vs 7日間ベースライン） | 完成 |
| OGイメージ動的生成（`/api/og`） | 完成 |
| PWA（オフライン対応・インストール可能） | 完成 |
| セクタービュー（経済・政治・テクノロジー等） | 実装中 |
| 地域階層ナビゲーション（大陸 → 国 → 地域） | 実装中 |

---

## データパイプライン

```
scripts/
├── fetch-gdelt.ts        # BigQueryからGKGレコードを取得（パーティションフィルタ付き）
├── aggregate.ts          # 国別感情スコアを集計
├── detect-anomaly.ts     # z-scoreによる異常検知（7日間ベースライン比較）
├── post-to-x.ts          # X投稿（定期モード / 異常モード）
└── generate-map-image.ts # X投稿用カード画像をヘッドレス生成
```

パイプラインはGitHub Actionsワークフロー（`.github/workflows/data-pipeline.yml`）としてUTC基準のcronで動作。各ステップでBigQuery使用量とX APIクレジット残高をログ出力し、クォータ超過を防止しています。

---

## ローカル起動

```bash
# 前提: Node.js 20+, pnpm 10+

git clone https://github.com/souma/world-emotion-map.git
cd world-emotion-map
pnpm install

# 環境変数を設定
cp .env.local.example .env.local
# 必須: NEXT_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_SUPABASE_URL,
#       NEXT_PUBLIC_SUPABASE_ANON_KEY, BIGQUERY_PROJECT_ID, ...

pnpm dev        # http://localhost:3000
pnpm lint       # ESLint
pnpm build      # 本番ビルド
```

---

## ディレクトリ構成

```
src/
├── app/
│   ├── [locale]/               # i18nルート（日本語/英語）
│   │   ├── page.tsx            # ホーム — マップ + 詳細パネル
│   │   ├── favorites/          # お気に入り一覧
│   │   └── about/              # サービス概要 + メール購読
│   └── api/
│       ├── emotions/           # 感情データエンドポイント（クライアントフォールバック）
│       └── og/                 # OGイメージ動的生成
├── components/
│   └── map/
│       ├── WorldMap.tsx         # Mapbox GL JSラッパー
│       ├── MapSection.tsx       # 状態管理オーケストレーション
│       ├── CountryDetailPanel.tsx
│       ├── EmotionBarChart.tsx
│       └── TrendSparkline.tsx
├── lib/
│   ├── emotions.ts              # スコア計算 + カラーマッピング
│   └── fips-to-iso.ts           # FIPS-10-4 → ISO 3166-1（70件以上）
└── hooks/
    ├── useTrend.ts              # Supabaseから24h感情履歴を取得
    └── useFavorite.ts           # お気に入りCRUD
```

---

## ライセンス

MIT
