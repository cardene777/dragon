# flowchart preset

`flowchart` preset は swimlane + 5 種の shape (process / decision / start / end / loop) を組み合わせたビジネス process diagram の高位 API です。
mermaid `flowchart` の swimlane 拡張に対応します。

`lanes` で役割 (role / department / system) を並べ、 各 node に shape と所属 lane を指定すると、 lane 別の business workflow が表現できます。
decision shape では `edge` の label に `true` / `false` を入れて条件分岐が描けます。

## いつ使うか

`flowchart` は組織横断の業務フローや承認フローに最適です。

- 申請 → 承認 → 払い戻し (User / Manager / Finance の 3 lane)
- order → review → ship (Customer / Sales / Warehouse)
- bug report → triage → fix → release (Reporter / Eng / QA / PM)

役割分担が不要で順次処理だけなら [flow preset](/docs/cdl/presets/flow) で十分です。

## shape → NodeKind 対応

| shape | NodeKind | 視覚 |
|---|---|---|
| `start` | event | 緑系、 開始 |
| `process` | function | 灰系、 標準処理 |
| `decision` | card | 黄系、 分岐 |
| `loop` | card | 紫系、 繰返 |
| `end` | event | 青系、 終了 |

## Signature

```ts
flowchart({ id: string, topic: string, lanes: string[], laneWidth?: number, defaultTone?: Tone })
  .node({ id, title, shape: "process" | "decision" | "start" | "end" | "loop", lane: string })
  .edge({ from, to, label?, tone? })
  .build()
```

[preview:presets/flowchart-demo]

## 完全な例

```ts
import { flowchart } from "@cardenelabs/cdl";

export const approvalFlow = flowchart({
  id: "approve",
  topic: "Approval workflow",
  lanes: ["User", "Manager"],
})
  .node({ id: "submit", title: "Submit request", shape: "start", lane: "User" })
  .node({ id: "review", title: "Review", shape: "decision", lane: "Manager" })
  .node({ id: "approve", title: "Approved", shape: "end", lane: "Manager" })
  .node({ id: "revise", title: "Revise", shape: "process", lane: "User" })
  .edge({ from: "submit", to: "review" })
  .edge({ from: "review", to: "approve", label: "true", tone: "success" })
  .edge({ from: "review", to: "revise", label: "false", tone: "warning" })
  .build();
```

[preview:presets/flowchart-demo]

## 関連

- [swimlane preset](/docs/cdl/presets/swimlane) — shape の区別なしで lane だけ分けたい時
- [flow preset](/docs/cdl/presets/flow) — 1 lane の単純な順次フロー
- [stateMachine2 preset](/docs/cdl/presets/state-machine2) — 状態遷移を主役にしたい時
