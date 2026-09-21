import type { Locale } from "./i18n";

/**
 * 画面の名前 (#2451)。
 *
 * 帯の行き先と道筋が同じ名前を出すので、**表は 1 つだけ持つ**。
 * 以前は帯が `SiteHeader.tsx` の中に持ち、道筋は 3 画面が字を直に書いていた。
 * 直に書いた側は言語で選んでおらず、英語で開いても `概要` と出ていた。
 */
export const 画面の名前: Record<string, { ja: string; en: string }> = {
  "/": { ja: "概要", en: "home" },
  "/catalog": { ja: "カタログ", en: "catalog" },
  "/editor": { ja: "編集画面", en: "editor" },
  "/docs": { ja: "使い方", en: "docs" },
  "/release-notes": { ja: "更新履歴", en: "releases" },
  "/contribute": { ja: "参加方法", en: "contribute" },
};

/**
 * 行き先の名前を引く。 表に無い行き先は **例外にして落とす**。
 *
 * 引けなかった時に行き先そのもの (`/catalog`) を出す形にすると、
 * 画面には出るので気付かないまま、英語でも日本語でもない字が残る。
 */
export function 画面の名前を引く(行き先: string, locale: Locale): string {
  const 名前 = 画面の名前[行き先];
  if (名前 === undefined) {
    throw new Error(`画面の名前が表に無い: ${行き先} (site-destinations.ts に足す)`);
  }
  return locale === "ja" ? 名前.ja : 名前.en;
}
