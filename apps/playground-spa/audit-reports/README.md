# Dragon 2 層 Check 機構 SSOT

**設置日** = 2026-07-07 / **契機** = user 指摘「チェック機構が弱い、 CDL チェックと dragon 記法チェックのダブルで盛り込め」

---

## 2 層 check 機構

| 層 | 対象 | 実装 | 実行 |
|---|---|---|---|
| 層 1 = CDL check (SPA UI level) | 全 route × 3 viewport の render / navigation / a11y / console error | `apps/playground-spa/tests/audit-3vp.spec.ts` + `full-regression.spec.ts` | `pnpm check:cdl` |
| 層 2 = dragon 記法 check (SVG geometry level) | 全 100+ diagram の geometry axis (edge-node-cross / row-gap-uniform / lane-border-clearance / clearance / edge-label-overlap 他 12 axis) | `packages/dragon/test/visual-validate-sweep.test.ts` | `pnpm check:dragon` |

### 統合 command

`pnpm check:all` = typecheck + 層 1 + 層 2 を一括実行。

---

## 現状 defect summary (2026-07-07 スナップショット)

**層 1 (CDL check) = 全 pass**
- 16 route Playwright regression = 16/16 pass
- console error 0 / navigation 0 / expectSelector 表示 0

**層 2 (dragon 記法 check) = 100+ 件の err 実在**

| category | err total | 主要 axis |
|---|---:|---|
| cookbook | 42 | row-gap-uniform 34 + lane-border-clearance 8 |
| patterns | 24 | edge-node-cross 1 + row-gap-uniform 5 + clearance 5 + row-alignment 4 + edge-label-overlap 7 他 |
| presets | 25 | clearance 7 + row-gap-uniform 6 + edge-label-clearance 6 他 |
| text-dsl | 13 | row-gap-uniform 5 + clearance 5 他 |
| primitives-extra | 0 | (pass) |
| styles | 0 | (pass) |

**合計 104 件の err**。 iteration 3 で「崩れ 0」 と報告したのは **層 1 のみ検証していた** のが原因、 層 2 の実 geometry defect を検知できていなかった。

---

## 修復方針

- 層 1 の regression は現状 100% pass = SPA UI level は健全
- 層 2 の err 104 件は **cdl engine 側 spec 厳格化 + dragon catalog topic 側書き方の合流点**
  - pattern-passthrough 等の「意図した貫通」 diagram を test 側で allowlist 化する必要あり
  - row-gap-uniform / clearance 系は cdl engine 側 layout algorithm 改修と dragon topic 側 override の並行作業
- 本 SPA 復元 auto session (「Neumorphism 1 個完璧化」) の scope 外、 別 sprint で cdl repo 側と並行改修

---

## 参照

- 層 1 実装 = `apps/playground-spa/tests/audit-3vp.spec.ts` / `full-regression.spec.ts`
- 層 2 実装 = `packages/dragon/test/visual-validate-sweep.test.ts`
- defect snapshot = `dragon-notation-defects.txt`
