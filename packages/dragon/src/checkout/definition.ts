import type { Diagram, DiagramModel } from "../schema";
import { MAX_CHECKOUT_LINES, parseCheckout, type CheckoutDefinition } from "./read";

export function definitionOf(diagram: Diagram): CheckoutDefinition {
  if (!diagram.checkout) throw new Error("Missing checkout definition");
  return { ...diagram.checkout, blocks: Object.entries(diagram.blocks).filter(([key]) => key.startsWith("purchase-")).flatMap(([, blocks]) => blocks as CheckoutDefinition["blocks"]) };
}

export function purchaseNotation(definition: CheckoutDefinition): string {
  for (const block of definition.blocks) {
    if (!Number.isSafeInteger(block.line) || block.line < 2 || block.line > MAX_CHECKOUT_LINES) throw new Error(`checkout block line must be an integer from 2 to ${MAX_CHECKOUT_LINES}`);
  }
  const attrs = (o: Readonly<Record<string,string>>) => Object.entries(o).map(([k,v]) => `${k}: ${JSON.stringify(v)}`).join(", ");
  const lines = [`checkout ${definition.id} as ${JSON.stringify(definition.title)} [version: 1, note: ${JSON.stringify(definition.note)}]`];
  // Preserve source positions stored in the semantic blocks across notation/JSON round trips.
  for (const b of [...definition.blocks].sort((a,b) => a.line-b.line)) {
    while (lines.length < b.line-1) lines.push("");
    lines.push(`${b.kind} ${b.id} as ${JSON.stringify(b.name)} [${attrs(b.options)}]`);
  }
  return lines.join("\n");
}

export function validatePurchase(diagram: Diagram): string[] {
  try {
    const read = parseCheckout(purchaseNotation(definitionOf(diagram)));
    return read.ok ? [] : read.errors.map(e => e.message);
  } catch (error) { return [String(error)]; }
}

export function modelOf(definition: CheckoutDefinition): DiagramModel {
  const parties = definition.blocks.filter(b => b.kind === "party");
  const boxes = parties.map(b => ({ id: b.id, name: b.name, sub: b.options.note, color: "green" as const }));
  const flow = definition.blocks.find(b => b.kind === "flow")!;
  const routes = [[flow.options.buyer!, flow.options.agent!], [flow.options.agent!, flow.options.seller!], [flow.options.seller!, flow.options.payment!]];
  return { version: 1, kind: "checkout", title: definition.title, checkout: definition, boxes,
    steps: [{ title: flow.name, body: definition.note, events: routes.map(([from,to]) => ({type: "edge" as const, from: from!, to: to!, carry: {kind:"envelope" as const} })) }] };
}

/** Kind-owned conversion keeps input-specific storage out of the common renderer. */
export function diagramOf(model: DiagramModel, version: number): Diagram {
  if (!model.checkout) throw new Error('Missing checkout definition');
  const {blocks: inputs, ...header} = model.checkout;
  const blocks: Record<`purchase-${string}`, import('./read').CheckoutBlock[]> = {};
  for (const block of inputs) (blocks[`purchase-${block.kind}`] ??= []).push(block);
  return {version,kind:'checkout',checkout:header,title:model.title,...(model.view ? {view:model.view} : {}),blocks,steps:model.steps};
}

export function checkoutModel(diagram: Diagram): DiagramModel {
  return {...modelOf(definitionOf(diagram)),...(diagram.view ? {view:diagram.view} : {}),steps:diagram.steps};
}

