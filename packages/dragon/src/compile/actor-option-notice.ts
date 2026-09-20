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
 * 値の図で、効かないと伝えない箱の欄 (#2368)。
 *
 * | 区分 | 欄 |
 * |---|---|
 * | 値の図が読む | 名前 / 題 / 呼び名 / 値 / 色味 / 前の値 と、書いた場所と種類を書いたかの印 |
 * | 別の知らせが受け持つ | 縦列 / 位置のずらし / 体験と工程の 4 欄 |
 *
 * 呼び名 (`subtitle`) は値を書いていない箱で **値として読まれる** (`a.value ?? a.subtitle`)
 * ので除く。 位置 (`posX` / `posY`) は除かない = 値の図では両方書いても効かないため、
 * 片方だけの知らせ (#2362) ではなくこちらが伝える。
 *
 * 記法の `offsetX` / `offsetY` は `layoutPos` に入る (`position-offset-ignored` が受け持つ)。
 * 欄の名前で判定するので、記法の項目名ではなく入った先の欄を書く。
 */
export const 値の図が伝えない箱の欄: ReadonlySet<string> = new Set([
  "name",
  "title",
  "subtitle",
  "value",
  "tone",
  "previous",
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
 * じょうごで、効かないと伝えない箱の欄 (#2368)。
 *
 * 値の図との違いは **色味と前の値を読まない** こと (`compile/funnel.ts` は値だけを使う)。
 * 同じ集合を使い回すと、じょうごで効かない 2 欄が黙って落ちる。
 */
export const じょうごが伝えない箱の欄: ReadonlySet<string> = new Set(
  [...値の図が伝えない箱の欄].filter((欄) => 欄 !== "tone" && 欄 !== "previous"),
);

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
