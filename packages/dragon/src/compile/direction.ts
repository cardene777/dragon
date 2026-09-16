import type { DslDocument, PresetType } from "../types";

/** 段の有無で経路が分かれる図種。 組み立ての入口が渡す種類と同じ綴り */
export type GenericKind = "flow" | "swimlane" | "er" | "state" | "topology";

/**
 * 図を並べる向きを決める小道具 (#2030 で `compile.ts` から移した)。
 *
 * 向きを書ける図種と、その既定、書いた向きの読み取り、後ろへ戻る矢印の判定。
 *
 * **葉に置く** = 図種ごとの組み立て器と、`compile.ts` に残る「書いたのに効かない」 の知らせの
 * 両方が呼ぶ。 どちらかの側に置くと、もう片方から逆向きの取り込みが生まれる。
 */

/**
 * 向きを選べる図種 (#1494)。
 *
 * **並び方そのものが読み方を担う図種は外す**。 表の図は「1 縦列 1 表」、クラス図と状態の図は
 * 設計が格子に置く形、順序図は 1 枚の板で、どれも向きを入れ替えると図の意味が変わる。
 *
 * `topology` も外す = 入れ物 (`contain`) を持つ図で、縦列の中に箱を囲む作りが向きと結びついている。
 */
export const 向きを選べる図種: ReadonlySet<PresetType> = new Set<PresetType>(["flow", "swimlane"]);

/** その図種の既定の向き。 書かなかった時は今までどおりの並びになる。 */
export function 既定の向き(kind: PresetType): "縦" | "横" {
  return kind === "flow" || kind === "topology" ? "縦" : "横";
}

/**
 * 実際に使う向き (#1494)。
 *
 * 書いていない図と、効かない図種に書いた図は既定のまま = **書かない図の並びは 1 つも動かない**。
 */
export function 並べる向き(kind: PresetType, doc: DslDocument): "縦" | "横" {
  if (doc.direction === undefined) return 既定の向き(kind);
  if (!向きを選べる図種.has(kind)) return 既定の向き(kind);
  return doc.direction;
}

/**
 * 後ろへ戻る矢印か (#1260)。
 *
 * 状態の図は、後ろの状態へ戻る矢印を **箱の上を回して** 描く (`routing: "back-detour"`)。
 * 組立て API 側がそうしており、記法側で付けないと **描いた図の高さが変わる**
 * (実測 = viewBox が 404 対 486 で、戻る矢印が箱の右横を回っていた)。
 *
 * 判定は並び順。 指す先が指す元より前にあれば戻る矢印
 * (実測 = `stateMachine()` は c -> a と c -> b の 2 本だけに付け、a -> b と b -> c には付けない)。
 *
 * **状態の図だけに付ける**。 他の図種の組立て API は付けない (実測 = `er()` は付けなかった)。
 */
export function 後ろへ戻る矢印か(
  kind: GenericKind,
  fromId: string,
  toId: string,
  箱の並び: ReadonlyMap<string, number>,
): boolean {
  if (kind !== "state") return false;
  const 元 = 箱の並び.get(fromId);
  const 先 = 箱の並び.get(toId);
  if (元 === undefined || 先 === undefined) return false;
  return 先 < 元;
}
