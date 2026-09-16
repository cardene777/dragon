import type { DslDocument } from "../types";
/**
 * 図の小見出しと、知らせに出す字の切り詰め (#2030 で `compile.ts` から移した)。
 *
 * 7 図種が小見出しを使う。 切り詰めは知らせを出す全域が使う。
 */

/**
 * 図全体を 1 箱にする図種で、 その箱の上に出す小見出しを渡す (#1247)。
 *
 * 書かなければ何も渡さない = 従来どおり小見出しは付かない。 `undefined` を明示して渡すと、
 * 組立て側が「空の小見出しを書いた」 と区別できなくなるので、 項目ごと落とす。
 */
export function 図の小見出し(doc: DslDocument): { eyebrow?: string } {
  return doc.eyebrow === undefined ? {} : { eyebrow: doc.eyebrow };
}

/** 知らせに載せる値を短く切る。 長い URL をそのまま出すと画面の帯が読めなくなる */
export function truncateForMessage(v: string): string {
  const s = v.trim();
  return s.length <= 40 ? s : `${s.slice(0, 37)}...`;
}
