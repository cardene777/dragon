/**
 * 枝を消すブロック (#3632)。
 *
 * 枝分かれの図の部品 (`only: git`)。段の中の `delete <枝>` の行で枝を消す。語は git の枝を消す命令 `git branch --delete` と同じ。
 * 消した段から後はその枝の札を描かず、どの札からも辿れなくなった commit は今の決まりのとおり点線の丸で描く。枝の帯は残す。
 * 宣言していない枝と、HEAD が指している枝は消せず、消した枝へは commit を積めない。
 */
import type { Block } from "../block";

/** 枝を消す出来事。枝の札を図から外す */
export interface GitDelete {
  type: "delete";
  branch: string;
}

export const block: Block = {
  name: "delete",
  rank: 9,
  attach: { how: "place", only: "git" },
  words: { heads: ["delete"], headRanks: { delete: 89 } },
};
