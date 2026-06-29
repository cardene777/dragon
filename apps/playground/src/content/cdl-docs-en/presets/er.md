# er preset

The `er` preset is a high-level API that assembles an ER diagram (an Entity-Relationship diagram that expresses a DB schema through entities and relations) from `entity` (table-like) and `relation` (link between tables) declarations.
It corresponds to mermaid `erDiagram`.

You declare the `rows` (column array) of each entity as strings; the engine renders the table layout with the `storage` kind and expands the `cardinality` (relation multiplicity) into an arrow label.

## When to use it

`er` is ideal when you want to visualize a DB schema or the relations between entities.
Mid-size schemas with three to ten entities give you the best readability.

- You want to visualize a DB schema.
- You want to make the cardinality between entities explicit (one-to-many, many-to-many, ...).
- You want the mermaid `erDiagram` shape, but type-safe in TypeScript.

For schemas with more than 10 entities, split the diagram into several focused views that highlight only the key entities.

## Why split this preset

When you draw entities with the low-level API, every entity needs its own `node`, you compose `rows` by hand, and you compute the table layout yourself.
The `er` preset accepts `rows` as a `string[]` where every element is `"key: value"` shape, and the engine handles the table layout and the key/value coloring.

> Difference from mermaid: mermaid `erDiagram` uses a custom syntax such as `USER { int id PK string email }`, while cdl `er` is plain TypeScript objects with IDE completion.

## Signature

::: tabs

@@@ humans 👤 For humans

An ER diagram in v0.5 Text DSL uses `type: er`, lists each entity with the `entity` kind, and writes inter-entity relations in `flow`.

```text
title: "<schema topic>"
type: er

actors:
  - <Entity 1>: entity
  - <Entity 2>: entity

flow:
  - <Entity 1> -> <Entity 2>: "<relation name>"
```

[preview:presets/er-demo]

v0.5 Text DSL is intentionally narrow: just entity names and one relation per line; it cannot express `rows` (column array) or `cardinality` (`1:1`, `1:N`, `N:M`, `0..1`, `1..*`).
When you need the table-row column declaration or an explicit cardinality, see the "API Reference (chain API)" section at the bottom of this page.

@@@ llm 🤖 For LLM

```yaml
fn: er(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      entityWidth: { type: number, optional: true, default: 460, range: [280, 720] }
      defaultTone: { type: Tone, optional: true }
returns: ErBuilder { entity, relation, build }
typical_use:
  - "DB schema visualization with 3-10 entities"
  - "explicit cardinality between entities (1:N, N:M, ...)"
  - "type-safe alternative to mermaid erDiagram"
constraints:
  - "rows are 'key: value' strings split at the first colon; key must be ASCII alphanumerics + underscore (no spaces)"
  - "cardinality is a fixed union of 6 values: 1:1, 1:N, N:1, N:M, 0..1, 1..*"
  - "relation.from / relation.to reference entity ids, not titles"
  - "when label is omitted, cardinality becomes the primary label; when set, cardinality drops to sub label"
  - "for >10 entities, split into multiple focused diagrams"
common_hallucinations:
  - '.entity({ id, title, columns: [...] }) — field is rows, not columns'
  - '.entity({ id, title, rows: [{ name: "id", type: "PK" }] }) — rows is string[], not object[]'
  - 'cardinality: "many-to-many" — must be one of 1:1 / 1:N / N:1 / N:M / 0..1 / 1..*'
  - '.relation({ from, to, type: "1:N" }) — field is cardinality, not type'
  - 'rows: ["user id: PK"] — key cannot contain spaces, use user_id instead'
```

:::

## Arguments

The arguments of `er` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Diagram-wide identifier, unique within the page. |
| `topic` | `string` | Required | Title rendered at the top of the diagram. |
| `entityWidth` | `number` | Optional | Width of one entity in px, default `460`. |
| `defaultTone` | `Tone` | Optional | Default color tone for every relation. |

The arguments of `entity` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Entity identifier, unique within the diagram. |
| `title` | `string` | Required | Entity name (table heading). |
| `rows` | `string[]` | Required | Column array; each element is `"key: value"` shape. |

The arguments of `relation` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `from` | `string` | Required | Source entity id. |
| `to` | `string` | Required | Target entity id. |
| `cardinality` | union | Required | Relation multiplicity (`1:1`, `1:N`, `N:1`, `N:M`, `0..1`, `1..*`). |
| `label` | `string` | Optional | Relation name (such as `"places"`); when omitted, the cardinality acts as the primary label. |
| `tone` | `Tone` | Optional | Override the color tone for just this relation. |

## Basic example

A complete example with two entities (`User` and `Order`) and one one-to-many relation.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "User-Order schema"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: schema, topic: "User-Order schema" }
entities:
  - id: user
    label: User
    rows: ["id: PK", "email: string", "createdAt: timestamp"]
  - id: order
    label: Order
    rows: ["id: PK", "userId: FK", "total: number"]
relations:
  - { from: user, to: order, cardinality: "1:N", label: places }
intent: one-to-many relation between User and Order with cardinality rendered as sub label
```

:::

[preview:presets/er-demo]

The code lines up two entities horizontally and draws an arrow labeled `places` from `User` to `Order`.
v0.5 Text DSL cannot express `rows` (column array) or `cardinality` (multiplicity), so reach for the chain API below when you need full schema detail.

Every entity renders with the `storage` kind, and `rows` is laid out as a table.
The engine auto-assigns `"Entity"` to `eyebrow`.

## API Reference (chain API)

v0.5 Text DSL is intentionally narrow: just entity names and one relation per line.
When you need detailed `rows` (column arrays) or `cardinality` (`1:1`, `1:N`, `N:M`, `0..1`, `1..*`), use the chain API below.

The `er` function signature and the builder interface are shown below.

```ts
er({
  id: string;
  topic: string;
  entityWidth?: number;       // width of one entity, default 460
  defaultTone?: Tone;
}): ErBuilder

interface ErBuilder {
  entity(e: ErEntity): ErBuilder;
  relation(r: ErRelation): ErBuilder;
  build(): CdlDiagram;
}

interface ErEntity {
  id: string;
  title: string;
  rows: string[];             // shape such as ["id: PK", "email: string", ...]
}

interface ErRelation {
  from: string;
  to: string;
  cardinality: "1:1" | "1:N" | "N:1" | "N:M" | "0..1" | "1..*";
  label?: string;
  tone?: Tone;
}
```

A complete usage example is shown below.

```ts
import { er } from "@cardenelabs/cdl";

export const schema = er({ id: "schema", topic: "User-Order schema" })
  .entity({ id: "user",  title: "User",  rows: ["id: PK", "email: string", "createdAt: timestamp"] })
  .entity({ id: "order", title: "Order", rows: ["id: PK", "userId: FK", "total: number"] })
  .relation({ from: "user", to: "order", cardinality: "1:N", label: "places" })
  .build();
```

## How to write `rows`

`rows` accepts an array of `"key: value"` strings.
The engine splits each row at the colon and renders the left side (key) in black and the right side (value) in an orange accent color.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "rows example"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places"
```

@@@ llm 🤖 For LLM

```yaml
rows:
  - "id: PK"               # PK = primary key
  - "userId: FK"           # FK = foreign key
  - "email: string"        # type info
  - "total: number"
  - "createdAt: timestamp"
  - "status: enum"
constraints:
  - "key (left) must be ASCII alphanumerics + underscore only; spaces break the colon split"
  - "value (right) is free text, rendered by the engine in the orange accent color"
```

:::

[preview:presets/er-demo]

v0.5 Text DSL cannot express `rows`, so write the chain API below when you need PK / FK / type-information tables.
Stick to alphanumerics and underscores in the key, because spaces would break the engine's `:` split and leave the value side empty.

```ts
rows: [
  "id: PK",               // PK = primary key
  "userId: FK",           // FK = foreign key
  "email: string",        // type info
  "total: number",
  "createdAt: timestamp",
  "status: enum",
]
```

## Meaning of `relation.cardinality`

`cardinality` (relation multiplicity, the notation for quantitative relationships between entities) takes one of six values.
The table lists each value with a typical use case.

| cardinality | Meaning | Typical example |
|---|---|---|
| `"1:1"` | one-to-one | User and Profile (one profile per user) |
| `"1:N"` | one-to-many | User and Order (one user, many orders) |
| `"N:1"` | many-to-one | Order and User (the inverse of `1:N`) |
| `"N:M"` | many-to-many | User and Role (many-to-many, needs a join table) |
| `"0..1"` | optional (0 or 1) | User and Avatar (users may have no avatar) |
| `"1..*"` | one or more | Cart and CartItem (an empty cart is not allowed) |

The primary label of a relation resolves to `label ?? cardinality`.
When you set `label`, it becomes the primary label, and the cardinality drops to the sub label.

## Mapping to mermaid

The table below maps the key mermaid `erDiagram` syntax to its cdl `er` counterpart.

| mermaid | cdl |
|---|---|
| `erDiagram` | `er({ id, topic })` |
| `USER \|\|--o{ ORDER : places` | `.relation({ from: "user", to: "order", cardinality: "1:N", label: "places" })` |
| `USER { int id PK string email }` | `.entity({ id: "user", title: "User", rows: ["id: PK", "email: string"] })` |

The mermaid cardinality glyphs (`||--o{` and friends) are hard to read, so cdl swaps in an alphabetic union type (`"1:N"` and friends).

## Related

- [API Reference](/docs/en/cdl/reference/api#er) is the canonical SSOT for type definitions.
- [Mermaid Migration Guide](/docs/en/cdl/overview/mermaid-migration) walks through the mermaid -> cdl conversion path.
