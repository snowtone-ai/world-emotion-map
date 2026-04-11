# WEM | World Emotion Map 🌍

世界中のニュースメディアから観測された「感情の気象」をリアルタイムで可視化するプロジェクト。

## 概要
GDELT ProjectのデータをGoogle BigQueryで解析し、世界各国の感情状態をMapbox上に描画します。
天気予報を確認するように、世界の感情＝WEMをチェックすることを目指しています。

## 技術スタック
- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Mapbox GL JS
- **Backend/DB**: Supabase (PostgreSQL), Google BigQuery
- **Data Source**: GDELT Global Knowledge Graph (GKG)
- **Deployment**: Vercel

## 開発状況
- [x] プロジェクトビジョン策定
- [x] 技術スタック選定
- [ ] UI/UXデザイン設計 (Next Task)
- [ ] データパイプライン構築
