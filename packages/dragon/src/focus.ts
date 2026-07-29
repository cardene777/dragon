/**
 * 光らせる相手 (`focus:`) の書き方を読む。
 *
 * 書き方は 2 通り。 箱の名前 1 つか、 矢印 (`A -> B`) で 2 者を指す形。
 *
 * 読み方をここに 1 つだけ置く。 id の形は図種で違う (順序図は縦列の上端 / 下端 / 手順箱、
 * 流れ図は箱 1 個) ため id への解決は図種ごとに残すが、 「どちらの書き方か」 の判断を
 * 図種ごとに持つと、 同じ記述が図種によって別の意味になる。
 *
 * 以前は図種ごとに判定していて、 順序図と汎用の 2 経路が `-` 1 文字を矢印と見なしていた。
 * その結果 `api-gateway` のような名前が「api から gateway への矢印」 と読まれ、 順序図では
 * 光らず、 流れ図では名前に部分一致した別の矢印が光っていた (実測)。
 */

/** 光らせる相手の指定。 */
export type FocusEntry =
  | { kind: "edge"; from: string; to: string }
  | { kind: "node"; name: string };

/**
 * 矢印の形。 `->` の 2 文字か `→` の 1 文字だけを矢印と見なす。
 *
 * `-` 1 文字を矢印に含めてはいけない。 名前に `-` を使う箱 (`api-gateway` / `shape-api-gateway`)
 * が矢印として読まれる。
 */
const ARROW = /^(.+?)\s*(?:->|→)\s*(.+)$/;

/**
 * 書かれた 1 件を読む。
 *
 * 矢印の両側は 1 文字以上を要求するので、 片側だけの形 (`-> API` / `API ->`) は矢印に
 * ならず名前として読まれる。
 */
export function parseFocusEntry(raw: string): FocusEntry {
  const item = raw.trim();
  const m = item.match(ARROW);
  if (!m) return { kind: "node", name: item };
  return { kind: "edge", from: m[1]!.trim(), to: m[2]!.trim() };
}
