# sequence preset

The `sequence` preset is a high-level API that assembles a UML sequence diagram (actor columns x ordered steps with time running downward and messages bouncing between actors) from a single builder.
It corresponds to the mermaid `sequenceDiagram` family, and the engine auto-generates the `lane` (column), `lifeline` (dotted vertical line), `header` (top card), and `footer` (bottom card) from your actor array.

You declare actor names and steps (`from`, `to`, `label`); the engine keeps the lane `x`, `width`, and slug calculations out of your code.

## When to use it

`sequence` is ideal when actors trade synchronous messages along a timeline.
Three to five actors per diagram give you the best readability.

- You want a UML sequence diagram.
- You want to show an API round-trip (`Client` -> `API` -> `DB` -> `API` -> `Client`) over time.
- You want roughly three to five actors of synchronous interaction on one page.

When actors run in parallel and time is not the protagonist, prefer the [swimlane preset](/docs/en/cdl/presets/swimlane).
When the work runs straight down a single lane, pick the [flow preset](/docs/en/cdl/presets/flow).

## Why split this preset

You can still build sequence diagrams with the low-level API (declaring each `lane`, drawing every lifeline by hand, and placing an activation marker per step), but a 10-step diagram easily passes 50 lines.
The `sequence` preset auto-generates headers, footers, lifelines, and activation markers so that your declaration shrinks to "an actor array plus steps."

> Difference from mermaid: mermaid `sequenceDiagram` emits a static PNG, while cdl `sequence` combines with `phase` (time-axis chunks) so you can play each step as an animation.

## Signature

::: tabs

@@@ humans 👤 For humans

A sequence diagram in v0.5 Text DSL uses `type: sequence`, lists actors in the header order, and lists flow arrows.

```text
title: "<diagram topic>"
type: sequence

actors:
  - <Actor 1>
  - <Actor 2>
  - <Actor 3>

flow:
  - <Actor 1> -> <Actor 2>: "<label>"
  - <Actor 2> -> <Actor 3>: "<label>" (<tone>, <style>)
```

[preview:presets/seq-demo]

The names you list in `actors` act both as the header display text and as the reference id used by the `from` / `to` of each flow line.
The engine slugifies the names internally and converts them to lane ids, so you keep writing the actor names directly in both ends of the arrow.

The trailing `(<tone>, <style>)` accepts tones such as `success` / `error` / `warning` / `info` / `accent` / `teal`, and styles such as `solid` / `dotted-flow`.
For the chain API type signature, see the "API Reference (chain API)" section at the bottom of this page.

@@@ llm 🤖 For LLM

```yaml
fn: sequence(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      actors: { type: "string[]", required: true, hint: "3-5 actors recommended, order = left-to-right" }
      defaultTone: { type: Tone, optional: true }
      defaultStyle: { type: EdgeStyle, optional: true }
      laneWidth: { type: number, optional: true, default: 340, range: [220, 600] }
returns: SequenceBuilder { step, build }
typical_use:
  - "UML sequence diagram with synchronous message round-trips"
  - "API call timeline (Client -> API -> DB -> API -> Client)"
  - "3-5 actors of synchronous interaction on one page"
constraints:
  - "actors order = left-to-right header ordering, cannot reorder later"
  - "step.from / step.to must reference names exactly as listed in actors"
  - "engine auto-generates lifeline, header, footer, activation markers - do not declare manually"
common_hallucinations:
  - 'sequence(id, topic, actors) — opts must be a single object, not positional args'
  - '.step("User", "API", "label") — step takes object, not positional args'
  - '.step({ actor: ..., message: ... }) — use from / to / label, not actor / message'
  - '.participant("Alice") — no such method, declare in actors array instead'
  - '.note({ over: "Alice" }) — no note API yet, use step.sub instead'
```

:::

## Arguments

The arguments of `sequence` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Diagram-wide identifier, unique within the page. |
| `topic` | `string` | Required | Title rendered at the top of the diagram. |
| `actors` | `string[]` | Required | Actor names lined up in the top header; array order = left-to-right ordering. |
| `defaultTone` | `Tone` | Optional | Default color tone for every step; each step can override via `tone`. |
| `defaultStyle` | `EdgeStyle` | Optional | Default line style for every edge; each step can override via `style`. |
| `laneWidth` | `number` | Optional | Width of one lane in px, default `340`. |

The arguments of `step` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `from` | `string` | Required | Actor name where the arrow starts. |
| `to` | `string` | Required | Actor name where the arrow ends. |
| `label` | `string` | Required | Primary label on the arrow (line 1). |
| `sub` | `string` | Optional | Secondary label on the arrow (line 2), equivalent to a mermaid Note. |
| `tone` | `Tone` | Optional | Override the color tone for just this step. |
| `style` | `EdgeStyle` | Optional | Arrow style (`solid`, `dotted-flow`, ...). |

## Basic example

A complete example that wires a login flow across three actors (`User`, `API`, `DB`).

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Login Flow"
type: sequence

actors:
  - User
  - API
  - DB

flow:
  - User -> API: "POST /login"
  - API -> DB: "SELECT credentials"
  - DB -> API: "rows" (success, dotted-flow)
  - API -> User: "200 OK" (success)
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: login, topic: Login Flow }
actors: [User, API, DB]
steps:
  - { from: User, to: API,  label: "POST /login", sub: "email + password" }
  - { from: API,  to: DB,   label: "SELECT credentials" }
  - { from: DB,   to: API,  label: rows,   tone: success, style: dotted-flow }
  - { from: API,  to: User, label: "200 OK", sub: JWT, tone: success }
intent: synchronous round-trip User -> API -> DB -> API -> User on a single timeline
```

:::

[preview:presets/seq-demo]

When you run this code, the engine lines up three lanes side by side and auto-places headers and footers above and below each lane.
Four flow lines produce four arrows that flow downward in order; the third and fourth arrows tagged with the `(success)` trailing option render in green hues.

v0.5 Text DSL cannot declare `sub` (the secondary label, line 2).
Reach for the chain API below when you need a mermaid Note-equivalent sub-label.

## API Reference (chain API)

v0.5 Text DSL cannot express `step.sub` (the secondary label), so use the chain API below when you need a mermaid Note-equivalent.

The `sequence` function signature and the builder interface are shown below.

```ts
sequence({
  id: string;
  topic: string;
  actors: string[];           // actor names shown in the top header
  defaultTone?: Tone;
  defaultStyle?: EdgeStyle;
  laneWidth?: number;         // width of one lane, default 340
}): SequenceBuilder

interface SequenceBuilder {
  step(input: {
    from: string;
    to: string;
    label: string;
    sub?: string;
    tone?: Tone;
    style?: EdgeStyle;
  }): SequenceBuilder;
  build(): CdlDiagram;
}
```

A complete usage example is shown below.

```ts
import { sequence } from "@cardenelabs/cdl";

export const login = sequence({
  id: "login",
  topic: "Login Flow",
  actors: ["User", "API", "DB"],
})
  .step({ from: "User", to: "API", label: "POST /login", sub: "email + password" })
  .step({ from: "API",  to: "DB",  label: "SELECT credentials" })
  .step({ from: "DB",   to: "API", label: "rows", tone: "success", style: "dotted-flow" })
  .step({ from: "API",  to: "User", label: "200 OK", sub: "JWT", tone: "success" })
  .build();
```

## Internal structure

When you call `build`, the engine auto-generates the following pieces.
You never declare them yourself.

- `actors.length` lanes (`lifeline = true`, so a dotted vertical line runs down the middle of each lane).
- A header per lane top (kind = `card`, width 140 px, height 72 px).
- A footer per lane bottom (the same box as the header).
- One activation marker per step (an invisible 2 x 2 px node).
- One edge per step (from the activation marker on the `step.from` lane to the `step.to` lane).

Thanks to this auto-generation, you only declare "who the actors are" and "what they send in which order."

## Mapping to mermaid

The table below maps the key mermaid `sequenceDiagram` syntax to its cdl `sequence` counterpart.

| mermaid | cdl |
|---|---|
| `sequenceDiagram` | `sequence({ id, topic, actors })` |
| `participant Alice` | element of `actors: ["Alice", ...]` |
| `Alice->>API: invoke` | `.step({ from: "Alice", to: "API", label: "invoke" })` |
| `API-->>Alice: response` | `.step({ from: "API", to: "Alice", label: "response", style: "dotted-flow" })` |
| `Note over Alice` | use `step.sub` for now |

The mermaid `Note` is currently expressed via `step.sub` (a secondary label).
A dedicated API for standalone note boxes is planned.

## Related

- [Mermaid Migration Guide](/docs/en/cdl/overview/mermaid-migration) walks through the mermaid -> cdl conversion path.
- [swimlane preset](/docs/en/cdl/presets/swimlane) is the better choice when time is not the protagonist.
- [API Reference](/docs/en/cdl/reference/api#sequence) is the canonical SSOT for type definitions.
