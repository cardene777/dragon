# CDL Text DSL Specification (v0.5)

This is the grammar specification for `@cardenelabs/cdl`'s **Mermaid-feeling Text DSL**.
We designed it as a notation that satisfies three axes at once — non-engineers, LLMs, and humans.

> This page is a **Reference**.
> It exhaustively lists syntax elements for readers who want to look up grammar.
> If you want to "have an LLM generate it", see [LLM Generation Guide](/docs/en/cdl/text-dsl-llm-guide).
> If you want to "migrate from the builder API", see [Migration Guide](/docs/en/cdl/migration-guide).

## TOC

This page is long, so jump from the table of contents to the section you need.

- [Design principles](#design-principles)
- [Overall structure](#overall-structure)
- [Syntax elements](#syntax-elements)
  - [`title` / `type`](#title--type)
  - [`actors`](#actors)
  - [`flow`](#flow)
  - [`states` / `animation`](#states--animation)
- [Complete examples](#complete-examples)
  - [Example 1 ... login flow (sequence)](#example-1--login-flow-sequence)
  - [Example 2 ... transfer animation (sequence + tween)](#example-2--transfer-animation-sequence--tween)
  - [Example 3 ... multiple phases (sequential animation)](#example-3--multiple-phases-sequential-animation)
- [Error handling](#error-handling)
- [i18n support](#i18n-support)
- [Version history / extension points](#version-history--extension-points)
- [File extension / glob conventions](#file-extension--glob-conventions)
- [Related](#related)

## Design principles

These are the six principles we kept while designing the DSL.
They form the basis of every syntax choice.

| Principle | Content |
|---|---|
| Mermaid feel | Lightweight, readable English keywords with a YAML-style structure (like `mermaid`) |
| Zero programming feel | Hide brackets and separators such as `()`, `{}`, and `;` as much as possible |
| Close to natural language | Allow native writing for value content in both Japanese and English (wrapped in quotes) |
| LLM friendly | Structure with YAML-style mappings plus labeled blocks |
| Preserve expressiveness | Express everything the builder API can (compiles to `LaidDiagram`) |
| Friendly errors | Show line number, expected value, and a fix suggestion |

"Mermaid feel" and "preserve expressiveness" form a hard trade-off, but we reconcile them by compiling to the builder API.
The DSL focuses on the layer humans write or LLMs generate, while expressiveness is delegated to the internal builder.

## Overall structure

A DSL file is composed of the following four to six blocks.
`title` / `type` / `actors` / `flow` are required, and `states` / `animation` are optional.

```
title: "<string>"
type: <preset name>           # pick from 12 presets

actors:                       # actor / node / entity declarations
  - <name>                    # treated as actor when kind is omitted
  - <name>: <kind>            # kind specified with colon

flow:                         # edge + action declarations
  - <from> -> <to>: "<label>"
  - <from> -> <to>: "<label>" (<tone>)

states:                       # animation state declarations as a YAML mapping
  <state name>: <initial value>

animation:                    # phase / tween / set declarations
  - step: "<phase name>" <duration>
    focus: [<element 1>, <element 2>]
    tween:
      <state name>: <from> -> <to>
    set:
      <state name>: "<value>"
    badge: "<label>"
    body: "<body text>"
```

Every block has the same shape — "English keyword + colon + YAML-style children".
That uniformity lets LLMs grasp the structure and the parser predict layout.

## Syntax elements

We walk through each block's syntax one by one.
For fine-grained behavior, also see the parser implementation under `packages/cdl/src/text-dsl/v05/parser.ts`.

### `title` / `type`

The top two lines declare the diagram's meta information.
Both are required.

```
title: "Login Flow"
type: sequence
```

`title:` maps to `LaidDiagram.topic` and shows up in the page header.
Wrap values that contain Japanese characters or whitespace in double quotes.
`type:` takes one of the 12 presets — `sequence`, `flow`, `swimlane`, `er`, `state`, `topology`, `solidity`, `gantt`, `class`, `pie`, `c4`, or `mind`.

### `actors`

The `actors:` block declares the actors, nodes, and entities that appear in the diagram.
Specify the kind with the colon form `- name: kind`.

```
actors:
  - User
  - API: function
  - DB: storage
```

Omitting the kind treats it as actor.
The kinds you can write cover all 29 NodeKinds (`actor` / `function` / `storage` / `event` / `cdn` / and others).
The name itself acts as the id, so no separate id assignment is needed (it is slugified internally).
The legacy v0.4 `- name (kind)` parenthesized form is also accepted by the parser for back-compat.

### `flow`

The `flow:` block lists arrows between actors in time order.
Numeric prefixes were removed in v0.5; the list uses a YAML-style bullet form instead.

```
flow:
  - User -> API: "login credentials"
  - API -> DB: "SELECT" (info)
  - DB -> API: "rows" (success)
  - API -> User: "200 OK" (success)
```

Each line is shaped as `- <from> -> <to>: "<label>"`.
We recommend `->` for the arrow; `→` / `=>` / `>>` are also normalized internally.
The trailing `(...)` is the tone, where you can write the English keywords `success` / `error` / `warning` / `info` / `neutral` (the Japanese `成功` / `失敗` / `警告` / `情報` / `中立` is also accepted for back-compat).
Edge ids are auto-generated as `{from-slug}-{to-slug}`, with a numeric suffix on duplicates.

### `states` / `animation`

`states:` declares animation variables as a YAML mapping, and `animation:` lists the phases.
Both are optional — omit them if you only need a static diagram.

#### `states`

```
states:
  balance: 100
  status: "idle"
```

Declare multiple states at once with a YAML mapping.
Embed the declared state as `{stateId}` inside a node's `value` or `rows` to surface the interpolated value on screen.

#### `animation` (step / focus / tween / set / badge / body)

`- step: "<phase name>" <duration>` declares a single phase.
List several to play them in sequence.

```
animation:
  - step: "send" 1.5s
    focus: [User, API]
    set:
      status: "authenticating"
    badge: "sending"
    body: "User submits credentials"
```

`step:` specifies the phase id and play duration.
The duration accepts the English short forms `1.5s` / `1500ms` / `2s` (the legacy `1.5 秒` form is accepted for back-compat).
The children mean the following.

- `focus:` ... equivalent to the builder API's `.activate()` — an array such as `[a, b]`
- `tween:` ... linear interpolation, a YAML mapping (`<state>: <from> -> <to>`)
- `set:` ... instant switch, a YAML mapping (`<state>: <value>`)
- `badge:` ... equivalent to `.badge()`
- `body:` ... equivalent to `phase.body`

#### State transitions (`tween` / `set`)

Inside a phase, `tween:` and `set:` change state values.
`tween:` does linear interpolation; `set:` switches instantly.

```
animation:
  - step: "transfer" 1.5s
    tween:
      balance: 100 -> 90       # tween (lerp)
    set:
      status: "done"           # set (instant)
```

`tween:` is for numeric state only and linearly interpolates over the phase duration.
`set:` supports both numeric and string state and switches the value instantly at the start of the phase.

## Complete examples

We show three full DSL examples below.
Each is paired with the builder API output it compiles into.

### Example 1 ... login flow (sequence)

This is the most basic sequence diagram.
You can write it as a static diagram with no animation.

```
title: "Login Flow"
type: sequence

actors:
  - User
  - API: function
  - DB: storage

flow:
  - User -> API: "login credentials"
  - API -> DB: "SELECT" (info)
  - DB -> API: "rows" (success)
  - API -> User: "200 OK" (success)
```

Passing this to `textDslToDiagram()` yields a `CdlDiagram` equivalent to the builder API below.
Expressiveness is fully on par with the builder API.

```ts
sequence({
  id: "login",
  topic: "Login Flow",
  actors: ["User", "API", "DB"],
})
  .step({ from: "User", to: "API", label: "login credentials" })
  .step({ from: "API", to: "DB", label: "SELECT", sub: "info" })
  .step({ from: "DB", to: "API", label: "rows", tone: "success" })
  .step({ from: "API", to: "User", label: "200 OK", tone: "success" })
  .build()
```

The DSL takes 12 lines and the builder API takes 11 lines — almost identical.
The DSL wins on "Mermaid-feeling readability" and "easy for LLMs to generate".

[preview:presets/seq-demo]

### Example 2 ... transfer animation (sequence + tween)

This is an example that uses state and tween.
It is a typical case completed in v0.5.

```
title: "Transfer"
type: sequence

actors:
  - Client
  - API: storage
  - Server

flow:
  - Client -> API: "deposit" (info)
  - API -> Server: "send" (success)

states:
  clientBalance: 100
  serverBalance: 0

animation:
  - step: "transfer" 1.5s
    focus: [Client, API, Client->API]
    tween:
      clientBalance: 100 -> 90
      serverBalance: 0 -> 10
    body: "Client sends 10 to Server via API"
```

Compiling this yields the builder API equivalent below.
You can see that the DSL drastically reduces the boilerplate of the low-level builder.

```ts
diagram("transfer", { topic: "Transfer" })
  .lane("client", { width: 340, label: "Client", lifeline: true })
  // ... each lane's header / spacer / step box / footer
  .state("clientBalance", { initial: 100 })
  .state("serverBalance", { initial: 0 })
  .phase(
    "transfer",
    { duration: 1500, title: "transfer", body: "Client sends 10 to Server via API" },
    (p) => p
      .activate("client-header", "client-footer", "api-header", "api-footer", "e0-client-api")
      .tween("clientBalance", 100, 90)
      .tween("serverBalance", 0, 10),
  )
  .build()
```

The builder API requires you to declare each actor's header, footer, and spacer one at a time.
The DSL compiler auto-generates that boilerplate.

[preview:presets/seq-demo]

### Example 3 ... multiple phases (sequential animation)

This is an example of a sequential animation with multiple phases.

```
title: "Auth flow"
type: sequence

actors:
  - User
  - Auth: function

flow:
  - User -> Auth: "login"
  - Auth -> User: "token" (success)

states:
  status: "idle"

animation:
  - step: "send" 1s
    focus: [User, User->Auth]
    set:
      status: "authenticating"
    body: "User submits credentials"

  - step: "verify" 1s
    focus: [Auth]
    badge: "verifying"
    body: "Auth verifies credentials"

  - step: "success" 1s
    focus: [Auth, Auth->User]
    set:
      status: "authenticated"
    badge: "OK"
```

Three phases play in sequence for a total animation of three seconds.
State (`status`) persists across phases, so you can carry values from one phase to the next.

### Legacy example ... v0.4 syntax (accepted for back-compat)

The old v0.4 Japanese-keyword + numeric-prefix form is still accepted by the parser. New docs should prefer the v0.5 syntax.

```
タイトル: ログインの流れ
種類: sequence

登場人物:
  - ユーザー
  - API (function)

流れ:
  1. ユーザー → API: ログイン情報
```

## Error handling

On failure, the parser returns an error message bundling line number, expected value, and a fix suggestion.
We aim for a granularity that humans can read and immediately fix.

### Friendly error messages

This is the output for an undeclared actor.
What is wrong and how to fix it fits in two lines.

```
Error: line 5 "User -> APIServer" ... "APIServer" is not in actors.
Hint: add it to actors, or use an existing name (User, API, DB).
```

The `Error:` line states the cause and the `Hint:` line offers the fix.
The format is also directly usable in an LLM self-correction loop.

### Common mistakes

This table lists frequent writing mistakes and how the parser detects and suggests fixes.

| Mistake | Detection | Suggested fix |
|---|---|---|
| Actor not declared | appears in an edge | "add to actors or fix the name" |
| Kind typo | unknown NodeKind | "pick from actor / function / storage, etc." |
| Tone typo | `(sucess)` instead of `(success)`, etc. | "pick from success / error / warning" |
| Missing quotes | Japanese value left unquoted | "wrap in double quotes" |

The parser stops processing on these errors and asks for a fix.

## i18n support

In v0.5, English keywords are the SSOT.
The v0.4 Japanese keywords are accepted as a legacy back-compat alias.

| v0.5 keyword (SSOT) | v0.4 legacy alias |
|---|---|
| `title` | `タイトル` |
| `type` | `種類` |
| `actors` | `登場人物` |
| `flow` / `steps` | `流れ` |
| `states` | `状態` (single-line form) |
| `animation` / `animate` | `アニメーション` |
| `step` | `ステップ` |
| `focus` / `highlight` / `active` | `強調` |
| `tween` | `遷移` |
| `set` | `切替` |
| `badge` | `バッジ` |
| `body` / `description` | `説明` |
| `success` | `成功` |
| `error` | `失敗` |
| `warning` | `警告` |

Value content is language-free — only the keywords are pinned to English.

```
title: "Login Flow"
type: sequence

actors:
  - User
  - API: function
  - DB: storage

flow:
  - User -> API: "login credentials"
  - API -> DB: "SELECT" (info)
  - DB -> API: "rows" (success)
  - API -> User: "200 OK" (success)
```

The parser accepts `→`, `->`, `=>`, or `>>` for arrows and normalizes them internally.
When `→` is hard to type in an ASCII environment, `->` is a valid substitute.

## Version history / extension points

This table lists each feature's implementation status and upcoming features.
Items at v0.6 and beyond are in planning and the spec may change.

| Feature | Syntax | Status |
|---|---|---|
| **Mermaid-feeling syntax + 12 presets complete (English keywords + YAML-style + short forms)** | `title:` / `type:` / `actors:` / `flow:` / `states:` / `animation:` | **v0.5 (shipped)** |
| Animation full support across 6 presets (sequence + flow + swimlane + er + state + topology) | `アニメーション:` | v0.4 (shipped) |
| Animation full compile (state / tween / set / badge / body / highlight) ... sequence only | `アニメーション:` | v0.3 (shipped) |
| All 6 presets supported (sequence / flow / swimlane / er / state / topology) | `種類: <preset>` | v0.2 (shipped) |
| Comments | `# comment` | v0.1 (shipped) |
| Error hints | line number + fix suggestion | v0.1 (shipped) |
| i18n (Japanese + English) | `タイトル:` / `title:` | v0.1 (shipped) |
| Arrow normalization (→ -> => >>) | `A -> B` | v0.1 (shipped) |
| Duration parsing (1.5s / 1500ms / 2s) | `1.5s` | v0.1 (shipped) |
| Import / split | `import: ./other.cdl` | v0.6 |
| Conditionals | `if: <state> == <value>` | v0.6 |
| Loops | `loop: <state> < <value>` | v0.6 |
| Visual editor | (UI) | v1.0 |
| Bidirectional sync | (UI) | v2.0 |

### Per-preset interpretation (12 kinds)

This table summarizes how each preset interprets `actors` and `flow` in a single view.
The preset decides whether `actors` mean actor, entity, or state.

| Preset | Role of actors | Flow interpretation | Limitations |
|---|---|---|---|
| `sequence` | actors (horizontal lifelines) | step (timeline message) | - |
| `flow` | nodes stacked vertically (one lane) | auto next-step edges | - |
| `swimlane` | lane labels | auto-place nodes + edges | - |
| `er` | entities (no rows) | relations, cardinality inside the label as `(1:N)` | "column definitions" under review for v0.6 |
| `state` | FSM states, first = initial, last = final | transitions (label = trigger, sub = guard) | - |
| `topology` | containers inside a single group | connects | multi-group support under review for v0.6 |
| `solidity` | contracts + EOAs (Wallet / Contract / Storage slot) | call / event / emit timeline | - |
| `gantt` | task rows (label + owner) | task + duration | parallel tasks under review for v0.6 |
| `class` | classes (attribute + method) | inheritance / aggregation / implementation relations | - |
| `pie` | slices (label + share) | share % totaling 100 | - |
| `c4` | containers (system / container / component) | relations (label = protocol) | covers C4 Levels 1–3 |
| `mind` | root + branches (hierarchy) | parent-child relations | radial layout |

Detailed `rows` for `er` and multiple groups in `topology` are currently only available through the builder API.
We plan DSL support for v0.6 and later.

## File extension / glob conventions

This table summarizes the file extension for DSL storage and detection rules.
The docs site's preview mechanism follows the same conventions.

| Use case | Extension | Detection |
|---|---|---|
| Text DSL file | `.cdl` | `*.cdl` |
| TypeScript builder (back-compat) | `.cdl.ts` | `**/*.cdl.ts` |
| Block inside Markdown | ```` ```cdl ```` | auto-previewed on the docs site |

The ```` ```cdl ```` block inside Markdown is automatically converted to a preview when the docs site renders the page.
We designed it so that example code in specs stays runnable as-is.

## Related

This section points to the next docs.

- [Primitives](/docs/en/cdl/primitives/README) ... the basic elements of `LaidDiagram` that the DSL compiles to
- [Presets](/docs/en/cdl/presets/README) ... the 12 presets you specify with `type:`
- [API Reference](/docs/en/cdl/reference/api) ... the builder API (public through v0.x, under review for internal-only at v1.0)
- [LLM Generation Guide](/docs/en/cdl/text-dsl-llm-guide) ... steps for having an LLM generate the DSL
- [Migration Guide](/docs/en/cdl/migration-guide) ... migrating from the builder API to the DSL
