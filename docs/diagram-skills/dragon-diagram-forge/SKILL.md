---
name: dragon-diagram-forge
description: Designs and generates high-quality dragon educational diagrams. Use for blockchain, Ethereum, protocol, network, or engineering mechanism diagrams when correctness, visual clarity, Japanese labels, animation, and reusable diagram parts matter.
---

# Dragon Diagram Forge

Use this skill when creating reusable high-quality educational diagrams for the dragon repository, especially blockchain, Ethereum, protocol, network, or engineering fundamentals diagrams.

This skill prevents low-quality diagram generation caused by jumping straight to visuals before the explanation is designed.

## Default Rule

Generate one diagram topic at a time unless the user explicitly asks for a batch. A complex topic must become a small scene set, not one crowded canvas. A 20-diagram batch is allowed only when every diagram has its own reviewed spec and review record.

When exploring visual themes, finish one high-quality exemplar before expanding the theme to other topics. A theme is not approved by changing colors or labels on the same mini-diagram.

Dragon reuse mode is the default. The artifact must work as a figure/component that can be embedded inside dragon. Do not spend quality budget on page chrome, hero headers, catalogs, or wrapper UI unless the user explicitly asks for a standalone page. The diagram content itself must carry the design quality.

After the visual theme is selected, the main task is diagram quality: mechanism modeling, composition choice, state visibility, and motion choreography. Follow `references/high-quality-diagram-process.md` before rendering.

Clarity is a separate gate from correctness and style. Follow `references/clarity-gate.md` before rendering and after visual review.

## Required Workflow

1. Research and summarize the target mechanism before drawing.
   - Use `references/research-notes-template.md`.
   - Use primary sources first: official docs, specifications, standards, reference implementations, or source code.
   - Write the mechanism summary in Japanese before any visual work.
   - Create an ordered flow where every step has owner, input, operation, output, state effect, and visual implication.
   - List at least two possible diagram structures and choose one with a concrete reason.
   - Do not create a scene model or render a diagram until `research-notes.md` exists.

2. Define the teaching target before drawing.
   - Audience: Japanese-speaking engineers.
   - Misconception to fix: one sentence.
   - Primary mechanism: one sentence.
   - Visual thesis: one sentence using `This diagram should make the viewer notice that ___ changes because ___, not because ___.`
   - Required protocol/data fields: concrete names, values, state variables, or messages.
   - Mechanism model: actors, containers, data objects, transformations, time boundaries, and misleading simplification to avoid.
   - Visual grammar: the spatial metaphor and motion model. This must not be a generic horizontal box flow.
   - Visual theme: the selected UI/design treatment, including layout, palette, material, annotation style, and responsive behavior.
   - Clarity plan: five-second test answer, one teaching sentence per scene, eye path, and label tiers.
   - Scene split: one scene per state transition, proof step, fee calculation, or timing distinction.
   - If the visual theme is `Paper Zine Collage`, read `references/paper-zine-collage.md` before creating the scene model.

3. Create a scene model before rendering.
   - Use `references/scene-model-template.md`.
   - `references/scene-model-template.md` is the SSOT for required scene fields.
   - Every scene must define every required field in that template.
   - The scene split must come from the ordered flow in `research-notes.md`, not from a visual template.
   - Every scene must pass `references/clarity-gate.md`: one teaching sentence, visible eye path, arrow ownership, label tiers, and static-first readability.
   - Include motion choreography for each scene: focus, entering data, transformation, changed state/computed value, and output.
   - Smart contract behavior must place function, storage, and event inside the contract boundary.
   - Long prose belongs outside the diagram, not inside the visual canvas.

4. Run a content review subagent before visual generation.
   - Use `references/subagent-prompts.md`.
   - The reviewer must return `PASS` only when all blocking gates pass.
   - A review without concrete evidence is invalid. The reviewer must cite the exact missing data, misleading simplification, or scene-model defect.
   - Do not generate the final figure until content review returns zero blocking issues.
   - After content `PASS`, freeze `research-notes.md`, `diagram-specs.md`, and `scene-model.md` for rendering.
   - If rendering changes scenes, required data, causal order, execution boundary, state names, active paths, or major labels, content review is invalidated and must run again.

5. Generate the diagram.
   - Prefer reusable HTML/SVG artifacts that can be inspected in a browser and later translated into dragon/CDL primitives.
   - Keep reusable parts in this skill directory under `assets/`.
   - Keep generated examples under `outputs/`.
   - Use Japanese labels by default.
   - Use a stable viewport and responsive constraints. Text must not rely on horizontal scrolling to be readable.
   - Animation must show a state transition, path traversal, proof verification, timing window, or value change. Decorative motion is not allowed.
   - The reusable unit should be a self-contained `<figure>`, `<svg>`, or component-sized HTML part. Page-level decoration is secondary and should be omitted for dragon parts.
   - Every animated highlight must correspond to a reviewed protocol event: entering data, execution, state mutation, publication, verification, vote, fee update, or proof check.
   - For an approved theme, generate a full-size explanation first. Do not use tiny catalog thumbnails as proof of quality.
   - For `Paper Zine Collage`, use `assets/paper-zine-collage-template.html` as a reference skeleton and enforce the mobile order `title -> diagram -> note`.
   - Do not copy rejected prototypes forward. If the user rejects a generated asset, remove it from references before continuing.

6. Run a separate visual review subagent after generation.
   - Use `references/subagent-prompts.md`.
   - Screenshot or browser-render evidence is required for a full pass. Source-only review can find defects, but it cannot certify final visual quality.
   - The reviewer checks visual hierarchy, overlap, readability, animation clarity, layout stability, and whether the figure teaches the intended mechanism.
   - Iterate until there are zero actionable fixes.
   - If screenshot verification is impossible, final artifact status cannot be `PASS`; use `SOURCE_REVIEWED_ONLY` only if final gate conditions pass, otherwise use `FAIL`.

7. Run deterministic checks.
   - Parse HTML/JS.
   - Verify expected diagram count.
   - Verify the target controls exist.
   - Verify scene-model to implementation parity: scene count and every required scene field in `references/scene-model-template.md` must match the rendered implementation.
   - Treat any mismatch between frozen scene model and rendered implementation as blocking.
   - If a browser is available, capture desktop and mobile screenshots and inspect them before declaring pass.

## Hard Rejections

Reject and redesign any diagram that has one of these traits:

- It is mainly horizontal boxes connected by arrows.
- It uses the same node-link graph pattern as another diagram with only label/color changes.
- It hides state mutation inside a cloud or generic service box.
- It shows ERC-20 tokens flying wallet-to-wallet.
- It implies Ethereum block inclusion means immediate finality.
- It shows EIP-1559 base fee as validator revenue.
- It uses decorative blockchain stacks that do not explain validation, execution, data structures, or fees.
- It tries to explain a complex protocol as one crowded all-steps-at-once canvas.
- It presents a theme catalog where every sample is the same geometry with different text or colors.
- It claims a visual theme is ready without one polished full-size exemplar and screenshot review.
- It looks good only because of the surrounding page while the figure itself is weak.
- It contains animation that does not identify a real data flow, state change, verification, or timing boundary.
- It receives `PASS` from a reviewer without evidence.
- It has no source-backed `research-notes.md`.
- Its scene model does not trace back to the ordered flow.
- It has no clarity plan, or the scene fails the five-second test.
- It requires animation to understand the static diagram.
- It has no scene model.
- It cannot be rendered and visually inspected, unless final artifact status is explicitly `SOURCE_REVIEWED_ONLY`.

## Output Shape

Each generated diagram set should include:

- `index.html`: navigable gallery or figure.
- `research-notes.md`: source-backed mechanism summary, ordered flow, and diagram-structure decision.
- `diagram-specs.md`: reviewed explanation structure.
- `review-report.md`: content and visual review findings.
- `scene-model.md`: scene model used before rendering.
- Optional reusable parts in `assets/`.

## References

- Read `references/review-rubrics.md` before reviewing or generating.
- Read `references/research-notes-template.md` before creating `research-notes.md`.
- Read `references/high-quality-diagram-process.md` after a visual theme is selected and before rendering.
- Read `references/clarity-gate.md` before rendering and during visual review.
- Read `references/scene-model-template.md` before rendering.
- Read `references/subagent-prompts.md` before spawning reviewers.
- Read `references/paper-zine-collage.md` when using or reviewing the Paper Zine Collage theme.
- Read `references/twenty-diagrams.md` when generating the initial 20-diagram set.
- Reuse `assets/evm-execution-cutaway.html` only as a part-level asset, not as a finished explanation.
- Reuse `assets/paper-zine-collage-template.html` as a theme-level reference, not as a fixed Ethereum-only figure.

## Output Check

Before reporting completion, answer these:

1. Does every scene show what enters, what executes, what state changes, and what exits?
2. Did content review cite evidence and return zero blocking issues?
3. Did visual review use render evidence, or is the artifact explicitly marked with final status `SOURCE_REVIEWED_ONLY`?
4. Are all remaining issues documented as deliberate non-blocking tradeoffs?
5. Can a first-time viewer identify start, action, state change, and result within five seconds?
