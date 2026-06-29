# gantt preset

The `gantt` preset expresses a Gantt chart (tasks laid out on a timeline for project progress, equivalent to mermaid `gantt`) in a simplified form.
The current implementation does not have a dedicated time-axis layout; each task is placed as one lane / one card and dependencies are expressed via `flow` edges.

## When to use

- Show a roadmap / milestones / project progress on one page.
- Lay out quarterly (Q1 / Q2 / Q3) or monthly task progression along time.
- Animate each task's progress (0-100%) via `states` + `tween`.

A full Gantt chart (time-axis bars, dependency arrows) is planned for a future PR with a dedicated layout.
Today it borrows the `swimlane` layout, drawing tasks as side-by-side cards.

## Minimal example

::: tabs

@@@ humans 👤 For humans

```text
title: "Roadmap"
type: gantt

actors:
  - task1: { kind: card, subtitle: "Q1" }
  - task2: { kind: card, subtitle: "Q2" }
  - task3: { kind: card, subtitle: "Q3" }

flow:
  - task1 -> task2: "depends"
  - task2 -> task3: "depends"

states:
  task1_progress: 0

animation:
  - step: "Q1 in progress" 1.2s
    focus: [task1]
    tween:
      task1_progress: 0 -> 100
    badge: "Q1 done"
```

@@@ llm 🤖 For LLM

```yaml
preset: gantt
intent: "Project roadmap with quarterly tasks"
actors:
  - { id: task1, kind: card, subtitle: "Q1" }
  - { id: task2, kind: card, subtitle: "Q2" }
flow:
  - { from: task1, to: task2, label: depends }
states:
  - { id: task1_progress, initial: 0 }
phases:
  - { id: q1, focus: [task1], tweens: [task1_progress: 0->100] }
constraints:
  - "task kind should be card (label + subtitle (period) is the focus)"
  - "no dedicated time-axis layout yet, planned for a future PR"
```

:::

## Arguments

The arguments mirror the other presets (`title` / `type` / `actors` / `flow` / `states` / `animation`).
Put the period (`"Q1"`, `"2026/06"`) into `subtitle`, and the progress percentage (`"50%"`) into `value`.

## Related

- [swimlane preset](/docs/en/cdl/presets/swimlane) — the base layout used here.
- [state primitive](/docs/en/cdl/primitives/state) — tween progress values over time.
