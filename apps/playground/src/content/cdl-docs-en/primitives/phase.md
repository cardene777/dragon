# phase

`phase` is the primitive that splits a diagram into chronological chapters (steps).
In each phase you declare which elements to emphasize as active, which states to transition, and what to display in the footer.
By lining up multiple phases in order, you compose an animation that unfolds like a story.

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.phase(id: string, opts: { duration?: number; title: string; body: string },
  build: (p: PhaseBuilder) => PhaseBuilder)

interface PhaseBuilder {
  activate(...ids: string[]): PhaseBuilder;                       // active emphasis
  tween(stateId: string, from: number, to: number): PhaseBuilder; // linear numeric interpolation
  set(stateId: string, value: number | string): PhaseBuilder;     // instant switch
  badge(text: string): PhaseBuilder;                              // phase footer badge
}
```

@@@ llm 🤖 For LLM

```yaml
fn: .phase
args:
  - name: id
    type: string
    required: true
    constraints:
      - "1-32 chars, [a-z0-9-_], unique per diagram"
      - "referenced from phase.activate when chaining phases"
  - name: opts
    type: object
    required: true
    properties:
      duration: { type: number, optional: true, range: [400, 6000], default: 1800, hint: "milliseconds" }
      title: { type: string, required: true, max: 32, hint: "header heading" }
      body: { type: string, required: true, max: 120, hint: "1-2 sentences explainer" }
  - name: build
    type: callback
    required: true
    signature: "(p: PhaseBuilder) => PhaseBuilder"
    methods:
      activate: { args: "...ids: string[]", hint: "node / edge / phase ids to highlight" }
      tween: { args: "stateId: string, from: number, to: number", hint: "linear interpolation over duration" }
      set: { args: "stateId: string, value: number | string", hint: "instant switch, no lerp" }
      badge: { args: "text: string", hint: "footer pill label, max 16 chars" }
returns: DiagramBuilder
typical_use:
  - "step-by-step active highlighting for narrative animation"
  - "state transition (tween for number, set for string flag)"
  - "footer badge as step marker (call / processing / done etc)"
constraints:
  - "build callback must return PhaseBuilder (chain method calls)"
  - "every node should appear in at least one phase.activate to avoid muted-stale warning"
  - "tween chains across phases inherit prior end value as next start value"
  - "set with string value cannot be tweened in any phase"
common_hallucinations:
  - '.phase({ id: ..., title: ..., body: ... }, build) — opts is 2nd positional, build is 3rd'
  - '.phase("p", { ... }) — build callback is required'
  - 'PhaseBuilder.deactivate / .reset — no such methods, muted is the default'
  - '.activate({ ids: [...] }) — variadic string args, not object'
  - 'duration in seconds — duration is milliseconds'
```

:::

[preview:animation/tween-simple]

## Arguments

| Argument | Type | Required | Purpose |
|---|---|---|---|
| `id` | `string` | Required | Unique ID that identifies the phase |
| `opts.duration` | `number` | Optional | Animation duration of the phase (ms, default `1800`) |
| `opts.title` | `string` | Required | Phase heading shown above the header |
| `opts.body` | `string` | Required | Description below the header (1-2 sentences) |
| `build` | `(p: PhaseBuilder) => PhaseBuilder` | Required | Callback that declares active elements and state transitions |

## PhaseBuilder methods

| method | Purpose |
|---|---|
| `.activate(...ids)` | Emphasize the passed node / edge / phase ids as active |
| `.tween(stateId, from, to)` | Linearly interpolate the state across the full duration |
| `.set(stateId, value)` | Instantly switch the state (no interpolation) |
| `.badge(text)` | Show a small pill label at the bottom right of the phase footer |

## Return value

Returns the DiagramBuilder.
You can chain further calls to `.phase()` or `.build()`.

## Design intent

> 💡 Why phase is the time-axis unit
> mermaid's sequenceDiagram only has the implicit "top to bottom" time ordering — it cannot express "multiple actors move in the same step" or "the emphasis changes per step."
> cdl introduces phase as an explicit time unit and is designed so you enumerate active elements within the phase.
> This way, a single diagram expresses the visual effect of "focus on the current step," letting you guide the reader's eye in presentations or explanatory videos.

## Basics

The minimal code specifies `id` / `title` / `body` and enumerates active elements in the callback.
Inactive elements drop to the background in gray at 50% opacity, while active elements come forward with emphasis.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "User to API call"
type: sequence

actors:
  - user
  - api: function

flow:
  - user -> api: "call"

animation:
  - step: "call" 1.8s
    focus: [user, api]
    badge: "call"
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: call
    duration_ms: 1800
    title: "User -> API"
    body: "The user calls the API."
    activates: [user, api, user-api]
    badge: call
intent: minimal phase composition (id / duration / title / body + activate + badge)
```

:::

## activate (active emphasis)

In `activate`, enumerate the element ids to emphasize during the phase.
The method accepts node / edge / phase ids uniformly and assigns the active class to the matching elements.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "activate mix"
type: sequence

actors:
  - client
  - fn: function

flow:
  - client -> fn: "call"

animation:
  - step: "p" 1.5s
    focus: [client, fn]
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: p
    activates: [client, fn, client-fn]   # 2 nodes + 1 edge mixed under the same method
intent: activate is variadic and accepts node / edge / phase ids uniformly
```

:::

[preview:animation/tween-simple]

Active elements get a thicker stroke, gain color, and scale slightly.
Inactive elements drop to the background as muted (gray at 50% opacity).

## tween (numeric interpolation)

Linearly interpolates a state across the full duration of the phase.
See [state.md](/docs/en/cdl/primitives/state) for detailed usage.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "tween balance"
type: sequence

actors:
  - api: storage

states:
  balance: 100

animation:
  - step: "transfer" 1.5s
    focus: [api]
    tween:
      balance: 100 -> 90
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: transfer
    activates: [api]
    tweens:
      - { state: balance, from: 100, to: 90 }
intent: linear-interpolate balance over the full phase duration (100 -> 90)
```

:::

## set (instant switch)

Use it for string states or for a switch that does not need interpolation.
Use it for values where intermediate values are meaningless, such as a status flag (`loading` -> `done`).

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "submit set"
type: flow

actors:
  - fn: function

states:
  status: "idle"

animation:
  - step: "submit" 0.8s
    focus: [fn]
    set:
      status: "loading"
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: submit
    sets:
      - { state: status, to: "loading" }
intent: instant switch (no interpolation); use for string states or flags whose intermediate values are meaningless
```

:::

## badge (footer label)

Shows a small pill at the bottom right of the phase footer.
Use it to supplement the phase name or as a flow signpost.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "badge example"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "call"

animation:
  - step: "call" 1.2s
    focus: [a, b]
    badge: "processing"
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: call
    activates: [a, b]
    badge: processing   # footer bottom-right pill (max 16 chars)
intent: attach a small pill to supplement the phase name or signpost the flow
```

:::

## opts.duration / title / body

The three options around the phase header each have a distinct role.
They control the animation length and the text shown in the header.

| field | Purpose |
|---|---|
| `duration` | Animation duration of the phase (ms, default `1800`) |
| `title` | Phase heading shown above the header |
| `body` | Description below the header (1-2 sentences) |

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "DB save phase"
type: flow

actors:
  - api: function
  - db: database

flow:
  - api -> db: "INSERT"

animation:
  - step: "DB save" 2.4s
    focus: [api, db]
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: p2
    duration_ms: 2400          # default 1800, range 400..6000
    title: "Save to DB"
    body: "Add a row to the users table and commit."
    activates: [...]
intent: header trio (duration / title / body) controls animation length and the text shown in the header
```

:::

v0.5 Text DSL cannot express the phase `body` (description below the header). Use the chain API when you need supplementary description.

## Writing a natural phase chain

When you line up multiple phases chronologically, the diagram moves like a story.
By declaring active elements and state transitions in each phase, you guide the reader's eye step by step.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Auth Flow"
type: sequence

actors:
  - u
  - api: function
  - db: database

flow:
  - u -> api: "submit"
  - api -> db: "validate"
  - api -> u: "respond" (success)

states:
  status: "idle"

animation:
  - step: "submit" 1.5s
    focus: [u, api]
    set:
      status: "loading"
  - step: "validate" 1.8s
    focus: [api, db]
  - step: "respond" 1.5s
    focus: [api, u]
    set:
      status: "done"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: auth, topic: "Auth Flow" }
states:
  - { id: status, initial: "idle" }
phases:
  - { id: submit,   duration_ms: 1500, title: submit,   body: "...", activates: [u, api, u-api],   sets: [{ state: status, to: "loading" }] }
  - { id: validate, duration_ms: 1800, title: validate, body: "...", activates: [api, db, api-db] }
  - { id: respond,  duration_ms: 1500, title: respond,  body: "...", activates: [api, u, api-u],   sets: [{ state: status, to: "done" }] }
intent: declare 3 chronological phases as a flat list and combine active elements with state transitions per phase
```

:::

[preview:animation/tween-simple]

## API Reference (chain API)

Use the builder API when you need callback-based declarations or fine-grained activate id targeting (such as edge auto ids) that v0.5 Text DSL cannot express, along with the phase `body` description.

```ts
.phase("call", { duration: 1800, title: "User -> API", body: "The user calls the API." },
  (p) => p.activate("user", "api", "user-api").badge("call"))

.phase("p", { ... },
  (p) => p.activate("client", "fn", "client-fn"))   // client node + fn node + client-fn edge become active

.phase("transfer", { ... },
  (p) => p.activate("api").tween("balance", 100, 90))

.phase("submit", { ... }, (p) => p.set("status", "loading"))

.phase("call", { ... },
  (p) => p.activate("a", "b").badge("processing"))

.phase("p2", { duration: 2400, title: "Save to DB", body: "Add a row to the users table and commit." },
  (p) => p.activate(...))

diagram("auth", { topic: "Auth Flow" })
  .lane(...).nodes(...).edges(...)
  .state("status", { initial: "idle" })
  .phase("submit",   { duration: 1500, title: "submit",   body: "..." }, (p) => p.activate("u", "api", "u-api").set("status", "loading"))
  .phase("validate", { duration: 1800, title: "validate", body: "..." }, (p) => p.activate("api", "db", "api-db"))
  .phase("respond",  { duration: 1500, title: "respond",  body: "..." }, (p) => p.activate("api", "u", "api-u").set("status", "done"))
  .build();
```

## Pitfalls / errors

### Warning — node is unused

**Cause** — A node that you never included in any phase's `activate` target stays muted across every phase and looks visually "absent." The validate skill raises the `unused` warning.

**Fix example**:

```diff
.node("dangling", { lane: "l", stack: 0, kind: "actor", title: "Dangling" })
.phase("p1", { ... }, (p) => p.activate("u", "api"))
+ .phase("p2", { ... }, (p) => p.activate("dangling"))
```

Aggregate `activate` across every phase and design so each element is active at least once.

## Related

- [state](/docs/en/cdl/primitives/state) — the variable you tween / set in a phase
- [animation guide (inside the cookbook)](/docs/en/cdl/overview/cookbook) — animation example #8
- [API Reference](/docs/en/cdl/reference/api#phase) — type definitions for every field
