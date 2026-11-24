/**
 * 部品の名札を、部品の表 (`parts.ts` の `PARTS`) を読まずに確かめる (#3868)。
 *
 * 最初の画面は、部品の頁の経路が部品を指すかと、題に出す部品の名前だけを知ればよい。
 * 部品の表を読むと、カタログの頁だけが見本を探すのに使う部品の使い方の表 (各ブロックの `gallery/uses.ts`) まで
 * 最初に読む script に入るので、最初の script に既に在るブロックの並び (`blocks.gen.ts`) で答える。
 * 部品の表もこの並びから作るので、答えは表と同じになる。
 */
import { BLOCK_ORDER } from "./blocks.gen";
import type { PartId } from "./parts";

const IDS: ReadonlySet<string> = new Set(BLOCK_ORDER);

/** `id` が部品の表に在る部品の名札か */
export const isPartId = (id: string | undefined): id is PartId => id !== undefined && IDS.has(id);
