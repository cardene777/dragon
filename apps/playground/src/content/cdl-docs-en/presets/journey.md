# userJourney preset

`userJourney` is a high-level API for laying out a user journey map (UX research style) as a time-ordered sequence of `step` items.
It corresponds to the mermaid `journey` syntax.

Each step carries an `emotion` (one of delighted / happy / neutral / frustrated / angry) and the edge tone is auto-coloured per emotion.
You can attach `touchpoint` and `opportunity` to record where the contact happens and what could be improved.

## When to use

`userJourney` is great for sharing UX / product research outcomes.

- Visualising signup / onboarding sequence with emotional ups and downs
- Spotlighting friction points (frustrated stages) to the team
- Demonstrating user pain points to product designers / PMs

If you want to model state transitions instead of a timeline, use [stateMachine preset](/docs/en/cdl/presets/state-machine).
For step-level processing details, [flow preset](/docs/en/cdl/presets/flow) fits better.

## Why a dedicated preset

With the low-level API you would assign emotion-based tones and link each step manually.
`userJourney` derives tone from the emotion enum and auto-generates the previous → next edge, so you can build the journey purely by listing steps.

## Signature

```ts
userJourney({ id: string, topic: string, stepWidth?: number, defaultTone?: Tone })
  .step({ id, title, emotion: "delighted" | "happy" | "neutral" | "frustrated" | "angry",
          touchpoint?, opportunity? })
  .build()
```

[preview:presets/journey-demo]

## emotion → tone mapping

| emotion | tone | visual |
|---|---|---|
| `delighted` | success | green, joy |
| `happy` | teal | teal, satisfied |
| `neutral` | info | blue, neutral |
| `frustrated` | warning | yellow, unhappy |
| `angry` | error | red, angry |

## Complete example

```ts
import { userJourney } from "@cardenelabs/cdl";

export const signupJourney = userJourney({ id: "signup", topic: "Signup journey" })
  .step({ id: "land", title: "Land on /", emotion: "neutral", touchpoint: "Website" })
  .step({ id: "form", title: "Fill signup form", emotion: "frustrated",
          touchpoint: "Form", opportunity: "improve input UX" })
  .step({ id: "verify", title: "Email verify", emotion: "happy", touchpoint: "Email" })
  .step({ id: "done", title: "Dashboard", emotion: "delighted", touchpoint: "Dashboard" })
  .build();
```

[preview:presets/journey-demo]

## See also

- [stateMachine preset](/docs/en/cdl/presets/state-machine) — when state transitions are the focus
- [flow preset](/docs/en/cdl/presets/flow) — emotion-less plain step sequence
- [funnel preset](/docs/en/cdl/presets/funnel) — when numbers (count / drop rate) matter
