# Primitives

This page is the navigation hub for the five basic parts of cdl.
Once you learn the primitives (cdl's smallest units) listed here, you can build any diagram.
For individual specifications, follow the left side menu or the links in the table below.

## The five primitives

You build cdl diagrams by combining the following five primitives.
Each one has an independent responsibility — column, element, relation, variable, or chapter — and does not depend on the other primitives.

| Primitive | Role | Link |
|---|---|---|
| `lane` | Horizontal partition (column). Group actors or system boundaries into a single column | [lane.md](/docs/en/cdl/primitives/lane) |
| `node` | Individual part. Pick one of 29 `kind` values such as actor / function / storage | [node.md](/docs/en/cdl/primitives/node) |
| `edge` | Express the relation between nodes with an arrow | [edge.md](/docs/en/cdl/primitives/edge) |
| `state` | Variable that changes through phase progression. Expresses numeric interpolation or state transitions | [state.md](/docs/en/cdl/primitives/state) |
| `phase` | Chapter of motion (a step on the timeline). The heart of the animation | [phase.md](/docs/en/cdl/primitives/phase) |

## Design intent

> 💡 Why we limited the primitives to five
> Whereas mermaid (a text-based diagram tool) and PlantUML have separate syntaxes for each figure type such as `sequenceDiagram` / `flowchart` / `stateDiagram`, cdl expresses any diagram as a combination of five primitives.
> By limiting the primitives, you learn them once and reuse them across every diagram, which minimizes the learning cost.
> Higher-level expressions (sequence / flowchart and so on) live in the preset layer and are built internally from the same primitives.

## Learning order

If this is your first time with cdl, read in the following order to start writing comfortably.
Each primitive builds on the previous one, so learn them from top to bottom.

1. Use `lane` to create columns
2. Use `node` to place elements in each column
3. Use `edge` to connect elements with arrows
4. Use `phase` to split the motion into chapters (the heart of the animation)
5. Use `state` to transition numeric values per phase (dynamic expression)

## Related

- [presets](/docs/en/cdl/presets/README) — higher-level APIs that combine the primitives above
- [Quickstart](/docs/en/cdl/overview/quickstart) — get the minimal code running in five minutes
- [Catalog page](/catalog/primitives) — browse 39 working samples in the catalog
