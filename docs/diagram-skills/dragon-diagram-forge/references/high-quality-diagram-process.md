# High Quality Diagram Process

Use this process after a visual theme is selected. The goal is not to make a pretty page. The goal is to make a diagram whose internal structure teaches a mechanism clearly.

## 1. Mechanism Model

Before drawing, write a compact model of the mechanism:

- Actors: who owns or performs each action.
- Containers: where state or data lives.
- Data objects: named fields, values, messages, roots, proofs, or events.
- Transformations: what changes, where it changes, and what computes it.
- Time boundaries: slots, blocks, epochs, requests, responses, parent/child dependencies.
- Misleading simplification to avoid.

If the model cannot be written clearly, do not draw.

## 2. Visual Thesis

Define one sentence:

`This diagram should make the viewer notice that ___ changes because ___, not because ___.`

This sentence decides the layout. If the layout does not make that sentence visible at first glance, the diagram is rejected.

## 3. Composition Plan

Choose the composition from the mechanism, not from a preset:

- Boundary cutaway: best for contract storage, EVM execution, protocol layers, and ownership.
- Timeline with state snapshots: best for block/slot/epoch, gas fee updates, consensus stages.
- Ledger/register view: best for balances, nonces, allowances, mappings, counters.
- Packet trace: best for TCP/IP, p2p gossip, RPC, mempool propagation.
- Formula machine: best for EIP-1559, difficulty, rate limits, scoring, auctions.
- Tree/proof anatomy: best for Merkle/Verkle, state roots, receipts, inclusion proofs.
- Split comparison: best for before/after, correct/incorrect, L1/L2, optimistic/zk.

Do not use a horizontal row of boxes unless the topic is actually a linear pipeline and no richer structure is needed.

## 4. Detail Budget

Every visible item must have one role:

- actor
- boundary
- state
- data field
- transformation
- path
- timing marker
- annotation
- legend/control

Remove anything that is only decoration. Replace tiny technical text with visible structure whenever possible.

## 5. Motion Choreography

Animation must be authored as a sequence of protocol events, not generic motion:

1. Focus the relevant boundary or state.
2. Move or reveal the entering data.
3. Show the transformation.
4. Mark the changed state or computed value.
5. Show the emitted output, vote, proof, next block, or dependent value.

At any moment there should be one primary animated event. Secondary motion must be quiet.

## 6. Review Before Rendering

The content reviewer must reject the diagram if:

- the visual thesis is vague
- the composition plan does not match the mechanism
- data objects are unnamed
- state mutation has no visible location
- the animation plan is decorative
- the diagram can only be understood from prose outside the figure

## 7. Review After Rendering

The visual reviewer must inspect screenshots and reject the artifact if:

- arrows do not clearly start and end at owned elements
- labels compete with the main mechanism
- text is used where visual structure should carry meaning
- mobile only shows a miniaturized desktop diagram
- the chosen theme is visible only in page chrome
- the figure is less clear when the animation is paused

## 8. Required Deliverables

For every serious diagram, produce these before calling it complete:

- `diagram-specs.md`: mechanism model and visual thesis.
- `scene-model.md`: scene sequence and animation choreography.
- `index.html`: rendered figure or figure set.
- `review-report.md`: content and visual review evidence.

If any of these are missing, final status is not `PASS`.
