# mindMap preset

`mindMap` is a high-level API for a mind map (ideas radiating from a central topic) built up via `branch` calls.
It corresponds to mermaid `mindmap`.

You declare the centre via `rootId` + `rootTitle`, and each branch references its `parent` to grow level 1 / level 2.
Branches at level 1 rotate through six colours (accent / teal / success / warning / info / error). Level 2 and deeper branches inherit the colour of their parent.

## When to use

`mindMap` is great for thought organisation, brainstorming, and idea structuring.

- Project ideation branching (Project → Features / UI design / Launch)
- Blog post outline (Topic → Section A / B / C → Sub points)
- Concept maps (cdl → Diagram engine / DSL / Visual editor)

If the hierarchy is one-way and the order matters, [tree preset](/docs/en/cdl/presets/tree) reads better.

## Compared to `tree`

| aspect | tree | mindMap |
|---|---|---|
| root | required (no `parent`) | required (`rootId`) |
| colours | single edge tone | six-colour rotation at level 1 |
| use case | org charts / file trees | brainstorming / idea structuring |
| feel | clear hierarchy | radial from a centre |

## Signature

```ts
mindMap({ id: string, topic: string, rootId: string, rootTitle: string,
          branchWidth?: number, defaultTone?: Tone })
  .branch({ id, title, parent, tone?, subtitle? })
  .build()
```

[preview:presets/mind-demo]

## Complete example

```ts
import { mindMap } from "@cardenelabs/cdl";

export const projectIdeas = mindMap({
  id: "ideas",
  topic: "Project ideas",
  rootId: "root",
  rootTitle: "Project",
})
  .branch({ id: "feat", title: "Features", parent: "root" })
  .branch({ id: "ui", title: "UI design", parent: "root" })
  .branch({ id: "launch", title: "Launch", parent: "root" })
  .branch({ id: "auth", title: "Auth", parent: "feat" })
  .branch({ id: "billing", title: "Billing", parent: "feat" })
  .build();
```

[preview:presets/mind-demo]

## See also

- [tree preset](/docs/en/cdl/presets/tree) — clear org chart / file tree hierarchy
- [classDiagram preset](/docs/en/cdl/presets/class) — to convey UML-flavoured structure
