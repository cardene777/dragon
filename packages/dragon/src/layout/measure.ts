/**
 * 字の幅を、同梱した字の送り幅の表で測る。描かずに測るので、頁の無い所 (node) でも同じ値になる。
 */
import { advance, EM, type Family } from "../look/fonts";
import type { TextStyle } from "../look/values";

/** 和文 (CJK) の字を含むか。等幅の字は和文を持たないので、含む字は Noto Sans JP で描く。 */
export const hasWide = (text: string): boolean => [...text].some((ch) => (ch.codePointAt(0) ?? 0) >= 0x2e80);

/** 等幅を望む字でも、和文を含めば和文の字で描く。 */
export function familyFor(text: string, preferred: Family): Family {
  return preferred === "mono" && hasWide(text) ? "sans" : preferred;
}

/** 1 行の字の幅。 */
export function textWidth(text: string, style: TextStyle): number {
  const family = familyFor(text, style.family);
  let sum = 0;
  for (const ch of text) sum += advance(ch, family);
  return (sum * style.size) / EM;
}
