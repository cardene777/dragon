# `@cardenelabs/cdl` Documentation

`@cardenelabs/cdl` is a TypeScript DSL for declaratively writing animated React + SVG diagrams.
We designed it as a library that adds animation (phase / tween / particle / state) on top of mermaid's "text-to-diagram" experience.

> This page serves as the docs-wide **Explanation + index**.
> Get a feel for cdl's philosophy and overall structure here before stepping into each section.
> If you want to "run something right away", you can jump straight to [Quickstart](/docs/en/cdl/overview/quickstart).

## TOC

This index is long, so jump from the table of contents to the section you need.

- [Why cdl exists](#why-cdl-exists)
- [4-tier structure](#4-tier-structure)
- [Learning path](#learning-path)
- [Complete example at a glance](#complete-example-at-a-glance)
- [Key features](#key-features)
- [Text DSL ... for those who do not want to write code](#text-dsl--for-those-who-do-not-want-to-write-code)
- [The "eye" (visual quality gates)](#the-eye-visual-quality-gates)
- [Catalog](#catalog)

## Why cdl exists

Existing diagram tools such as mermaid are strong for static representation but cannot express temporal animation or state changes.
We designed cdl to be "as approachable as mermaid while letting you write animation too".

In addition, cdl carries an **"eye" (automatic verification that author intent matches the actual screen)** on the engine side — something no other diagram tool offers.
That mechanism detects engine bugs and layout drift without relying on the author eyeballing the output.
The Explanation section of the [Verifier Guide](/docs/en/cdl/reference/verifier-guide) collects the design intent.

## 4-tier structure

The docs are split into four tiers that align with reader skill and use case.
Reading in the table order below minimizes learning cost.

| Tier | Content | Audience |
|---|---|---|
| [overview](/docs/en/cdl/overview/README) | Quickstart / Cookbook / Mermaid Migration | Beginners / mermaid users |
| [primitives](/docs/en/cdl/primitives/README) | The five building blocks: lane / node / edge / state / phase | Anyone learning cdl from scratch |
| [presets](/docs/en/cdl/presets/README) | The six high-level APIs: swimlane / flow / sequence / topology / er / stateMachine | Anyone who wants "one-line declaration like mermaid" |
| [patterns](/docs/en/cdl/patterns/README) | 18 practical patterns: Permit / Bridge / DEX / Multicall / Approve-Pull, etc. | Anyone wanting concrete blockchain / Web2 examples |
| [reference](/docs/en/cdl/reference/README) | API listing / Verifier Guide | Anyone covering every API |

Each tier is designed so you can read it independently, but newcomers should go overview → primitives → presets.

## Learning path

This is the recommended path when you read the docs in order.
Each section is kept compact so you can move on within 5-15 minutes per route.

```
overview/quickstart  (run it in five minutes)
        ↓
primitives/  (understand the five building blocks)
        ↓
presets/  (one-line declaration via high-level API)
        ↓
patterns/  (mimic practical patterns)
        ↓
reference/  (full API + verifier)
```

If something stops working along the way, return to the previous section and rerun the sample.
Every section ships a checkpoint that says "by here, things should be running".

## Complete example at a glance

This is what cdl code looks like, shown through a single payment flow.
Running the TypeScript below on a page after `pnpm dev` renders the animated diagram exactly as shown.

```ts
import { diagram } from "@cardenelabs/cdl";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const payment = diagram("payment", { topic: "Payment Flow" })
  .lane("u", { x: 0, width: 320 })
  .lane("api", { x: 460, width: 380 })
  .nodes([
    { id: "user", lane: "u", stack: 0, kind: "actor", title: "User" },
    { id: "pay", lane: "api", stack: 0, kind: "function", title: "POST /pay" },
  ])
  .edges([
    { from: "user", to: "pay", label: "submit" },
    { from: "pay", to: "user", label: "200 OK", tone: "success" },
  ])
  .phase("submit", { duration: 1800, title: "submit", body: "User submits payment info." },
    (p) => p.activate("user", "pay", "user-pay"))
  .phase("respond", { duration: 1500, title: "respond", body: "Server returns OK." },
    (p) => p.activate("pay", "user", "pay-user"))
  .build();

export const App = () => <CdlDiagramView diagram={payment} />;
```

You assemble the declaration with the `diagram()` chain and obtain an immutable `CdlDiagram` via `.build()`.
On the React side, just pass it to `<CdlDiagramView diagram={...} />` and the animation plays in phase order.

[preview:presets/seq-demo]

## Key features

This table summarizes the main features cdl provides, linked to the related docs.
Follow the links for details.

| Feature | Description |
|---|---|
| **Text DSL (v0.1)** | A bulleted notation that suits non-engineers and LLMs ... [text-dsl-spec.md](/docs/en/cdl/text-dsl-spec) |
| **Fully typed in TypeScript** | The builder API auto-completes from type hints |
| **animated by default** | phase / tween / progress glow run automatically |
| **6 presets (mermaid equivalent)** | [presets/](/docs/en/cdl/presets/README) |
| **29 NodeKinds** | [primitives/node.md](/docs/en/cdl/primitives/node) |
| **6 Tones** | [primitives/edge.md](/docs/en/cdl/primitives/edge) |
| **The "eye" = visual verifier** | [reference/verifier-guide.md](/docs/en/cdl/reference/verifier-guide) |
| **Automatic layout** | lane / stack placement / edge routing / particle — all automatic |

If you have used mermaid, it helps to think of cdl as "close to mermaid but with animation".
For newcomers, the Text DSL is also a viable entry point.

## Text DSL ... for those who do not want to write code

If writing the builder API feels hard, you can use the bulleted Text DSL.
The natural-language-like notation below produces the same diagram as the equivalent builder API.

```cdl
タイトル: Login
種類: sequence

登場人物:
  - User
  - API (function)

流れ:
  1. User → API: POST /login
  2. API → User: 200 OK (成功)
```

Passing this to `textDslToDiagram()` yields a `CdlDiagram` equivalent to the builder API above.
We designed the grammar so non-engineers and LLMs (ChatGPT / Claude / Cursor, etc.) can write it.

[preview:presets/seq-demo]

For details, see the [Text DSL Spec](/docs/en/cdl/text-dsl-spec) and [LLM Generation Guide](/docs/en/cdl/text-dsl-llm-guide).

## The "eye" (visual quality gates)

cdl ships a mechanism no other diagram tool offers: **the engine automatically verifies that author intent matches the actual rendered screen**.
You run three progressive routes (static / DOM consistency / intent matching) to detect drift between declaration and screen.

```bash
pnpm validate:diagrams      # static layout collision detection
pnpm verify:dom             # render DOM consistency (engine self-consistency)
pnpm verify:intent          # author intent vs. actual screen (the mermaid essence)
```

For how to use the three routes, tolerance design, and concrete examples, see the [Verifier Guide](/docs/en/cdl/reference/verifier-guide).
For daily operations, `validate:diagrams` alone is fast enough, so try it first.

## Catalog

Live demos of each primitive, preset, and pattern are available on the web catalog pages.
Open them when you want a visual check before reading the docs.

| Page | Content |
|---|---|
| `/catalog/primitives` | 39 primitives (5 building blocks + 29 NodeKinds + etc.) |
| `/catalog/styles` | 10 tone / edge style samples |
| `/catalog/animation` | 5 animation patterns |
| `/catalog/patterns` | 18 blockchain patterns |
| `/catalog/presets` | 6 preset completion examples |

Every diagram on a catalog page links to its source cdl declaration.
If you like an example, copy the declaration into your own project.
