# Verifier Guide (How to use "the eye")

This is a **How-to + Explanation** guide for running cdl's automated verification ("the eye") and keeping diagram quality high.
The first half (How-to) shows how to drive the three verifier routes.
The second half (Explanation) explains why the mechanism is needed.

> This page mixes **How-to** and **Explanation**.
> If you want to "run it now", start with the How-to section.
> If you want to understand "why it is designed this way", read the Explanation section first.
> For function signatures, see [API Reference](/docs/en/cdl/reference/api).

## TOC

This page is long, so jump to the section you need.

- [How-to ... using the three routes](#how-to--using-the-three-routes)
  - [Prerequisites](#prerequisites)
  - [Step 1 ... static validation (`validate:diagrams`)](#step-1--static-validation-validatediagrams)
  - [Step 2 ... DOM consistency check (`verify:dom`)](#step-2--dom-consistency-check-verifydom)
  - [Step 3 ... author intent verification (`verify:intent`)](#step-3--author-intent-verification-verifyintent)
  - [Partial execution and CI integration](#partial-execution-and-ci-integration)
  - [Strict mode](#strict-mode)
  - [Calling from vitest](#calling-from-vitest)
- [Explanation ... why verifiers are needed](#explanation--why-verifiers-are-needed)
  - [Role split across the three routes](#role-split-across-the-three-routes)
  - [Detection scope per route](#detection-scope-per-route)
  - [Detection examples](#detection-examples)
  - [Tolerance design philosophy](#tolerance-design-philosophy)
- [Related](#related)

---

## How-to ... using the three routes

This section only shows the steps to "just run it".
Background and design intent are collected in the Explanation section below.

### Prerequisites

Make sure the following are in place before running the verifier.
The dev server is a prerequisite for `verify:dom` and `verify:intent` in particular.

- `pnpm install` is complete
- You can launch a dev server (default `http://localhost:4321`) with `pnpm dev`
- Playwright is installed (one-time `pnpm exec playwright install`)

Only `validate:diagrams` runs without a dev server.
For instant feedback while developing locally, run `validate:diagrams` first.

### Step 1 ... static validation (`validate:diagrams`)

This is the lightest static layout check, which runs without a dev server.
Use it for instant feedback while you edit cdl.

```bash
pnpm validate:diagrams
```

This command reads only the declaration and checks AABB, clearance, and alignment.
It does not need to render the screen, so results return in under a second.

### Step 2 ... DOM consistency check (`verify:dom`)

This checks the engine's self-consistency — cdl values versus DOM attributes.
Use it to detect regressions during engine refactors.

Start a dev server in a separate terminal and then run the command below.

```bash
# 1. start dev server in a separate terminal
pnpm dev

# 2. DOM consistency check
pnpm verify:dom
```

`verify:dom` uses Playwright to fetch the real screen and matches attributes such as `data-cdl-cx` / `data-cdl-cy` against the layout-computed values.
It tours every catalog page, so the full run takes tens of seconds.

### Step 3 ... author intent verification (`verify:intent`)

This checks whether the intent you wrote in cdl (title, label, activate, tone, etc.) **appears exactly that way** on the actual screen.
It is the core mermaid-style check: is what you wrote being drawn?

Run this with the dev server up.

```bash
pnpm verify:intent
```

`verify:intent` reads the visible state of SVG `<text>` and `<path>` elements directly and matches them against the cdl declaration.
It has the highest power for finding engine bugs.

### Partial execution and CI integration

Because running every diagram takes time, we provide options for per-module runs, machine-readable output, and a baseline gate.
Pass flags as your situation requires.

```bash
# only a specific module
pnpm verify:intent -- --module patterns

# JSON output (CI / machine processing)
pnpm verify:intent -- --json > result.json

# baseline gate (allow existing fail count, block only regressions)
pnpm verify:intent -- --max-fail 10
```

`--max-fail` treats the existing fail count as a pass.
It is effective as a CI gate that stops only regressions (the increase).

### Strict mode

The default tolerance is a loose setting that catches "visually obvious deviations".
If you want to dig into fine internal engine errors, pass `--strict`.

```bash
# default uses tolerance acceptable to user vision, strict is for engine bug hunting
pnpm verify:intent -- --strict   # lane 24px / edge 40px tolerance
pnpm verify:dom    -- --strict   # particle 30px / bbox 4px tolerance
```

Under `--strict`, tolerances tighten significantly, so even normally OK diagrams may fail.
We recommend a two-handed approach: default for daily operations, `--strict` only during engine refactors.

### Calling from vitest

The verifier functions are exported as part of the npm package, so you can integrate them into vitest.
This is handy when you want to prevent regressions on specific diagrams at PR granularity.

```ts
// packages/cdl/test/intent.test.ts
import { verifyAuthorIntent } from "@cardenelabs/cdl";

test("login flow is displayed as declared", async () => {
  await page.goto("http://localhost:4321/login");
  const discs = await verifyAuthorIntent(asPageLike(page), loginDiagram);
  expect(discs).toHaveLength(0);
});
```

`verifyAuthorIntent` returns discrepancies as an array.
You can assert "zero discrepancies" with `toHaveLength(0)`.

[preview:animation/tween-simple]

---

## Explanation ... why verifiers are needed

From here, we explain why the three routes above exist and how they are designed.

Other diagram tools such as mermaid lack any engine-side mechanism that checks whether "the text you wrote actually appears on screen".
As a result, when engine bugs or layout drift occur, no one notices until the author looks at the screen.
cdl solves this problem by **automatically verifying on the engine side**.

### Role split across the three routes

The three verifiers separate concerns by verification target and whether they cost LLM tokens.
None of them use an LLM, so you can run them with zero cost.

| Verifier | Verification target | LLM | Cost |
|---|---|---|---|
| `pnpm validate:diagrams` | static layout (AABB / clearance) | not required | 0 |
| `pnpm verify:dom` | engine self-consistency (cdl value vs. DOM attribute) | not required | 0 |
| `pnpm verify:intent` | **author intent vs. actual screen** (the mermaid-style essence) | not required | 0 |

The three routes get progressively heavier.
You can run `validate:diagrams` instantly, `verify:dom` per PR, and `verify:intent` as a release gate.

### Detection scope per route

This section organizes what each verifier checks and how, axis by axis.
We split rather than merge into a single route in order to grade the trade-off between verification cost and granularity.

#### validate:diagrams (static judgment, 6 axes)

This is a lightweight check that runs without a dev server.
We designed it for instant feedback while editing cdl.

- node-visibility ... bbox area >= 80x40
- edge-label-overlap ... AABB collision
- text-readability ... font size / contrast
- row-format ... parse `key: value` of storage rows
- alignment ... cx alignment within the same lane
- clearance ... clearance policy violation

A failure here means the declaration's own structure is broken.
Fix the declaration before moving on to later routes.

#### verify:dom (engine self-consistency, 5 kinds)

This reads DOM attributes from the SVG rendered by the dev server and matches them against cdl values.
It is the most effective route for catching regressions during engine refactors.

- node position ... `data-cdl-cx` / `data-cdl-cy` match the layout-computed value
- edge path endpoints ... they sit on the `from` / `to` node sides
- edge label position ... `labelX` / `labelY` match
- bbox matching ... actual SVG viewport position vs. SVG userspace
- particle position ... mid-animation particle stays on the path
- activation ... the active class set matches `phase.activate`

When `verify:dom` fails, suspect a bug in the engine's render layer or layout layer.
Open a pull request that fixes the engine without changing the declaration.

#### verify:intent (author intent vs. actual screen, 6 axes, most important)

This directly confirms, in the mermaid spirit, "when a human writes `.node("user", { title: "User" })`, does the text `User` appear on screen?".
It is cdl's unique route for verifying the consistency between declaration and screen.

- **node-in-lane** ... node sits inside the lane area when `contain: true`
- **node-text-visible** ... `node.title` / `subtitle` / `eyebrow` are visible in SVG `<text>`
- **edge-label-visible** ... `edge.label` / `sub` are visible in SVG `<text>`
- **edge-connected** ... edge path endpoints are near the `from` / `to` nodes
- **activation-visible** ... elements declared by `.activate()` are emphasized as active on screen
- **tone-color** ... the `edge.tone` color is reflected in SVG stroke (RGB distance judgment)

A failure here means "the author's intent and the screen do not match".
Either rework the declaration or fix the engine's render layer.

### Detection examples

We show how to read the errors that the verifier produces, with two examples.
The output is formatted as `[diagram-id] axis-name (element=target id)`.

#### Bug caught by `pnpm verify:intent` ... 1

`node-title-missing` means "a title is written in the declaration, but it is not visible in an SVG `<text>` element".
This indicates a bug where the engine's render layer fails to draw the title.

```
[seq-demo] node-title-missing (element=user)
  title "User" of node "user" is not visible in SVG <text>
```

Because the cdl author wrote `title: "User"` as intended but it does not appear on screen, this is a genuine engine bug.
Fix the code under `packages/cdl/src/render/` without changing the declaration.

#### Bug caught by `pnpm verify:intent` ... 2

`activation-not-visible` means "an element declared via `.activate("user-order")` is not emphasized as active on screen".
This very likely indicates that phase activation propagation is broken.

```
[er-demo] activation-not-visible (element=user-order)
  .activate("user-order") is declared in phase "p1", but it is not emphasized as active (data-cdl-active=true) on screen
```

Because the cdl author's `phase` declaration is not effective, re-inspect the phase logic.
Common causes are a typo in the `activate` id or stalled propagation on the engine side.

### Tolerance design philosophy

The verify routes ship two tolerance presets — default and `--strict`.
The split lets you switch "how strict to look" between daily operations and active engine refactors.

| Route | Tolerance | Detection scope |
|---|---|---|
| default | loose (lane 500px, edge 80px, etc.) | only visually obvious deviations on the actual screen |
| `--strict` | strict (lane 24px, edge 40px, etc.) | down to fine internal engine error |

We recommend a two-handed approach.
Use default for the CI gate to "stop only drifts with real harm".
Use `--strict` during engine refactors to "catch even minute drifts".
Running everything under `--strict` creates fatigue from false positives, so leave it on default in normal use.

---

## Related

This section points to the next docs.
Reference whichever fits your situation.

- [Quickstart](/docs/en/cdl/overview/quickstart) ... if you want to run something in five minutes
- [API Reference](/docs/en/cdl/reference/api) ... if you want function signatures
- Internal implementation ... `packages/cdl/src/author-intent-verify.ts` / `dom-verify.ts` / `visual-validate.ts`
