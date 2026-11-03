/**
 * merge commit の描き方 (#3164、#3347)。
 *
 * 取り込みの線は、取り込む枝の先端から merge commit へ引く。引き方は親から子へ引く線と同じで、引いた後も残す。
 * 線の道の形 (取り込む枝の帯から merge commit の帯へ折れる形) は並べ方が持つ。
 * この file は枝分かれの図を描く部品 (`render/git.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { type LinkLine, parentLine } from "../commit/draw";

/** 取り込みの線。親から子へ引く線と同じく、引き始めてから引き終えるまでに伸ばし、繰り返す前まで残す */
export const mergeLine: LinkLine = (l, time, ctx) => parentLine(l, time, ctx);
