# Checkout

Use `checkout` when readers should change purchase terms, approve the latest quote and try payment outcomes.
It is a registered diagram kind: use the usual `parseNotation`, `printNotation`, `renderDiagram` and `mountDiagram` APIs.
Do not implement the purchase model in page-specific JavaScript.

The head is `checkout <id> as <title> [version: 1, note: <intro>]`.
The semantic blocks are `party`, `flow`, `product`, `delivery`, `option`, `budget`, `total`, `approval`, `payment`, `order` and `scenario`.
Each block has an ASCII id; references name that id.
The shared JSON stores purchase blocks under `blocks.purchase-*`.
The native SVG pipeline draws the horizontal routes, arrows and envelopes; the native player mounts the purchase inputs.

Read `packages/dragon/examples/checkout/acp-purchase.dragon` for a full example.
Changing quantity or delivery recalculates the quote and invalidates prior approval.
Payment is limited to the approved total, and repeated requests cannot create duplicate orders or charges.
The model uses integer yen and never performs real payment or card authentication.

For an article toolbar, use `mountFramedDiagram` from `@cardenelabs/dragon/frame`.
It provides source tabs, syntax colors, copy, fullscreen, the official editor link, and PNG/SVG/HTML/GIF/MP4 export.
The frame exports the complete input view; generic `renderDiagram` returns the route SVG.
GIF/MP4 replay recent operation states, rather than recording the screen continuously.

Check notation/JSON round trips, stale approvals, decline, lost responses, duplicate completion, reset and teardown.
