import { party } from "./party";
import { product } from "./product";
import { delivery } from "./delivery";
import { option } from "./option";
import { budget } from "./budget";
import { total } from "./total";
import { approval } from "./approval";
import { payment } from "./payment";
import { order } from "./order";
import { scenario } from "./scenario";
import { flow } from "./flow";

export interface FieldRule { required?: boolean; default?: string; values?: readonly string[]; number?: boolean }
export interface BlockRule { name: string; min: number; max: number; fields: Readonly<Record<string, FieldRule>> }
export const CHECKOUT_BLOCKS: readonly BlockRule[] = [party, product, delivery, option, budget, total, approval, payment, order, scenario, flow];
