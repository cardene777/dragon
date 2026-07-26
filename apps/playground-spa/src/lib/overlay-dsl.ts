/**
 * overlay parts と DSL の相互変換を pure function として提供。
 * CdlEditor.tsx から抽出、 DOM / React 依存ゼロで vitest 単発 test 可能にする (Layer 1)。
 */

import type { CatalogItem } from "@/lib/catalog-items";

export type OverlayPartRaw = { id: string; kind: string; posX: number; posY: number; scale: number; rotate: number; bg?: string; item: CatalogItem };

/**
 * actor 行 (`  - alias: { ... }`) の parse regex。
 *
 * inner を `(.+)` (greedy) にしているのは nested brace を含む行を落とさないため。
 * cdl の actor には `state: { phase: false }` のような入れ子が実在し、
 * `[^}]*` (閉じ括弧を含まない) にすると最初の `}` で打ち切られて行全体が非 match になる
 * = parts が overlay から消えて drag / resize が保存されなくなる。
 *
 * ReDoS を懸念して `[^}]*` に変えた版を一度入れたが、 実測すると旧形は
 * 1000 → 16000 repeat で 0.011ms → 0.148ms と線形で、 catastrophic backtracking は起きていなかった。
 * 懸念が実測で否定されたので greedy 形に戻し、 nested brace の取りこぼしを避ける方を採る。
 */
const ACTOR_LINE_RE = /^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)\{(.+)\}\s*$/;

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
    // ReDoS 耐性のため ACTOR_LINE_RE (capture: prefix / name / sep / inner) を共用する
    const m = line.match(ACTOR_LINE_RE);
    if (m) {
      const alias = m[2]!.replace(/^"(.+)"$/, "$1");
      const inner = m[4]!;
      const kindMatch = inner.match(/(?:^|,)\s*kind\s*:\s*([a-zA-Z0-9-_]+)/);
      if (kindMatch) {
        const kindValue = kindMatch[1]!;
        if (partKindSet.has(kindValue)) {
          const posXMatch = inner.match(/(?:^|,)\s*posX\s*:\s*(-?\d+(?:\.\d+)?)/);
          const posYMatch = inner.match(/(?:^|,)\s*posY\s*:\s*(-?\d+(?:\.\d+)?)/);
          const scaleMatch = inner.match(/(?:^|,)\s*scale\s*:\s*(-?\d+(?:\.\d+)?)/);
          const rotateMatch = inner.match(/(?:^|,)\s*rotate\s*:\s*(-?\d+(?:\.\d+)?)/);
          // 2026-07-26 CAR-2158 correctness fix = bg を parse する。
          // 旧実装は bg を無視していたため、 color picker で DSL に bg を書いても canvas に反映されなかった。
          const bgMatch = inner.match(/(?:^|,)\s*bg\s*:\s*"([^"]*)"/);
          const item = partsItems.find((p) => p.id === `parts-${kindValue}` || p.id === kindValue);
          if (item) {
            parts.push({
              id: alias,
              kind: kindValue,
              posX: posXMatch ? parseFloat(posXMatch[1]!) : 0,
              posY: posYMatch ? parseFloat(posYMatch[1]!) : 0,
              scale: scaleMatch ? parseFloat(scaleMatch[1]!) : 1,
              rotate: rotateMatch ? parseFloat(rotateMatch[1]!) : 0,
              bg: bgMatch ? bgMatch[1]! : undefined,
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
  rotate: number = 0,
): string {
  const lines = src.split("\n");
  const rx = Math.round(posX);
  const ry = Math.round(posY);
  const sScale = Number.isFinite(scale) ? Number(scale.toFixed(3)) : 1;
  const sRotate = Number.isFinite(rotate) ? Number(rotate.toFixed(1)) : 0;
  const next = lines.map((line) => {
    const headMatch = line.match(ACTOR_LINE_RE);
    if (!headMatch) return line;
    const rawName = headMatch[2]!.replace(/^"(.+)"$/, "$1");
    if (rawName !== alias) return line;
    const prefix = headMatch[1]! + headMatch[2]! + headMatch[3]!;
    let inner = headMatch[4]!;
    inner = inner.replace(/,?\s*posX\s*:\s*-?\d+(?:\.\d+)?/g, "");
    inner = inner.replace(/,?\s*posY\s*:\s*-?\d+(?:\.\d+)?/g, "");
    inner = inner.replace(/,?\s*scale\s*:\s*-?\d+(?:\.\d+)?/g, "");
    inner = inner.replace(/,?\s*rotate\s*:\s*-?\d+(?:\.\d+)?/g, "");
    inner = inner.replace(/^\s*,\s*/, "").replace(/\s*,\s*$/, "").trim();
    const newFields = [`posX: ${rx}`, `posY: ${ry}`];
    if (Math.abs(sScale - 1) > 0.001) newFields.push(`scale: ${sScale}`);
    if (Math.abs(sRotate) > 0.05) newFields.push(`rotate: ${sRotate}`);
    const merged = inner.length > 0 ? `${inner}, ${newFields.join(", ")}` : newFields.join(", ");
    return `${prefix}{ ${merged} }`;
  });
  return next.join("\n");
}
