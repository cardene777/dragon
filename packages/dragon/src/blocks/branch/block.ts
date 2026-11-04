/**
 * 枝のブロック (#3164、#3347)。
 *
 * 枝分かれの図の部品 (`only: git`)。最初の `step` より前に `branch <名札> [note: <添え書き>]` で枝を上から順に宣言し、枝ごとに横長の帯が並ぶ。
 * 段の中で `<枝> from <commit>` と書くと、その commit から枝を切る。枝を切る行は行の頭が枝の名札なので、
 * 宣言した枝の名札の次に `from` が来る行は、定義の `lines` (2 つ目の語が `from`) で名指し、読み方 (`read.ts`) の `take` が `readCut` で読む。
 * 書き戻す時は、枝の行を図の種類の行の直ぐ後ろ (箱の宣言より前) に書く。
 */
import type { DiagramEvent } from "../../schema";
import type { Block } from "../block";

export const FROM = "from";

/** 枝分かれの図の枝。上から宣言した順に帯を並べる */
export interface GitBranch {
  id: string;
  note?: string;
}

/** 枝を切る出来事。枝の札を `from` の commit へ置く */
export type BranchCut = Extract<DiagramEvent, { type: "branch" }>;

export const block: Block = {
  name: "branch",
  rank: 5,
  attach: { how: "place", only: "git" },
  words: { heads: ["branch"], headRanks: { branch: 89 }, attrs: { branch: ["note"] } },
  // 枝分かれの図に枝が要る決まりと、線で枝の札を動かす決まりを持つ。枝を切る行 (`<枝> from <commit>`) は行の形で読む
  always: true,
  lines: [{ second: FROM }],
};
