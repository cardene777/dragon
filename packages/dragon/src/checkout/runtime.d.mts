import type { CheckoutDefinition } from "./read";
import type { CheckoutState, CheckoutEvent } from "./model.mjs";
export interface CheckoutOptions { onResize?: (height: number) => void }
export interface CheckoutController { readonly definition: CheckoutDefinition; getState(): CheckoutState; dispatch(event: CheckoutEvent): void; destroy(): void }
export function mountCheckoutRuntime(host: HTMLElement, definition: CheckoutDefinition, options?: CheckoutOptions & { drawFlow: (anchors: Record<string, {x:number;y:number;w:number;h:number}>, route?: {from:string;to:string}) => {svg:string;timeline:import("../timeline").Timeline} }): CheckoutController;
