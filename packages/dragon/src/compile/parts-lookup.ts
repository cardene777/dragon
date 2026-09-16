import type { CdlDiagram } from "@cardenelabs/cdl";
/**
 * 見本帳から部品を引く (#2030 で `compile.ts` から移した)。
 *
 * `parts-` の前置きは付けても付けなくても引ける。
 */

/** catalog を引くところだけ。 測れるかは見ない。 */
export function lookupPartRaw(
  partsCatalog: Record<string, CdlDiagram>,
  partId: string | undefined,
): CdlDiagram | undefined {
  if (typeof partId !== "string" || partId.length === 0) return undefined;
  if (Object.hasOwn(partsCatalog, partId)) return partsCatalog[partId];
  if (Object.hasOwn(partsCatalog, `parts-${partId}`)) return partsCatalog[`parts-${partId}`];
  return undefined;
}
