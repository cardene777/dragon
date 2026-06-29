# class preset

The `class` preset expresses a UML class diagram (equivalent to mermaid `classDiagram`).
Each class becomes one actor; `subtitle` holds attributes, `rows` holds methods, and the `flow` edges express inheritance / implements / association.

## When to use

- Show an OOP class hierarchy on a single page.
- Visualize inheritance (extends), implementation (implements), or association (cardinality 1:N, etc.).
- Organize entity / aggregate / value object relationships in a DDD context.

There is no dedicated UML layout yet, so the diagram is drawn with the same horizontal layout as the sequence preset.
A full UML layout (stacked compartments, interface diamond arrows) is planned for a future PR.

## Minimal example

::: tabs

@@@ humans 👤 For humans

```text
title: "User / Admin"
type: class

actors:
  - User: { kind: card, subtitle: "+name: string", rows: ["+login(): void"] }
  - Admin: { kind: card, subtitle: "+role: string", rows: ["+delete(): void"] }

flow:
  - User -> Admin: "extends"
```

@@@ llm 🤖 For LLM

```yaml
preset: class
intent: "UML class hierarchy with inheritance"
actors:
  - { id: User, kind: card, subtitle: "+name: string", rows: ["+login(): void"] }
  - { id: Admin, kind: card, subtitle: "+role: string", rows: ["+delete(): void"] }
flow:
  - { from: User, to: Admin, label: extends }
constraints:
  - "subtitle = attribute (e.g. +name: string), rows = method array"
  - "edge label = extends / implements / has-a / 1:N keywords"
  - "no dedicated UML layout yet, drawn as side-by-side cards"
```

:::

## Arguments

The arguments mirror the other presets.
Put attributes into `subtitle`, methods into `rows`.
Use `flow.label` for `"extends"` / `"implements"` / `"has-a"`, and the inline option `cardinality` for `"1:N"` etc.

## Related

- [sequence preset](/docs/en/cdl/presets/sequence) — the base layout used here.
- [er preset](/docs/en/cdl/presets/er) — use this for DB schema entity relationships.
