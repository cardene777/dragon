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

## 修正システム = 記法の検査 (`notation lint`)

### 何のためか

図の書き手 (`presets.cdl.ts` を書く開発者と、dragon の記法を書く外の利用者) が、見た目は動くのに読む人へ伝わらない図を作った時に、決まった規則で指摘する。
見るのは、図の説明に入り込んだ実装の書き方、無い部品を指す参照、値や項目が空の図表と四象限図。

例は、図の説明が `chart preset (SVG polyline + 縦軸目盛)` のように作り手の書き方になっている図、工程表の作業の `dependsOn` が無い作業を指す図、枝分かれ図の枝の `parent` が無い枝を指す図。

### 規則の一覧

| 規則 | 重さ | 自動修正 | 何を見るか |
|---|---|---|---|
| `topic-redundant-implementation-detail` | ⚠ 注意 | できる (条件は下の節) | 図の説明に実装の書き方 (`preset (…)` / `render 未実装` / `SVG` の描き方の名前 (`polyline` など) / `polygon`) が入っている |
| `chart-empty-datum` | ⚠ 注意 | できない | 図表 (`chart-line` / `chart-pie` / `chart-bar`) に値 (`datum`) が 1 件も無い |
| `chart-single-datum` | ℹ 参考 | できない | 図表の値が 1 件だけ |
| `gantt-unknown-depends-on` | ⚠ 注意 | できない | 工程表の作業の `dependsOn` が、無い作業を指している |
| `mindmap-unknown-parent` | ⚠ 注意 | できない | 枝分かれ図の枝の `parent` が、中心にも他の枝にも無い |
| `tree-unknown-parent` | ⚠ 注意 | できない | 階層図の項目の `parent` が、無い項目を指している |
| `quadrant-empty` | ⚠ 注意 | できない | 四象限図に項目 (`item`) が 1 件も無い |
| `quadrant-single-quadrant` | ℹ 参考 | できない | 四象限図の項目が 4 件以上あり、すべて 1 つの区画に入っている |
| `funnel-increasing-count` | ⚠ 注意 | できない | 絞り込み図の段階の数が、前の段階より多い (状態から取る `{名前}` の数は比べない) |

重さの呼び名は、記法の検査の道具が端末に出す呼び名と同じ。
表の規則・重さ・自動修正の 3 つの欄は、画面側の検査 (`apps/playground-spa/src/lib/audit-readme-lint.test.ts`) が記法の検査の実物と照らす。
「何を見るか」 の欄は機械で照らしていないので、規則の条件を変えた時は `packages/dragon/src/notation-lint.ts` と見比べて直す。

### 走らせ方

```bash
# カタログの図に記法の検査を当て、指摘を端末に出す (自動修正は当てない)
pnpm lint:notation

# カタログの presets.cdl.ts に自動修正を当てた結果を、隣の presets.lint-fix.json に書き出す (指摘がある時だけ)
pnpm fix:notation

# 実証用の台本。 わざと問題を入れた図に当て、全ての規則が指摘を出すことを確かめる
pnpm lint:notation:proof
```

任意の file に当てる時。

```bash
node packages/dragon/scripts/dragon-lint.mjs path/to/your.cdl.ts
node packages/dragon/scripts/dragon-lint.mjs --fix path/to/your.cdl.ts
```

### 自動修正の挙動

自動修正 (`autoFix`) が直すのは図の説明の規則だけで、他の規則は手で直す。

1. 図の説明が型の名前 (`gantt` など) で始まる時は、説明全体を「{何を示すか}を示す{カタログの名前}」 に書き換える。 型の一覧は `notation-lint.ts` の検出の正規表現が、書き換え先は書き換え先の表 (`KIND_TO_JA`) が持つ
2. 型の名前で始まらない時は、括弧の中の実装の言葉と `preset` / `render` の語だけを消す。 3 字に満たなくなった時は `図の説明` にする

例。

- `chart preset (SVG polyline + tone 別 slice)` → `項目ごとの数値を示すグラフ`
- `gantt preset (Release timeline)` → `作業の期間と前後の関係を示す工程表`
- `mindMap preset (Project ideas)` → `中心の主題から広がる発想を示す枝分かれ図`
- `ログイン (render 未実装)` → `ログイン`

括弧の外に実装の言葉がある説明 (`SVG polyline を使う`) は、自動修正を当てても字が変わらない。
この時の指摘は自動修正できる数に入れず、修正案は直し方の文になる (#1940)。

### プログラムから使う

`@cardenelabs/dragon` が書き出す。

```ts
import { lintDiagram, autoFix, type LintReport, type LintIssue } from "@cardenelabs/dragon";

const report: LintReport = lintDiagram(diagram);
console.log(report.issues); // LintIssue[]
console.log(report.autoFixableCount);

const patched = autoFix(diagram); // 自動修正できる指摘を直した新しい図を返す (元の図は変えない)
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
