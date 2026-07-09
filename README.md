# dragon

**Chainome Diagram Language (cdl)** の **人 / LLM 向け記法層**。 YAML DSL (人向け) と JSON DSL (LLM 向け、 [Issue #208](https://github.com/cardene777/dragon/issues/208) で対応中) を parser し、 裏で cdl engine を呼ぶ。 加えて記法 catalog SPA を提供して「どう書けば何が描けるか」 の見本を並べる。

## 責任分担 (cdl vs dragon)

人 / LLM が図を書く時は **dragon 記法を書く** のが標準、 cdl は engine として dragon の裏で動く。 dragon が担うのは「書きやすさ」、 cdl が担うのは「描画」。

| 層 | dragon (本 repo) | cdl ([リポジトリ](https://github.com/cardene777/cdl)) |
|---|---|---|
| **役割** | 記法層 = 人 / LLM 向け DSL parser + catalog SPA | engine = shape 描画 + builder API + layout + render |
| **提供物** | YAML DSL (人向け) / JSON DSL (LLM 向け、 [#208](https://github.com/cardene777/dragon/issues/208)) / catalog 30+ 実例 | 49 shape kind / TypeScript builder / layout engine / animation runtime |
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
- **LLM 向け JSON DSL** ... [Issue #208](https://github.com/cardene777/dragon/issues/208) で対応中 (schema + structured output 経路)
- **compile 層** ... YAML / JSON AST → cdl builder call 変換 (`compile.ts`)
- **catalog SPA** ... 30+ 実例で「どう書けば何が描けるか」 見本 (`apps/playground-spa/`)
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

catalog SPA で 30+ 実例を確認可能、 コピペして応用する使い方が標準。

## 関連 repo (相互リンク SSOT)

- **[cdl](https://github.com/cardene777/cdl)** ... engine SSOT + layout / routing / rendering
  - engine SPEC ... `packages/cdl/SPEC.md` (routing v10 / v10.1 / px-projection / clearance SSOT)
  - 本 repo が `@cardenelabs/cdl` として consume する engine
- **dragon** (本 repo)
  - `packages/dragon/` = text DSL parser (`textDslToDiagram`)
  - `apps/playground-spa/` = Vite + React SPA playground (7 category catalog + editor + compare + docs)

## 構成

```
dragon/
├── packages/
│   └── dragon/                ... text DSL parser (cdl engine wrap)
│       └── src/               ... YAML-like → CdlDiagram compile
├── apps/
│   └── playground-spa/        ... Vite + React 19 + Tailwind 4 SPA
│       ├── src/
│       │   ├── pages/         ... HomePage / CategoryPage / EditorPage / ComparePage / DocsPage
│       │   ├── topics/catalog ... 7 category × 100+ diagram (primitives / presets / patterns / cookbook / text-dsl / animation / styles)
│       │   ├── lib/           ... CATEGORIES + CATALOG_ITEMS SSOT
│       │   └── components/    ... InViewMount / ThemePicker / SvgDefs / Toast
│       └── tests/             ... Playwright E2E (home / catalog / editor)
├── eslint.config.mjs
└── tsconfig.json              ... solution-style (packages/dragon + apps/playground-spa)
```

## 開発

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
