/** Kind-owned input blocks have their own notation instead of shared SVG blocks. */
import type { Kind } from './catalog';
import { CHECKOUT_INPUTS } from './inputs.gen';

export const INPUT_KINDS = [{
  kind: 'checkout' as const,
  words: ['kind:checkout'],
  blocks: CHECKOUT_INPUTS,
}];

export const inputsOf = (kind: Kind) => INPUT_KINDS.find(input => input.kind === kind)?.blocks ?? [];
