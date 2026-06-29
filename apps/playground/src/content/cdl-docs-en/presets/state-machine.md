# stateMachine preset

The `stateMachine` preset is a high-level API that assembles an FSM (Finite State Machine, a model that expresses a workflow through states and transitions between them) from `state` and `transition` declarations.
It corresponds to mermaid `stateDiagram-v2`.

You declare a state, raise the `initial` (start) and `final` (terminal) markers, and describe transitions with a `trigger` (the event that fires the transition) and a `guard` (the condition).
Return transitions (such as `error` -> `idle`, which point backward against the forward path) are auto-detected by the engine, which draws an upper detour bezier (a U-shaped curve).

## When to use it

`stateMachine` is ideal when state is the protagonist of the workflow.
Four to eight states with return transitions or conditional branches give you the best readability.

- You want to describe the state transitions of a workflow or process.
- You want to visualize the states of a button UI (`Idle`, `Loading`, `Done`, `Error`).
- You want to show the progress of an order or request (`Pending`, `Approved`, `Rejected`, ...).

When there is no return transition and the flow is straight, the [flow preset](/docs/en/cdl/presets/flow) yields a shorter declaration.

## Why split this preset

Drawing an FSM with the low-level API forces you to compute the bezier for each return transition by hand and to avoid overlaps with the forward path, and even a four-state diagram becomes tangled.
The `stateMachine` preset auto-detects return transitions and lets the engine route the detour, so you only declare `from` and `to`, and the forward and back paths separate themselves.

> Difference from mermaid: mermaid `stateDiagram-v2` marks the initial state with `[*]`, while cdl uses the explicit boolean flag `initial: true`. mermaid requires manual tweaks to avoid return-transition overlap, while cdl auto-detours.

## Signature

::: tabs

@@@ humans 👤 For humans

A state machine in v0.5 Text DSL uses `type: state`, lists each state with the `state` kind, and writes transitions in `flow`.

```text
title: "<FSM topic>"
type: state

actors:
  - <State 1>: state
  - <State 2>: state
  - <State 3>: state

flow:
  - <State 1> -> <State 2>: "<trigger event>"
  - <State 2> -> <State 3>: "<trigger event>" (<tone>)
  - <State 3> -> <State 1>: "<trigger event>"
```

[preview:presets/fsm-demo]

The declaration order of states becomes the left-to-right ordering of the forward path, and the engine detects return transitions (whose `from` index exceeds the `to` index) and auto-draws them as an upper bezier curve.
v0.5 Text DSL cannot express `initial` / `final` flags or `guard` (the sub-label condition); see the "API Reference (chain API)" section at the bottom of this page when you need them.

@@@ llm 🤖 For LLM

```yaml
fn: stateMachine(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      stateWidth: { type: number, optional: true, default: 360, range: [240, 600] }
      defaultTone: { type: Tone, optional: true }
returns: StateMachineBuilder { state, transition, build }
typical_use:
  - "FSM with 4-8 states, return transitions, or conditional branches"
  - "button UI state visualization (Idle / Loading / Done / Error)"
  - "order or request progress (Pending / Approved / Rejected)"
constraints:
  - "state declaration order = left-to-right forward path order"
  - "return transitions (from-index > to-index) auto-detour as upper U-shaped bezier - do not draw bezier manually"
  - "trigger is required on every transition (event name)"
  - "guard is optional sub label, rendered in monospace below trigger"
  - "for straight-line flow without return transitions, prefer flow preset"
common_hallucinations:
  - '.state({ id, title, type: "initial" }) — use initial: true boolean, not type string'
  - '.transition({ from, to, label: "submit" }) — field is trigger, not label'
  - '.state({ id, title, start: true }) — field is initial, not start'
  - 'stateMachine({ states: [...], transitions: [...] }) — declare via .state() / .transition() chain'
  - '.transition({ from, to, trigger, condition: "x < 3" }) — field is guard, not condition'
```

:::

## Arguments

The arguments of `stateMachine` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Diagram-wide identifier, unique within the page. |
| `topic` | `string` | Required | Title rendered at the top of the diagram. |
| `stateWidth` | `number` | Optional | Width of one state in px, default `360`. |
| `defaultTone` | `Tone` | Optional | Default color tone for every transition. |

The arguments of `state` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | State identifier, unique within the diagram. |
| `title` | `string` | Required | Primary label shown inside the state. |
| `initial` | `boolean` | Optional | When `true`, marks the start state and prints `"Initial"` in the eyebrow. |
| `final` | `boolean` | Optional | When `true`, marks the terminal state and prints `"Final"` in the eyebrow. |

The arguments of `transition` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `from` | `string` | Required | Source state id. |
| `to` | `string` | Required | Target state id. |
| `trigger` | `string` | Required | Primary edge label (line 1), the event name. |
| `guard` | `string` | Optional | Sub edge label (line 2), the condition expression. |
| `tone` | `Tone` | Optional | Override the color tone for just this transition. |

## Basic example

A complete example that assembles a four-state auth FSM (`Idle`, `Loading`, `Done`, `Error`).

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Auth FSM"
type: state

actors:
  - Idle: state
  - Loading: state
  - Done: state
  - Error: state

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "success" (success)
  - Loading -> Error: "fail" (error)
  - Error -> Idle: "retry"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: fsm, topic: "Auth FSM" }
states:
  - { id: idle,    label: Idle,    initial: true }
  - { id: loading, label: Loading }
  - { id: done,    label: Done,    final: true }
  - { id: error,   label: Error }
transitions:
  - { from: idle,    to: loading, trigger: submit }
  - { from: loading, to: done,    trigger: success, tone: success }
  - { from: loading, to: error,   trigger: fail,    tone: error }
  - { from: error,   to: idle,    trigger: retry,   guard: "if attempts < 3" }
intent: forward path idle->loading->done/error plus return transition error->idle drawn as auto-detour bezier
```

:::

[preview:presets/fsm-demo]

The code lays four states out horizontally, draws the forward path (`Idle` -> `Loading` -> `Done` or `Error`) as straight lines, and lets the engine draw the return transition (`Error` -> `Idle`) as an upper bezier curve.

v0.5 Text DSL cannot express the `initial` and `final` flags or the `guard` (transition condition).
Reach for the chain API below when you need any of those.

## API Reference (chain API)

v0.5 Text DSL cannot express the `initial` / `final` markers or `guard` (sub label), so use the chain API below when you need a detailed FSM.

The `stateMachine` function signature and the builder interface are shown below.

```ts
stateMachine({
  id: string;
  topic: string;
  stateWidth?: number;        // width of one state, default 360
  defaultTone?: Tone;
}): StateMachineBuilder

interface StateMachineBuilder {
  state(s: FsmState): StateMachineBuilder;
  transition(t: FsmTransition): StateMachineBuilder;
  build(): CdlDiagram;
}

interface FsmState {
  id: string;
  title: string;
  initial?: boolean;          // start state
  final?: boolean;            // terminal state
}

interface FsmTransition {
  from: string;
  to: string;
  trigger: string;            // edge label (primary)
  guard?: string;             // edge sub label (condition)
  tone?: Tone;
}
```

A complete usage example is shown below.

```ts
import { stateMachine } from "@cardenelabs/cdl";

export const fsm = stateMachine({ id: "fsm", topic: "Auth FSM" })
  .state({ id: "idle",    title: "Idle",    initial: true })
  .state({ id: "loading", title: "Loading" })
  .state({ id: "done",    title: "Done",    final: true })
  .state({ id: "error",   title: "Error" })
  .transition({ from: "idle",    to: "loading", trigger: "submit" })
  .transition({ from: "loading", to: "done",    trigger: "success", tone: "success" })
  .transition({ from: "loading", to: "error",   trigger: "fail",    tone: "error" })
  .transition({ from: "error",   to: "idle",    trigger: "retry",   guard: "if attempts < 3" })
  .build();
```

## Auto-detour for return transitions

When the engine detects a transition whose `from` state index is greater than its `to` index (a return transition such as `error` -> `idle`), it auto-draws an upper detour bezier (a U-shaped curve).
The forward path (`idle` -> `loading` -> `done` -> `error`) and the return path stay fully separated.

Internally, the engine sets the attribute `routing: "back-detour"` for you.
You write nothing extra to avoid overlap between forward and back paths.

## `guard` (transition condition)

When you pass `guard`, the edge sub label (line 2) shows the condition.
The expression is a string and renders in a monospace font.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "guard example"
type: state

actors:
  - Error: state
  - Idle: state

flow:
  - Error -> Idle: "retry"
```

@@@ llm 🤖 For LLM

```yaml
transitions:
  - { from: error, to: idle, trigger: retry, guard: "if attempts < 3" }
intent: passing guard renders the condition as a sub label in monospace below trigger
```

:::

[preview:presets/fsm-demo]

v0.5 Text DSL cannot render `guard` (the sub label condition), so only the primary `retry` label appears.
Reach for the chain API below when you need a sub label.

```ts
.transition({ from: "error", to: "idle", trigger: "retry", guard: "if attempts < 3" })
```

The expression language is free; use pseudocode or natural language that your readers can understand.

## `initial` and `final` markers

The `initial` and `final` flags auto-attach special strings to the state's eyebrow.
They correspond to mermaid's `[*] --> Idle` and `Done --> [*]`.

| marker | eyebrow | Meaning |
|---|---|---|
| `initial: true` | `"Initial"` | start state, the entry of the diagram |
| `final: true` | `"Final"` | terminal state, the exit of the diagram |
| (none) | `"State"` | a regular state |

You can raise multiple `initial` or `final` flags on the same diagram.
Multiple initials express "an FSM with several entries"; multiple finals express "an FSM with several exit conditions."

## Related

- [API Reference](/docs/en/cdl/reference/api#statemachine) is the canonical SSOT for type definitions.
- [Mermaid Migration Guide](/docs/en/cdl/overview/mermaid-migration) walks through the mermaid -> cdl conversion path.
- [flow preset](/docs/en/cdl/presets/flow) is the choice when the process flow is the protagonist instead of state.
