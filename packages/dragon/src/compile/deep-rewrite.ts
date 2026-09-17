/**
 * 入れ子の中の文字だけを書き換える (#2034 で `compile.ts` から移した)。
 *
 * **葉に置く** = 入口 (`compileToCdl`) と部品の取り込み (`mergePartIntoDiagram`) の両方が呼ぶ。
 */

/**
 * 形 (`shape`) と数値の表示 (`readout`) の入れ子にある文字の葉を、全て書き換え関数に通す。
 * 文字でない葉 (数 / 真偽 / null) はそのまま残す。
 * 同じ object を 2 度辿らないよう `WeakSet` で覚える = 今の形は木なので輪にはならないが、
 * 輪ができた時に戻らなくなるのを防ぐため。
 */
export function deepRewriteStrings(
  value: unknown,
  rewrite: (s: string | undefined) => string | undefined,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (typeof value === "string") return rewrite(value) ?? value;
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((v) => deepRewriteStrings(v, rewrite, seen));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = deepRewriteStrings(v, rewrite, seen);
  }
  return out;
}
