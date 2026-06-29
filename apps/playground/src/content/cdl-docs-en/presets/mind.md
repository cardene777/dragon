# mind preset

The `mind` preset expresses a mind map (ideas radiating out from a central theme, equivalent to mermaid `mindmap`).
The first actor would ideally become the central root with the rest as leaves, but the current implementation does not have a dedicated radial layout; instead it routes through the topology preset and auto-generates implicit edges from the root to each leaf.

## When to use

- Show a brainstorm / idea expansion on a single page.
- Visualize a concept map (central concept fanning out to related terms).
- Organize learning material chapter structure (root = title, leaves = chapters).

A full radial layout (root at the center, leaves spread across 360 degrees) is planned for a future PR.
Today, actors are placed vertically inside a group, with edges from the root to each leaf.

## Minimal example

::: tabs

@@@ humans 👤 For humans

Even with an empty `flow`, the first actor becomes the root and implicit edges are generated to the rest.

```text
title: "Idea expansion"
type: mind

actors:
  - Core: { kind: card, subtitle: "central theme" }
  - Idea1: { kind: card, subtitle: "option 1" }
  - Idea2: { kind: card, subtitle: "option 2" }
  - Idea3: { kind: card, subtitle: "option 3" }
```

Declare a `flow` to make edges explicit.

```text
flow:
  - Core -> Idea1: "branch"
  - Core -> Idea2: "branch"
  - Idea1 -> Idea3: "child"
```

@@@ llm 🤖 For LLM

```yaml
preset: mind
intent: "Mind map / brainstorm with central root and leaves"
actors:
  - { id: Core, kind: card, role: root }
  - { id: Idea1, kind: card, role: leaf }
  - { id: Idea2, kind: card, role: leaf }
flow: []   # empty: root -> leaf edges are generated automatically
constraints:
  - "actors[0] = root, rest = leaves"
  - "empty flow auto-generates root -> leaf edges"
  - "no dedicated radial layout yet, drawn as vertical cards"
```

:::

## Related

- [topology preset](/docs/en/cdl/presets/topology) — the base layout used here.
- [flow preset](/docs/en/cdl/presets/flow) — use this for sequential idea organization.
