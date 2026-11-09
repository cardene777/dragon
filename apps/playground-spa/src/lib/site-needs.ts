/**
 * 検査の file の字から、見本帳の頁の build が要るかを読む (#3381、#3585)。
 *
 * 1 回の実行の準備の段 (`site-setup.ts`) は、これで build するかを決める。
 * build の道具 (vite) を読み込まないので、検査の file の process でも軽く読める。
 */

/** build の鍵 */
export const DEFAULT_SITE = "default";

/** 検査の file の字から、要る build の鍵を読む */
export function sitesNeeded(sources: string[]): string[] {
  return sources.some((text) => /\bbuiltDir\(\)/u.test(text)) ? [DEFAULT_SITE] : [];
}
