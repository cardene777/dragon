/**
 * 枝の描き方 (#3164、#3347)。
 *
 * 枝を切る線は、切った commit から枝の帯へ引く。引き方は親から子へ引く線と同じで、引いた後も残す。
 * 枝の帯と名札は、並べ方が区画の形 (`SceneRegion`) で出して区画のブロックの描き方 (`blocks/group/draw.ts`) で描くので、この file は分かれの線だけを持つ。
 * この file は枝分かれの図を描く部品 (`render/git.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { type LinkLine, parentLine } from "../commit/draw";

/** 枝を切る線。親から子へ引く線と同じく、引き始めてから引き終えるまでに伸ばし、繰り返す前まで残す */
export const forkLine: LinkLine = (l, time, ctx) => parentLine(l, time, ctx);
