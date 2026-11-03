/**
 * 生存線の描き方 (#3345)。
 *
 * 時系列図の箱の下から、点線の縦の線を最後の段の下まで伸ばす。置き場所は時系列図の並べ方 (`kinds/sequence/layout.ts`) が決める。
 */
import { r1 } from "../../render/parts";

export function lifeline(x: number, y1: number, y2: number): string {
  return `<line class="dg-ll" x1="${r1(x)}" y1="${r1(y1)}" x2="${r1(x)}" y2="${r1(y2)}"/>`;
}
