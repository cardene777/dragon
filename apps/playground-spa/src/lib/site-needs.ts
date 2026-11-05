/**
 * 検査の file の字から、その file が開く見本帳の頁の build を読む (#3381、#3388)。
 *
 * 1 回の実行の準備の段 (`site-setup.ts`) は、これで build する頁を決める。
 * 検査の file の準備の段 (`chromium-preload.ts`) は、これで Chromium を起こすかを決める。
 * 2 つが同じ規則で読むよう、規則をここに 1 つだけ持つ。
 * build の道具 (vite) を読み込まないので、検査の file の process でも軽く読める。
 */

/** 名指さない build の鍵 */
export const DEFAULT_SITE = "default";

const NAMED = /startSite\(\{\s*config:\s*join\(app,\s*"([^"]+)"\)\s*\}\)/gu;

/** 検査の file の字から、要る build の鍵を読む */
export function sitesNeeded(sources: string[]): string[] {
  const keys = new Set<string>();
  for (const text of sources) {
    if (/\b(?:startSite|useSite)\(\)/u.test(text)) keys.add(DEFAULT_SITE);
    for (const m of text.matchAll(NAMED)) if (m[1]) keys.add(m[1]);
  }
  return [...keys].sort();
}
