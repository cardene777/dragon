# Migration Guide ... Builder API → Text DSL

This is a **How-to** guide for incrementally migrating existing builder-API diagrams to the Text DSL.
At v0.4, the six presets all work with animation, so most diagrams can be rewritten directly in the Text DSL.

> This page is a **How-to**.
> It shows the concrete steps for the task "rewrite existing builder-API code as Text DSL".
> For grammar, see [Text DSL Spec](/docs/en/cdl/text-dsl-spec).
> For philosophy, see [Overview](/docs/en/cdl/README).

## TOC

- [Why we recommend migration](#why-we-recommend-migration)
- [Migration example ... sequence preset](#migration-example--sequence-preset)
- [Migration example ... with animation (v0.3+)](#migration-example--with-animation-v03)
- [v0.4 migration map (all 6 presets)](#v04-migration-map-all-6-presets)
- [Migration strategy](#migration-strategy)
- [FAQ](#faq)
- [Related](#related)

## Why we recommend migration

First, let us lay out the trade-off between Text DSL and Builder API.
The decision is not "which is better" — choose by use case.

| Aspect | Builder API | Text DSL |
|---|---|---|
| Learning cost | TypeScript required | Learn through bullets |
| Non-engineers | Not viable | Viable |
| LLM generation | Somewhat hard | Easy (system prompt provided) |
| Line count | 8-15 lines | 5-10 lines |
| Type safety | Full | Hints at parse time |
| IDE completion | Full | None (LSP under review) |
| Fine-grained control | Free | Inside preset bounds |

Choose the Text DSL when you want LLMs to write it or you want to minimize code.
Choose the Builder API when you want to write fine-grained code while watching types in your IDE.
You can also mix both inside the same project.

## Migration example ... sequence preset

This is the simplest example — rewriting a sequence diagram from the builder API to the Text DSL.
A single example shows the line-count difference and the readability gain.

### Before (Builder API)

This is a login flow as a sequence in the builder API.
It is the typical style — arranging four steps in a chain.

```ts
import { sequence } from "@cardenelabs/cdl";

export const login = sequence({
  id: "login",
  topic: "User Login",
  actors: ["User", "API", "DB"],
})
  .step({ from: "User", to: "API", label: "POST /login" })
  .step({ from: "API", to: "DB", label: "SELECT" })
  .step({ from: "DB", to: "API", label: "rows", tone: "success" })
  .step({ from: "API", to: "User", label: "200 OK", tone: "success" })
  .build();
```

Each `step()` takes an options object with `from`, `to`, `label`, and `tone` keys.
Expressiveness is sufficient, but understanding what is happening requires reading TypeScript syntax.

[preview:presets/seq-demo]

### After (Text DSL)

This is the same diagram rewritten in the Text DSL.
Passing a template string to `textDslToDiagram()` yields a `CdlDiagram` equivalent to the builder API.

```ts
import { textDslToDiagram } from "@cardenelabs/cdl";

export const login = textDslToDiagram(`
タイトル: User Login
種類: sequence

登場人物:
  - User
  - API (function)
  - DB (storage)

流れ:
  1. User → API: POST /login
  2. API → DB: SELECT
  3. DB → API: rows (成功)
  4. API → User: 200 OK (成功)
`);
```

Line count drops from 15 to 12, and the structure reads intuitively.
Import count stays at 1 → 1.

[preview:presets/seq-demo]

## Migration example ... with animation (v0.3+)

This is an animated example with state, tween, phase, and badge.
The more boilerplate the builder API carries, the larger the line-count win when you move to the DSL.

### Before

This is an API call animation written in the builder API.
Because it uses the low-level builder directly, you declare each lane's header, spacer, step box, and footer one by one.

```ts
import { diagram } from "@cardenelabs/cdl";

export const apiCall = diagram("api-call", { topic: "API call" })
  .lane("client", { width: 340, label: "Client", lifeline: true })
  .lane("api", { width: 340, label: "API", lifeline: true })
  .lane("db", { width: 340, label: "DB", lifeline: true })
  .node("client-header", { lane: "client", stack: 0, kind: "card", title: "Client" })
  // ... (a lot of boilerplate)
  .state("request_count", { initial: 0 })
  .state("row_count", { initial: 0 })
  .phase("call", { duration: 1500, title: "call", body: "Client -> API -> DB" }, (p) =>
    p.activate("client-header", "api-header", "client-api")
      .tween("request_count", 0, 1)
      .tween("row_count", 0, 20)
      .badge("call"))
  .build();
```

The elided block (`// ...`) requires an additional 20+ lines of node declarations in real code.
40+ lines is typical for three actors.

[preview:animation/tween-simple]

### After

This is the same diagram rewritten in the Text DSL.
The DSL compiler auto-generates boilerplate such as headers, footers, and spacers, so they are no longer needed.

```ts
export const apiCall = textDslToDiagram(`
title: API call
type: sequence

actors:
  - Client
  - API (function)
  - DB (storage)

flow:
  1. Client -> API: GET /items
  2. API -> DB: SELECT (success)

animation:
  state: request_count = 0
  state: row_count = 0
  step "call" 1.5s:
    focus: Client, API, Client->API
    tween: request_count: 0 -> 1
    tween: row_count: 0 -> 20
    badge: call
    description: Client -> API -> DB
`);
```

Line count halves from 40+ to 22, and the structure reads at a glance.
With elisions gone, the overall shape is also easier to grasp.

[preview:animation/tween-simple]

## v0.4 migration map (all 6 presets)

This table maps each builder API preset to its Text DSL `種類:` value.
At v0.4, animation support is complete across all six presets.

| Use case | Builder API | Text DSL `種類:` |
|---|---|---|
| UML sequence | `sequence(...)` + `.step(...)` | `種類: sequence` |
| Vertical process | `flow(...)` + `.step(...)` | `種類: flow` |
| Parallel actors | `swimlane(...)` + `.node(...)` | `種類: swimlane` |
| ER diagram | `er(...)` + `.entity(...).relation(...)` | `種類: er` |
| FSM | `stateMachine(...)` + `.state(...).transition(...)` | `種類: state` |
| Architecture diagram | `topology(...).group(...).add(...).connect(...)` | `種類: topology` |

For every preset, the basic expressiveness of the builder API is equally available in the DSL.
Only fine-grained control still requires the builder API (see the next section for details).

## Migration strategy

We recommend migrating in four stages rather than all at once.
Validating behavior at each stage prevents regressions.

### Stage 1 ... write new diagrams in the Text DSL

Write any newly added diagrams in the Text DSL from the start.
Leave existing builder API code alone and align only the new additions to the DSL.
Even this stage alone unifies the look of the docs site.

### Stage 2 ... migrate easy examples first

Rewrite small 5-10 line builder examples into the Text DSL.
For each migration, run `pnpm verify:intent` to confirm that the declaration matches the screen.
Once you are comfortable with small examples, move on to larger diagrams.

### Stage 3 ... migrate animated diagrams to the Text DSL

Because v0.3 and v0.4 allow animation expressions, include phase, tween, and badge diagrams in the migration scope.
Diagrams from the low-level builder with heavy boilerplate benefit the most from migration.
Start from a simple single-phase example and grow into multi-phase / multi-state examples.

### Stage 4 ... keep the builder API only for diagrams that need fine-grained control

Keep diagrams that need fine-grained layout control — `labelOffsetY` or `routing: "back-detour"` and so on — in the builder API.
We plan DSL extensions for these in v0.5 and later, so the builder API is fine until then.
Aim to converge the project to roughly "90% DSL, 10% builder".

## FAQ

This collection lists three questions that come up frequently during migration.

### Q: Will the builder API be deprecated?

No.
The builder API stays public through v1.0.
After v1.0 we will consider gradual internal-only treatment, but no sudden breaking change is planned.
You can confidently keep fine-grained-control diagrams on the builder API.

### Q: What cases can the Text DSL not express?

As of v0.4, the following four are builder-API only.
We are reviewing DSL support for these in v0.5 and beyond.

- `labelOffsetX` / `labelOffsetY` ... fine-grained label position adjustments
- `routing: "back-detour"` ... routing for back transitions
- ER entity `rows: ["id: PK", ...]` ... column definitions (under review for v0.5)
- Multiple groups in topology ... currently single-group only (under review for v0.5)

You can mix-and-match — write the parts the DSL cannot express in the builder API and the rest in the DSL.
You do not need to unify the format file-by-file.

### Q: How accurate is LLM-generated DSL?

We confirm 80%+ accuracy with the system prompt plus the five few-shot examples.
For details and evaluation metrics, see the [LLM Generation Guide](/docs/en/cdl/text-dsl-llm-guide).

If you slip below 80%, swap in few-shot examples closer to the request to raise accuracy.
Parse errors such as undeclared actors are absorbed by the LLM's self-correction loop, so this is not a problem in practice.

## Related

This section points to the next docs.

- [Text DSL Specification (v0.4)](/docs/en/cdl/text-dsl-spec) ... grammar details
- [LLM Generation Guide](/docs/en/cdl/text-dsl-llm-guide) ... steps for having an LLM generate the DSL
- [API Reference (Builder API)](/docs/en/cdl/reference/api) ... full spec of the builder API
- [CHANGELOG](../../CHANGELOG.md) ... version history
