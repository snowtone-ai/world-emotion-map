# vision.md — World Emotion Map

---

## 1. Purpose

世界中のニュースメディアから観測された感情シグナルをリアルタイムで可視化するインタラクティブマップ。

- **対象ユーザー**: 世界情勢に関心のある一般ユーザー（メイン）+ セクター別感情でリスク・トレンドを把握したいライトビジネス層
- **解決課題**: 世界各地で「今何が人々の心を動かしているか」を直感的に把握する手段がない。既存のセンチメント分析ツールは高額（$149-$42,000+/月）でB2B専用。一般ユーザーがアクセス可能な世界感情マップは存在しない
- **注記**: 感情データはGDELT GKG（ニュースメディア解析）から観測。「ニュースメディアが報じる世界の感情気象」として位置づける

---

## 2. Features

### Feature 1: World Emotion Map（メインマップ）
**User Story**: ユーザーとして、世界地図上で各国の感情状態を色で直感的に把握したい
**Acceptance Criteria**:
- Given: トップページにアクセスした時
- When: 地図が表示される
- Then: 世界地図（Mapbox GL JS）が表示され、各国が現在の支配的感情に応じた色で塗り分けられている
- Given: 感情レイヤーがデフォルト（6感情）の時
- When: 凡例を確認する
- Then: Joy/Trust/Fear/Anger/Sadness/Surpriseの6色とその意味が表示されている
- Given: 感情トグルで拡張（8感情）に切り替えた時
- When: 地図を確認する
- Then: Uncertainty/Optimismが追加され、8色で塗り分けが更新される
- **Must NOT**: 地図の初期ロードに3秒以上かからないこと。色覚多様性に配慮しないパレットを使わないこと

### Feature 2: Region Hierarchy Navigation（地域階層ナビゲーション）
**User Story**: ユーザーとして、大陸→国→地域とドリルダウンして感情を探索したい
**Acceptance Criteria**:
- Given: 世界地図が表示されている時
- When: 大陸をクリックする
- Then: その大陸にズームし、国単位の感情が表示される
- Given: 国をクリックした時
- When: GDELTデータが十分な主要国（自動判定）の場合
- Then: 国内地域別の感情マップにドリルダウンできる
- Given: 国をクリックした時
- When: データが不十分な国の場合
- Then: 国全体の感情詳細パネルが右側にスライドインする
- **Must NOT**: ドリルダウン不可能な国でドリルダウンUIを表示しないこと

### Feature 3: Sector View（セクター別表示）
**User Story**: ユーザーとして、経済・政治・テクノロジー等のセクター別に世界の感情を見たい
**Acceptance Criteria**:
- Given: ビュー切替で「セクター」を選択した時
- When: 大分類セクター（8種）が表示される
- Then: 各セクターの世界全体の感情スコアがカード形式で一覧表示される
- Given: 大分類セクター（例: Economy）をクリックした時
- When: 小分類セクターが展開される
- Then: Markets/Trade/Employmentの3小分類が表示され、それぞれの感情スコアが見える
- Given: セクター詳細画面で国フィルターを適用した時
- When: 特定の国を選択する
- Then: その国のセクター別感情データが表示される
- **Must NOT**: セクターと国の2軸を同時に複雑なマトリクスで表示しないこと（段階的にドリルダウン）

**セクター分類（2階層）**:
| 大分類 | 小分類 |
|--------|--------|
| Economy | Markets, Trade, Employment |
| Politics | Domestic, Diplomacy, Elections |
| Technology | AI/ML, Cybersecurity, Innovation |
| Environment | Climate, Disasters |
| Health | Public Health, Pharma |
| Security | Military, Terrorism, Crime |
| Society | Education, Human Rights, Migration |
| Energy | Oil/Gas, Renewables |

### Feature 4: View Switching（表示切替）
**User Story**: ユーザーとして、地域別表示とセクター別表示をワンクリックで切り替えたい
**Acceptance Criteria**:
- Given: 地図上部にトグルスイッチがある時
- When: 「Region」↔「Sector」を切り替える
- Then: 表示が即座に切り替わり、現在のフィルター状態が維持される
- **Must NOT**: 切替時にページリロードが発生しないこと

### Feature 5: Country Detail Panel（国詳細パネル）
**User Story**: ユーザーとして、特定の国の感情の詳細と根拠ニュースを確認したい
**Acceptance Criteria**:
- Given: 地図上で国をクリックした時
- When: 詳細パネルが右側からスライドインする
- Then: 以下が表示される：国名、現在の感情スコア（6or8感情のレーダーチャート）、過去24時間の感情推移チャート、セクター別感情内訳、根拠ニュース3-5件（タイトル+URL）
- Given: ニュースリンクをクリックした時
- When: リンク先に遷移する
- Then: 新しいタブで元記事が開く
- **Must NOT**: パネルが画面全体を覆わないこと（地図と同時に見えること）

### Feature 6: Sector Detail Panel（セクター詳細パネル）
**User Story**: ユーザーとして、特定セクターの感情動向と国別比較を確認したい
**Acceptance Criteria**:
- Given: セクタービューでセクターを選択した時
- When: 詳細パネルが表示される
- Then: 世界全体の感情スコア、過去24時間の推移、国別感情ランキング（トップ/ワースト5）、関連ニュース3-5件が表示される
- **Must NOT**: データが不十分な国をランキングに含めないこと

### Feature 7: Emotion Layer Toggle（感情レイヤー切替）
**User Story**: ユーザーとして、基本6感情と拡張8感情を切り替えたい
**Acceptance Criteria**:
- Given: 地図の凡例エリアにトグルがある時
- When: 「Extended」をONにする
- Then: UncertaintyとOptimismが追加され、地図・チャート・パネル全てが8感情モードに更新される
- **Must NOT**: トグル切替時にデータの再取得が発生しないこと（フロントエンドのみで切替）

### Feature 8: Google Authentication（認証）
**User Story**: ユーザーとして、Googleアカウントで簡単にログインしたい
**Acceptance Criteria**:
- Given: ヘッダーの「Sign in」ボタンをクリックした時
- When: Googleログインフローが開始される
- Then: Googleアカウント選択→認証→リダイレクトでログイン完了。ヘッダーにアバターが表示される
- Given: ログイン済みの時
- When: アバターをクリックする
- Then: ドロップダウンメニューに「Favorites」「Sign out」が表示される
- **Must NOT**: 認証情報をlocalStorageに平文で保存しないこと

### Feature 9: Favorites（お気に入り）
**User Story**: ログインユーザーとして、関心のある国を保存して素早くアクセスしたい
**Scope 決定（2026-04-13）**: 国（country）レイヤーのみ実装。セクター・コンボお気に入りはスコープ外。
**Acceptance Criteria**:
- Given: ログイン済みで国詳細パネルを見ている時
- When: ☆ボタンをクリックする
- Then: その国がお気に入りに追加される。☆が★に変わる
- Given: /favorites ページにアクセスした時
- When: お気に入り一覧が表示される
- Then: 保存した国がカード形式で表示され、各カードに現在の感情サマリーが表示される
- Given: 未ログインで☆をクリックした時
- When: ログイン促進モーダルが表示される
- Then: 「Sign in to save favorites」とGoogleログインボタンが表示される
- **Must NOT**: Phase 1ではお気に入り機能に課金しないこと（全て無料）

### Feature 10: X Auto-Posting（X自動投稿）
**User Story**: 運営者として、6時間ごとの定期投稿と感情異常検知時の即時投稿でWEMへの認知・興味を最大化したい
**Acceptance Criteria**:
- Given: GitHub Actionsが6時間ごとに実行される時（UTC 0,6,12,18時）
- When: BigQueryから最新データを取得し、前回との差分を計算する
- Then: 感情マップ画像を生成し、テンプレートに基づくテキスト+画像+ニュースURLをXに投稿する
- Given: 異常検知ワークフローが1時間ごとに実行される時
- When: 以下の異常条件のいずれかを検出した場合
- Then: 即時投稿（異常専用テンプレート）を行い、次の定期投稿時刻をリセットしない（定期投稿と独立して動作）
- Given: 投稿テンプレートを変更したい時
- When: config/x-post-template.yaml をGitHub Web UIで編集しpushする
- Then: 次回の投稿から新テンプレートが反映される
- Given: X API投稿が失敗した時
- When: 1回リトライする
- Then: リトライも失敗した場合はエラーログを記録し、次の定時実行を待つ（アラートは送らない）
- **Must NOT**: APIクレジット残高不足時に投稿を試行し続けないこと
- **Must NOT**: 同一異常イベントで重複投稿しないこと（cooldown: 異常検知後2時間は同一トリガーをスキップ）

#### 異常検知ロジック（WEM認知・興味最大化のための5トリガー）
WEMへの認知・興味を最大化する目的から、以下の「ニュースになりやすい・拡散しやすい」感情変化を異常として定義する：

| トリガーID | 条件 | 投稿例 |
|-----------|------|--------|
| T1: 急激なスパイク | G20国家のいずれかで、2時間以内に単一感情が +20pt 以上変化 | "🚨 BREAKING: Fear surged +28pts in Germany in the last 2 hours. Something's happening." |
| T2: 感情逆転 | G20国家の支配的感情が3時間以内に反転（例: Joy→Fear、Trust→Anger）| "⚡ FLIP: Japan shifted from #Joy to #Fear as dominant emotion in 3h. What changed?" |
| T3: 世界同期スパイク | 5カ国以上で同一感情が2時間以内に +15pt 以上上昇（バイラルイベント検知） | "🌍 SYNCHRONIZED: 7 countries show Fear spike simultaneously. Global event unfolding." |
| T4: セクター危機 | 世界全体でFear または Anger のセクタースコアが 75/100 を超過 | "📊 SECTOR ALERT: Global #Security Fear hits 78/100 — highest since tracking began." |
| T5: 歴史的極値 | 任意の国×感情ペアで観測史上最高/最低スコアを記録 | "📈 RECORD: Brazil's #Joy score hit 94/100 — all-time high in our dataset." |

**異常検知の実装方針**:
- Supabaseの `emotion_snapshots` テーブルと過去24時間データを比較してトリガー判定
- 異常投稿は定期投稿とは別の専用テンプレート `config/x-post-anomaly-template.yaml` を使用
- 同一トリガー+同一国の組み合わせは2時間のcooldownを設ける（`anomaly_posts_log` テーブルで管理）
- 複数トリガーが同時発火した場合は最もインパクトの大きい1件のみ投稿する

### Feature 11: i18n（多言語対応）
**User Story**: ユーザーとして、英語または日本語でサイトを利用したい
**Acceptance Criteria**:
- Given: サイトにアクセスした時
- When: ブラウザの言語設定が日本語の場合
- Then: 自動で日本語UIが表示される（デフォルトは英語）
- Given: ヘッダーの言語切替ボタンをクリックした時
- When: EN/JAを切り替える
- Then: UI全体のラベル・セクター名・感情名が切り替わる。地図データは変わらない
- **Must NOT**: ニュース記事タイトルを翻訳しないこと（原文のまま表示）

### Feature 12: PWA（Progressive Web App）
**User Story**: モバイルユーザーとして、ホーム画面にアプリとして追加したい
**Acceptance Criteria**:
- Given: スマートフォンでサイトにアクセスした時
- When: 「ホーム画面に追加」を実行する
- Then: アプリアイコンがホーム画面に追加され、フルスクリーンで起動できる
- Given: オフライン時にアプリを開いた時
- When: キャッシュされたデータがある場合
- Then: 最後に取得したデータでマップが表示される（「最終更新: X時間前」表示付き）
- **Must NOT**: オフラインで新しいデータの取得を試みないこと

### Feature 13: Email Signup（メール登録）
**User Story**: 興味を持ったユーザーとして、メールアドレスを登録してアップデートを受け取る準備をしたい
**Acceptance Criteria**:
- Given: フッターまたはAboutページにメール登録フォームがある時
- When: メールアドレスを入力して「Subscribe」をクリックする
- Then: Supabaseのemail_subscribersテーブルに保存され、「Thank you!」メッセージが表示される
- **Must NOT**: 登録時にメールを自動送信しないこと（リスト構築のみ。配信機能はPhase 2）

### Feature 14: OG Image（ソーシャルシェア画像）
**User Story**: ユーザーがURLをシェアした時、感情マップのプレビュー画像が表示されてほしい
**Acceptance Criteria**:
- Given: World Emotion MapのURLをXやSNSに貼り付けた時
- When: プレビューカードが表示される
- Then: 最新の感情マップ画像（X投稿用と同一）がOG画像として表示される
- **Must NOT**: OG画像の生成に追加のAPIコストが発生しないこと（X投稿画像を流用）

### Feature 15: AdSense + Analytics（広告・分析）
**User Story**: 運営者として、最小限の広告収益を得つつユーザー行動を計測したい
**Acceptance Criteria**:
- Given: サイトが表示された時
- When: AdSenseの広告枠がロードされる
- Then: 非侵入的な位置（サイドバー下部またはフッター上部）に広告が表示される
- Given: GA4 + Vercel Analyticsが設置されている時
- When: ユーザーがサイトを利用する
- Then: ページビュー、セッション、地域、使用言語、人気の国/セクターが計測される
- **Must NOT**: 広告がマップの操作を妨げないこと。ポップアップ広告を使わないこと

### Feature 16: Legal Pages（法的ページ）
**User Story**: ユーザーとして、プライバシーポリシーと利用規約を確認したい
**Acceptance Criteria**:
- Given: フッターに「Privacy Policy」「Terms of Service」リンクがある時
- When: クリックする
- Then: 該当ページが表示される。GDPR準拠のデータ取り扱い説明、データ削除要求方法が記載されている
- **Must NOT**: 法的ページを外部リンクにしないこと（自サイト内に設置）

---

## 3. Pages & UI

### ページ一覧
1. `/` — メインマップページ（全機能の90%がここ）
2. `/favorites` — お気に入りダッシュボード（要認証）
3. `/about` — About + データソース説明 + メール登録
4. `/legal/privacy` — プライバシーポリシー
5. `/legal/terms` — 利用規約

### メインページ (`/`) レイアウト
```
┌─────────────────────────────────────────────────┐
│ Header: Logo | [Region ⇄ Sector] | 🌐EN/JA | 👤│
├─────────────────────────────────────────┬────────┤
│                                         │ Detail │
│          Mapbox GL JS Map               │ Panel  │
│         (globe or flat)                 │ (slide │
│                                         │  in)   │
│                                         │        │
├─────────────────────────────────────────┤        │
│ Legend: [6/8 emotions] [Toggle Extended] │        │
│ Mini Dashboard: Top changes, alerts     │        │
├─────────────────────────────────────────┴────────┤
│ Footer: About | Privacy | Terms | Subscribe | Ad │
└─────────────────────────────────────────────────┘
```

### デザインシステム
- DESIGN.md方式（awesome-design-md準拠）
- 3案プレビュー後にユーザー選択:
  - A: Linear風（ダークUI、データ密度高）
  - B: Notion風（温かいミニマリズム）
  - C: Coinbase風（クリーン青基調）
- shadcn/ui をコンポーネントライブラリとして使用
- レスポンシブ: モバイル（地図全画面＋下部シート）、タブレット、デスクトップ

---

## 4. Data Model

### Supabase PostgreSQL Schema

**emotion_snapshots** — 1時間ごとの感情集計データ
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| timestamp | timestamptz | 集計時刻 |
| country_code | text (nullable) | ISO 3166-1 alpha-2。NULLなら世界全体 |
| region_code | text (nullable) | 主要国の地域コード。NULLなら国全体 |
| sector_slug | text (nullable) | セクター小分類slug。NULLなら全セクター |
| continent | text | 大陸名（denormalized） |
| joy | float | 0-100 |
| trust | float | 0-100 |
| fear | float | 0-100 |
| anger | float | 0-100 |
| sadness | float | 0-100 |
| surprise | float | 0-100 |
| uncertainty | float | 0-100 |
| optimism | float | 0-100 |
| article_count | int | 集計対象記事数 |
| sample_urls | jsonb | [{title, url}] 上位3-5件 |

**sectors** — セクター定義（マスタ）
| Column | Type | Description |
|--------|------|-------------|
| slug | text (PK) | 例: "economy", "markets" |
| name_en | text | English name |
| name_ja | text | Japanese name |
| parent_slug | text (nullable) | 大分類のslug（小分類の場合） |
| gdelt_themes | text[] | 対応するGDELTテーマ名配列 |

**profiles** — ユーザープロフィール（Supabase Auth連携）
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK, FK→auth.users) | |
| email | text | |
| display_name | text | |
| locale | text | "en" or "ja" |
| created_at | timestamptz | |

**favorites** — お気に入り
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| user_id | uuid (FK→profiles) | |
| type | text | "country" / "sector" / "combo" |
| country_code | text (nullable) | |
| sector_slug | text (nullable) | |
| created_at | timestamptz | |
| UNIQUE(user_id, type, country_code, sector_slug) |

**email_subscribers** — メール登録
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| email | text (UNIQUE) | |
| source | text | "footer" / "about" / "login" |
| subscribed_at | timestamptz | |

### GCAM感情マッピング（実装時にBrave Searchで最新ID確認が必須）
| 感情 | GCAM候補ディメンション |
|------|----------------------|
| Joy | WordNet Affect "Joy", LIWC "Posemo" |
| Trust | General Inquirer "Trust" |
| Fear | LIWC "Anx", WordNet Affect "Fear" |
| Anger | LIWC "Anger", WordNet Affect "Anger" |
| Sadness | LIWC "Sad", WordNet Affect "Sadness" |
| Surprise | WordNet Affect "Surprise" |
| Uncertainty | Loughran-McDonald "Uncertainty" |
| Optimism | Lexicoder "Positivity" + low anxiety composite |

---

## 5. Task Breakdown

### Task 0: DESIGN.md作成 + デザインプレビュー3案
awesome-design-mdリポジトリからLinear/Notion/Coinbaseの DESIGN.md を取得し、World Emotion Map用にカスタマイズした3案を作成する。ユーザーに提示して選択を得る。
成果物: DESIGN.md（選択された1案）
検証: ユーザーが3案のプレビューを見て1つを選択した

### Task 1: プロジェクトスキャフォールド + Supabase初期化
create-next-app + shadcn/ui + Supabase CLIでプロジェクト作成。DBスキーマ（5テーブル）をマイグレーションで適用。Google OAuth設定。
成果物: 起動可能なNext.jsアプリ + Supabaseスキーマ
検証: `pnpm dev`でローカルサーバー起動。Supabaseダッシュボードでテーブル確認

### Task 2: セクターマスタデータ投入
sectorsテーブルに8大分類+22小分類のマスタデータをseedスクリプトで投入する。各セクターにGDELTテーマ名を対応付ける。
成果物: seed.tsスクリプト + 投入済みデータ
検証: Supabaseダッシュボードで30件のセクターレコードを確認

### Task 3: BigQuery GDELT GKGクエリスクリプト
事前調査: Brave SearchでGDELT BigQuery最新テーブル名・GCAM列ID・クエリ例を確認する。差分クエリ（前回取得以降の新着データ）でGKG 2.0からV2Tone + GCAM感情スコア + V1Locations + V1Themes + DocumentIdentifierを抽出するスクリプトを作成する。
成果物: scripts/fetch-gdelt.ts
検証: ローカル実行で直近1時間のGDELTデータがJSON出力される

### Task 4: 感情マッピング＆集計ロジック
GCAMの2,300+次元から8感情へのマッピングロジックを実装する。国別・セクター別・地域別に集計し、0-100スコアに正規化する。主要国判定ロジック（データ量閾値ベース）も含む。
成果物: scripts/aggregate-emotions.ts
検証: Task 3の出力を入力として、国別×セクター別の感情スコアJSON出力

### Task 5: データパイプライン（GitHub Actions）
BigQuery取得→感情集計→Supabase書き込みの一連のパイプラインをGitHub Actionsワークフローとして構築する。1時間ごとのcron実行。BigQuery無料枠（1TB/月）に収まることを確認する。異常検知ロジックも同ワークフローで1時間ごとに実行し、閾値超過時はポスト用フラグをSupabaseに書き込む。
成果物: .github/workflows/data-pipeline.yml + .github/workflows/anomaly-detect.yml
検証: GitHub Actionsで手動トリガー実行。Supabaseにemotion_snapshotsデータ投入確認

### Task 6: i18n基盤セットアップ
next-intlを導入し、EN/JAの言語切替基盤を構築する。メッセージファイル（感情名、セクター名、UIラベル全て）を作成する。デフォルトは英語。
成果物: src/i18n/ ディレクトリ + messages/en.json + messages/ja.json
検証: ブラウザで `/` にアクセスし、言語切替ボタンでEN/JAが切り替わる

### Task 7: ベースレイアウト + ヘッダー + フッター
DESIGN.md（Task 0で選択済み）に基づくベースレイアウト、ヘッダー（Logo、Region/Sectorトグル、言語切替、認証ボタン）、フッター（About、Legal、Subscribe、Ad枠）を実装する。レスポンシブ対応。
成果物: src/app/layout.tsx + Header + Footer コンポーネント
検証: ブラウザでPC/モバイル表示を確認。ヘッダー・フッターが適切に表示される

### Task 8: Mapbox GL JS マップコンポーネント
Mapbox GL JSをdynamic importで読み込み、世界地図（グローブ表示）を描画する。国ポリゴンにSupabaseから取得した感情データで色を塗る。ズーム・パン・回転操作。色覚多様性対応パレット。
成果物: src/components/map/WorldMap.tsx
検証: ブラウザで地図が表示され、国が感情に応じた色で塗り分けられている

### Task 9: 地域階層ナビゲーション
大陸クリック→ズーム→国表示、国クリック→詳細パネルまたは地域ドリルダウンの階層ナビゲーションを実装する。パンくずリスト表示。
成果物: src/components/map/RegionNav.tsx
検証: 大陸→国のドリルダウンがスムーズに動作する

### Task 10: 感情レイヤー切替（6⇄8）
凡例エリアにトグルを配置し、6感情（デフォルト）と8感情（Extended）をフロントエンドのみで切り替えるUIを実装する。
成果物: src/components/map/EmotionToggle.tsx
検証: トグル切替で地図の色分けと凡例がリアルタイムに更新される

### Task 11: 国詳細パネル
国クリック時に右からスライドインするパネル。感情レーダーチャート、24時間推移チャート（recharts使用）、セクター別内訳、ニュースリンク3-5件を表示。
成果物: src/components/panel/CountryDetail.tsx
検証: 任意の国をクリックし、パネルに感情データとニュースリンクが表示される

### Task 12: セクタービュー + セクター詳細パネル
Region⇄Sectorトグルでセクタービューに切替。8大分類→22小分類の2階層カード表示。セクター選択時に詳細パネル（世界スコア、国別ランキング、ニュース）。国レベルのセクターデータも表示可能。
成果物: src/components/sector/SectorView.tsx + SectorDetail.tsx
検証: セクタービューで大分類→小分類のドリルダウン、国別フィルターが動作する

### Task 13: Google認証
Supabase AuthでGoogleログイン。ヘッダーにSign in/アバター表示。ログイン状態管理。
成果物: src/components/auth/ ディレクトリ
検証: Googleアカウントでログイン→アバター表示→サインアウトのフロー

### Task 14: お気に入り機能
国・セクター・組合せの☆ボタン。Supabase favorites テーブルへのCRUD。/favoritesページにカード一覧表示。未ログイン時のログイン促進モーダル。
成果物: src/app/favorites/page.tsx + FavoriteButton.tsx
検証: ログイン→国を☆→/favoritesに表示→☆解除で消える

### Task 15: X投稿画像生成
サーバーサイドで感情マップの画像を生成する。@vercel/og または satori + sharp で静的画像を生成。画像にブランドロゴ・タイムスタンプ・トップ変化情報を含む。
成果物: scripts/generate-map-image.ts
検証: スクリプト実行で1200x630pxのマップ画像が生成される

### Task 16: X自動投稿 + YAMLテンプレート
GitHub Actionsワークフローに2種類のX投稿ステップを追加：
- **定期投稿**: 6時間ごと（UTC 0,6,12,18時）。config/x-post-template.yaml でテンプレート管理
- **異常検知投稿**: 1時間ごとに異常検知スクリプトを実行し、5つのトリガー（T1〜T5）のいずれかが発火した場合のみ即時投稿。config/x-post-anomaly-template.yaml でテンプレート管理。cooldown管理は anomaly_posts_log テーブルで実施。

投稿テンプレート変数: {{top_emotion}}, {{top_country}}, {{change_summary}}, {{news_url}}, {{trigger_id}}, {{delta}}, {{score}}
成果物: scripts/post-to-x.ts + scripts/detect-anomaly.ts + config/x-post-template.yaml + config/x-post-anomaly-template.yaml + ワークフロー更新
検証: GitHub Actionsの手動トリガーでXにテスト投稿される（定期・異常検知それぞれ）

### Task 17: OG画像設定
X投稿用に毎時生成されるマップ画像をpublicディレクトリに保存し、meta og:imageタグで参照する。Supabase Storageまたはpublic/ogに最新画像を配置。
成果物: src/app/layout.tsx の OGP メタタグ更新
検証: SNSデバッガー（Twitter Card Validator等）でプレビュー画像が表示される

### Task 18: AdSense + GA4 + Vercel Analytics
Google AdSenseの広告コードをフッター上部に設置。GA4トラッキングコードをlayout.tsxに追加。Vercel Analytics（@vercel/analytics）を導入。
成果物: 各トラッキングコード設置
検証: GA4リアルタイムレポートでアクセスが計測される

### Task 19: メール登録 + 法的ページ
フッターとAboutページにメール登録フォーム。Supabase email_subscribersに保存。Privacy Policy・Terms of Serviceページ作成（GDPR準拠テンプレートベース）。データ削除要求手順を記載。
成果物: EmailSignup.tsx + /legal/privacy + /legal/terms
検証: メール登録→Supabaseで確認。法的ページのリンクが動作する

### Task 20: PWA対応
next-pwaでService Worker設定。manifest.json、アイコン各サイズ。オフライン時のフォールバック表示（キャッシュデータ＋最終更新時刻）。
成果物: PWA設定ファイル群
検証: Chrome DevTools → Application → Service Workers で登録確認。ホーム画面追加でアプリ起動

### Task 21: レスポンシブ最終調整
モバイル（地図全画面＋底部シートで詳細）、タブレット、デスクトップの3ブレークポイントで全ページ・全パネルのレイアウトを最終調整する。
成果物: レスポンシブCSS調整
検証: Chrome DevToolsのデバイスモードでiPhone/iPad/デスクトップ表示を確認

### Task 22: Vercelデプロイ確認
Vercelにデプロイし、独自ドメイン設定、環境変数設定、ビルド成功、全機能の本番動作を確認する。
成果物: 本番URL（独自ドメイン）
検証: 独自ドメインでサイトにアクセスし、地図表示・認証・お気に入り・セクター切替が全て動作する

---

## 6. Out of Scope（Phase 1では実装しない）

- お気に入り課金（Phase 2で有料プラン化）
- ニュースレター配信（メール登録リスト構築のみ）
- 感情アラート通知（Push/メール）← X自動投稿での異常検知はPhase 1に含む
- SNSデータ統合（X公開ポストのセンチメント取得）
- 感情変化率ランキング
- APIアクセス提供（開発者向け）
- カスタムダッシュボード
- 3言語以上の対応
- ネイティブモバイルアプリ
- B2Bデータフィード
- 感情ストーリー（24時間の感情フロー可視化）
- X以外のSNS投稿（Bluesky、Threads等）

**バックログ**:
- [BACKLOG] SNSセンチメントデータ統合（X API読み取りでサンプリング）
- [DONE→Phase 1] 感情異常検知＋自動追加投稿（Feature 10に組み込み済み）
- [BACKLOG] APIアクセス（RESTful、月額$29-99）
- [BACKLOG] Pro Plan（カスタムダッシュボード、月$5-10）
- [BACKLOG] Open Core化（コアOSS + SaaS版）

---

## 7. Assumptions

- [ASSUMPTION] BigQuery無料枠（1TB/月クエリ処理）内でGDELT GKGの差分クエリが収まる [影響度: HIGH]
  → 事前にクエリサイズを計測し、超過の場合は実行頻度を2-3時間に調整
- [ASSUMPTION] GDELTのGCAMディメンションから8感情への正確なマッピングが可能 [影響度: HIGH]
  → 実装時にBrave Searchで最新のGCAMコードブックとディメンションIDを確認する
- [ASSUMPTION] Mapbox GL JS無料枠（50,000マップロード/月）が初期トラフィックで十分 [影響度: MEDIUM]
  → 超過時はLeaflet + OpenStreetMapへのフォールバック実装を準備
- [ASSUMPTION] Supabase無料枠（500MB DB、50K MAU）が初期段階で十分 [影響度: MEDIUM]
  → 1時間×200国×30セクター≒6K行/時。月間データは約4.3M行。ストレージ見積もり要
- [ASSUMPTION] X API pay-per-useのコストが月$3-8で収まる（定期投稿: 4回/日×30日=120投稿 + 異常検知投稿: 推定0-5回/日×30日=0-150投稿、合計最大270投稿/月）[影響度: LOW]
- [ASSUMPTION] GDELTデータから「主要国」を自動判定する閾値が適切に設定できる [影響度: MEDIUM]
  → 記事数ベースで閾値を設定し、最初はG20+αを手動リストで補完
- [ASSUMPTION] GitHub Actions パブリックリポジトリでの1時間cron実行（異常検知）および6時間cron実行（定期投稿）が制限に抵触しない [影響度: LOW]
- [ASSUMPTION] 独自ドメイン worldemotionmap.com（または類似）が取得可能 [影響度: LOW]

### 制約（外部サービス無料枠）
| サービス | 無料枠 | 想定使用量 |
|----------|--------|-----------|
| BigQuery | 1TB/月クエリ + 10GB保存 | 差分クエリで推定50-200GB/月 |
| Mapbox GL JS | 50,000ロード/月 | 初期は1,000-5,000/月 |
| Supabase | 500MB DB + 50K MAU | 要計測（4.3M行/月） |
| Vercel | 100GB帯域/月 | 初期は十分 |
| X API | pay-per-use | ~$7-10/月 |
| GitHub Actions | 2,000分/月（パブリック無制限）| ~720回/月×2分=1,440分 |
| Google AdSense | 無料 | — |
| GA4 | 無料 | — |
