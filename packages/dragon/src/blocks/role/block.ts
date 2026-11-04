/**
 * 役のブロック (#3351、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。最初の `step` より前の `role <名札> [note: <一言>]` の行で、チップを持たずに動く役を宣言し、役の札が箱の上に並ぶ。
 * 段の中の `role <名札>` の行は、その段で動く役を名指し、その段に役の札が光る。段の中で名指す役は宣言した役だけ。
 * 書き戻す時は、役の宣言を図の種類の行の直ぐ後ろ、箱の宣言より前に書く (`print.lead`)。
 */
import type { Block } from "../block";

export interface LineupRole {
  id: string;
  note?: string;
}

/** 列の図の、段 `role` の役が動く出来事 (#3351)。役の札の縁が光る */
export interface LineupAct {
  type: "role";
  role: string;
}

export const block: Block = {
  name: "role",
  rank: 104,
  attach: { how: "place", only: "lineup" },
  words: { heads: ["role"], attrs: { role: ["note"] } },
};
