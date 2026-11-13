/** Purchase inputs have their own view; routes use the shared edge pipeline. */
import type { Kind } from '../kind';

export const kind: Kind = {
  name: 'checkout',
  accepts: [],
  fields: 'party product delivery option budget total approval payment order scenario flow'.split(' ').map(name => `purchase-${name}`),
  later: true,
};
