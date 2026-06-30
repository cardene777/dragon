# classDiagram preset

`classDiagram` is a high-level API for UML class diagrams built up via a `class` (class) and `relation` (relation) chain API.
It corresponds to mermaid `classDiagram`.

Each class carries `attributes` and `methods` in its rows and is rendered with the `storage` kind.
Five relation types are supported: extends / implements / uses / aggregates / composes.

## When to use

`classDiagram` is great for OO designs or for sharing TypeScript / Python type hierarchies.

- React component prop hierarchies (Base → Variant → Specialized)
- DDD entity / aggregate / value object relationships
- SDK class hierarchies (Client → Resource → Operation)
- State management store structures

For table relationships use [er preset](/docs/en/cdl/presets/er) instead.
`classDiagram` targets object designs with behaviour (methods).

## Relation types

| type | UML | usage |
|---|---|---|
| `extends` | inheritance (solid + hollow ▲) | superclass → subclass, type extension |
| `implements` | implementation (dashed + hollow ▲) | interface → concrete class |
| `uses` | usage (solid + →) | a class depends on another's methods |
| `aggregates` | aggregation (solid + hollow ◇) | has-a, independent lifecycle |
| `composes` | composition (solid + filled ◆) | has-a, shared lifecycle |

## Signature

```ts
classDiagram({ id: string, topic: string, classWidth?: number, defaultTone?: Tone })
  .class({ id, title, attributes?, methods?, stereotype? })
  .relation({ from, to, type, label?, cardinality?, tone? })
  .build()
```

[preview:presets/class-demo]

## attribute / method notation

Follow UML conventions: `+` (public) / `-` (private) / `#` (protected).

- `+name: string` — public attribute, type string
- `-id: number` — private attribute
- `+login(): void` — public method, returns void

Both `attributes` and `methods` are optional, but when both are present a `─────` separator row is inserted automatically.

## Complete example

```ts
import { classDiagram } from "@cardenelabs/cdl";

export const userDomain = classDiagram({ id: "user-domain", topic: "User domain model" })
  .class({
    id: "User",
    title: "User",
    attributes: ["+name: string", "+email: string"],
    methods: ["+login(): void", "+logout(): void"],
  })
  .class({
    id: "Admin",
    title: "Admin",
    attributes: ["+permissions: string[]"],
    methods: ["+banUser(): void"],
    stereotype: "subclass",
  })
  .class({
    id: "Order",
    title: "Order",
    attributes: ["+id: number", "+total: number"],
    methods: ["+pay(): void"],
  })
  .relation({ from: "Admin", to: "User", type: "extends" })
  .relation({ from: "User", to: "Order", type: "aggregates", cardinality: "1..*" })
  .build();
```

[preview:presets/class-demo]

## See also

- [er preset](/docs/en/cdl/presets/er) — for table relationships
- [tree preset](/docs/en/cdl/presets/tree) — for plain inheritance hierarchies
