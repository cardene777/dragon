# Dragon Check / Lint 機構 SSOT

**設置日** = 2026-07-07 / **更新日** = 2026-07-08 (CAR-1064 で 3 層 + notation lint 追加)

---

## 役割分離 = 検知システム vs 修正システム

| 系統 | 対象読者 | 目的 | LLM | 実行 |
|---|---|---|---|---|
| **検知システム** | 開発陣 (dragon / cdl repo 開発者) | 実装バグの検出、 CI ゲート、 PR 前確認 | **不使用** | `pnpm check:*` |
| **修正システム** | 記法の author (cdl / dragon DSL を書く人) | 書き方の癖 / 冗長表現 / 未定義参照を rule-based に指摘 + auto-fix | **不使用** | `pnpm lint:notation` / `pnpm fix:notation` |

**両方 LLM 不使用** = pure geometry / pure rule で動作、 コスト 0、 決定論的、 CI に安全に組込可。

---

## 検知システム = 3 層 check 機構

| 層 | 対象 | 実装 | 実行 |
|---|---|---|---|
| 層 1 = CDL check (SPA UI level) | 全 route × 3 viewport の render / navigation / a11y / console error | `apps/playground-spa/tests/full-regression.spec.ts` | `pnpm check:cdl` |
| 層 2 = dragon 記法 check (engine geometry level) | 全 100+ diagram の geometry axis (edge-node-cross / row-gap-uniform / lane-border-clearance / clearance / edge-label-overlap 他 12 axis) | `packages/dragon/test/visual-validate-sweep.test.ts` | `pnpm check:dragon` |
| 層 3 = kind 描画 check (SVG DOM geometry level) | CAR-994 で追加した新 kind (chart / gantt / mind-map / funnel / quadrant / tree / journey) の SVG geometry (arrow 方向 / polygon 単調減少 / root 中央 / edge fill:none 等) | `apps/playground-spa/tests/kind-geometry-check.spec.ts` | `pnpm check:kind` |

### 統合 command

- `pnpm check:all` = typecheck + 層 1 + 層 2 + 層 3 (positive + proof) を一括実行 (PR 前 CI)
- `pnpm check:cdl` = 層 1 のみ (SPA route regression)
- `pnpm check:dragon` = 層 2 のみ (engine visualValidate sweep)
- `pnpm check:kind` = 層 3 全 (positive `test:kind` + negative proof `test:kind:proof`)

### 検知 axis の実効性証明 (dead axis 回帰防止)

**動機** = CAR-1064 で追加した gantt arrow axis が実装バグにより 「見た目 OK だが test は pass する」 dead axis 状態になっていた (batch4 で発見)。

**対策** = 各 axis に対し 「(clean) OK → (DOM mutate) FAIL」 のペアで実効性を CI 保証。

- `pnpm test:kind` = positive test (clean 状態で 8 axis 違反 0)
- `pnpm test:kind:proof` = negative proof (5 axis に DOM mutation 注入 → 違反 >= 1 を確認)

これで 「axis の検査ロジック自体が壊れて全 pass」 になる dead axis 回帰を構造的に排除。

### 層 3 が追加された理由

CAR-994 で cdl engine に 10 新 kind (chart-line/pie/bar / gantt-timeline / mind-map / mind-radial / funnel-stages / quadrant-matrix / tree-hierarchy / journey-map) を追加した際、 **層 1 / 層 2 のどちらも kind 内部の SVG geometry を検出できなかった** (層 1 = 描画有無のみ、 層 2 = engine LaidDiagram の低位 edge/node のみ)。

例 = CAR-1064 で報告された **gantt dependsOn arrow の折れ方バグ**、 **flowchart false edge の 青塗り polygon バグ** は層 1 / 層 2 では検出できず、 user 目視で発見された。 層 3 では以下を検証。

- gantt-timeline: dependsOn arrow が **右向き着地** (arrow tip が子 bar 左辺の水平方向)
- funnel-stages: polygon 幅が上→下で **単調減少** (自然な逆三角形)
- mind-map: root node が canvas 中央 (±10%)
- chart-line: polyline point 数 = datum 数
- edge-line: fill が **none** (fill:#XXX 回帰なし = flowchart false edge が polygon 塗りに見えるバグ再発防止)

---

## 修正システム = notation lint

### 動機

catalog 記述の author (`presets.cdl.ts` を書く開発者、 dragon DSL を書く外部ユーザ) が **書き方の癖 / 冗長表現 / 未定義参照 / 空 payload** で「見た目は動くが読者に伝わらない」 diagram を作るのを rule-based に指摘する。

例 = topic が `chart preset (SVG polyline + 縦軸目盛)` の実装詳細説明になっている、 gantt の dependsOn 参照先 task が未定義、 mind-map の branch が未定義 parent を参照。

### 検出 rule 一覧

| rule | severity | auto-fix | 対象 |
|---|---|---|---|
| topic-redundant-implementation-detail | warn | ✓ | topic に "preset" / "render 未実装" / "SVG polygon" 等 |
| chart-empty-datum | warn | — | chart-{line,pie,bar} kind の datum 0 件 |
| chart-single-datum | info | — | datum 1 件 (2 件以上推奨) |
| gantt-unknown-depends-on | warn | — | 未定義 task への dependsOn 参照 |
| mindmap-unknown-parent | warn | — | mind-map の branch 未定義 parent 参照 |
| tree-unknown-parent | warn | — | tree の node 未定義 parent 参照 |
| quadrant-empty | warn | — | quadrant の item 0 件 |
| quadrant-single-quadrant | info | — | item が 1 象限に集中 |
| funnel-increasing-count | warn | — | funnel stage の count が増加 (単調減少期待) |

### 実行

```bash
# lint 結果を stdout に表示 (auto-fix 未適用)
pnpm lint:notation

# auto-fix 可能な rule を適用、 修正版を .lint-fix.json に書出し
pnpm fix:notation

# 実効性証明 (意図的にバグを注入した fixture で 8 rule 全 detect + autoFix 動作)
pnpm lint:notation:proof
```

### autoFix 挙動

`topic-redundant-implementation-detail` rule に対応する autoFix は topic の先頭 kind 名を判定し、 該当 kind の 「〜 を示す図」 日本語 description に自動置換する。

例:
- `"chart preset (SVG polyline + tone 別 slice)"` → `"統計チャート を示す図"`
- `"gantt preset (Release timeline)"` → `"ガントチャート を示す図"`
- `"mindMap preset (Project ideas)"` → `"マインドマップ を示す図"`

kind 判定 20+ pattern (chart / flow / swimlane / sequence / topology / er / stateMachine / infrastructure / classDiagram / tree / userJourney / mindMap / funnel / quadrant / gantt / flowchart / network 等)。

CLI から任意 file を lint する場合:

```bash
node packages/dragon/scripts/dragon-lint.mjs path/to/your.cdl.ts
node packages/dragon/scripts/dragon-lint.mjs --fix path/to/your.cdl.ts
```

### プログラム API

`@cardenelabs/dragon` から export:

```ts
import { lintDiagram, autoFix, type LintReport, type LintIssue } from "@cardenelabs/dragon";

const report: LintReport = lintDiagram(diagram);
console.log(report.issues); // LintIssue[]
console.log(report.autoFixableCount);

const patched = autoFix(diagram); // autoFixable な issue を全部解消
```

---

## 実装 file 一覧

- 層 1 = `apps/playground-spa/tests/full-regression.spec.ts`
- 層 2 = `packages/dragon/test/visual-validate-sweep.test.ts`
- 層 3 = `apps/playground-spa/tests/kind-geometry-check.spec.ts` (CAR-1064 新規)
- notation lint = `packages/dragon/src/notation-lint.ts` (CAR-1064 新規)
- CLI = `packages/dragon/scripts/dragon-lint.mjs` (CAR-1064 新規)

---

## 参照

- CAR-1064 = 3 層 + notation lint 追加、 gantt arrow bug 修正
- CAR-994 = 10 kind 追加 (chart / gantt / mind-map / mind-radial / funnel / quadrant / tree / journey)
- CAR-993 / CAR-1034 / CAR-1065 = catalog subtitle / i18n / dark mode 修正 chain
