# flowchart preset

`flowchart` is a high-level API that combines swimlane + five shape types (process / decision / start / end / loop) for business process diagrams.
It maps to mermaid `flowchart` extended with swimlanes.

You declare `lanes` (role / department / system), then assign a shape and lane to each node. The result is a workflow split per role.
For decision shapes you can label the outgoing edges with `true` / `false` to express conditional branches.

## When to use

`flowchart` is great for cross-team business and approval flows.

- Request → Approve → Reimburse (User / Manager / Finance, three lanes)
- Order → Review → Ship (Customer / Sales / Warehouse)
- Bug report → Triage → Fix → Release (Reporter / Eng / QA / PM)

If you don't need role lanes and only need a single sequence, [flow preset](/docs/en/cdl/presets/flow) is enough.

## shape → NodeKind

| shape | NodeKind | visual |
|---|---|---|
| `start` | event | green, start |
| `process` | function | grey, default work |
| `decision` | card | yellow, branch |
| `loop` | card | purple, repeat |
| `end` | event | blue, finish |

## Signature

```ts
flowchart({ id: string, topic: string, lanes: string[], laneWidth?: number, defaultTone?: Tone })
  .node({ id, title, shape: "process" | "decision" | "start" | "end" | "loop", lane: string })
  .edge({ from, to, label?, tone? })
  .build()
```

[preview:presets/flowchart-demo]

## Complete example

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

## See also

- [swimlane preset](/docs/en/cdl/presets/swimlane) — for lanes without shape distinctions
- [flow preset](/docs/en/cdl/presets/flow) — single-lane sequential flow
- [stateMachine2 preset](/docs/en/cdl/presets/state-machine2) — when state transitions are the focus
