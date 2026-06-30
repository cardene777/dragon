# Presets

`preset` (高位 API、 1 行宣言で図を組み立てる builder) は **18 種類**の図を提供します。
低位 API の `lane` (列) / `node` (箱) / `edge` (矢印) / `phase` (時間軸) を意識せず、 用途別の builder を 1 行で呼び出して図を組み立てられます。

このページは 18 種類の preset を一覧して、 用途と mermaid 等価を比較するハブとして機能します。
個別 preset の signature や使用例は各 preset の Reference ページに記載しています。

## なぜ preset を分けたか

低位 API (`primitives` で `lane` や `node` を 1 つずつ宣言する経路) は柔軟ですが、 著者は毎回 lane の `x` / `width` / `slug` を計算する必要があります。
preset はその計算を engine 側に閉じ込めて、 著者は宣言したい 18 種類の図のうち 1 つを選ぶだけで済みます。

これは mermaid と同じ「図の種類ごとに最適化された記法」 という思想に由来します。
cdl は 18 種類の preset を用意して、 著者の認知負荷を減らします。

## 基本 6 preset (cdl 創設時)

| Preset | mermaid 相当 | 用途 | リンク |
|---|---|---|---|
| `swimlane` | `flowchart LR` (subgraph 並列) | 並列に動く actor 群 | [swimlane.md](/docs/cdl/presets/swimlane) |
| `flow` | `flowchart TB` | 縦の処理流れ | [flow.md](/docs/cdl/presets/flow) |
| `sequence` | `sequenceDiagram` | UML sequence (actor × 時系列) | [sequence.md](/docs/cdl/presets/sequence) |
| `topology` | `C4` / deployment | 構成図 (group + container) | [topology.md](/docs/cdl/presets/topology) |
| `er` | `erDiagram` | ER 図 (entity + relation) | [er.md](/docs/cdl/presets/er) |
| `stateMachine` | `stateDiagram-v2` | FSM (state + transition) | [state-machine.md](/docs/cdl/presets/state-machine) |

## 新 12 preset (v0.6+)

| Preset | mermaid 相当 | 用途 | リンク |
|---|---|---|---|
| `infrastructure` | `flowchart` (box grid) | cloud / SaaS architecture | [infrastructure.md](/docs/cdl/presets/infrastructure) |
| `network` | (専用 NW 図) | router / switch / firewall + protocol | [network.md](/docs/cdl/presets/network) |
| `flowchart` | `flowchart` + swimlane | swimlane + decision + 5 shape | [flowchart.md](/docs/cdl/presets/flowchart) |
| `stateMachine2` | `stateDiagram-v2` (拡張) | nested + entry/exit + action | [state-machine2.md](/docs/cdl/presets/state-machine2) |
| `classDiagram` | `classDiagram` | UML クラス + 5 種 relation | [class.md](/docs/cdl/presets/class) |
| `tree` | `graph TD` | parent-child + 階層 | [tree.md](/docs/cdl/presets/tree) |
| `mindMap` | `mindmap` | 中心 + 放射 branch | [mind.md](/docs/cdl/presets/mind) |
| `userJourney` | `journey` | step + emotion + touchpoint | [journey.md](/docs/cdl/presets/journey) |
| `gantt` | `gantt` | sprint / release timeline | [gantt.md](/docs/cdl/presets/gantt) |
| `funnel` | `funnelChart` | Awareness → Conversion + drop rate | [funnel.md](/docs/cdl/presets/funnel) |
| `quadrant` | `quadrantChart` | 2 軸 matrix (Priority / SWOT) | [quadrant.md](/docs/cdl/presets/quadrant) |
| `chart` (pie/bar/line) | `pie` / xy charts | 統計チャート 3 種統合 | [chart.md](/docs/cdl/presets/chart) (+ [pie.md](/docs/cdl/presets/pie)) |

## どの preset を選ぶか

表現したい内容から逆引きで preset を選びます。
迷ったら catalog page (`/catalog/presets`) で全 preset の visual 見本を比較してください。

| 表現したい | 推奨 preset |
|---|---|
| API call の往復 (`User` → `API` → `DB`) | `sequence` |
| 業務 workflow (申請 → 承認 → 通知) | `flow` / `flowchart` / `stateMachine` |
| 並列の役割 (Frontend / Backend / DB) | `swimlane` / `flowchart` |
| AWS architecture / SaaS 構成 | `infrastructure` / `topology` |
| Office NW / DMZ / VLAN | `network` |
| DB schema | `er` |
| OO 設計 / クラス階層 | `classDiagram` |
| 状態遷移 (Idle / Loading / Done) | `stateMachine` / `stateMachine2` |
| 組織図 / file tree | `tree` |
| ブレスト / アイデア整理 | `mindMap` |
| UX research の journey | `userJourney` |
| sprint planning / release roadmap | `gantt` |
| Conversion funnel | `funnel` |
| Priority matrix / SWOT | `quadrant` |
| pie / bar / line chart | `chart` |

並列か直列かで `swimlane` と `flow` を分け、 時系列の往復が主なら `sequence`、 状態が主役なら `stateMachine` を選びます。
構成図と schema は専用の preset (`topology` / `infrastructure` / `er`) で表現します。

## 関連

- [primitives](/docs/cdl/primitives/README) は preset 内部で使われる基本要素 (`lane` / `node` / `edge` / `phase`) を直接宣言する低位 API です。
- [patterns](/docs/cdl/patterns/README) は preset では表現しにくい組み合わせを低位 API で書くための実用 pattern 集です。
- [Cookbook](/docs/cdl/overview/cookbook) は 25 種類の完全例を集めた実践集です。
