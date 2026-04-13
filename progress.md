# World Emotion Map — 進捗と問題記録

## Task 22: Vercel デプロイ

### 状態: 地図表示まで完了、感情色が未表示（全国）

### 解決済み
- Vercel へのデプロイ成功（200 OK）
- Mapbox `wem-public-token` の URL 制限を全削除 → 地図・国境線は表示
- SW cache-first → network-first 変更（コミット済み）
- `/api/emotions` エンドポイント追加（クライアントサイドフォールバック）
- エラーログ強化・フォールバッククエリ追加

### 現在の状態
- 地球儀グローブ表示: ✅
- 国境線表示: ✅
- 感情の色: ✅ **解決済み（2026-04-12確認）**

---

## 試した修正の記録

### 修正1: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を Vercel に追加
- 結果: 500 エラーは解消。データは返るようになった

### 修正2: `/api/emotions` ルート追加（client-side fallback）
- コミット: `9d993e5`
- 内容: Server Component が空を返す場合、クライアントが直接 API 呼び出し
- 結果: API は 194件のデータを返すことを確認

### 修正3: FIPS→ISO 変換（`src/lib/fips-to-iso.ts` 新規作成）
- コミット: `d28f375`, `44d362b`
- 内容: GDELT の FIPS 10-4 コード（GM, JA, UK, AS 等）を ISO 3166-1 alpha-2 に変換
- 追加マッピング計 70件以上
- `/api/emotions` と `page.tsx` の両方に適用
- 結果: **依然として1カ国も色がつかない**

---

## 現在の状況分析

### `/api/emotions` レスポンス（確認済み）
- 194件のデータを返す
- 主要国コードは ISO になっている（GB, DE, JP, AU...）
- 一部まだ未変換コードが残っているが、主要国はカバー済み

### 色がつかない根本原因（未特定）
**仮説1**: `computeColorMap()` が正しく動作していない（入力データは正しいが色計算に問題）
**仮説2**: `colorMap` は生成されているが、Mapbox GL JS への反映タイミングに問題
**仮説3**: `MapSection` の `serverData` と `clientData` の切り替えロジックに問題
**仮説4**: Mapbox の country feature の `iso_3166_1` プロパティと照合するコードが合わない
**仮説5**: Service Worker のキャッシュが古いコードを返している

### 未調査のポイント
- `computeColorMap()` の実装内容（`src/lib/emotions.ts`）
- `WorldMap.tsx` でどのように colorMap を Mapbox レイヤーに適用しているか
- ブラウザの DevTools で colorMap の中身を確認できていない
- Mapbox の country feature の実際のプロパティ名（`iso_3166_1` か `iso_3166_1_alpha_2` か）
- Vercel Function Logs でサーバーサイドのログを確認していない

---

## 設定済み環境変数（Vercel）
- `NEXT_PUBLIC_SUPABASE_URL` = `https://wlialvgpspyrgsaotczy.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Supabase anon public キー
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 既存（値不明）
- `NEXT_PUBLIC_MAPBOX_TOKEN` = wem-public-token（URL制限なし）
- `BIGQUERY_PROJECT_ID` / `BIGQUERY_CLIENT_EMAIL` / `BIGQUERY_PRIVATE_KEY` = 設定済み

---

## 過去の問題記録（Feature 5: Country Detail Panel）

### 実装済み（完成）

| ファイル | 状態 |
|---------|------|
| `src/app/globals.css` | `.animate-slide-in-right` ユーティリティ追加済み |
| `src/hooks/useTrend.ts` | 新規作成済み（24h Supabase クエリ） |
| `src/components/map/EmotionBarChart.tsx` | 新規作成済み |
| `src/components/map/TrendSparkline.tsx` | 新規作成済み |
| `src/components/map/CountryDetailPanel.tsx` | 新規作成済み |
| `src/components/map/WorldMap.tsx` | クリック/ハイライト修正済み |
| `src/components/map/MapSection.tsx` | selectedCountry state + flex-row 追加済み |

## ワークフロー設定変更履歴

### 2026-04-13
- **X 定期投稿**: 6時間ごと → **12時間ごと**に変更
  - 変更前: `10 0,6,12,18 * * *`（UTC 0:10 / 6:10 / 12:10 / 18:10）
  - 変更後: `10 0,12 * * *`（UTC 0:10 / 12:10 = JST 9:10 / 21:10）
- **異常検知**: 設定は保持したまま**一時停止**
  - `Detect Anomalies` / `Post Anomaly to X` の両ステップに `false &&` を追加
  - 再開時: `.github/workflows/data-pipeline.yml` の `# PAUSED` コメント箇所の `false &&` を削除

---

## 完了タスク（2026-04-13）
- GitHub Secrets 設定（X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET）: ✅ 設定済み
- Supabase migration（description カラム）: ✅ 既に存在（detect-anomaly.ts が正常 INSERT 確認済み）
- WEM_BASE_URL: ✅ `https://worldemomap.com` に更新
- 異常検知: ✅ 再有効化（`false &&` 削除）
- カスタムドメイン worldemomap.com: ✅ Valid Configuration 確認

## 完了タスク（2026-04-13 続き）
- Feature 3: Sector View UI: ✅ SectorSection + SectorDetailPanel 実装済み
- Feature 4: View Switching: ✅ Header の Region/Sector トグル機能化
- Feature 6: Sector Detail Panel: ✅ 実装済み（サブセクター一覧 + トレンド）
- /api/sectors: ✅ 新規エンドポイント追加
- supabase/seed_sectors.sql: ✅ 作成済み（31セクター定義）

## セクターデータを有効化する手順（ユーザーアクション必要）
1. Supabase SQL エディタを開く
2. `supabase/seed_sectors.sql` の内容を貼り付けて実行
3. 次の毎時:05 の GitHub Actions pipeline 実行後にセクターデータが蓄積開始

## 未着手タスク
- Feature 2: Region Hierarchy Navigation（fetch-gdelt.ts パイプライン改修が必要 → 後回し）
- Feature 15: AdSense（Google 審査申請が必要 → コード挿入は今すぐ可能）
