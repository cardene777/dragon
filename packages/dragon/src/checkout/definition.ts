import type { Diagram, DiagramModel } from "../schema";
import { parseCheckout, type CheckoutDefinition } from "./read";

export function definitionOf(diagram: Diagram): CheckoutDefinition {
  if (!diagram.checkout) throw new Error("Missing checkout definition");
  return { ...diagram.checkout, blocks: Object.entries(diagram.blocks).filter(([key]) => key.startsWith("purchase-")).flatMap(([, blocks]) => blocks as CheckoutDefinition["blocks"]) };
}

export function purchaseNotation(definition: CheckoutDefinition): string {
  const attrs = (o: Readonly<Record<string,string>>) => Object.entries(o).map(([k,v]) => `${k}: ${JSON.stringify(v)}`).join(", ");
  return `checkout ${definition.id} as ${JSON.stringify(definition.title)} [version: 1, note: ${JSON.stringify(definition.note)}]\n` + definition.blocks.map(b => `${b.kind} ${b.id} as ${JSON.stringify(b.name)} [${attrs(b.options)}]`).join("\n");
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

