# dragon

**Chainome Diagram Language (cdl)** の text DSL + playground。 YAML-like syntax で
cdl engine を wrap し、 diagram catalog / editor / theme picker を提供する。

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
