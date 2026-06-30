# gantt preset

`gantt` is a high-level API for Gantt charts (tasks × time axis) built up via `task` items.
It corresponds to mermaid `gantt`.

Each task carries `start` / `end` (period), `owner`, and `dependsOn` (id of the predecessor). When `dependsOn` is set, an edge is auto-generated.
It suits sprint planning / release timeline / project planning narratives.

## When to use

`gantt` is great for project / sprint planning share-outs.

- Quarterly release roadmap (Q1 Design → Q2 Build → Q3 Test → Q4 Ship)
- Sprint planning (work split across Week 1-2 / Week 3-4)
- Visualising dependencies across multiple teams

The cdl chart API does not provide hour-precise timeline rendering.
If you need a fully fledged Gantt, consider a dedicated library (e.g. Bryntum Gantt).

## Why a dedicated preset

`task` dependencies (`dependsOn`) auto-create edges, so declaring tasks alone gives you the dependency graph.
You no longer have to write each dependency edge by hand with the low-level API.

## Signature

```ts
gantt({ id: string, topic: string, laneWidth?: number, defaultTone?: Tone })
  .task({ id, title, start: string, end: string, owner?, dependsOn? })
  .build()
```

[preview:presets/gantt-demo]

## Auto-generated subtitle

Each task subtitle includes:

- `<start> → <end>` (e.g. `Q1 → Q1`)
- `owner: <name>` (only when provided, e.g. `owner: Designer`)

## Complete example

```ts
import { gantt } from "@cardenelabs/cdl";

export const releaseTimeline = gantt({ id: "release", topic: "Release timeline" })
  .task({ id: "design", title: "Design", start: "Q1", end: "Q1", owner: "Designer" })
  .task({ id: "build", title: "Build", start: "Q2", end: "Q2", owner: "Eng",
          dependsOn: "design" })
  .task({ id: "test", title: "Test", start: "Q3", end: "Q3", owner: "QA",
          dependsOn: "build" })
  .task({ id: "ship", title: "Ship", start: "Q4", end: "Q4", owner: "PM",
          dependsOn: "test" })
  .build();
```

[preview:presets/gantt-demo]

## See also

- [flow preset](/docs/en/cdl/presets/flow) — plain sequential step list, no dependencies
- [flowchart preset](/docs/en/cdl/presets/flowchart) — role-split business workflow
