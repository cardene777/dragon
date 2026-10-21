/**
 * 頁で選べる見本 3 つ。記法の file を字のまま読み込む (#2995)。
 *
 * 見本の正は `packages/dragon/examples` の file で、英語版は同じ名前に `.en` を付けた file。
 */
import ccipJa from "../../../packages/dragon/examples/ccip.dragon?raw";
import ccipEn from "../../../packages/dragon/examples/ccip.en.dragon?raw";
import introJa from "../../../packages/dragon/examples/intro.dragon?raw";
import introEn from "../../../packages/dragon/examples/intro.en.dragon?raw";
import oauthJa from "../../../packages/dragon/examples/oauth.dragon?raw";
import oauthEn from "../../../packages/dragon/examples/oauth.en.dragon?raw";

import type { Lang } from "./text";

export const EXAMPLE_KEYS = ["intro", "oauth", "ccip"] as const;
export type ExampleKey = (typeof EXAMPLE_KEYS)[number];

/** 頁を開いた時に出す見本 */
export const FIRST_EXAMPLE: ExampleKey = "oauth";

const EXAMPLES: Record<ExampleKey, Record<Lang, string>> = {
  intro: { ja: introJa, en: introEn },
  oauth: { ja: oauthJa, en: oauthEn },
  ccip: { ja: ccipJa, en: ccipEn },
};

export const exampleText = (key: ExampleKey, lang: Lang): string => EXAMPLES[key][lang].trimEnd();

/** 書く欄の中身がどれかの見本そのままなら、その見本と言葉 */
export function whichExample(text: string): { key: ExampleKey; lang: Lang } | undefined {
  for (const key of EXAMPLE_KEYS) {
    for (const lang of ["ja", "en"] as const) {
      if (exampleText(key, lang) === text.trimEnd()) return { key, lang };
    }
  }
  return undefined;
}
