import type { Locale } from "./i18n";

/**
 * 画面に出す字の 2 言語の組 (#2455)。
 *
 * 同じ形の型が 3 file に別々に書かれていた (`axis-names.ts` / `editor-text.ts` /
 * `DiagramZoomControls.tsx`)。 画面ごとに字の表が増えるので、組の形だけをここに置く。
 *
 * **字そのものはここに置かない**。 ここに在るのは型と引き方だけで、字は画面ごとの表が持つ。
 * 全画面の字を 1 file に集めると、1 画面を直すたびに他の画面の字を読むことになる。
 */
export interface 二言語 {
  ja: string;
  en: string;
}

/** 組から言語の側を引く。 `locale === "ja" ? x.ja : x.en` を画面に散らさないための 1 行 */
export function 字を引く(組: 二言語, locale: Locale): string {
  return locale === "ja" ? 組.ja : 組.en;
}

/**
 * 表ごと言語の側に畳む。 画面は `字.鍵` の形で引ける。
 *
 * **言語ごとに 1 度だけ畳む** = 描くたびに新しい object を返すと、字を受け取る側が
 * 値が替わったとみなして描き直す。 畳んだ結果を控えに持つ。
 */
export function 表を畳む<K extends string>(
  表: Record<K, 二言語>,
  locale: Locale,
  控え: Partial<Record<Locale, Record<K, string>>>,
): Record<K, string> {
  const 有り = 控え[locale];
  if (有り !== undefined) return 有り;
  const 畳んだ = Object.fromEntries(
    Object.entries<二言語>(表).map(([k, v]) => [k, 字を引く(v, locale)]),
  ) as Record<K, string>;
  控え[locale] = 畳んだ;
  return 畳んだ;
}
