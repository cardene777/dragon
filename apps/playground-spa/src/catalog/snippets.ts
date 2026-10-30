/**
 * 部品の図の記法 (#3246)。
 *
 * `parts.ts` がこの file を `import()` で読み、build はこの file を部品の図の記法だけを持つ 1 つの塊にする。
 * 鍵は `./parts/<名札>.<図の種類>.dragon` と英語の `.en.dragon` の path。
 */
export const SNIPPETS: Record<string, string> = import.meta.glob<string>("./parts/*.dragon", { query: "?raw", import: "default", eager: true });
