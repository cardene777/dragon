/**
 * overlay parts と DSL の相互変換を pure function として提供。
 * CdlEditor.tsx から抽出、 DOM / React 依存ゼロで vitest 単発 test 可能にする (Layer 1)。
 */

import type { CatalogItem } from "@/lib/catalog-items";

export type OverlayPartRaw = { id: string; kind: string; posX: number; posY: number; scale: number; item: CatalogItem };

/**
 * src から parts kind actor 行を抽出、 base src (parts なし) と parts list を返す。
 * cdl compile pipeline 前段で呼び、 cdl には base のみ渡す = parts は cdl の auto-layout 対象外。
 */
export function extractPartsFromSrc(
  src: string,
  partsCatalog: Record<string, unknown>,
  partsItems: CatalogItem[],
): { baseSrc: string; parts: OverlayPartRaw[] } {
  const partKindSet = new Set<string>();
  for (const k of Object.keys(partsCatalog)) {
    partKindSet.add(k);
    if (k.startsWith("parts-")) partKindSet.add(k.slice(6));
  }
  const lines = src.split("\n");
  const baseLines: string[] = [];
  const parts: OverlayPartRaw[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*-\s*("[^"]+"|\S+?)\s*:\s*\{(.+)\}\s*$/);
    if (m) {
      const alias = m[1]!.replace(/^"(.+)"$/, "$1");
      const inner = m[2]!;
      const kindMatch = inner.match(/(?:^|,)\s*kind\s*:\s*([a-zA-Z0-9-_]+)/);
      if (kindMatch) {
        const kindValue = kindMatch[1]!;
        if (partKindSet.has(kindValue)) {
          const posXMatch = inner.match(/(?:^|,)\s*posX\s*:\s*(-?\d+(?:\.\d+)?)/);
          const posYMatch = inner.match(/(?:^|,)\s*posY\s*:\s*(-?\d+(?:\.\d+)?)/);
          const scaleMatch = inner.match(/(?:^|,)\s*scale\s*:\s*(-?\d+(?:\.\d+)?)/);
          const item = partsItems.find((p) => p.id === `parts-${kindValue}` || p.id === kindValue);
          if (item) {
            parts.push({
              id: alias,
              kind: kindValue,
              posX: posXMatch ? parseFloat(posXMatch[1]!) : 0,
              posY: posYMatch ? parseFloat(posYMatch[1]!) : 0,
              scale: scaleMatch ? parseFloat(scaleMatch[1]!) : 1,
              item,
            });
            continue;
          }
        }
      }
    }
    baseLines.push(line);
  }
  return { baseSrc: baseLines.join("\n"), parts };
}

/**
 * overlay parts の posX / posY / scale field を DSL actor 行に upsert。
 * 他 field (kind / bg / state override 等) は保持。 scale が 1 以外の時のみ scale field 書出し。
 */
export function writeOverlayPartToDsl(
  src: string,
  alias: string,
  posX: number,
  posY: number,
  scale: number,
): string {
  const lines = src.split("\n");
  const rx = Math.round(posX);
  const ry = Math.round(posY);
  const sScale = Number.isFinite(scale) ? Number(scale.toFixed(3)) : 1;
  const next = lines.map((line) => {
    const headMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)\{(.+)\}\s*$/);
    if (!headMatch) return line;
    const rawName = headMatch[2]!.replace(/^"(.+)"$/, "$1");
    if (rawName !== alias) return line;
    const prefix = headMatch[1]! + headMatch[2]! + headMatch[3]!;
    let inner = headMatch[4]!;
    inner = inner.replace(/,?\s*posX\s*:\s*-?\d+(?:\.\d+)?/g, "");
    inner = inner.replace(/,?\s*posY\s*:\s*-?\d+(?:\.\d+)?/g, "");
    inner = inner.replace(/,?\s*scale\s*:\s*-?\d+(?:\.\d+)?/g, "");
    inner = inner.replace(/^\s*,\s*/, "").replace(/\s*,\s*$/, "").trim();
    const newFields = [`posX: ${rx}`, `posY: ${ry}`];
    if (Math.abs(sScale - 1) > 0.001) newFields.push(`scale: ${sScale}`);
    const merged = inner.length > 0 ? `${inner}, ${newFields.join(", ")}` : newFields.join(", ");
    return `${prefix}{ ${merged} }`;
  });
  return next.join("\n");
}
