/**
 * 字の幅を、同梱した字の送り幅の表で測る。描かずに測るので、頁の無い所 (node) でも同じ値になる。
 */
import { advance, EM, type Family } from "../look/fonts";
import type { TextStyle } from "../look/values";
import type { Rect } from "./scene";

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

/**
 * 1 行の字が占める四角 (#3175)。`x` は `anchor` が `start` なら左端、`middle` なら真ん中で、`y` は基準線。
 * 高さは行の外枠ではなく字の形の高さ (基準線から上に字の大きさの 8 割、下に 2 割) を取る。上下に並べた 2 行 (箱の名前と下の字) を重なりに数えないため
 */
export function textBox(text: string, x: number, y: number, style: TextStyle, anchor: "start" | "middle" = "start"): Rect {
  const w = textWidth(text, style);
  return { x: anchor === "middle" ? x - w / 2 : x, y: y - style.size * 0.8, w, h: style.size };
}
