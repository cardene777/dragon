# Presets

A `preset` (a high-level API builder that assembles a diagram in one declaration) covers **18 diagram families**.
You do not have to think about the low-level primitives `lane` (column), `node` (box), `edge` (arrow), or `phase` (time-axis chunk); you pick the builder that matches your use case and call it in a single line.

This page is the hub that lists every preset, maps each one to its mermaid equivalent, and links to the per-preset Reference pages where signatures and worked examples live.

## Why split presets

The low-level API (declaring each `lane` and `node` one at a time through `primitives`) is flexible, but you must compute the `x`, `width`, and `slug` for every lane yourself.
Presets push that computation into the engine, so you only decide which of the 18 diagram families you want.

cdl ships 18 presets that minimize your cognitive load by offering syntax tuned to each diagram family.

## The six core presets

| Preset | mermaid equivalent | Use case | Link |
|---|---|---|---|
| `swimlane` | `flowchart LR` (parallel subgraphs) | actors that run in parallel | [swimlane.md](/docs/en/cdl/presets/swimlane) |
| `flow` | `flowchart TB` | a single vertical process flow | [flow.md](/docs/en/cdl/presets/flow) |
| `sequence` | `sequenceDiagram` | UML sequence (actor x time) | [sequence.md](/docs/en/cdl/presets/sequence) |
| `topology` | `C4` / deployment | architecture (group + container) | [topology.md](/docs/en/cdl/presets/topology) |
| `er` | `erDiagram` | ER diagram (entity + relation) | [er.md](/docs/en/cdl/presets/er) |
| `stateMachine` | `stateDiagram-v2` | FSM (state + transition) | [state-machine.md](/docs/en/cdl/presets/state-machine) |

## The twelve new presets (v0.6+)

| Preset | mermaid equivalent | Use case | Link |
|---|---|---|---|
| `infrastructure` | `flowchart` (box grid) | cloud / SaaS architecture | [infrastructure.md](/docs/en/cdl/presets/infrastructure) |
| `network` | (dedicated NW notation) | router / switch / firewall + protocol | [network.md](/docs/en/cdl/presets/network) |
| `flowchart` | `flowchart` + swimlane | swimlane + decision + 5 shapes | [flowchart.md](/docs/en/cdl/presets/flowchart) |
| `stateMachine2` | `stateDiagram-v2` (extended) | nested + entry/exit + action | [state-machine2.md](/docs/en/cdl/presets/state-machine2) |
| `classDiagram` | `classDiagram` | UML class + 5 relation types | [class.md](/docs/en/cdl/presets/class) |
| `tree` | `graph TD` | parent-child hierarchy | [tree.md](/docs/en/cdl/presets/tree) |
| `mindMap` | `mindmap` | radial branches from a centre | [mind.md](/docs/en/cdl/presets/mind) |
| `userJourney` | `journey` | step + emotion + touchpoint | [journey.md](/docs/en/cdl/presets/journey) |
| `gantt` | `gantt` | sprint / release timeline | [gantt.md](/docs/en/cdl/presets/gantt) |
| `funnel` | `funnelChart` | Awareness → Conversion + drop rate | [funnel.md](/docs/en/cdl/presets/funnel) |
| `quadrant` | `quadrantChart` | 2-axis matrix (Priority / SWOT) | [quadrant.md](/docs/en/cdl/presets/quadrant) |
| `chart` (pie/bar/line) | `pie` / xy charts | unified statistical charts | [chart.md](/docs/en/cdl/presets/chart) (+ [pie.md](/docs/en/cdl/presets/pie)) |

## Which preset to pick

Choose a preset by working backward from what you want to express.
When you are unsure, open the catalog page (`/catalog/presets`) and compare every preset visually.

| What you want to show | Recommended preset |
|---|---|
| A round-trip API call (`User` -> `API` -> `DB`) | `sequence` |
| A business workflow (request -> approval -> notify) | `flow` / `flowchart` / `stateMachine` |
| Parallel roles (Frontend, Backend, DB) | `swimlane` / `flowchart` |
| AWS architecture / SaaS layout | `infrastructure` / `topology` |
| Office NW / DMZ / VLAN | `network` |
| A DB schema | `er` |
| OO design / class hierarchy | `classDiagram` |
| State transitions (Idle / Loading / Done) | `stateMachine` / `stateMachine2` |
| Org chart / file tree | `tree` |
| Brainstorming / idea organisation | `mindMap` |
| UX research journey | `userJourney` |
| Sprint planning / release roadmap | `gantt` |
| Conversion funnel | `funnel` |
| Priority matrix / SWOT | `quadrant` |
| Pie / bar / line chart | `chart` |

Use `swimlane` for parallel work and `flow` for sequential work.
Pick `sequence` when round-trip timing is the point and `stateMachine` when state is the protagonist.
Architecture diagrams and schemas have their own dedicated presets (`topology` / `infrastructure` / `er`).

## Related

- [primitives](/docs/en/cdl/primitives/README) declares the building blocks (`lane`, `node`, `edge`, `phase`) that presets use internally.
- [patterns](/docs/en/cdl/patterns/README) collects practical low-level combinations that no preset covers directly.
- [Cookbook](/docs/en/cdl/overview/cookbook) ships 25 end-to-end examples you can adapt.
