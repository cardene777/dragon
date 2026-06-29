# overview ... what cdl is

This section gives you a single-page overview of `cdl` (Chainome Diagram Language, an animated diagram description library) before you start drawing.
Before you write a diagram, read this page to grasp what cdl aims for and how it differs from mermaid.

## What cdl is

cdl is a diagram description library that you write in a YAML-style Text DSL (Domain-Specific Language), and it generates animated React components instead of static images.
When you declare the four blocks `title:` / `type:` / `actors:` / `flow:`, the library lays them out automatically and turns them into a moving diagram.
The authoring feel resembles mermaid's `sequenceDiagram`, but the output is a React component rather than an SVG string.

```text
title: "Hello"
type: sequence

actors:
  - User
  - API

flow:
  - User -> API: "request"
```

> 💡 **Relationship with mermaid** ... cdl complements mermaid rather than competing with it. Use mermaid when you paste a small one-line diagram into a README, and use cdl when you want to show a moving diagram in a docs site or a teaching material.

## What kinds of diagrams you can draw

cdl targets developers who want to draw six types of diagrams.
You pick one of six presets in `type:`.

| preset | The diagram you write | Moving element |
|---|---|---|
| `sequence` | Sequence diagram (time-ordered interaction) | Particles flow between actors |
| `flow` | Single-column vertical flow | Auto-connected next-step edges |
| `swimlane` | Role-based lanes (Sender / Contract / Receiver) | The active region transitions per phase |
| `er` | ER diagram (entity-relation) | Static structure with cardinality |
| `state` | State machine | initial / final + guard conditions |
| `topology` | System topology (top-down) | Cross-group connect |

cdl ships 29 visual kinds (`actor` / `function` / `storage` / `cloud` / others), giving it a wider expressive range than mermaid.

## How to read the docs

This section has three onboarding articles matched to your learning stage.

| File | Type (Diátaxis) | When you read it |
|---|---|---|
| [Quickstart](/docs/en/cdl/overview/quickstart) | Tutorial (hands-on intro) | When you touch cdl for the first time |
| [Cookbook](/docs/en/cdl/overview/cookbook) | How-to (25 recipes) | When you want to write a specific pattern |
| [Mermaid Migration](/docs/en/cdl/overview/mermaid-migration) | How-to (migration steps) | When you switch over from mermaid |

> 💡 **About Diátaxis** ... Diátaxis (https://diataxis.fr/) is a methodology that splits documentation into four kinds (Tutorial / How-to / Reference / Explanation). The cdl docs follow this classification.

After you finish reading, you can move on to deeper design concepts.
We recommend you understand the minimal primitives `lane` / `node` / `edge` / `phase` in [primitives](/docs/en/cdl/primitives/README), learn the six presets in [presets](/docs/en/cdl/presets/README), then move on to five blockchain patterns in [patterns](/docs/en/cdl/patterns/README), in this order.

## Next steps

If you want to draw a moving diagram first, follow the five 5-minute steps in [Quickstart](/docs/en/cdl/overview/quickstart) to put a minimal example on your screen.
If you already have a specific diagram in mind, skim the 25 examples (DeFi / NFT / DAO / Bridge) in [Cookbook](/docs/en/cdl/overview/cookbook) to find the closest pattern.
