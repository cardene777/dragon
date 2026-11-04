/**
 * ブロックを使える図の種類 (#3348)。
 *
 * 図の種類は受け付ける付け方 (`kinds/<種類>/kind.ts` の `accepts`) を持ち、ブロックは付け方を 1 つ名乗る (`blocks/<名前>/block.ts` の `attach`)。
 * ブロックを使える図の種類は、ブロックの付け方を受け付ける図の種類のうち、`only` に合い `except` に無い物で、手で書いた一覧を持たない。
 * 2 つ以上の図の種類で使えるブロックがコアブロック、1 つの図の種類だけで使えるブロックが個別ブロックになる。
 */
import { KIND_FOLDERS } from "../kinds/index";
import type { Kind } from "../kinds/kind";
import type { DiagramKind } from "../schema";
import type { Block } from "./block";
import { BLOCKS } from "./index";

/** ブロックの付け方が図の種類に合うか。図の種類が付け方を受け付け、`only` が無いかその図の種類で、`except` にその図の種類が無い */
export const fits = (block: Block, kind: Kind): boolean =>
  kind.accepts.includes(block.attach.how) && (block.attach.only === undefined || block.attach.only === kind.name) && !(block.attach.except ?? []).includes(kind.name);

/** 名前 `name` のブロックを使える図の種類。図の種類の置き場の一覧の順で返し、知らない名前は空 */
export function blockKinds(name: string): DiagramKind[] {
  const block = (BLOCKS as Readonly<Record<string, Block>>)[name];
  return block === undefined ? [] : Object.values(KIND_FOLDERS as Readonly<Record<string, Kind>>).filter((kind) => fits(block, kind)).map((kind) => kind.name);
}
