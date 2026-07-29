/**
 * 編集画面に出す指摘を選ぶ。
 *
 * cdl の検証は図の全ての軸を返すが、 そのまま出すと「書いた通りに置いたこと」 まで
 * 誤りとして並ぶ。 書く人が直せることだけを残す。
 */

import type { CdlDiagram, Violation } from "@cardenelabs/cdl";

/** 画面には出さない軸。 描画の滲みなど、 書く人が本文で直せないもの。 */
export const HIDDEN_WARNING_AXES: ReadonlySet<string> = new Set(["subpixel-precision"]);

/**
 * 自動配置を前提にした整列の軸。 位置を自分で書いた図では出さない。
 *
 * これらは「同じ列の箱は中心を揃える」「箱の間隔を均一にする」 を見る。 自動配置なら妥当だが、
 * 書く人が位置を決めた図では、 書いた通りに置いたことを誤りとして報せてしまう。 位置を書くと
 * 必ず出るため、 位置を調整した瞬間から画面が常時 NG になる (実測 = `位置: 700,498` を手で
 * 書いた場合も、 相対で書いた場合も同じ軸が出る)。
 *
 * 並べるのは実際に発火を確認した軸だけにする。 同じ系統に見えるが出たことのない軸
 * (`grid-alignment` / `lane-cx-consistency`) は、 出るのを見てから足す。
 */
export const AUTO_LAYOUT_ALIGNMENT_AXES: ReadonlySet<string> = new Set([
  "alignment",
  "column-alignment",
  "column-gap-uniform",
  "row-alignment",
  "row-gap-uniform",
]);

/**
 * 図の中に、 書く人が決めた位置があるか。
 *
 * 座標は縦横の 2 つが揃って初めて効くので、 揃っている時だけ「決めた」 とみなす。
 */
export function hasExplicitPositions(diagram: CdlDiagram): boolean {
  return (
    diagram.nodes.some((n) => n.posX !== undefined && n.posY !== undefined) ||
    diagram.lanes.some((l) => l.posX !== undefined && l.posY !== undefined)
  );
}

/** 画面に出す指摘を選ぶ。 位置を書いた図では整列の軸を外す。 */
export function visibleWarnings(violations: Violation[], diagram: CdlDiagram): Violation[] {
  const manual = hasExplicitPositions(diagram);
  return violations.filter(
    (v) => !HIDDEN_WARNING_AXES.has(v.axis) && !(manual && AUTO_LAYOUT_ALIGNMENT_AXES.has(v.axis)),
  );
}
