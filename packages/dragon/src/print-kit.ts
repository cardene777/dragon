/**
 * 原本を記法へ書き戻す下請け (#3345)。
 *
 * 書き戻す処理 (`printer.ts`) と、ブロックの書き戻す処理 (`blocks/<名前>/block.ts`) が共に使う。
 * ブロックは書き戻す処理を読まずにこの file だけを読む。
 * `"` で囲むのは要る時だけにする。`[` を含む名前と、`,` か `]` を含む属性の値と、`"` で始まる字を囲む。
 */

export const quote = (text: string): string => `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
/** 行の終わりか `[` の前に置く名前と文 */
export const name = (text: string): string => (text.includes("[") || text.startsWith('"') ? quote(text) : text);
/** 属性の値 */
export const value = (text: string): string => (text.includes(",") || text.includes("]") || text.startsWith('"') ? quote(text) : text);

/** 属性の並び。値の無い鍵は書かず、1 つも無ければ何も付けない */
export const attrs = (pairs: [string, string | undefined][]): string => {
  const written = pairs.filter((pair): pair is [string, string] => pair[1] !== undefined);
  return written.length === 0 ? "" : ` [${written.map(([k, v]) => `${k}: ${value(v)}`).join(", ")}]`;
};

/** 名札と違う名前だけを `as` の後ろに書く */
export const shown = (id: string, text: string): string => (text === id ? "" : ` as ${name(text)}`);
