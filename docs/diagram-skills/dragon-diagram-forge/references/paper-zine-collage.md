# Paper Zine Collage

Use this reference when the selected visual theme is `Paper Zine Collage`.

This theme is not a color preset. It is a tactile editorial layout: protocol state is treated as paper pieces pinned to a desk, and causality is read through placement, pencil paths, stamps, and short labels.

For dragon reuse, build the diagram as an embeddable part. The Paper Zine Collage treatment must exist inside the figure itself. Page headers, wrappers, hero text, galleries, or catalog chrome do not count as diagram quality.

## Best Fit

- Protocol explainers where the main challenge is boundary, state mutation, or parent-child dependency.
- Japanese engineering articles where dense prose would make the figure unreadable.
- One polished diagram part whose internal composition explains the mechanism.
- Component-sized diagrams that can be embedded into a lesson or CDL-generated view without page chrome.

## Visual Contract

- Use paper sheets, tape, pins, stamps, torn edges, pencil marks, and light paper texture inside the figure canvas.
- Compose the figure as one dominant explanation surface plus small internal annotation scraps only when they explain causality.
- Use cut-paper shapes for actors, contracts, blocks, roots, payloads, storage cells, and fee meters.
- Use pencil paths for messages and transactions.
- Use green ink only for accepted/vote/success paths.
- Use red pencil/stamps for warnings, deltas, changed roots, or observed state changes.
- Use amber marker for gas usage and fee pressure.
- Keep all long explanation outside the diagram body. Inside the diagram, use short Japanese labels or tiny data tags only.
- If a surrounding page is removed, nothing important should be lost.

## Layout Rules

- Desktop: the figure itself must reveal the topic before details. It may include a compact internal legend only if the legend directly improves interpretation.
- Tablet: preserve the main causal path and keep annotations secondary.
- Mobile: the diagram must not become a tiny unreadable thumbnail. Split scenes or simplify the visible layer instead of shrinking everything.
- Do not place more than one active causal path in the same sheet unless the scene is explicitly comparing paths.
- Do not make the paper sheet a decorative frame around a generic arrow diagram. The paper pieces must encode semantic roles.
- For dragon parts, produce one self-contained figure or a scene sequence. A small legend or step caption is allowed only when it directly supports the mechanism.

## Required Semantics

For Ethereum block production:

- Show `slot/proposer`, `payload`, execution result, `stateRoot`, and `attestation/head choice` as separate paper pieces or paths.
- Execution path and attestation/fork-choice path must be visually separate.
- Do not imply block inclusion is finality.

For ERC-20 transfer:

- Put `transfer(to, amount)`, `balanceOf` deltas, and `Transfer` event inside or attached to the Token Contract boundary.
- Alice and Bob are outside the contract boundary.
- Never show tokens flying wallet-to-wallet.

For EIP-1559:

- Show parent/current/next blocks or meters together.
- Show gas target and current `gasUsed` relative to the target.
- Show the dependency `parent baseFee + gasUsed vs target -> next baseFee`.
- Do not show base fee as validator revenue.

## Quality Gates

Reject the artifact if any of these happen:

- The same geometry is reused for Block, Transfer, and Fee with only label changes.
- A decorative scrap hides the causal path, state delta, or target line.
- A label or chip is clipped at desktop, tablet, or mobile widths.
- The figure depends on a horizontal box flow as the primary structure.
- Mobile shows a tiny unreadable thumbnail while notes dominate the sheet.
- The diagram looks like a style catalog item instead of a finished explanation.
- The theme quality depends on wrapper UI, headers, or page decoration outside the figure.
- Technical detail is added as tiny text instead of being expressed as clear visual structure.

## Extraction For Other Themes

When expanding to `Warm Cutaway Machine`, `Terminal Trace`, `Liquid Glass Lab`, or `Museum Exhibition`, preserve the semantic structure rather than the paper visuals:

- One dominant explanation surface.
- Supporting panels only for distinct mechanisms.
- One active path per panel.
- State mutation and boundary ownership are visible.
- Japanese labels stay short and reviewed.

## Reference Asset

- `assets/paper-zine-collage-template.html` is the current reusable reference implementation.
- Treat it as a theme reference only. It is not a finished block-production reference and must not be copied mechanically.
