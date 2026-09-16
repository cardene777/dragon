/**
 * 書いた語を図の状態へ読み替える表 (#2030 で `compile.ts` から移した)。
 *
 * 道のり図の顔と、四象限の置き場所。 どちらも記法に書く語と描画側の値が 1 対 1 で対応する。
 *
 * **葉に置く** = 図種ごとの組み立て器と、`compile.ts` に残る読み替えの両方が呼ぶ。
 * どちらかの側に置くと、もう片方から逆向きの取り込みが生まれる。
 */

export const 気持ち = new Map<string, "delighted" | "happy" | "neutral" | "frustrated" | "angry">([
  ["最高", "delighted"],
  ["満足", "happy"],
  ["普通", "neutral"],
  ["不満", "frustrated"],
  ["怒り", "angry"],
]);

export const 区画 = new Map<string, "topLeft" | "topRight" | "bottomLeft" | "bottomRight">([
  ["左上", "topLeft"],
  ["右上", "topRight"],
  ["左下", "bottomLeft"],
  ["右下", "bottomRight"],
]);
