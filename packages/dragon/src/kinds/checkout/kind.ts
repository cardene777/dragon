/** Purchase inputs have their own view; routes use the shared edge pipeline. */
import type { Kind } from '../kind';

export const kind: Kind = {
  name: 'checkout',
  accepts: [],
  fields: ['purchase-party','purchase-product','purchase-delivery','purchase-option','purchase-budget','purchase-total','purchase-approval','purchase-payment','purchase-order','purchase-scenario','purchase-flow'],
  later: true,
};
