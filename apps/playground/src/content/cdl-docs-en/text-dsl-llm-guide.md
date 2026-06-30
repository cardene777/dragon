# Text DSL ... LLM Generation Guide (v0.5)

This is a **How-to** guide for asking an LLM (Claude / GPT / Gemini) to "draw a diagram of XYZ" and getting back chainome's Text DSL.
Combine a system prompt with few-shot examples to coax the DSL out of natural-language requests.

> This page is a **How-to**.
> It walks through the concrete task of "having an LLM generate the DSL".
> For the grammar specification itself, see [Text DSL Spec](/docs/en/cdl/text-dsl-spec).

## TOC

- [Usage (user side)](#usage-user-side)
- [Five few-shot examples](#five-few-shot-examples)
- [Prompt template (copy-paste)](#prompt-template-copy-paste)
- [LLM weak points and mitigations](#llm-weak-points-and-mitigations)
- [Evaluation metrics (future)](#evaluation-metrics-future)
- [Related](#related)

## Usage (user side)

Set the following system prompt on ChatGPT, Claude, Cursor, and similar tools.
With this prompt loaded as context, throwing natural-language requests at the LLM produces the DSL.

```
You are a specialist AI that generates chainome's Text DSL.
Receive the user's request and output v0.5 DSL that conforms to docs/cdl/text-dsl-spec.md.

Rules:
- Always write the four blocks: `title` / `type` / `actors` / `flow` (English keywords)
- Add `states` and `animation` blocks when animation is needed
- Pick `type` from the 12 presets: sequence / flow / swimlane / er / state / topology / solidity / gantt / class / pie / c4 / mind
- Specify actor kinds with the colon form `- name: kind` (actor / function / storage / event / cdn / service / database / cache / queue, etc.)
- Write `flow` entries as `- <from> -> <to>: "<label>"` — no numeric prefix
- Pick a tone from (success) (error) (warning) (info) (neutral)
- Wrap Japanese or whitespace-containing values in double quotes
- Use English short forms for durations: 1.5s / 1500ms / 2s
- Write in friendly prose (technical-writing style)
- When in doubt, make a reasonable assumption (do not ask)
```

The final rule, "do not ask", reduces conversational round-trips.
Letting the LLM decide tends to produce fewer retries overall.

## Five few-shot examples

We prepared five examples to ship alongside the system prompt — they sharply raise generation quality.
For coverage, the set spans four families: static, animated, blockchain, and architecture.

### Example 1 ... "login flow"

This is the most basic sequence-diagram request and the expected DSL output.
It sits as a defaults case with no twists.

**Request**: Draw a login flow

**Output**:
```
title: "Login Flow"
type: sequence

actors:
  - User
  - API Server: function
  - DB: storage

flow:
  - User -> API Server: "send login credentials"
  - API Server -> DB: "fetch user record" (info)
  - DB -> API Server: "user record" (success)
  - API Server -> User: "200 OK + JWT token" (success)
```

Labels are kept toward natural-language prose.
Prefer a style that shows the action clearly rather than short trace-log-like glyphs.

### Example 2 ... "transfer with animation"

This is an animation example covering state, tween, focus, badge, and body.
It shows the full animation syntax in a single example.

**Request**: A transfer flow where Client sends 10 to Server via a API, with a balance animation

**Output**:
```
title: "Client -> Server transfer"
type: sequence

actors:
  - Client
  - API: storage
  - Server

flow:
  - Client -> API: "deposit(10)" (info)
  - API -> Server: "send(10)" (success)

states:
  clientBalance: 100
  serverBalance: 0

animation:
  - step: "transfer" 1.5s
    focus: [Client, API, Server]
    tween:
      clientBalance: 100 -> 90
      serverBalance: 0 -> 10
    badge: "transferring"
    body: "Client goes from 100 to 90; Server goes from 0 to 10"
```

`tween:` interpolates two states simultaneously.
This example serves as a reference when you drive multiple states inside one phase.

### Example 3 ... "permit (EIP-2612 gasless approval)"

This request contains blockchain-specific terminology — EIP-712, on-chain, allowance.
It shows a three-phase sequential animation where state propagates between phases.

**Request**: ERC20 Permit gasless approval flow

**Output**:
```
title: "Permit (EIP-2612 gasless approval)"
type: solidity

actors:
  - Owner
  - Spender: function
  - permit: function
  - allowance: storage

flow:
  - Owner -> Spender: "send EIP-712 signature (off-chain)" (info)
  - Spender -> permit: "relay with signature"
  - permit -> allowance: "set allowance" (success)
  - permit -> Spender: "allowance set" (success)

states:
  allowanceValue: 0

animation:
  - step: "sign" 1.5s
    focus: [Owner]
    body: "Owner signs EIP-712 typed data (no gas)"
  - step: "relay" 1.5s
    focus: [Spender, permit]
    body: "Spender relays the signature on-chain"
  - step: "execute" 1.5s
    focus: [permit, allowance]
    tween:
      allowanceValue: 0 -> 100
    badge: "approved"
    body: "permit sets allowance to 100"
```

Switching the `focus:` target across the three phases expresses focus moving along the progress.
The LLM handles domain-specific terms such as EIP-2612 / EIP-712.

### Example 4 ... "DEX swap (Uniswap V2 style)"

This is a concise expression of a DeFi-style AMM swap with no animation.
It shows the case where a static diagram works with the minimum of `actors` and `flow`.

**Request**: A Uniswap V2 style AMM swap flow

**Output**:
```
title: "DEX Swap (Uniswap V2 AMM)"
type: sequence

actors:
  - Trader
  - Router: function
  - Pair: function
  - Reserves: storage

flow:
  - Trader -> Router: "swap A -> B" (info)
  - Router -> Pair: "forward"
  - Pair -> Reserves: "update (constant product)" (warning)
  - Pair -> Trader: "receive tokenB" (success)
```

Adding `(warning)` to `Pair -> Reserves` visually highlights the invariant maintenance of the constant product.
This is a reference example for using tone to add visual emphasis.

### Example 5 ... "microservice topology"

This uses the `topology` preset for an architecture diagram.
We include it to show the case where, unlike sequence, actors are placed as containers.

**Request**: A User -> Frontend -> Backend -> DB + Cache topology

**Output**:
```
title: "Microservice topology"
type: topology

actors:
  - User
  - Frontend: service
  - Backend API: service
  - PostgreSQL: database
  - Redis: cache

flow:
  - User -> Frontend: "HTTPS request" (info)
  - Frontend -> Backend API: "REST call"
  - Backend API -> PostgreSQL: "SQL query" (info)
  - Backend API -> Redis: "cache lookup" (info)
  - Redis -> Backend API: "cached value" (success)
```

It explicitly specifies architecture-oriented NodeKinds — `service`, `database`, and `cache` — with the colon form.
When you pick `type: topology`, hint the LLM to prefer infrastructure NodeKinds over plain actor for higher quality.

## Prompt template (copy-paste)

This is the template that bundles the system prompt, few-shot examples, and user request into one body.
Copy it as-is and paste it into the LLM's context.

```text
# System prompt
You are an AI that generates chainome v0.5 Text DSL.
Follow the grammar of docs/cdl/text-dsl-spec.md and translate the request into DSL.

# Few-shot examples
[Paste all five examples above]

# User request
{user's natural-language request}
```

If the LLM's context window is small, you may reduce the few-shot block from five to two or three examples.
Keeping Example 2 (animation) and Example 5 (topology) preserves diversity.

## LLM weak points and mitigations

This table summarizes typical failure modes observed in practice and the recommended mitigations.
We defend from both sides by hardening the parser and stating expectations to the LLM.

| Weakness | Mitigation |
|---|---|
| `animation` structure (states / tween / step relationships) | Show detailed patterns in Examples 2 and 3 |
| Missing quotes on Japanese values (`title: API call` instead of `title: "API call"`) | The spec mandates double quotes |
| Choosing among the 12 presets (sequence vs. flow vs. topology vs. solidity, etc.) | Include the per-preset interpretation table in the LLM context |
| Arrow variants (-> vs. → vs. =>) | The parser normalizes all forms — the LLM may pick any |
| Undeclared actor | The parser detects it as a clear error — you can ask the LLM to regenerate |

The undeclared-actor error message is formatted so the LLM can plug it straight into a self-correction loop.
Running the parser → LLM feedback loop secures 80%+ accuracy.

## Evaluation metrics (future)

We are preparing metrics to evaluate the quality of LLM-generated DSL mechanically.
We plan to ship them in v0.6 or later.

| Metric | Content |
|---|---|
| Parse success rate | Share of LLM-generated DSL that parses OK |
| Intent match rate | Share of generated diagrams that match user intent |
| Error detection rate | Share of invalid DSL where the error yields an appropriate hint |

Parse success is mechanically measurable; intent match requires human review.
There is a plan to merge both into a benchmark and pull it into the docs.

## Related

This section points to the next docs.

- [Text DSL Specification](/docs/en/cdl/text-dsl-spec) ... grammar details
- [Primitives](/docs/en/cdl/primitives/README) ... the basic elements of `LaidDiagram` that the DSL compiles to
- [Presets](/docs/en/cdl/presets/README) ... the 12 presets list
- [Migration Guide](/docs/en/cdl/migration-guide) ... migrating from the builder API to the DSL
