# Layout Diversity Patterns

`apps/playground-spa/src/topics/catalog/interactive.cdl.ts` の 99 diagram を multi-lane 化した 33 wave refactor で確立した layout pattern 集。 user 元指摘「なんか全部同じように左上に配置するのは正しいの？」 への対応で全 catalog が「1 lane + 中央 card + readouts 縦 stack」 の単調 pattern から脱却、 lane 分割で semantic 情報を可視化する経路を体系化した。

## 背景

75 diagram を primitive expansion iteration 5 で追加した後、 user が layout 一様性を指摘。 cdl の `lane` primitive は横位置と width を宣言的に持ち、 node を lane に配置することで意味的グループを表現できるが、 単発 catalog 例では全て `lane("l", { x: 0, width: 480 })` 単一 lane に集約されていた。 33 wave (PR #267-#299) で全 99 diagram を lane 分割し、 PR #300 で structural check (lane count >= 2) を機械保証。

- 元指摘 = 2026-07-13 の `/handoff` message
- 完遂 = 33 wave × 3 catalog + 残 3 catalog = 99/99 = 100%
- regression 保証 = `verify-structural.mjs` で全 diagram 巡回 lane count assert

## Pattern taxonomy (8 経路)

33 wave で採用した lane 分割 pattern を意味論で 8 経路に分類。 各 pattern の適用条件と実例 catalog を示す。

### 1. state-based split (状態別分散)

signal 値 or dropdown の option 別に lane を切る。 default 位置 lane に current indicator card を stack することで「今どこにいるか」 が視覚化される。

- 適用条件 = discrete state (2-4 個) が明確
- 実例 = `interactive-issue-priority` (High/Med/Low 3-lane + current)、 `interactive-build-traffic-light` (Red/Yellow/Green 3-lane + current)、 `interactive-alert-notification` (Info/Warn/Error/Success 4-lane + current)、 `interactive-deploy-spinner` (Running/Done/Error 3-lane + current)
- 実装 idiom
  ```ts
  .lane("high", { x: 0, width: 200 })
  .lane("med", { x: 240, width: 200 })
  .lane("low", { x: 480, width: 200 })
  .node("currentIssue", { lane: "high", stack: 1, kind: "card", title: "◆ Current", subtitle: "prio: {prio}" })
  ```

### 2. range band split (数値帯別分散)

数値 signal を low/mid/high 等の band に分けて lane 分散。 各 band の意味 (color / label / criterion) を lane で明示、 current value indicator で slider 位置を可視化。

- 適用条件 = 連続 numeric range を semantic band に分割可能
- 実例 = `interactive-kpi-bullet` (bad 0-40 / avg 40-70 / good 70-100 + gap edge)、 `interactive-ml-confidence` (Low<40 / Mid 40-74 / High≥75)、 `interactive-device-battery` (Low<20 / Mid 20-60 / High≥60)、 `interactive-engine-tachometer` (Idle/Cruise/Redline)、 `interactive-exam-grade` (A/B/C/D/F 5-lane)、 `interactive-room-thermometer` (Cold/Comfort/Hot)、 `interactive-product-rating` (Low/Mid/High)
- 実装 idiom = state-based split と同じ骨格、 subtitle に「◆ Current = {sig}」 で lane 越境 indicator

### 3. category split (category 別分散)

array data を semantic category に分けて lane 分散。 各 element 個別 card で内訳を明示し、 対応する readout (list/donut/histogram 等) を併存させて aggregate view も維持。

- 適用条件 = array element に意味的 category label が付与可能
- 実例 = `interactive-search-results` (Docs 4 / Interactive tool 1)、 `interactive-week-weather` (Sunny/Cloudy/Thunder)、 `interactive-tutorial-videos` (Rust/TS/React)、 `interactive-crypto-wallet` (Gainers/Losers)、 `interactive-world-map` (APAC/AMEA)、 `interactive-portfolio-donut` (Traditional/Alternative)、 `interactive-signup-form` (Personal/Contact/Prefs)
- 実装 idiom
  ```ts
  .lane("catA", { x: 0, width: 260 })
  .lane("catB", { x: 300, width: 260 })
  .node("item1", { lane: "catA", stack: 0, kind: "card", title: "...", subtitle: "..." })
  .readout.donut("d", { source: "arr", ... })
  ```

### 4. pipeline flow (段階連鎖 + edge)

上流 → 下流 の段階を lane で横並び、 各段階間を edge で連結。 tone escalate (info → warning → error など) で drop-off や tier change を可視化。

- 適用条件 = step / stage の連鎖 (2-5 段階)
- 実例 = `interactive-eip1559` (Sender/Block N/N+1/N+2 + 3 tx edge)、 `interactive-oauth-flow` (User/Auth/Resource + 6 event edge)、 `interactive-shipping-status` (Packed/Shipped/Delivery/Delivered + 3 edge)、 `interactive-onboarding-stepper` (5-lane + 4 next/finish edge)、 `interactive-sales-funnel` (Visit/Signup/Trial/Paid + 3 conv edge, tone escalate to error)、 `interactive-project-gantt` (Design/Impl/Test/Ship + 3 handover edge)、 `interactive-traffic-sankey` (Sources 3 / Landings 2 / Checkout + 8 edge)、 `interactive-year-roadmap` (Q1-Q4 + 3 handover edge)、 `interactive-user-avatar` (Input/Initials/Circle + 2 parse/render edge)
- 実装 idiom
  ```ts
  .lane("s1", { x: 0, width: 200 })
  .lane("s2", { x: 240, width: 200 })
  .lane("s3", { x: 480, width: 200 })
  .edge("n1", "n2", { label: "step", tone: "info" })
  .edge("n2", "n3", { label: "step", tone: "success" })
  ```

### 5. fan-out (1 signal → N readout)

1 つの source signal から複数 readout に bind される構造。 source lane と各 readout lane を分けて、 fan-out edge で分岐を明示。

- 適用条件 = 1 signal が N readout に bind される reactive 構造
- 実例 = `interactive-stepper` (Control → Bar + Stat の 2 fan-out edge)、 `interactive-dynamic-readouts` (revenue → 3 readout + status → typewriter の 4-lane 分散)、 `interactive-timeline-drive` (t → Rect + Arc fan-out edge)、 `interactive-formula-text` (Input → Doubled / Halved の 2 dependency edge)、 `interactive-visual-bar` (Signal → Bar + Readout fan-out edge)
- 実装 idiom
  ```ts
  .lane("src", { x: 0, width: 200 })
  .lane("target1", { x: 240, width: 220 })
  .lane("target2", { x: 500, width: 220 })
  .edge("srcNode", "t1Node", { label: "→ t1", tone: "info" })
  .edge("srcNode", "t2Node", { label: "→ t2", tone: "success" })
  ```

### 6. staged comparison (段階比較 view)

同一 primitive を異なる parameter で複数並列描画、 slider driven の reactive 版を末尾に置く「3 static + 1 reactive」 pattern。 shape family (rect / circle / arc / wave / polygon) で採用。

- 適用条件 = primitive の parameter 変化を段階的に見せたい (fill %, sides count 等)
- 実例 = `interactive-shape-rect` (25/50/75 static + slider)、 `interactive-shape-circle` (0/33/66 progress + slider)、 `interactive-shape-arc` (0°/90°/180° + slider)、 `interactive-shape-wave` (25/50/75 tank + slider)、 `interactive-shape-polygon` (Triangle/Hexagon/Octagon + slider)
- 実装 idiom
  ```ts
  .lane("low", { x: 0, width: 140 })
  .lane("mid", { x: 160, width: 140 })
  .lane("high", { x: 320, width: 140 })
  .lane("interactive", { x: 480, width: 160 })
  .node("nLow", { lane: "low", stack: 0, kind: "dyn-rect", shape: { source: "{low25}", ... } })
  .node("nInteractive", { lane: "interactive", stack: 0, kind: "dyn-rect", shape: { source: "{v}", ... } })
  ```

### 7. individual element split (要素個別分散)

array 5 element 前後を 1 lane 1 element に分散、 各 element 個別 card で内訳全展開。 element 数 = lane 数の 1:1 対応。

- 適用条件 = 少数 element (3-5) を全部個別に見せる価値がある場合
- 実例 = `interactive-team-activity` (5 event 5-lane timeline + 4 edge)、 `interactive-tournament-podium` (Silver/Gold/Bronze 3-lane、 podium 実配置模倣)、 `interactive-post-reactions` (Thumbs/Heart/Laugh/Party 4-lane)、 `interactive-kpi-icon-tile` (Growth/Revenue/Goals)、 `interactive-metrics-grid` (Users/Revenue/Uptime/Errors)、 `interactive-timezone-clock` (Tokyo/London/NYC/Sydney)
- 実装 idiom = 各 element 1 lane に固定 stack 0

### 8. tree depth split (treeNodes template で動的 lane 割当)

treeNodes callback 内で level に応じて lane 名を動的算出。 tree diagram を depth 別 lane 分散、 renderOffset で見た目上の tree 構造を保持しつつ lane 分割の semantic を追加。

- 適用条件 = treeNodes / gridNodes 経路で 2 軸構造 (level+pos / row+col)
- 実例 = `interactive-decision-tree` (Root/Mid/Leaf 3-lane + 6 edge)、 `interactive-grid-matrix` (Col 0-3 4-lane 動的、 3 row stack)
- 実装 idiom
  ```ts
  .lane("root", { x: 0, width: 200 })
  .lane("mid", { x: 240, width: 200 })
  .lane("leaf", { x: 480, width: 240 })
  .treeNodes(3, 2, 70, 80, (level, pos, i, ox, oy) => ({
    id: `node-{i}`,
    lane: level === 0 ? "root" : level === 1 ? "mid" : "leaf",
    stack: i,
    ...
  }))
  ```

## 集約 view と lane view の併存

33 wave の共通経路 = lane 分散 + 元の readout 併存。 readout (donut / bar / list / grid / heatmap / etc) は全体 aggregate view を担い、 lane 分散は category / state 分類 view を担う。 「同じ data を 2 経路で見る」 構造が semantic 情報密度を最大化する。

例 = `interactive-portfolio-donut` は 2-lane (Traditional / Alternative) 分散で asset category を可視化しつつ、 donut readout で 4 asset の面積比較を維持。 これにより「どの asset に traditional / alternative の bias があるか」 + 「全体でどの asset が最大か」 の 2 経路 view が同時に得られる。

## edge tone escalation

pipeline flow (経路 4) で 3 edge 以上を並べる場合、 tone を info → warning → error や info → accent → success で escalate させると「後段の重要度上昇」 が視覚化される。

- drop-off escalate = info (40% conv) → warning (37.5%) → error (26.7%、 sales-funnel)
- release escalate = info (next) → accent (test start) → success (release、 project-gantt)
- correlate expression = success (positive correlate) / error (inverse correlate) / info (fan-out) (kpi-dashboard)

## regression 保証

`apps/playground-spa/scripts/verify-structural.mjs` で全 99 catalog 巡回、 SVG 内 `[data-cdl-lane]` count が 2 以上を assert (PR #300)。 単一 lane pattern の再発を機械的に禁止。 併せて precision (102/102) と overlap (99/0) も継続 pass、 layout diversity 状態を drift 防止する 3 経路 verify chain を確立。

- precision = signal → SVG 属性 bind の数値検証 (`verify-precision.mjs`)
- overlap = 描画 element 間の視覚的衝突検出 (`detect-overlap.mjs`)
- structural = lane count >= 2 の layout monotony 防止 (`verify-structural.mjs`)

## 適用範囲外

lane 分割が意味を持たない diagram (single primitive demo で state / category が存在しない場合) は本規範対象外だが、 33 wave 完遂時点で全 99 diagram に何らかの semantic axis を見出せた。 primitive expansion で新規 diagram を追加する場合は本 pattern taxonomy を参照して lane 設計する。
