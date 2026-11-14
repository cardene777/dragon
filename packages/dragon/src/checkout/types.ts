import type { CheckoutDefinition, CheckoutBlock } from "./read";
export interface CheckoutQuote { revision: number; qty: number; delivery: string; subtotal: number; fee: number; total: number; merchant: string }
export interface CheckoutState {
  session: number; revision: number; qty: number; delivery: string; budget: number;
  phase: "over_budget" | "quoting" | "ready" | "approved" | "processing" | "declined" | "unknown" | "reconciling" | "ordered";
  quote: CheckoutQuote; approval: CheckoutQuote | null;
  token: { maxAmount: number; merchant: string; session: number } | null;
  order: (CheckoutQuote & { number: string }) | null;
  chargeCount: number; attempt: number; mode: "normal" | "decline" | "lost";
  notice: string; invalidated: boolean; focus: string;
  events: { actor: string; text: string; n: number }[]; eventCount: number;
}
export interface CheckoutEvent { type: string; session?: number; revision?: number; attempt?: number; qty?: number; delivery?: string; value?: number; mode?: string; actor?: string }
export interface CheckoutView { pending: boolean; approved: boolean; gap: number; lockedInputs: boolean; title: string; description: string; canApprove: boolean; canBuy: boolean }
export interface CheckoutModel {
  UNIT_PRICE: number; DELIVERY: Readonly<Record<string, { name: string; fee: number; note: string; icon: string }>>;
  QUANTITY: { min: number; max: number; initial: number }; BUDGET: { min: number; max: number; step: number; initial: number };
  PRODUCT: CheckoutBlock; PARTIES: Record<string, CheckoutBlock>;
  initialState(session?: number): CheckoutState;
  approvalValid(state: CheckoutState): boolean;
  transition(state: CheckoutState, event: CheckoutEvent): CheckoutState;
  viewOf(state: CheckoutState): CheckoutView;
}

export interface CheckoutOptions { onResize?: (height: number) => void }
export interface CheckoutController { readonly definition: CheckoutDefinition; getState(): CheckoutState; dispatch(event: CheckoutEvent): void; destroy(): void }
