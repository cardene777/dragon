/** 見本帳の部品の頁で、運ぶ物の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "attr:edge.carry": (v) => v.edges.some((e) => e.carry.kind === "coin" || e.carry.kind === "none"),
  /** 枝分かれの図の線は書かなければ送る側の名前の札を運ぶので、その札は書いた札に数えない */
  "attr:edge.tag": (v) => v.edges.some((e) => e.carry.kind === "tag" && !(v.diagram.kind === "git" && e.carry.text === e.from)),
  /** 線を起こした操作の番号 (Tracelyth #86)。シーケンス図の線と赤い×が `data-op` で持つ */
  "attr:edge.op": (v) => v.edges.some((e) => e.op !== undefined),
} satisfies BlockUses;
