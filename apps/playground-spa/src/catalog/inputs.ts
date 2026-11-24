/** Kind-owned input blocks have their own notation instead of shared SVG blocks. */
import type { Kind } from './catalog';
import { CHECKOUT_INPUTS } from './inputs.gen';

/**
 * 判定の表 (#3879) の行と、行に書ける属性。判定の表の種類の読み方が読む行で、ブロックの置き場を持たないので手で並べる。
 * `rule` の `as` は規則の名前、`fail` の `stop` はその後の列を照らさない印
 */
const JUDGE_INPUTS = [
  { name: 'judge', fields: { pass: {}, block: {} } },
  { name: 'rule', fields: { as: {}, value: {} } },
  { name: 'case', fields: { note: {} } },
  { name: 'fail', fields: { stop: {} } },
];

export const INPUT_KINDS = [{
  kind: 'checkout' as const,
  words: ['kind:checkout'],
  blocks: CHECKOUT_INPUTS,
}, {
  kind: 'judge' as const,
  words: ['kind:judge'],
  blocks: JUDGE_INPUTS,
}];

export const inputsOf = (kind: Kind) => INPUT_KINDS.find(input => input.kind === kind)?.blocks ?? [];
