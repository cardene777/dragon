# dragon

**Chainome Diagram Language (cdl)** の text DSL + playground + docs site。 YAML-like syntax で
cdl engine を wrap し、 dev 中の diagram / visual regression / editor UI を提供する。

## 関連 repo (相互リンク SSOT)

- **[cdl](https://github.com/cardene777/cdl)** ... engine SSOT + layout / routing / rendering
  - engine SPEC ... `packages/cdl/SPEC.md` (routing v10 / v10.1 / px-projection / clearance SSOT)
  - 本 repo が `@cardenelabs/cdl` として consume する engine
- **dragon** (本 repo)
  - `packages/dragon/` = text DSL parser (`textDslToDiagram`)
  - `apps/playground/` = Astro docs site + editor + visual regression

## 構成

```
dragon/
├── packages/
│   └── dragon/          ... text DSL parser (cdl engine wrap)
│       └── src/         ... YAML-like → CdlDiagram compile
├── apps/
│   └── playground/      ... Astro site (docs + editor + visual regression)
│       ├── src/         ... pages + components
│       └── tests/       ... visual regression (Playwright)
│           └── visual/  ... G1-G4 gate (pixel-perfect via cdl px-projection)
├── eslint.config.mjs    ... type-checked + react-hooks + import/no-cycle
├── tsconfig.eslint.json ... lint 用 solution-style tsconfig
└── tsconfig.test.json   ... dragon test 用 tsconfig (composite: false)
```

## visual regression stack

- **overlap-detector.spec.ts** ... AABB overlap 検出 (label × node / label × label)
- **visual-diagnostics.spec.ts** ... G1-G4 gate (arrow angle / label-path / label-node / label-label)
  - engine SSOT (world unit) を import + viewBox scale で DOM px 動的計算 = pixel-perfect
  - engine SSOT ... `@cardenelabs/cdl` から `CLEARANCE_*` / `DIST_LABEL_PATH_MAX` 等を import
  - px 変換 ... `@cardenelabs/cdl` の px-projection (`computeViewportScale` / `projectNode` 等)
- **snapshot regression** ... presets / patterns / cookbook / extended / animation の SVG diff

## 開発

```sh
# root で
pnpm install

# playground 起動
pnpm dev

# 全 test
pnpm verify   # typecheck + vitest + overlap-detector
pnpm test     # vitest only
pnpm test:overlap  # overlap-detector only
pnpm --filter dragon-playground exec playwright test tests/visual/  # full visual regression
```

## contributing

commit / branch / PR 規約は `docs/` 配下 (未整備、 dev-flow は cdl repo の README 参照)。

## license

MIT
