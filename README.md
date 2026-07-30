# dragon

> Mermaid 感覚で書く **animated SVG diagram の Text DSL**。
> 人 / LLM が YAML / JSON で書き、 内部で cdl engine が SVG 描画。

[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![types](https://img.shields.io/badge/types-TypeScript-blue.svg)](https://www.typescriptlang.org/)

**cdl (`@cardenelabs/cdl`) engine** の **人 / LLM 向け記法層**。 YAML DSL (人向け) と JSON DSL (LLM 向け) を parser し、 裏で cdl engine が SVG 描画を担う。 加えて記法 catalog SPA を提供して「どう書けば何が描けるか」 の見本を並べる。

## 60 秒で動かす

```bash
pnpm add @cardenelabs/dragon @cardenelabs/cdl react react-dom
```

```tsx
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView } from "@cardenelabs/cdl";

const dsl = `
タイトル: User Login
種類: シーケンス
登場人物: User, API, DB
流れ:
  - User → API: POST /login
  - API → DB: SELECT credentials
  - DB → API: rows (成功)
  - API → User: 200 OK (成功)
`;

const diagram = textDslToDiagram(dsl);

export default function Demo() {
  return <CdlDiagramView diagram={diagram} />;
}
```

これで browser に animated sequence diagram が表示される。 phase 切替 / edge glow / 進行点 wave まで自動。

## LLM から使う (JSON DSL)

```tsx
import { jsonToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView } from "@cardenelabs/cdl";

// LLM (Claude / GPT 等) が structured output で吐き出す JSON
const json = {
  id: "auth",
  topic: "User Login",
  kind: "sequence",
  actors: ["User", "API", "DB"],
  steps: [
    { from: "User", to: "API", label: "POST /login" },
    { from: "API", to: "DB", label: "SELECT credentials" },
    { from: "DB", to: "API", label: "rows", tone: "success" },
    { from: "API", to: "User", label: "200 OK", tone: "success" },
  ],
};

const diagram = jsonToDiagram(json);
return <CdlDiagramView diagram={diagram} />;
```

## catalog SPA (実例集)

playground SPA (本 repo `apps/playground-spa/`) で 380+ の実例を閲覧。 9 カテゴリ (プリセット / レシピ集 / パターン / 基本要素 / テキスト DSL / アニメーション / パーツ / スタイル / インタラクティブ) で「いつ何のために使うか」 を探索できる。 local 起動 = `pnpm run dev` (http://localhost:4323)。

## 思想 (dragon の存在理由)

dragon の value proposition = **「見てて楽しくて理解しやすい」 図を作れる DSL**。 mermaid が持たない **rich layered animation** で「見てて楽しい」 を、 情報伝達目的の設計原則で「理解しやすい」 を両立する。

### 中心規範

1. **見てて楽しい (fun to watch)** = viewer が「もう 1 回見たい」「面白い」 と感じる rich layered animation
2. **理解しやすい (easy to understand)** = 見た瞬間に何が起きているか読める情報伝達目的の設計
3. **両立が dragon の強み** = mermaid は静的で理解しやすいが楽しくない、 D3 は楽しいが書くのが難しい、 dragon は「書きやすさ + 楽しさ + 理解しやすさ」 の 3 拍子

### rich layered animation とは

単一 animation (edge の色付けだけ / phase.tween だけ) は poor。 dragon 記法の真価は **複数 visual layer を同時発火** することにある:

- layer 1 = arrow が順番に色付き (edge activate 連鎖)
- layer 2 = rectangle border が光る (glow / pulse)
- layer 3 = rectangle 内部で wave 高さが数値を示す (dyn-wave 内包)
- layer 4 = readout 数値が変化 (countup / gauge / stat)
- layer 5 = badge state 遷移

この layer 組合せで rectangle 1 個の情報密度が数倍になり、 「rectangle だらけ」 の静的な図が「見てて楽しい」 rich な図に変わる。

### 設計原則 5 (P0-P4)

- **P0 = 見てて楽しい + 理解しやすい を両立** = dragon の value proposition、 どちらか片方だけの図は作らない
- **P1 = 情報伝達が目的** = 図を作る前に「何を伝えるか」 を 1 文で書く、 topic 必須明記
- **P2 = 逆算設計 (parts の使用機会が先)** = 「bar が必要な状況」 「gauge が必要な状況」 「dyn-wave が必要な状況」 を先に enumerate、 それに対応する図を作る。 primitive audit から始めない
- **P3 = animation は積極活用、 layer 組合せで rich に** = 「animation を消しても情報伝わる」 = YES でも animation は残す、 但し layer 組合せで rich にする、 単純 4 phase tween template は禁止
- **P4 = 長方形一律の呪縛から脱出** = rectangle + line は表現手段の 1 つ、 情報要求に応じて containment / heat / spatial / matrix / 比喩 / dyn-wave / dyn-arc / dyn-polygon 等を frank に組み合わせる、 shape 40+ の primitive を使いこなす

### mermaid との差別化 (dragon の勝負所)

| 観点 | mermaid | dragon |
|---|---|---|
| 書きやすさ | ○ (テキスト DSL) | ○ (YAML / JSON DSL) |
| 静的な理解しやすさ | ○ | ○ |
| **rich layered animation** | ✕ (static のみ) | **◎ (複数 layer 同時発火)** |
| **見てて楽しい** | ✕ | **◎ (arrow + glow + wave + readout + badge)** |
| shape 表現力 | △ (基本形状のみ) | ◎ (49 kind + dyn-* / matrix / heatmap) |
| 情報密度 / 単位面積 | 低 (rectangle + line) | 高 (layered animation で数倍) |

dragon が mermaid に勝つのは「rich layered animation で情報密度と楽しさを両立」 する 1 点、 ここに全リソースを集中する。

### 廃止した過去 SSOT

- **v2 pattern SSOT (「6 shape + 4 phase + 4 readout tween」 template)** = 2026-07-14 に廃止 (76 例全 revert)。 template 均一化で「見てて楽しくない」 rectangle 並列を量産していた。 layer 組合せで rich にする方針に置換
- **「animation 必要性テスト = 消しても伝われば削除」 方針** = 廃止。 animation は積極活用、 layer 組合せで rich にする方針が正解

detail は本 repo `docs/diagram-skills/dragon-diagram-forge/` の各 reference (clarity-gate.md / high-quality-diagram-process.md / review-rubrics.md 等) を参照。


## 責任分担 (cdl vs dragon)

人 / LLM が図を書く時は **dragon 記法を書く** のが標準、 cdl は engine として dragon の裏で動く。 dragon が担うのは「書きやすさ」、 cdl が担うのは「描画」。

| 層 | dragon (本 repo) | cdl ([リポジトリ](https://github.com/cardene777/cdl)) |
|---|---|---|
| **役割** | 記法層 = 人 / LLM 向け DSL parser + catalog SPA | engine = shape 描画 + builder API + layout + render |
| **提供物** | YAML DSL (人向け) / JSON DSL (LLM 向け) / catalog 380+ 実例 | 49 shape kind / TypeScript builder / layout engine / animation runtime |
| **書く主体** | 人 / LLM が書く | dragon が裏で呼ぶ (人 / LLM は直接触らない前提) |
| **npm package** | `@cardenelabs/dragon` | `@cardenelabs/cdl` / `@cardenelabs/anim` |

**流れ**。

```
[人が書く YAML]  ─┐
                  ├─→ dragon parser ─→ cdl builder ─→ SVG (React component)
[LLM が書く JSON] ─┘
```

**dragon の SSOT 責任**。
- **人向け YAML DSL parser** ... `packages/dragon/src/parser.ts` (現行 v0.4 / v0.5)
- **LLM 向け JSON DSL** ... `jsonToDiagram` / `validateDragonJson` / `diagramJsonSchema` (JSON Schema Draft 7) を提供、 Claude / GPT の structured output で確実に diagram を生成できる
- **compile 層** ... YAML / JSON AST → cdl builder call 変換 (`compile.ts`)
- **catalog SPA** ... 380+ 実例で「どう書けば何が描けるか」 見本 (`apps/playground-spa/`)
- **notation lint** ... 記法 error / 冗長 / 未定義参照 診断 (`notation-lint.ts`)

**cdl 側の SSOT 責任 (dragon は触らない)**。
- shape 49 kind の SVG 描画 component (`packages/cdl/src/kinds/shape-*.tsx`)
- DSL builder API (`.diagram(...).lane().node().edge().phase()`)
- layout engine (lane / stack 座標計算 + routing)
- animation runtime (phase / tween / set / activate / badge)

記法変更は本 repo の PR、 shape / engine 変更は cdl 側の PR。

## 記法 example (人向け YAML)

```yaml
title: "ログインAPI"
type: sequence
actors:
  - ユーザー
  - API
  - データベース
flow:
  - ユーザー -> API: "ログイン要求"
  - API -> データベース: "ユーザー検索"
  - データベース -> API: "結果"
  - API -> ユーザー: "認証成功" (success)
animation:
  - step: "call" 1.4s
    focus: [ユーザー, API, "ユーザー -> API"]
  - step: "query" 1.4s
    focus: [API, データベース, "API -> データベース"]
```

catalog SPA で 380+ 実例を確認可能、 コピペして応用する使い方が標準。

### 登場人物の書き方

値は空白で並べる。 `{ }` は要らない。

```yaml
actors:
  - Client
  - API: service
  - Web: service "APIサーバー"
  - 決済: service "決済基盤" 失敗
  - 表: storage ["id: PK", "name: 文字列"]
```

値は形で見分ける。 引用符付きは補足、 角括弧は行、 色名は色、 残りが種類。
形が違うので並べる順番は自由で、 `- 決済: 失敗 "決済基盤" service` と書いても同じ。

項目が多い時は縦に並べられる。 何を指定できるかが読み取りやすい。

```yaml
actors:
  - Web:
      kind: service
      補足: "APIサーバー"
      色: 失敗
```

項目名は日本語でも英語でもよい (`種類` / `kind`、 `補足` / `subtitle`、 `行` / `rows`)。
色は `色:` 1 つにまとめてあり、 意味の色 (`失敗`) と色番号 (`"#f59e0b"`) の両方を受け付ける。

### 位置と大きさ

書かなければ自動で決まる。 決めたい時だけ書く。

```yaml
actors:
  - Web: service @300,200
  - DB:
      kind: database
      位置: 300,400
      大きさ: 400,180
```

位置は左からの距離と上からの距離、 大きさは幅と高さ。
どちらも 2 つ揃って初めて効くので、 1 つの項目にまとめてある。

座標が分からない時は、 他の箱を基準にして置ける。

```yaml
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の右
  - DB:
      kind: database
      位置: Web の下 200
```

向きは `右` / `左` / `上` / `下` の 4 つ。 英語 (`right` / `left` / `above` / `below`) でも書ける。
数を書くとその分だけ離し、 書かなければ隣に置く。 離す距離は箱の縁から測る。

基準にした箱がまた別の箱を基準にしていてもよい。 書く順番は問わない。
パーツも同じように置ける (パーツを基準にする / パーツを他の箱の隣に置く、 どちらも書ける)。

図種によって効かない向きがある (順序図の縦位置は、 縦列が横に並ぶものなので動かせない)。
効かなかった時は自動配置に戻り、 editor の画面にその旨が出る。

`focus:` に書いた相手が居ない場合も同じく画面に出る。 名前に `-` を含む箱 (`api-gateway`) も
そのまま書ける (以前は矢印と読まれて光らなかった)。

editor の「位置を表示」 を押すと、 各要素が今どこに居るかが図に重なって出る。
その数字を押すと `位置: 300,200` として本文に入るので、 そこから数を足し引きして調整できる。
座標を知らないまま書き始めて、 細かく詰める時だけ数字に落とす使い方になる。

色は矢印と同じ名前と別名 (`成功` / `失敗` / `警告` / `情報` / `中立`) を受け付ける。
全図種で効く。 未知の名前を書いた場合は既定色のままになる。

parts (`kind` に parts の名前を書いたもの) では `tone` は状態の上書きとして扱われ、 色にはならない。

### 流れの書き方

矢印も同じく空白で並べる。

```yaml
flow:
  - Client -> API: "ログイン要求"
  - API -> DB: "検索" 成功
  - DB -> API: "結果" 成功 dotted-flow
```

説明文は引用符で囲むので、 中に色名が入っていても色として取られない。

従来の `{ }` と `( )` の書き方も引き続き動く。

## 関連 repo (相互リンク SSOT)

- **[cdl](https://github.com/cardene777/cdl)** ... engine SSOT + layout / routing / rendering
  - engine SPEC ... `packages/cdl/SPEC.md` (routing v10 / v10.1 / px-projection / clearance SSOT)
  - 本 repo が `@cardenelabs/cdl` として consume する engine
- **dragon** (本 repo)
  - `packages/dragon/` = text DSL parser (`textDslToDiagram`)
  - `apps/playground-spa/` = Vite + React SPA playground (9 category catalog + editor + preset detail + docs)

## 構成

```
dragon/
├── packages/
│   └── dragon/                ... text DSL parser (cdl engine wrap)
│       └── src/               ... YAML-like → CdlDiagram compile
├── apps/
│   └── playground-spa/        ... Vite + React 19 + Tailwind 4 SPA
│       ├── src/
│       │   ├── pages/         ... HomePage / CategoryPage / EditorPage / PresetDetailPage / DocsPage
│       │   ├── topics/catalog ... 9 category × 380+ diagram (presets / cookbook / patterns / primitives / text-dsl / animation / parts / styles / interactive)
│       │   ├── lib/           ... CATEGORIES + CATALOG_ITEMS SSOT
│       │   └── components/    ... CdlEditor / InViewMount / SiteHeader / SvgDefs / Toast
│       └── tests/             ... Playwright E2E (home / catalog / editor)
├── eslint.config.mjs
└── tsconfig.json              ... solution-style (packages/dragon + apps/playground-spa)
```

## 開発

型の出力先が 2 つある。 束ねた 1 file (`dist/index.d.ts`、 `tsup` が出す) が package の公開型で、
型検査 (`tsc -b`) の出力は `dist-types/` に分ける。 同じ場所に出すと交互に上書きし、
`package.json` の `types` が指す中身が「最後に走った側」 で決まる。

```sh
pnpm install

# playground SPA 起動 (localhost:4323)
pnpm dev

# build
pnpm build

# 検証
pnpm verify   # typecheck + vitest
```

## 検知システム / 修正システム

**役割分離** = 開発陣向け「検知」 と author 向け「修正」 は完全に別、 両方 LLM 不使用の pure rule / geometry ベース。

- **検知システム (開発陣向け)** = 3 層 check 機構
  - 層 1 = SPA route regression = `pnpm check:cdl`
  - 層 2 = engine geometry sweep = `pnpm check:dragon`
  - 層 3 = kind 描画品質 (gantt arrow / funnel polygon / mind-map root / edge fill:none 等) = `pnpm check:kind`
  - 一括 = `pnpm check:all`
- **修正システム (author 向け)** = notation lint
  - `pnpm lint:notation` = 冗長 topic / 未定義参照 / 空 payload / 単調減少違反等を rule-based に指摘
  - `pnpm fix:notation` = auto-fix 可能な rule を自動適用
  - プログラム API = `import { lintDiagram, autoFix } from "@cardenelabs/dragon"`

**SSOT ドキュメント** = `apps/playground-spa/audit-reports/README.md`

## license

MIT
