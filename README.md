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

## license

MIT
