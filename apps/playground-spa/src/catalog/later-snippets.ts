/**
 * 部品の図の記法の塊。`snippets.ts` を 1 つの塊にして後から読む (#3246)。
 *
 * 最初の画面は、見本帳を開く頃に届くよう裏で読み始めるためにこの塊を名指す。部品の表 (`parts.ts`) と同じ file に置くと、
 * 名指しただけで部品の表と部品の使い方の表 (各ブロックの `gallery/uses.ts`) まで最初に読む script に入るので分ける (#3868)
 */
import { laterChunk } from "../site/later";

export const LATER_SNIPPETS = laterChunk(() => import("./snippets").then((m) => m.SNIPPETS));
