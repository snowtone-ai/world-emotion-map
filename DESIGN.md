# DESIGN.md — World Emotion Map

> **Task 0 成果物**: デザイン3案のプレビュー。下記を確認してA/B/Cから1案を選択してください。
> 選択後、未選択の2案セクションを削除し、選択案のトークン/カラーを `src/app/globals.css` の `@theme` に適用します。

---

## 選択方法

以下の3案を比較し、最もWorld Emotion Mapのブランドと目的に合うものを選んでください。

| 観点 | A: Linear風 | B: Notion風 | C: Coinbase風 |
|------|------------|------------|--------------|
| 雰囲気 | プロフェッショナル・SF的 | 温かみ・知的 | 信頼感・クリーン |
| 主ユーザー | データ重視層 | 一般ユーザー重視 | 金融・ビジネス層 |
| 地図映え | ◎ 暗背景で色が映える | △ 地図との対比弱め | ○ 青基調で統一感 |
| モバイル | ○ | ◎ | ○ |

---

## Plan A: Linear風ダーク（Midnight Data）

**コンセプト**: 「世界の感情を宇宙から観測する。」データ密度を最大化した暗黒宇宙テーマ。感情の色が夜の地球上で輝く。

### カラーパレット

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-bg` | `#0A0A0F` | ページ背景 |
| `--color-surface` | `#13131A` | カード・パネル背景 |
| `--color-surface-raised` | `#1C1C27` | ホバー・選択状態 |
| `--color-border` | `#2A2A38` | ボーダー |
| `--color-text-primary` | `#F0F0FF` | 主テキスト |
| `--color-text-secondary` | `#8080A0` | 補助テキスト |
| `--color-text-muted` | `#505068` | 非アクティブ |
| `--color-accent` | `#7C6EF5` | プライマリアクション（紫） |
| `--color-accent-hover` | `#9D91FF` | アクセントホバー |
| `--color-accent-subtle` | `#1E1B3A` | アクセント薄背景 |
| `--color-success` | `#34D399` | 成功・ポジティブ |
| `--color-warning` | `#FBBF24` | 警告 |
| `--color-danger` | `#F87171` | エラー・危険 |

### 感情カラー（色覚多様性対応）

| 感情 | Hex | 説明 |
|------|-----|------|
| Joy | `#FFD166` | 暖かい黄色 |
| Trust | `#06D6A0` | ティール |
| Fear | `#A78BFA` | 薄紫 |
| Anger | `#FF6B6B` | 赤 |
| Sadness | `#4EA8DE` | 青 |
| Surprise | `#FF9F1C` | オレンジ |
| Uncertainty | `#94A3B8` | グレー |
| Optimism | `#84CC16` | 明るい緑 |

### タイポグラフィ

| Role | Font | Size | Weight |
|------|------|------|--------|
| Display | `Inter` (Google Fonts) | 48px / 3rem | 700 |
| Heading 1 | `Inter` | 24px / 1.5rem | 600 |
| Heading 2 | `Inter` | 18px / 1.125rem | 600 |
| Body | `Inter` | 14px / 0.875rem | 400 |
| Caption | `Inter` | 12px / 0.75rem | 400 |
| Mono (数値) | `JetBrains Mono` | 13px / 0.8125rem | 500 |

### スペーシング・形状

- Border radius: `6px`（カード・ボタン）/ `3px`（バッジ・タグ）
- Shadow: `0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)`
- Blur (glassmorphism): `backdrop-filter: blur(12px)` on panels

### コンポーネントスタイル

**Header**
```
背景: bg-[#13131A] + 下ボーダー border-[#2A2A38]
高さ: 52px
Logo: テキスト「WEM」+ ドット（accent紫）
Region/Sectorトグル: ピル型、アクティブ側が accent 紫塗りつぶし
```

**Country Detail Panel**
```
幅: 360px（デスクトップ）/ フルスクリーンボトムシート（モバイル）
背景: bg-[#13131A] + 左ボーダー border-[#2A2A38]
スライドイン: translate-x アニメーション 200ms ease-out
```

**Map Legend**
```
位置: 地図左下、padding 12px
背景: bg-[#13131A]/90 backdrop-blur
感情チップ: 小丸アイコン + ラベル
```

**Emotion Score Bar**
```
背景: bg-[#1C1C27]
Fill: 感情カラー + glow (box-shadow: 0 0 8px {emotion-color}60)
```

### UIモックアップ（テキスト図）

```
┌──────────────────────────────────────────────────────────────────┐
│ ■ WEM    [Region ●|○ Sector]    🌐 EN/JA    [● souma ▾]         │  ← bg #13131A
├──────────────────────────────────────────────────────────────────┤
│                                                    ┌────────────┐│
│  🌍 globe rotating slowly                          │  JAPAN     ││  ← panel #13131A
│     各国: 感情カラーで発光                          │  🇯🇵       ││
│     hover: 国名tooltip + 感情アイコン               │  Joy 72%   ││
│                                                    │  ▓▓▓▓▓░░  ││
│                                                    │  ──────── ││
│                                                    │  24h trend ││
│  ┌──── Mini Dashboard ─────────────────────────┐  │  📈        ││
│  │  📊 Top Changes  🚨 T1: +28 Fear in DE      │  │  ──────── ││
│  └─────────────────────────────────────────────┘  │  Sources   ││
├────────────────────────────────────────────────────│  ▸ Reuters ││
│  🟡Joy  🟢Trust  🟣Fear  🔴Anger  🔵Sadness        │  ▸ NHK    ││
│  🟠Surprise  [Extended ○]                          └────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## Plan B: Notion風ウォーム（Warm Intelligence）

**コンセプト**: 「感情は、知識だ。」新聞・レポートの温かみとWebアプリの使いやすさを融合。誰でも読み解けるシンプルな世界感情新聞。

### カラーパレット

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-bg` | `#FAFAF8` | ページ背景（生成り） |
| `--color-surface` | `#FFFFFF` | カード・パネル |
| `--color-surface-raised` | `#F4F4F0` | ホバー・インセット |
| `--color-border` | `#E5E5E0` | ボーダー |
| `--color-text-primary` | `#1A1A1A` | 主テキスト |
| `--color-text-secondary` | `#6B6B6B` | 補助テキスト |
| `--color-text-muted` | `#B0B0A8` | 非アクティブ |
| `--color-accent` | `#E85D4A` | プライマリアクション（テラコッタ） |
| `--color-accent-hover` | `#CF4A38` | アクセントホバー |
| `--color-accent-subtle` | `#FEF0EE` | アクセント薄背景 |
| `--color-success` | `#2D9250` | 成功 |
| `--color-warning` | `#D97706` | 警告 |
| `--color-danger` | `#DC2626` | エラー |

### 感情カラー（色覚多様性対応）

| 感情 | Hex | 説明 |
|------|-----|------|
| Joy | `#F5A623` | アンバー |
| Trust | `#27AE60` | グリーン |
| Fear | `#8E44AD` | 深紫 |
| Anger | `#E74C3C` | 赤 |
| Sadness | `#2980B9` | 青 |
| Surprise | `#E67E22` | オレンジ |
| Uncertainty | `#95A5A6` | グレー |
| Optimism | `#7FB800` | 草緑 |

### タイポグラフィ

| Role | Font | Size | Weight |
|------|------|------|--------|
| Display | `Lora` (serif, Google Fonts) | 48px / 3rem | 700 |
| Heading 1 | `Lora` | 22px / 1.375rem | 600 |
| Heading 2 | `Inter` | 16px / 1rem | 600 |
| Body | `Inter` | 15px / 0.9375rem | 400 |
| Caption | `Inter` | 12px / 0.75rem | 400 |
| Mono (数値) | `IBM Plex Mono` | 13px / 0.8125rem | 500 |

### スペーシング・形状

- Border radius: `8px`（カード）/ `4px`（ボタン・バッジ）
- Shadow: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- Panel: 右側から `box-shadow: -4px 0 24px rgba(0,0,0,0.06)` でスライドイン

### コンポーネントスタイル

**Header**
```
背景: bg-white + 下ボーダー border-[#E5E5E0]
高さ: 56px
Logo: 「World Emotion Map」セリフ体 + 小サブタイトル「by news sentiment」
Region/Sectorトグル: アンダーライン型、アクティブ側にテラコッタ下線
```

**Country Detail Panel**
```
幅: 400px（デスクトップ）/ 80vhボトムシート（モバイル）
背景: bg-white + 左ボーダー border-[#E5E5E0] + shadow
スライドイン: 220ms ease-in-out
国名: セリフ体 Lora h1
```

**Map凡例**
```
位置: 地図左下、カード型
背景: bg-white shadow-sm
感情チップ: 丸 + ラベル（serif体）
```

**Emotion Score Bar**
```
背景: bg-[#F4F4F0]
Fill: 感情カラー（solid、no glow）
数値: IBM Plex Mono
```

### UIモックアップ（テキスト図）

```
┌──────────────────────────────────────────────────────────────────┐
│  World Emotion Map            [Region | Sector]   EN/JA   souma  │  ← bg white / serif logo
│  by news sentiment                                               │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐ ┌────────────┐ │
│ │  flat mercator map (warm tones)              │ │  JAPAN     │ │  ← panel white
│ │  各国ポリゴン: 感情カラー（彩度抑えめ）       │ │  2026/04   │ │
│ │  hover: tooltip（新聞見出し風）               │ │  ───────  │ │
│ │                                              │ │  Joy  72  │ │
│ │                                              │ │  ████░░░  │ │
│ │  ┌─── Latest Reading ──────────────────┐    │ │           │ │
│ │  │ 🌍 Asia Fear+12  🌎 Americas Joy+8  │    │ │  24h chart│ │
│ │  └────────────────────────────────────┘    │ │  ─────── │ │
│ └──────────────────────────────────────────── │ │  Sources  │ │
│ ○Joy ○Trust ○Fear ○Anger ○Sadness ○Surprise   │ │  Reuters  │ │
│ [Extended emotions ▾]                          │ └────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  About  Privacy  Terms  Subscribe ✉                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Plan C: Coinbase風クリーン（Trust Blue）

**コンセプト**: 「信頼できるデータを、信頼できるUIで。」金融ダッシュボードの明快さと情報の信頼性を全面に打ち出す。青基調で知性と誠実さを表現。

### カラーパレット

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-bg` | `#F7F8FA` | ページ背景（ライトブルーグレー） |
| `--color-surface` | `#FFFFFF` | カード・パネル |
| `--color-surface-raised` | `#EEF1F7` | ホバー・インセット |
| `--color-border` | `#D9DCE3` | ボーダー |
| `--color-text-primary` | `#0A0C12` | 主テキスト |
| `--color-text-secondary` | `#5A6478` | 補助テキスト |
| `--color-text-muted` | `#9BA5B4` | 非アクティブ |
| `--color-accent` | `#1652F0` | プライマリアクション（Coinbaseブルー） |
| `--color-accent-hover` | `#0F3FBF` | アクセントホバー |
| `--color-accent-subtle` | `#EBF0FE` | アクセント薄背景 |
| `--color-success` | `#05B169` | 成功・上昇 |
| `--color-warning` | `#F5971A` | 警告 |
| `--color-danger` | `#E7373E` | エラー・下落 |

### 感情カラー（色覚多様性対応）

| 感情 | Hex | 説明 |
|------|-----|------|
| Joy | `#FFB800` | ゴールド |
| Trust | `#00A878` | エメラルド |
| Fear | `#7B61FF` | 紫 |
| Anger | `#E7373E` | 赤 |
| Sadness | `#1652F0` | 濃い青 |
| Surprise | `#FF7A00` | オレンジ |
| Uncertainty | `#9BA5B4` | グレー |
| Optimism | `#05B169` | グリーン |

### タイポグラフィ

| Role | Font | Size | Weight |
|------|------|------|--------|
| Display | `Inter` | 48px / 3rem | 800 |
| Heading 1 | `Inter` | 22px / 1.375rem | 700 |
| Heading 2 | `Inter` | 16px / 1rem | 600 |
| Body | `Inter` | 15px / 0.9375rem | 400 |
| Caption | `Inter` | 12px / 0.75rem | 400 |
| Mono (数値) | `Inter` | 14px / 0.875rem | 600 |

### スペーシング・形状

- Border radius: `12px`（カード・パネル）/ `8px`（ボタン）/ `99px`（バッジ・ピル）
- Shadow: `0 2px 8px rgba(10,12,18,0.08), 0 0 1px rgba(10,12,18,0.06)`
- Panel: 右側から border-l border-[#D9DCE3] でスライドイン

### コンポーネントスタイル

**Header**
```
背景: bg-white + 下ボーダー border-[#D9DCE3]
高さ: 60px
Logo: 「WEM」+ 青丸マーカー（accent blue）+ 「World Emotion Map」細字サブ
Region/Sectorトグル: タブ型、アクティブ側 bg-[#EBF0FE] + accent blue テキスト
```

**Country Detail Panel**
```
幅: 380px（デスクトップ）/ フルボトムシート h-[70vh]（モバイル）
背景: bg-white + 左ボーダー border-[#D9DCE3]
スライドイン: 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)
感情スコア: 大きい数字（Inter 800 weight）
```

**Map凡例**
```
位置: 地図左下、ピル型コンテナ
背景: bg-white rounded-2xl shadow
感情チップ: カラードット + テキスト（tight spacing）
```

**Emotion Score Bar**
```
背景: bg-[#EEF1F7] rounded-full
Fill: 感情カラー rounded-full
アニメーション: width transition 400ms ease-out
```

### UIモックアップ（テキスト図）

```
┌──────────────────────────────────────────────────────────────────┐
│ ● WEM  World Emotion Map   [Region] [Sector]   EN  JA   👤souma │  ← bg white / blue accent
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐  ┌──────────────┐  │
│ │                                          │  │  🇯🇵 Japan   │  │  ← panel white rounded-xl
│ │   flat/globe map (light base)            │  │              │  │
│ │   各国: 感情カラー（高彩度）              │  │  Joy   72    │  │
│ │   active country: 白縁取り強調           │  │  ████████░░  │  │
│ │                                          │  │              │  │
│ │                                          │  │  Fear  31    │  │
│ │  ┌── Live Signals ───────────────────┐  │  │  ████░░░░░░  │  │
│ │  │ 🔴 +28 Fear · Germany · 2h ago   │  │  │              │  │
│ │  │ 🟡 +19 Joy · Brazil · 4h ago     │  │  │  24h ───── │  │
│ │  └───────────────────────────────────┘  │  │             │  │
│ └──────────────────────────────────────────┘  │  Reuters ↗  │  │
│  ● Joy ● Trust ● Fear ● Anger ● Sadness       │  NHK ↗      │  │
│  [+ Extended]                                 └──────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 選択後の作業（Claude Codeが実行）

選択案が決まったら以下を実行します：

1. `src/app/globals.css` の `@theme {}` に選択案のカラートークンを追記
2. Google Fonts の `import` を `layout.tsx` に追加
3. shadcn/ui の `components.json` の `cssVariables` を選択案に合わせて調整
4. 未選択の2案をこのファイルから削除してコンパクトに保つ

---

*DESIGN.md generated for Task 0 — World Emotion Map*
