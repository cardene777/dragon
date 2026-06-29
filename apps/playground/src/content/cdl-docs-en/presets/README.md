# Presets

A `preset` (a high-level API builder that assembles a diagram in one declaration) covers the six mermaid diagram families (`sequenceDiagram`, `flowchart`, `erDiagram`, `stateDiagram-v2`, `C4`, `classDiagram`).
You do not have to think about the low-level primitives `lane` (column), `node` (box), `edge` (arrow), or `phase` (time-axis chunk); you pick the builder that matches your use case and call it in a single line.

This page is the hub that lists every preset, maps each one to its mermaid equivalent, and links to the per-preset Reference pages where signatures and worked examples live.

## Why split presets

The low-level API (declaring each `lane` and `node` one at a time through `primitives`) is flexible, but you must compute the `x`, `width`, and `slug` for every lane yourself.
Presets push that computation into the engine, so you only decide which of the six diagram families you want.

The idea comes from mermaid itself: each diagram family deserves syntax tuned to its purpose.
mermaid uses different syntax for `sequenceDiagram` and `flowchart`; in the same spirit, cdl ships six presets that minimize your cognitive load.

## The six presets

Each preset is a named export from `@cardenelabs/cdl`.
The table lists the mermaid counterpart and the typical use case for each one.

| Preset | mermaid equivalent | Use case | Link |
|---|---|---|---|
| `swimlane` | `flowchart LR` (parallel subgraphs) | actors that run in parallel | [swimlane.md](/docs/en/cdl/presets/swimlane) |
| `flow` | `flowchart TB` | a single vertical process flow | [flow.md](/docs/en/cdl/presets/flow) |
| `sequence` | `sequenceDiagram` | UML sequence (actor x time) | [sequence.md](/docs/en/cdl/presets/sequence) |
| `topology` | `C4` / deployment | architecture (group + container) | [topology.md](/docs/en/cdl/presets/topology) |
| `er` | `erDiagram` | ER diagram (entity + relation) | [er.md](/docs/en/cdl/presets/er) |
| `stateMachine` | `stateDiagram-v2` | FSM (state + transition) | [state-machine.md](/docs/en/cdl/presets/state-machine) |

## Which preset to pick

Choose a preset by working backward from what you want to express.
When you are unsure, open the catalog page (`/catalog/presets`) and compare every preset visually.

| What you want to show | Recommended preset |
|---|---|
| A round-trip API call (`User` -> `API` -> `DB` -> `API` -> `User`) | `sequence` |
| A business workflow (request -> approval -> notify) | `flow` or `stateMachine` |
| Parallel roles (Frontend, Backend, and DB drawn side by side) | `swimlane` |
| An AWS deployment diagram (Client / Backend / DB tiers) | `topology` |
| A DB schema | `er` |
| State transitions (Idle / Loading / Done / Error) | `stateMachine` |

Use `swimlane` for parallel work and `flow` for sequential work.
Pick `sequence` when round-trip timing is the point and `stateMachine` when state is the protagonist.
Architecture diagrams and schemas have their own dedicated presets (`topology` and `er`).

## Related

- [primitives](/docs/en/cdl/primitives/README) declares the building blocks (`lane`, `node`, `edge`, `phase`) that presets use internally.
- [patterns](/docs/en/cdl/patterns/README) collects practical low-level combinations that no preset covers directly.
- [Cookbook](/docs/en/cdl/overview/cookbook) ships nine end-to-end examples you can adapt.
