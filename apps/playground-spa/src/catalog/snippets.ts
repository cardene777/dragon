/**
 * 部品の図の記法 (#3246)。
 *
 * `parts.ts` がこの file を `import()` で読み、build はこの file を部品の図の記法だけを持つ 1 つの塊にする。
 * 部品の図はブロックの置き場 (`packages/dragon/src/blocks/<名前>/gallery/`) に在り (#3345、#3348)、
 * 鍵は `./parts/<名札>.<図の種類>.dragon` と英語の `.en.dragon` の形で引く。
 */
const figures = import.meta.glob<string>("../../../../packages/dragon/src/blocks/*/gallery/*.dragon", { query: "?raw", import: "default", eager: true });

export const SNIPPETS: Record<string, string> = Object.fromEntries(
  Object.entries(figures).map(([path, text]) => [`./parts/${path.slice(path.lastIndexOf("/") + 1)}`, text]),
);
