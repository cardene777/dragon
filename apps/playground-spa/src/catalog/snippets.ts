/**
 * 部品の図の記法 (#3246)。
 *
 * `parts.ts` がこの file を `import()` で読み、build はこの file を部品の図の記法だけを持つ 1 つの塊にする。
 * 鍵は `./parts/<名札>.<図の種類>.dragon` と英語の `.en.dragon` の path。
 * ブロックの置き場へ移した部品の図 (`packages/dragon/src/blocks/<名前>/gallery/`) も読み、同じ形の鍵で引く (#3345)。
 */
const own = import.meta.glob<string>("./parts/*.dragon", { query: "?raw", import: "default", eager: true });
const moved = import.meta.glob<string>("../../../../packages/dragon/src/blocks/*/gallery/*.dragon", { query: "?raw", import: "default", eager: true });

export const SNIPPETS: Record<string, string> = {
  ...own,
  ...Object.fromEntries(Object.entries(moved).map(([path, text]) => [`./parts/${path.slice(path.lastIndexOf("/") + 1)}`, text])),
};
