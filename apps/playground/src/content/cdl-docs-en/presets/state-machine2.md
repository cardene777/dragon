# stateMachine2 preset

`stateMachine2` is a high-level API for an extended FSM that resembles UML statecharts.
On top of the basic [stateMachine preset](/docs/en/cdl/presets/state-machine), it adds **nested state** (parent), **entry / exit actions** (run when entering / leaving), and **transition actions** (run during a transition).

## When to use

`stateMachine2` works for detailed state models in UI or business workflows.

- Visualising React useReducer / xstate statechart designs
- Expressing "Loading / Idle nested inside Active" hierarchies
- Annotating entry / exit / transition actions in a design doc

If you don't need actions or nesting, [stateMachine preset](/docs/en/cdl/presets/state-machine) is enough.

## Why a separate preset

`stateMachine` keeps a simple API of `trigger` + `guard`.
`stateMachine2` layers nested + action support so you can fully capture UML statechart semantics.
Keeping the two side by side lets you pick "lightweight workflow with `stateMachine`" or "detailed design with `stateMachine2`".

## Signature

```ts
stateMachine2({ id: string, topic: string, stateWidth?: number, defaultTone?: Tone })
  .state({ id, title, initial?, final?, parent?, entry?, exit? })
  .transition({ from, to, trigger, guard?, action?, tone? })
  .build()
```

[preview:presets/sm2-demo]

## Subtitle / sub annotations

State subtitles can include:

- `entry: <action>` — action on entering
- `exit: <action>` — action on leaving

Transition `sub` can include:

- `[<guard>]` — guard condition (UML notation)
- `/<action>` — action on transition (UML notation)

States with a `parent` get `nested in <parent>` appended to the eyebrow.

## Complete example

```ts
import { stateMachine2 } from "@cardenelabs/cdl";

export const authFsm = stateMachine2({ id: "auth", topic: "Auth FSM (extended)" })
  .state({ id: "idle", title: "Idle", initial: true, entry: "clearForm" })
  .state({ id: "active", title: "Active" })
  .state({ id: "loading", title: "Loading", parent: "active",
           entry: "startSpinner", exit: "stopSpinner" })
  .state({ id: "done", title: "Done", final: true })
  .transition({ from: "idle", to: "loading", trigger: "submit", action: "validate" })
  .transition({ from: "loading", to: "done", trigger: "success", tone: "success" })
  .build();
```

[preview:presets/sm2-demo]

## See also

- [stateMachine preset](/docs/en/cdl/presets/state-machine) — simpler FSM
- [flowchart preset](/docs/en/cdl/presets/flowchart) — for business processes rather than state
