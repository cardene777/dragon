# Presets

`preset` (高位 API、 1 行宣言で図を組み立てる builder) は mermaid の 6 種類の図 (`sequenceDiagram` / `flowchart` / `erDiagram` / `stateDiagram-v2` / `C4` / `classDiagram`) に対応します。
低位 API の `lane` (列) / `node` (箱) / `edge` (矢印) / `phase` (時間軸) を意識せず、 用途別の builder を 1 行で呼び出して図を組み立てられます。

このページは 6 種類の preset を一覧して、 用途と mermaid 等価を比較するハブとして機能します。
個別 preset の signature や使用例は各 preset の Reference ページに記載しています。

## なぜ preset を分けたか

低位 API (`primitives` で `lane` や `node` を 1 つずつ宣言する経路) は柔軟ですが、 著者は毎回 lane の `x` / `width` / `slug` を計算する必要があります。
preset はその計算を engine 側に閉じ込めて、 著者は宣言したい 6 種類の図のうち 1 つを選ぶだけで済みます。

これは mermaid と同じ「図の種類ごとに最適化された記法」 という思想に由来します。
mermaid が `sequenceDiagram` と `flowchart` で別 syntax を採用しているのと同じく、 cdl は 6 種類の preset を用意して、 著者の認知負荷を減らします。

## 6 種類の preset 一覧

各 preset は `@cardenelabs/cdl` から named export で読み込めます。
mermaid の対応 syntax と用途を併記します。

| Preset | mermaid 相当 | 用途 | リンク |
|---|---|---|---|
| `swimlane` | `flowchart LR` (subgraph 並列) | 並列に動く actor 群 | [swimlane.md](/docs/cdl/presets/swimlane) |
| `flow` | `flowchart TB` | 縦の処理流れ | [flow.md](/docs/cdl/presets/flow) |
| `sequence` | `sequenceDiagram` | UML sequence (actor × 時系列) | [sequence.md](/docs/cdl/presets/sequence) |
| `topology` | `C4` / deployment | 構成図 (group + container) | [topology.md](/docs/cdl/presets/topology) |
| `er` | `erDiagram` | ER 図 (entity + relation) | [er.md](/docs/cdl/presets/er) |
| `stateMachine` | `stateDiagram-v2` | FSM (state + transition) | [state-machine.md](/docs/cdl/presets/state-machine) |

## どの preset を選ぶか

表現したい内容から逆引きで preset を選びます。
迷ったら catalog page (`/catalog/presets`) で全 preset の visual 見本を比較してください。

| 表現したい | 推奨 preset |
|---|---|
| API call の往復 (`User` → `API` → `DB` → `API` → `User`) | `sequence` |
| 業務 workflow (申請 → 承認 → 通知) | `flow` または `stateMachine` |
| 並列の役割 (Frontend / Backend / DB を同時に描く) | `swimlane` |
| AWS deployment 図 (Client / Backend / DB 階層) | `topology` |
| DB schema | `er` |
| 状態遷移 (Idle / Loading / Done / Error) | `stateMachine` |

並列か直列かで `swimlane` と `flow` を分け、 時系列の往復が主なら `sequence`、 状態が主役なら `stateMachine` を選びます。
構成図と schema は専用の preset (`topology` と `er`) で表現します。

## 関連

- [primitives](/docs/cdl/primitives/README) は preset 内部で使われる基本要素 (`lane` / `node` / `edge` / `phase`) を直接宣言する低位 API です。
- [patterns](/docs/cdl/patterns/README) は preset では表現しにくい組み合わせを低位 API で書くための実用 pattern 集です。
- [Cookbook](/docs/cdl/overview/cookbook) は 9 種類の完全例を集めた実践集です。
