/**
 * 箱に書いた指定が効かない時の、伝える欄の割り出しと呼び名 (#2368 で 1 箇所にまとめた)。
 *
 * 同じ判定を 3 経路が使う。
 *
 * | 経路 | 図種 | 起点 |
 * |---|---|---|
 * | 板の面 | `sequence` / `solidity` | #2358 |
 * | 木の図 | `tree` | #2360 |
 * | 値の図とじょうご | `pie` ほか 9 図種 + `funnel` | #2368 |
 * | 工程表と体験の地図と四象限 | `gantt` / `journey` / `quadrant` | #2370 |
 * | 骨組みの図 | `flow` / `swimlane` / `topology` / `c4` / `class` | #2376 |
 *
 * 矢印の側は `edge-option-notice.ts` が同じ形を持つ (#2366)。
 */

/**
 * 効かない箱の欄の呼び名 (#2358)。 **並べた順に知らせへ出す**。
 *
 * 呼び名を持たない欄は名前をそのまま出すので、ここに足し忘れても知らせは消えない。
 * 複数の欄が 1 つの呼び名を持つ形 (位置が 4 欄) は、1 度だけ出す。
 *
 * **図種をまたいで 1 つの表にする** (#2360)。 同じ欄を図種ごとに別の文言で呼ぶと、
 * 図種を変えた読み手が同じ指定だと気付けない。 どの欄を伝えるかは図種ごとの除外が決める。
 */
export const 効かない箱の欄の呼び名: readonly (readonly [string, string])[] = [
  ["kind", "種類"],
  ["posW", "大きさ"],
  ["posH", "大きさ"],
  ["posX", "位置"],
  ["posY", "位置"],
  ["posRel", "位置"],
  // 位置のずらし (#1971)。 板は面ごとの箱を持たないので動かす相手が無い
  ["layoutPos", "位置"],
  ["rows", "行"],
  ["tone", "色"],
  ["colorHex", "色"],
  ["color", "色"],
  ["eyebrow", "小見出し"],
  ["value", "値"],
  ["shape", "図形"],
  ["previous", "前の値"],
  ["marks", "印"],
  ["stack", "段"],
  ["initial", "始まりの印"],
  ["final", "終わりの印"],
  ["visibleIf", "出す条件"],
  ["opacity", "透け具合"],
  ["wBind", "値への追随"],
  ["hBind", "値への追随"],
  ["renderOffsetX", "値への追随"],
  ["renderOffsetY", "値への追随"],
  ["owner", "担当"],
  ["end", "終わる時期"],
  ["touchpoint", "接点"],
  ["opportunity", "伸びしろ"],
];

/**
 * 板の面で、効かないと伝えない箱の欄 (#2358)。
 *
 * **除外側を書く**。 効かない欄を並べる形にすると、箱に欄を足した日にその欄だけが
 * 一覧から漏れ、書いた人には「書いたのに何も起きない」 としか見えない。
 *
 * | 区分 | 欄 |
 * |---|---|
 * | 板が描く | 名前 / 題 / 呼び名 と、書いた場所と種類を書いたかの印 |
 * | 別の知らせが受け持つ | 縦列 (`reportLaneNotHonored` が伝える) |
 *
 * 種類 (`kind`) は図種で分かれるので、判定の側で足す。
 */
export const 板が伝えない箱の欄: ReadonlySet<string> = new Set([
  "name",
  "title",
  "subtitle",
  "pos",
  "kindWritten",
  "lane",
]);

/**
 * 木の図で、効かないと伝えない箱の欄 (#2360)。
 *
 * | 区分 | 欄 |
 * |---|---|
 * | 木の図が描く | 名前 / 題 / 呼び名 / 値 と、書いた場所と種類を書いたかの印 |
 * | 別の知らせが受け持つ | 縦列 / 位置のずらし / 体験と工程の 4 欄 |
 *
 * 別の知らせは順に `lane-not-honored` / `position-offset-ignored` / `chart-value-unreadable`。
 * 除かないと同じ箱に 2 件並ぶ。
 */
export const 木の図が伝えない箱の欄: ReadonlySet<string> = new Set([
  "name",
  "title",
  "subtitle",
  "value",
  "pos",
  "kindWritten",
  "lane",
  "layoutPos",
  "owner",
  "end",
  "touchpoint",
  "opportunity",
]);

/**
 * 箱を名前と値の組として読む図で、どの図種でも効かないと伝えない箱の欄 (#2368 / #2370)。
 *
 * | 区分 | 欄 |
 * |---|---|
 * | どの図種も読む | 名前 / 題 / 呼び名 / 値 と、書いた場所と種類を書いたかの印 |
 * | 別の知らせが受け持つ | 縦列 / 位置のずらし / 体験と工程の 4 欄 |
 *
 * 呼び名 (`subtitle`) は値を書いていない箱で **値として読まれる** (`a.value ?? a.subtitle`)
 * ので除く。 位置 (`posX` / `posY`) は除かない = この図種では両方書いても効かないため、
 * 片方だけの知らせ (#2362) ではなくこちらが伝える。
 *
 * 記法の `offsetX` / `offsetY` は `layoutPos` に入る (`position-offset-ignored` が受け持つ)。
 * 欄の名前で判定するので、記法の項目名ではなく入った先の欄を書く。
 *
 * 体験と工程の 4 欄 (`owner` / `end` / `touchpoint` / `opportunity`) は、読む図種と
 * 別の知らせが受け持つ図種に分かれる。 どちらも伝えないので 1 つにまとめて除く。
 */
const 値として読む図に共通の除外: ReadonlySet<string> = new Set([
  "name",
  "title",
  "subtitle",
  "value",
  "pos",
  "kindWritten",
  "lane",
  "layoutPos",
  "owner",
  "end",
  "touchpoint",
  "opportunity",
]);

/**
 * 箱を名前と値の組として読む図種と、共通に加えて読む欄 (#2368 / #2370)。
 *
 * **表で持つ**。 図種ごとに除外の集合を丸ごと書くと、共通部分が図種の数だけ写され、
 * 1 つ直した日に他が古いまま残る (実測 = 値の図とじょうごで 2 つに分かれていた)。
 *
 * | 図種 | 共通に加えて読む欄 |
 * |---|---|
 * | 値の図 9 図種 | 色味 (`tone`) / 前の値 (`previous`) |
 * | じょうご / 体験の地図 / 四象限 | 無し (名前と値だけを読む) |
 * | 工程表 | 色味 (`tone`)。 担当と終わる時期は共通の除外に入っている |
 */
export const 値として読む図種: ReadonlyMap<string, readonly string[]> = new Map([
  ["pie", ["tone", "previous"]],
  ["bar", ["tone", "previous"]],
  ["line", ["tone", "previous"]],
  ["gauge", ["tone", "previous"]],
  ["radial", ["tone", "previous"]],
  ["stat", ["tone", "previous"]],
  ["waffle", ["tone", "previous"]],
  ["stacked", ["tone", "previous"]],
  ["slope", ["tone", "previous"]],
  ["funnel", []],
  ["gantt", ["tone"]],
  ["journey", []],
  ["quadrant", []],
]);

/**
 * その図種で、効かないと伝えない箱の欄を返す (#2370)。
 *
 * @param 図種 `値として読む図種` に載っている図種
 * @returns 共通の除外に、その図種が読む欄を足した集合
 */
export function 値として読む図が伝えない箱の欄(図種: string): ReadonlySet<string> {
  const 読む欄 = 値として読む図種.get(図種) ?? [];
  if (読む欄.length === 0) return 値として読む図に共通の除外;
  return new Set([...値として読む図に共通の除外, ...読む欄]);
}

/**
 * 箱を並べて線で繋ぐ図 (骨組みの図) で、どの図種でも効かないと伝えない箱の欄 (#2376)。
 *
 * | 区分 | 欄 |
 * |---|---|
 * | 骨組みの図が描く | 名前 / 題 / 呼び名 / 小見出し / 値 / 行 / 色味 / 図形 / 種類 / 段 / 透け具合 / 出す条件 |
 * | 位置と大きさ | `posX` / `posY` / `posW` / `posH` / `posRel` / `layoutPos` |
 * | 値への追随 | `wBind` / `hBind` / `renderOffsetX` / `renderOffsetY` |
 * | 別の知らせが受け持つ | 縦列 / 色番号 / 体験と工程の 4 欄 |
 *
 * 色番号 (`colorHex`) を除くのは、**部品を置いた箱でだけ効く** 欄だから。
 * 部品が色を変えられる状態を持たない時は `compile/parts.ts` が別に伝えるので、
 * ここで鳴らすと同じことを 2 度言う。
 *
 * 印 (`marks`) も除く。 行頭の記号に読み替えるのは ER 図と状態遷移図だけ
 * (`行頭の印にする`) で、骨組みの図では行と組にしても効かない。 **ここで伝えないのは、
 * 伝える側に回すとカタログの見本 3 枚と日本語の項目の見本が同時に動くため** =
 * 行と印の扱いは別に切り出す (#2377)。
 *
 * 残るのは始まりの印 / 終わりの印 / 前の値の 3 つ。
 * 実測 = 流れ図 447 枚 ・ 泳路の図 35 枚 ・ 配置の図 8 枚の見本すべてで、この 3 件が
 * 図も変えず知らせも出さなかった。
 */
const 骨組みの図に共通の除外: ReadonlySet<string> = new Set([
  "name",
  "title",
  "subtitle",
  "pos",
  "kindWritten",
  "value",
  "eyebrow",
  "tone",
  "rows",
  "shape",
  "kind",
  "stack",
  "marks",
  "opacity",
  "visibleIf",
  "colorHex",
  "color",
  "posX",
  "posY",
  "posW",
  "posH",
  "posRel",
  "layoutPos",
  "wBind",
  "hBind",
  "renderOffsetX",
  "renderOffsetY",
  "lane",
  "owner",
  "end",
  "touchpoint",
  "opportunity",
]);

/**
 * 箱を並べて線で繋ぐ図種と、共通の除外から外す欄 (#2376)。
 *
 * 外す欄 = その図種だけが読まない欄。 図種ごとの組み立て器が箱を自前で作るため、
 * 共通の経路が写す欄の一部が届かない。
 *
 * | 図種 | 外す欄 | 理由 |
 * |---|---|---|
 * | 流れ図 / 泳路の図 / 配置の図 / ER 図 | 無し | `compile/generic.ts` が共通の経路で箱を作る |
 * | 構成の図 (`c4`) | 段 (`stack`) | `compile/c4.ts` が `a.stack` を読まない |
 * | クラス図 (`class`) | 種類 (`kind`) | `compile/class.ts` が種類を行の形から決める |
 */
export const 骨組みの図種: ReadonlyMap<string, readonly string[]> = new Map([
  ["flow", []],
  ["swimlane", []],
  ["topology", []],
  ["er", []],
  ["c4", ["stack"]],
  ["class", ["kind"]],
]);

/**
 * その図種で、効かないと伝えない箱の欄を返す (#2376)。
 *
 * @param 図種 `骨組みの図種` に載っている図種
 * @returns 共通の除外から、その図種が読まない欄を抜いた集合
 */
export function 骨組みの図が伝えない箱の欄(図種: string): ReadonlySet<string> {
  const 読まない欄 = 骨組みの図種.get(図種) ?? [];
  if (読まない欄.length === 0) return 骨組みの図に共通の除外;
  const 残り = new Set(骨組みの図に共通の除外);
  for (const 欄 of 読まない欄) 残り.delete(欄);
  return 残り;
}

/**
 * 箱に書いた欄のうち、効かないものの呼び名を並べる (#2368)。
 *
 * **伝える欄を並べず、読む欄を除いた残り全部を返す**。 効かない欄を並べる形にすると、
 * 箱に欄を足した日にその欄だけが一覧から漏れ、書いた人には「書いたのに何も起きない」
 * としか見えない。 除外側を書けば、足し忘れは「余計に知らせる」 側へ倒れる。
 *
 * @param 箱 記法から読んだ箱 1 つ
 * @param 伝えない欄 その図種が読む欄と、別の知らせが受け持つ欄
 * @param 判定で外す欄 図種の中でさらに外す欄 (種類が図種で分かれる形、#2358)
 * @returns 知らせに出す呼び名。 空なら伝えるものが無い
 */
export function 効かない箱の欄を並べる(
  箱: object,
  伝えない欄: ReadonlySet<string>,
  判定で外す欄: readonly string[] = [],
): string[] {
  const 残り = new Set(
    Object.entries(箱 as Record<string, unknown>)
      .filter(([欄, 値]) => 値 !== undefined && !伝えない欄.has(欄))
      .map(([欄]) => 欄),
  );
  for (const 欄 of 判定で外す欄) 残り.delete(欄);
  const 効かない: string[] = [];
  for (const [欄, 呼び名] of 効かない箱の欄の呼び名) {
    if (!残り.delete(欄)) continue;
    if (!効かない.includes(呼び名)) 効かない.push(呼び名);
  }
  // 呼び名を持たない欄は名前をそのまま出す = 読みにくい名前でも、黙って落とすよりは伝わる
  効かない.push(...[...残り].sort());
  return 効かない;
}
