# DESIGN.md — World Emotion Map

> **Concept: "Cinematic Resonance"**
> 宇宙から地球を見下ろすと、各国が人々の感情で光っている。
> 国をタップすると、同じ感情を抱く国へ光の糸が走る。
> 「世界はつながっている」を、データではなく体験として伝える。

---

## 1. Design Philosophy

### Core Principle: Feel First, Read Second

このアプリケーションは「データを見せる」のではなく「感情を感じさせる」ことを目的とする。
ユーザーはまず地球が光っている美しさに心を動かされ、次に「この光は何だろう」と興味を持ち、
最後にデータを読む。この順序を守ることが全てのデザイン判断の基準。

### Three-Layer Architecture

```
Layer 3: DATA      — 数値・チャート・ニュースソース（詳細パネル内）
Layer 2: STORY     — 共鳴アーク・感情ラベル・Live Signal（タップで出現）
Layer 1: EMOTION   — 地球・感情色・大気・脈動（常時表示）
```

ユーザーは Layer 1 を見て感動し、Layer 2 に触れて発見し、Layer 3 で理解する。
モバイルでもデスクトップでも、この3層の順序を崩さない。

---

## 2. Emotion Density System

グローブ上に8色を同時表示すると視認性が落ちる。
ユーザーが理解の深度に応じて色数を選べる **段階的開示** を採用する。

### 2-Color Mode（ポジネガ）
最もシンプル。世界を一目で「良い/悪い」で把握。

| 極性 | 含む感情 | 色 | Hex |
|------|---------|-----|-----|
| Positive | Joy, Trust, Optimism, Surprise | Emerald | `#34D399` |
| Negative | Fear, Anger, Sadness, Uncertainty | Coral | `#FF6B6B` |

### 4-Color Mode（デフォルト）
**「世界は今、喜んでいる？怖がっている？怒っている？悲しんでいる？」**
Ekmanの基本感情から4つを選出。文化・言語・年齢を問わず、見た瞬間に理解できる。

| 感情 | 集計ロジック | 色 | Hex | 問い |
|------|------------|-----|-----|------|
| **Joy** | max(Joy, Trust, Optimism) | Gold | `#FFD166` | この地域は幸せ？ |
| **Fear** | max(Fear, Uncertainty) | Violet | `#A78BFA` | この地域は不安？ |
| **Anger** | Anger スコア単体 | Coral | `#FF6B6B` | この地域は怒っている？ |
| **Sadness** | Sadness スコア単体 | Azure | `#4EA8DE` | この地域は悲しんでいる？ |

- 国の色 = 4つのうちスコアが最も高い感情の色
- **Surprise は4色モードでは非表示**（文脈依存で正負が曖昧なため、8色モード専用）
- Trust/Optimism は Joy に、Uncertainty は Fear に自然に吸収される（「信頼≒喜びの一形態」「不確実性≒不安の一形態」）

### 8-Color Mode（フル）
データ分析者・リピーター向け。全8感情を個別に表示。

| 感情 | Hex | 色覚多様性の区別方法 |
|------|-----|-------------------|
| Joy | `#FFD166` | 暖かい黄（高明度） |
| Trust | `#06D6A0` | ティール（青緑系） |
| Fear | `#A78BFA` | 薄紫（中明度） |
| Anger | `#FF6B6B` | 赤（暖色高彩度） |
| Sadness | `#4EA8DE` | 青（寒色中明度） |
| Surprise | `#FF9F1C` | オレンジ（暖色中明度） |
| Uncertainty | `#94A3B8` | グレー（無彩色） |
| Optimism | `#84CC16` | 黄緑（明るい） |

**色覚多様性対応**: 8色は明度・色相の両方で区別可能にしている。
P型・D型色覚でも Joy(黄/高明度) と Anger(赤/中明度) が区別可能。
Uncertainty をグレー（無彩色）にすることで、全型の色覚で認識可能。

### Density Toggle UI

```
モバイル: ボトムバー中央に [2] [4] [8] のピル型トグル
デスクトップ: 凡例エリア内にセグメントコントロール

   ┌───┬───┬───┐
   │ 2 │ 4 │ 8 │   ← アクティブ側が accent で塗りつぶし
   └───┴───┴───┘
```

---

## 3. Color System

### Base Palette（ダークテーマ固定）

| Token | Hex | OKLCH | 用途 |
|-------|-----|-------|------|
| `--wem-void` | `#06060F` | `oklch(0.08 0.02 270)` | 宇宙背景・ページ背景 |
| `--wem-surface` | `#0F0F1A` | `oklch(0.12 0.02 270)` | カード・パネル背景 |
| `--wem-surface-raised` | `#1A1A2E` | `oklch(0.17 0.03 270)` | ホバー・選択状態 |
| `--wem-border` | `#2A2A40` | `oklch(0.23 0.03 270)` | ボーダー（微妙に見える程度） |
| `--wem-glass` | `rgba(15,15,26,0.75)` | — | グラスモフィズム背景 |
| `--wem-glass-border` | `rgba(255,255,255,0.08)` | — | グラスモフィズムボーダー |
| `--wem-text` | `#EEEEF5` | `oklch(0.95 0.01 270)` | 主テキスト |
| `--wem-text-secondary` | `#8888A8` | `oklch(0.62 0.04 270)` | 補助テキスト |
| `--wem-text-muted` | `#55556A` | `oklch(0.42 0.03 270)` | 非アクティブテキスト |
| `--wem-accent` | `#7C6EF5` | `oklch(0.58 0.2 280)` | アクセント（紫） |
| `--wem-accent-glow` | `rgba(124,110,245,0.3)` | — | アクセントのグロー |

### Semantic Colors

| Token | Hex | 用途 |
|-------|-----|------|
| `--wem-positive` | `#34D399` | 上昇・改善 |
| `--wem-negative` | `#FF6B6B` | 下降・悪化 |
| `--wem-warning` | `#FBBF24` | 警告・異常検知 |
| `--wem-info` | `#4EA8DE` | 情報・中立 |

---

## 4. Typography

| Role | Font | Size (mobile / desktop) | Weight | Letter-spacing |
|------|------|------------------------|--------|---------------|
| Display | Geist | 32px / 48px | 800 | -0.02em |
| H1 | Geist | 20px / 24px | 700 | -0.01em |
| H2 | Geist | 16px / 18px | 600 | 0 |
| Body | Geist | 14px / 15px | 400 | 0 |
| Caption | Geist | 11px / 12px | 400 | 0.01em |
| Data Value | Geist Mono | 18px / 22px | 600 | -0.02em |
| Data Label | Geist Mono | 11px / 12px | 400 | 0.04em |

**規則**: 感情スコアの数値は必ず Geist Mono。UIラベルは Geist。混在しない。

---

## 5. Layout & Responsive Design

### Mobile（< 768px）— 最重要ブレークポイント

```
┌─────────────────────────┐
│                         │
│                         │
│     🌍 Globe            │  ← 100vw × 100vh 全画面
│     (auto-rotate)       │
│                         │
│                         │
│  ┌─ Legend ─┐           │  ← 左下 floating pill
│  │ ● ● ● ● │           │
│  └──────────┘           │
├─────────────────────────┤
│ 🫀 Joy +4  [2][4][8] ☰ │  ← 48px bottom bar (glassmorphic)
└─────────────────────────┘

      ↓ 国をタップ ↓

┌─────────────────────────┐
│     🌍 Globe            │  ← 上部にグローブが残る（peek）
│     (zoomed to country) │
│ ─── ─── ─── ─── ─── ── │
├─────────────────────────┤  ← ボトムシート（ドラッグハンドル付き）
│  ═══════════            │
│  🇯🇵 Japan              │
│  Dominant: Warmth (Joy) │
│  Score: 72              │  ← peek state (30vh)
├─────────────────────────┤
│  Emotion Bars           │
│  ▓▓▓▓▓▓▓░░ Joy    72   │
│  ▓▓▓░░░░░░ Fear   31   │
│  ▓▓░░░░░░░ Anger  22   │  ← half state (60vh) — swipe up
│  ▓░░░░░░░░ Sad    14   │
│  ───────────────────    │
│  24h Trend  📈          │
│  ───────────────────    │
│  Resonance: 🇩🇪🇧🇷🇰🇷     │  ← 同じ感情を共有する国
│  ───────────────────    │
│  Sources                │
│  ▸ Reuters ↗            │  ← full state (90vh) — swipe up more
│  ▸ NHK ↗               │
└─────────────────────────┘
```

**モバイルのキー原則**:
- ヘッダーは非表示。☰ メニューから Region/Sector 切替・言語・認証にアクセス
- グローブは常に画面上部に見える（ボトムシートは最大90vhまで）
- 片手操作を前提: 全てのインタラクションは親指の届く下半分に配置
- タップ → ズーム → ボトムシートの流れは 400ms 以内に開始

### Tablet（768px - 1024px）

```
┌────────────────────────────────────────────┐
│  ● WEM    [Region|Sector]  🌐 EN/JA   👤  │  ← 52px header (glassmorphic)
├────────────────────────────────┬───────────┤
│                                │           │
│     🌍 Globe                   │  Detail   │
│                                │  Panel    │
│                                │  (360px)  │
│                                │           │
│  ┌─ Legend ─────┐             │           │
│  │ ● ● ● ●     │             │           │
│  │ [2][4][8]    │             │           │
│  └──────────────┘             │           │
├────────────────────────────────┴───────────┤
│  🫀 Global: Joy 62   │ 🔴 Fear +28 DE 2h  │  ← Live Signal bar
└────────────────────────────────────────────┘
```

### Desktop（> 1024px）

```
┌──────────────────────────────────────────────────────────┐
│  ● WEM  World Emotion Map  [Region ● | ○ Sector]  🌐  👤│  ← 52px header (glassmorphic)
├──────────────────────────────────────────────┬───────────┤
│                                              │           │
│         🌍 Globe (auto-rotate)               │  Detail   │
│         Resonance arcs visible               │  Panel    │
│                                              │  (400px)  │
│                                              │  glass-   │
│                                              │  morphic  │
│  ┌─ Legend ─────────┐                       │           │
│  │ ● Warmth ● Unease│                       │           │
│  │ ● Tension● Sorrow│                       │           │
│  │ [2] [4] [8]      │                       │           │
│  └──────────────────┘                       │           │
├──────────────────────────────────────────────┴───────────┤
│  🫀 Global Pulse: Joy 62  │  🔴 Fear +28 · Germany · 2h │  ← Live Signal (glassmorphic)
└──────────────────────────────────────────────────────────┘
```

---

## 6. Globe Specification

### Mapbox Configuration

```
Projection: globe
Base style: mapbox://styles/mapbox/standard (theme: monochrome)
Initial zoom: 1.5 (地球全体が見える)
Initial center: ユーザーのタイムゾーンから推定（navigator.language fallback）
Auto-rotate: 0.3°/sec（タッチで停止、5秒後に再開）
```

### Atmosphere（大気圏）

```javascript
map.setFog({
  'color': 'rgb(6, 6, 15)',           // 宇宙の闇（void に近い色）
  'high-color': 'rgb(20, 30, 80)',    // 大気上層（深い紺）
  'horizon-blend': 0.03,              // 大気の薄さ（控えめ）
  'space-color': 'rgb(6, 6, 15)',     // 背景の宇宙
  'star-intensity': 0.35              // 星の強さ（控えめ）
});
```

### Country Fill Layer

```javascript
// 感情色でコロプレス塗り分け
{
  id: 'emotion-fill',
  type: 'fill',
  source: 'countries',
  'source-layer': 'country_boundaries',
  paint: {
    'fill-color': emotionMatchExpression,  // 動的に生成
    'fill-opacity': 0.8
  }
}
```

### Country Glow（選択時）

```javascript
// 選択中の国に光のアウトライン
{
  id: 'country-highlight',
  type: 'line',
  paint: {
    'line-color': '#ffffff',
    'line-width': 2,
    'line-blur': 6,        // ← ぼかしでグロー効果
    'line-opacity': ['case', ['==', ['get', 'iso_3166_1'], selectedCountry], 0.8, 0]
  }
}
```

### 感情強度の表現

国の感情色に加えて、感情の **強度**（スコアの絶対値）を `fill-opacity` で表現する:
- スコア 80-100: opacity 0.9（強く光る）
- スコア 50-79: opacity 0.7
- スコア 20-49: opacity 0.5
- スコア 0-19: opacity 0.3（ほぼ見えない＝データなし/ニュートラル）

---

## 7. Resonance Arcs（共鳴アーク）

このプロジェクトの **核心的ビジュアル差別化要素**。

### 発動条件
- ユーザーが国をタップ/クリックした時
- 選択された国と感情プロファイルが最も類似する 3〜5カ国 への大圏弧を描画

### 視覚仕様

```
形状: Great Circle Arc（大圏航路）
色: 選択国の支配的感情の色（4色モードの色を使用）
幅: 2px（細い＝邪魔にならない）
グロー: line-blur: 4px で発光感
アニメーション: 弧に沿って光の粒子が0.8秒で走る（line-gradient で表現）
フェード: 出現後 3秒で自然に opacity 0 へ fade out
```

### アーク描画の疑似コード

```
1. 選択国の感情ベクトル取得 [joy, trust, fear, anger, sadness, surprise, uncertainty, optimism]
2. 全国との cosine similarity 計算
3. 上位 3〜5カ国を抽出（閾値: similarity > 0.7）
4. 各ペアの首都座標間に GeoJSON LineString を生成
5. turf.js の greatCircle() で弧を補間
6. 'resonance-arcs' レイヤーとして追加、アニメーション開始
7. 3秒後に opacity → 0、削除
```

### モバイルでの制限
- 最大 3本（デスクトップは5本）
- 弧の上にラベルは表示しない（タップでボトムシート内に表示）

---

## 8. Component Specifications

### Header（グラスモフィズム）

```css
/* モバイルでは非表示、タブレット以上で表示 */
height: 52px;
background: var(--wem-glass);
backdrop-filter: blur(16px) saturate(1.2);
border-bottom: 1px solid var(--wem-glass-border);
```

| 要素 | 仕様 |
|------|------|
| Logo | 「●」(accent紫の円) + 「WEM」Geist 700 16px + 「World Emotion Map」Geist 400 12px text-secondary |
| View Toggle | `[Region ● \| ○ Sector]` ピル型。アクティブ側は bg-accent + text-white |
| Language | `EN / JA` テキストトグル。アクティブ側に下線 |
| Auth | 未ログイン: 「Sign in」テキストボタン。ログイン済み: 32px アバター円 |

### Detail Panel（グラスモフィズム）

```css
/* デスクトップ: 右パネル */
width: 400px;
background: var(--wem-glass);
backdrop-filter: blur(16px) saturate(1.2);
border-left: 1px solid var(--wem-glass-border);
transform: translateX(100%);       /* 初期状態: 画面外 */
transition: transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* モバイル: ボトムシート */
border-radius: 16px 16px 0 0;
max-height: 90vh;
/* ドラッグハンドル: 幅40px 高さ4px rounded bg-wem-text-muted/30 */
```

### Emotion Bar

```
┌──────────────────────────────────┐
│  Joy                          72 │  ← label: Geist 400 14px / value: Geist Mono 600 18px
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ │  ← bar: h-2 rounded-full
│                                  │     bg: wem-surface-raised
│                                  │     fill: emotion color
│                                  │     glow: box-shadow 0 0 8px {color}40
└──────────────────────────────────┘
```

### Legend（フローティングピル）

```css
/* 地図左下に浮遊 */
position: fixed;
bottom: 64px;  /* bottom bar の上 */
left: 16px;
background: var(--wem-glass);
backdrop-filter: blur(12px);
border-radius: 12px;
padding: 8px 12px;
border: 1px solid var(--wem-glass-border);
```

内容: 感情ドット（8px circle）+ ラベル（caption サイズ）を横並び。
4色モードのとき: `● Joy  ● Fear  ● Anger  ● Sadness`

### Global Pulse Indicator

```
位置: ボトムバー左端（モバイル）/ Live Signal バー左端（デスクトップ）
形状: 12px の円 + テキスト「Joy 62」
アニメーション:
  - 円が scale(1) → scale(1.3) → scale(1) を繰り返す
  - 速度: 世界の感情変化率に比例
    - 安定時: 2秒周期（ゆったり）
    - 急変時: 0.8秒周期（緊迫感）
  - 色: 世界の支配的感情の色
```

### Live Signal Ticker

```
位置: デスクトップ — 画面下部バー中央。モバイル — ☰メニュー内
形式: 横スクロール（auto）
内容例:
  🔴 Fear +28 · Germany · 2h ago
  🟡 Joy reversed → Fear · Japan · 3h ago
  🟣 5 countries synced in Fear · 1h ago
フォント: Geist Mono 12px, text-secondary
```

---

## 9. Animation & Motion

### 原則
- **prefers-reduced-motion を尊重する**: 全アニメーションを `@media (prefers-reduced-motion: reduce)` で無効化可能に
- **60fps を死守**: アニメーションは CSS transform/opacity のみ。layout shift を起こさない
- **控えめ > 派手**: 演出は常に「少し足りないかも」くらいで止める

### Keyframes

```css
/* グローバルパルス */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
}

/* パネルスライドイン */
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* ボトムシート出現 */
@keyframes slide-in-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* 共鳴アークのフェードアウト */
@keyframes arc-fade {
  0% { opacity: 0.8; }
  70% { opacity: 0.8; }
  100% { opacity: 0; }
}
```

### カメラモーション（Mapbox flyTo）

```javascript
// 国選択時のカメラダイブ
map.flyTo({
  center: [countryLng, countryLat],
  zoom: 4,
  pitch: 30,          // 少し傾けて立体感
  duration: 1200,     // 1.2秒
  essential: true,    // prefers-reduced-motion でも実行（地図操作のため）
  curve: 1.2          // 加速カーブ
});

// 国選択解除時の帰還
map.flyTo({
  zoom: 1.5,
  pitch: 0,
  duration: 800,
  curve: 1.0
});
```

---

## 10. Glassmorphism System

全てのオーバーレイUIに統一されたグラスモフィズムを適用する。

```css
.glass {
  background: var(--wem-glass);             /* rgba(15,15,26,0.75) */
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid var(--wem-glass-border); /* rgba(255,255,255,0.08) */
}

.glass-light {
  background: rgba(15, 15, 26, 0.5);        /* より透過 */
  backdrop-filter: blur(8px);
}
```

**使い分け**:
- `.glass`: Header, Detail Panel, Bottom Sheet — 情報を読むエリア
- `.glass-light`: Legend, Bottom Bar — 地図の上に軽く浮くエリア

---

## 11. Emotional Micro-Copy

数値だけでなく、人間が共感できるコピーを添える。

| スコア帯 | Joy | Fear | Anger | Sadness |
|----------|-----|------|-------|---------|
| 80-100 | "A wave of joy" | "Deep fear grips" | "Outrage is boiling" | "Profound grief" |
| 60-79 | "Cautious optimism" | "Growing anxiety" | "Anger is rising" | "A cloud of sadness" |
| 40-59 | "Quiet contentment" | "Unease lingers" | "Simmering frustration" | "Lingering melancholy" |
| 20-39 | "Muted calm" | "Mild concern" | "Subtle discontent" | "Faint sorrow" |
| 0-19 | "Stillness" | "Largely at ease" | "At peace" | "Emotionally neutral" |

**実装**: `lib/micro-copy.ts` に感情×スコア帯のマッピングテーブル。i18n 対応（EN/JA 両方用意）。

---

## 12. Accessibility

| 要件 | 対応 |
|------|------|
| 色覚多様性 | 8色は明度差で区別可能。2色/4色モードでさらに簡略化 |
| スクリーンリーダー | 地図に `aria-label="World emotion map"` + 国選択時に感情データを読み上げ |
| キーボード | Tab で国選択（フォーカスリング表示）、Esc でパネル閉じ |
| モーション | `prefers-reduced-motion: reduce` で全アニメーション無効化、auto-rotate 停止 |
| コントラスト | テキストは全て WCAG AA（4.5:1）以上。`--wem-text` on `--wem-void` = 15.8:1 |
| タッチターゲット | 最小 44px × 44px（WCAG 2.5.5） |

---

## 13. Spacing & Radius

| Token | Value | 用途 |
|-------|-------|------|
| `--space-xs` | `4px` | アイコンとラベルの隙間 |
| `--space-sm` | `8px` | コンパクト要素の内側余白 |
| `--space-md` | `12px` | 標準余白 |
| `--space-lg` | `16px` | セクション間 |
| `--space-xl` | `24px` | カード内パディング |
| `--space-2xl` | `32px` | セクション間（大） |
| `--radius-sm` | `6px` | ボタン・バッジ |
| `--radius-md` | `10px` | カード・パネル |
| `--radius-lg` | `16px` | ボトムシート上部 |
| `--radius-pill` | `9999px` | ピル型トグル・凡例 |

---

## 14. Shadow & Glow

```css
/* カード影 */
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.05);

/* 感情バーのグロー（CSS変数として感情色を受け取る） */
--glow-emotion: 0 0 8px color-mix(in oklch, var(--emotion-color) 40%, transparent);

/* 選択国のグロー */
--glow-selected: 0 0 16px rgba(124, 110, 245, 0.4);
```

---

## 15. First Visit Experience

初回訪問時のみ再生される 3秒のミニシーケンス（localStorage フラグで管理）:

```
t=0.0s  黒い画面。星がゆっくり現れる
t=0.5s  地球が void の中から fade in（scale 0.8 → 1.0）
t=1.5s  国々が感情色で一つずつ illuminate（100ms 間隔でランダム順）
t=2.5s  一瞬、全国が同時に明るく光る（pulse）
t=3.0s  通常の表示へ遷移。ボトムバーが slide-up
```

**再訪時**: 即座にグローブ表示。イントロなし。
**prefers-reduced-motion**: イントロ全スキップ。

---

## 16. Implementation File Map

```
src/
├── app/
│   ├── globals.css          ← テーマトークン・キーフレーム・グラス定義
│   ├── layout.tsx           ← dark クラス固定・フォント・メタデータ
│   └── page.tsx             ← メインマップページ
├── components/
│   ├── map/
│   │   ├── WorldGlobe.tsx   ← Mapbox GL JS (dynamic import, ssr: false)
│   │   ├── EmotionLayer.tsx ← コロプレス fill layer
│   │   ├── ResonanceArcs.tsx← 共鳴アーク描画
│   │   ├── GlobePulse.tsx   ← auto-rotate + pulse 制御
│   │   └── Legend.tsx       ← 凡例 + density toggle
│   ├── panel/
│   │   ├── DetailPanel.tsx  ← デスクトップ右パネル
│   │   ├── BottomSheet.tsx  ← モバイルボトムシート
│   │   ├── EmotionBars.tsx  ← 感情スコアバー
│   │   └── TrendChart.tsx   ← 24h 推移チャート
│   ├── layout/
│   │   ├── Header.tsx       ← ヘッダー (glassmorphic)
│   │   ├── BottomBar.tsx    ← モバイルボトムバー
│   │   └── LiveSignal.tsx   ← リアルタイムティッカー
│   └── ui/                  ← shadcn/ui コンポーネント
├── lib/
│   ├── emotions.ts          ← 感情定義・色マップ・density grouping
│   ├── micro-copy.ts        ← 感情マイクロコピー (EN/JA)
│   └── utils.ts             ← shadcn/ui ユーティリティ
└── hooks/
    ├── useEmotionData.ts    ← Supabase から感情データ取得
    └── useMediaQuery.ts     ← レスポンシブ判定
```
