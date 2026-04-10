# CLAUDE.md — World Emotion Map

## Tech Stack
Next.js 16+ (App Router) / React 19 / TypeScript (strict: true) / Tailwind CSS v4 / pnpm / Vercel
Supabase (Auth + PostgreSQL) / Mapbox GL JS / Google BigQuery / X API v2 / GitHub Actions

## Pitfall Rules
- Tailwind のスタイル設定時 → globals.css の @theme で定義する。tailwind.config.ts は作らない（v4でCSS-First Configuration）
- globals.css の先頭 → `@import "tailwindcss"` の1行にする。@tailwind base/components/utilities は使わない
- postcss.config に postcss-import や autoprefixer を書かない → Tailwind v4 が内部処理する
- ページコンポーネントで params/searchParams を使う時 → 必ず await で非同期アクセスする（Next.js 16で同期アクセスは完全削除済み）
- cookies() / headers() / draftMode() を使う時 → 必ず await する
- middleware を使う時 → ファイル名は proxy.ts、エクスポート関数名も proxy にする（Next.js 16で middleware.ts は廃止）
- パッケージの依存関係エラー時 → --force ではなく pnpm を使う
- Vercel にデプロイする前 → npx tsc --noEmit と pnpm lint と pnpm build をローカルで実行する
- Server Component をデフォルトにする。"use client" は状態管理やブラウザAPIが必要な時だけ追加し、末端に配置する
- ブラウザ専用API（Mapbox GL JS等）を使うコンポーネント → dynamic(() => import(...), { ssr: false })でSSRを無効化する
- layout.tsx で <html> タグを書く時 → suppressHydrationWarning 属性を必ず付ける
- Supabase クライアント → Server ComponentではcreateServerClient、Client ComponentではcreateBrowserClient を使い分ける
- BigQuery クエリ実行時 → パーティションフィルタとSELECT列指定を必ず使う（無料枠1TB/月超過防止）
- GitHub Actions の cron 設定時 → UTC基準で記述する（JSTはUTC+9）
- X API 投稿時 → pay-per-useクレジット残高をログ出力する。投稿失敗時はリトライ1回のみ
- 環境変数は .env.local に記述する。.env.local は .gitignore に必ず含める
- Mapbox のアクセストークンは NEXT_PUBLIC_MAPBOX_TOKEN として公開可（公開トークン設計）。ただしURL制限を設定する

## Knowledge Sync（Context7 MCP）
- Next.js / React / Tailwind / shadcn/ui / Supabase / Mapbox GL JS のAPIを使う時 → 必ず Context7 MCP で公式ドキュメントを確認してから実装する。推測で実装しない。例外なし

## Web Research（Brave Search MCP）
- エラーの解決策を調べる時 → Brave Search MCP で最新の情報を検索する
- ライブラリの選定・比較を行う時 → Brave Search MCP で現在の評価・互換性を確認する

## External Service Research
- 外部API・サービスを使う時 → 実装前に Brave Search MCP で以下を確認する：
  (1) 最新バージョン/モデル名 (2) 無料枠の制限 (3) 料金体系 (4) レート制限の回避策
- 調査結果を vision.md の制約セクションに記録する
- 「たぶんこのバージョンで大丈夫」は禁止。確認してから使う

## 3-Tier Verification
- Tier 1: Hooks自動テスト（build/lint）— この層はCLAUDE.mdに書かない
- Tier 2: playwright-slim でブラウザ上の動作検証 → 1回10ステップ以内 → 再利用テスト生成
- Tier 3: ユーザーに「ブラウザで http://localhost:3000/[パス] を開き、[何が見えるか] を確認してください」と指示
- 機能実装後 → vision.md の Acceptance Criteria の各項目について合否を1行ずつ報告する

## Error Loop Exit
- 同じエラーを2回修正して直らない時 → 修正を止めて：
  (1) 根本原因の仮説 (2) 試した修正と結果 (3) 不足情報の特定 (4) ユーザーに判断を仰ぐ

## Error Auto-Recording
- エラー発生時 → issues.md に追記：日時、タスク名、エラー内容、試した修正、結果
- 手戻り発生時 → issues.md に原因と対処を追記

## Boundaries
- ✅ Always: テスト実行、lint通過確認、動作確認コミット、Plan Mode でのタスク開始
- ⚠️ Ask first: 新規依存の追加、DB/APIスキーマ変更、外部サービスのクォータ変更
- 🚫 Never: .env のコミット、node_modules 編集、失敗テストの削除、BigQuery課金設定変更、Supabase本番データ削除

## Context Management
- /compact 時は変更ファイル一覧と現在のタスク状況を必ず保持する
- 3タスク完了ごと、または30分経過時 → /context でトークン使用率を確認しユーザーに報告する
- コンテキスト使用率50%超過時 → 即座に /compact を実行する

## Git Automation
- 各タスク完了時 → git add . と git commit -m "[タスク名]: [変更内容の要約]" を実行する
- 全タスク完了時 → ユーザーに GitHub プッシュ手順を提示する

## XP Rules（プロジェクト横断教訓）
- UI検証時 → playwright-slim（73%スキーマ削減）を使い、1回の検証は10ステップ以内に制限する。検証結果からPlaywrightテストファイルを生成し、以降はHooksで自動実行する
- 確定的に強制するルール（prettier/build/lint/type-check）→ Hooksに配置する。CLAUDE.mdからは除外し、判断を伴うルールのみCLAUDE.mdに残す

## Self-improvement
- 間違えた時 → このファイルにルールを追加して再発防止する（最終行に記載）
