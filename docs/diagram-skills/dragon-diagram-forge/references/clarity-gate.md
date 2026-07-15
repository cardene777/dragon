# Clarity Gate

Use this gate before rendering and again after visual review. Correctness is not enough. The diagram must be understandable.

## Five-Second Test

A first-time viewer should understand these within five seconds:

- What mechanism is being explained.
- Where to start looking.
- What changes.
- Why it changes.
- What the result is.

If any answer requires reading a paragraph, split the scene or redesign the composition.

## One Scene, One Sentence

Every scene must have exactly one teaching sentence:

`このシーンでは ___ が ___ によって ___ になることを見せる。`

Reject the scene if it tries to teach two mechanisms at once.

## Eye Path

Every scene must define the visual reading path:

1. Start element.
2. Entering data or trigger.
3. Operation or boundary.
4. Changed state or computed value.
5. Output or next dependency.

The path must be visible without relying on animation.

## Arrow Ownership

Every arrow/path must have:

- named source
- named destination
- payload or meaning
- semantic color

Reject arrows that point vaguely to a region, pass through unrelated objects, or require guessing ownership.

## Label Tiers

Assign each label a tier:

- Tier 1: must read to understand the scene.
- Tier 2: useful protocol detail.
- Tier 3: optional detail, hover/detail panel, or removed.

If a scene needs more than two Tier 1 labels to make sense, split or simplify it.

## Static-First Rule

The paused frame must be understandable. Animation may improve sequence, focus, or causality, but it must not be required to decode the diagram.

## Clarity Rejections

Reject and redesign if:

- the main state change is smaller than supporting decoration
- labels explain what the drawing should show
- multiple active animations compete
- color meanings change inside the same diagram
- mobile is just a scaled-down desktop overview
- the figure is accurate but a viewer cannot retell the flow after one pass
