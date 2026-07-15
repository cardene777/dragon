# Review Rubrics

## Status Enums

- Content review verdict: `PASS`, `FIX`, `REJECT`.
- Visual review verdict: `PASS`, `FIX`, `REJECT`, `SOURCE_ONLY`.
- Final gate status: `PASS`, `SOURCE_REVIEWED_ONLY`, `FAIL`.

Do not use other status labels. `SOURCE_ONLY` is a visual-review verdict. `SOURCE_REVIEWED_ONLY` is a final artifact status.

## Content Review

The content reviewer must answer each item as `PASS`, `FIX`, or `REJECT`.

`PASS` requires evidence. A reviewer must cite the scene, element, value, or exact text that satisfies the gate. If evidence is not cited, treat the review as invalid.

- The diagram has one explicit misconception to correct.
- `research-notes.md` exists and cites primary sources for the mechanism.
- The ordered flow identifies owner, input, operation, output, state effect, and visual implication for every step.
- The clarity plan exists: five-second test, one teaching sentence per scene, eye path, arrow ownership, and label tiers.
- The visual grammar is topic-specific, not a generic row of boxes.
- The selected visual theme has a concrete layout/material/annotation contract, not only a palette name.
- The visual thesis is concrete and the composition makes that thesis visible without relying on prose outside the figure.
- Required protocol fields are present and named accurately.
- Actors, containers, data objects, transformations, and time boundaries are explicit when the mechanism needs them.
- The sequence does not imply false causality or instant finality.
- State mutation is visible where the topic depends on state.
- Timing, ordering, thresholds, or parent-child dependencies are visible when relevant.
- Simplifications are honest and do not invert the meaning.
- Japanese labels are clear without becoming long paragraphs inside the figure.
- The scene model fills every required field/section in `scene-model-template.md`, including Teaching Target, Required Data, and each scene field; this template is the SSOT.
- Complex topics are split into scenes instead of compressed into one canvas.
- Each scene can be explained in one sentence and does not teach two mechanisms at once.

Blocking examples:

- ERC-20 transfer stores balances on wallets instead of contract storage.
- EIP-1559 omits gas target or burn path.
- Ethereum block production omits proposer/attestation/fork-choice distinction.
- Finality is shown as the same thing as block inclusion.
- TCP/TLS diagrams confuse signatures, encryption, or addressing layers.
- A reviewer says "OK" without pointing to specific evidence.
- A diagram is generated before the scene model exists.
- A diagram is generated before source-backed research notes and ordered flow exist.
- A scene exists only because it looks good, not because it maps to a researched flow step.
- A scene has no defined eye path or requires animation to understand the static frame.

## Visual Review

The visual reviewer must answer each item as `PASS`, `FIX`, `REJECT`, or `SOURCE_ONLY`.

`PASS` requires render evidence: desktop screenshot and mobile screenshot. Source-only review can return fixes, but cannot return final visual pass. If render verification is impossible, the visual review verdict must be `SOURCE_ONLY`; final status is `SOURCE_REVIEWED_ONLY` only if Final Gate conditions pass, otherwise `FAIL`.

- The first glance reveals what mechanism is being explained.
- A first-time viewer can identify start, action, changed state, and result within five seconds.
- The chosen theme changes structure, material, and composition, not only colors, fonts, or labels.
- The figure/component itself has the design quality; surrounding page chrome is not counted as visual quality.
- The most important state change is the dominant visual event.
- State changes, computed values, and ownership boundaries are carried by visual structure, not tiny labels alone.
- Labels fit their containers at desktop and mobile widths.
- Tier 1 labels are limited and readable; Tier 2/3 details do not compete with the main mechanism.
- No important text, arrows, bars, or nodes overlap.
- Repeated concepts use consistent visual encoding.
- Different topics use different visual grammars.
- Animation clarifies cause/effect instead of decorating a static chart.
- Every animated element maps to a concrete protocol event or value transition.
- Controls, if present, visibly change the next state and not only a number.
- The active phase count is one unless the scene intentionally compares multiple states.
- Inactive paths are visually quiet.
- Mobile view shows the current operation and state change without relying on horizontal discovery.
- If the artifact is a theme exemplar, it is a full-size finished explanation, not a catalog thumbnail.

Blocking examples:

- Layout collapse or clipped Japanese text.
- Dense technical labels competing equally with the main mechanism.
- Arrows without clear start/end ownership.
- A slider changes a value but the affected block/state does not visibly change.
- The diagram is technically correct but not teachable at a glance.
- The reviewer did not inspect a rendered screenshot but still claims final visual pass.
- Multiple active highlights make the viewer unsure where to look.
- The viewer cannot tell where to start, what changed, or what result was produced.
- Theme samples reuse the same geometry with only text or color changes.
- The artifact would lose most of its quality if embedded without its outer page wrapper.
- Technical correctness is present only as dense labels while the drawing itself does not explain the mechanism.

## Iteration Rule

Continue revision until the visual review returns zero actionable fixes. If the current run must stop before zero, document the remaining fixes in `review-report.md` and keep the artifact clearly marked as not final.

## Content Scoring Gate

Use this scoring gate before content `PASS`.

| Area | Max | Pass Threshold |
|---|---:|---:|
| Protocol correctness | 5 | 5 |
| Scene causality | 5 | 4 |
| Data completeness | 5 | 5 |
| Japanese clarity | 5 | 4 |

Any protocol correctness score below 5 is blocking. Any data completeness score below 5 is blocking. Missing required fields/sections from `scene-model-template.md` prevents content `PASS`.

## Visual Scoring Gate

Use this scoring gate before visual `PASS`.

| Area | Max | Pass Threshold |
|---|---:|---:|
| Visual hierarchy | 5 | 4 |
| Five-second clarity | 5 | 4 |
| Label readability | 5 | 4 |
| Motion causality | 5 | 4 |
| Mobile framing | 5 | 4 |
| Render stability | 5 | 4 |

Any missing screenshot evidence makes render stability unscored and prevents visual `PASS`; use visual verdict `SOURCE_ONLY` instead.

## Final Gate

Final `PASS` requires:

- content verdict `PASS`
- visual verdict `PASS`
- deterministic checks passed
- no undocumented known material issue

If visual review is `SOURCE_ONLY`, final status may be `SOURCE_REVIEWED_ONLY` only when:

- content verdict is `PASS`
- deterministic checks passed except screenshot-based final visual certification
- source-only visual review has zero blocking or source-detectable fixes
- remaining verification limits are documented

Otherwise final status must be `FAIL`.
