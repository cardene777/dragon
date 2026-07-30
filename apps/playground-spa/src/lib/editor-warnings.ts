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
 * 自動配置を前提にした整列の軸。 手で置いた要素に関わる分だけ出さない。
 *
 * これらは「同じ列の箱は中心を揃える」「箱の間隔を均一にする」 を見る。 自動配置なら妥当だが、
 * 書く人が位置を決めた箱については、 書いた通りに置いたことを誤りとして報せてしまう。
 *
 * 図に手動配置が 1 件あるだけで全部隠すと、 触っていない箱で起きた本物の配置不良まで
 * 見えなくなる。 指摘が指す相手を見て、 手で置いた分に関わる時だけ隠す。
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
 * 指摘の文面から、 対象の箱と縦列の id を取る。
 *
 * cdl の `Violation` は軸と文面しか持たないため、 文面から読む以外に対象を知る手段がない。
 * 文面の形が変わると隠す範囲がずれるので、 `editor-warnings.test.ts` が実際の検証結果に
 * 対して読み取れることを確かめる。
 */
export function violationTargets(detail: string): { node?: string; lane?: string } {
  return {
    node: detail.match(/node "([^"]+)"/)?.[1],
    lane: detail.match(/lane "([^"]+)"/)?.[1],
  };
}

/** 手で置いた箱の id と、 その箱が属する縦列の id。 */
function manuallyPlaced(diagram: CdlDiagram): { nodes: Set<string>; lanes: Set<string> } {
  const nodes = new Set<string>();
  const lanes = new Set<string>();
  for (const n of diagram.nodes) {
    if (n.posX === undefined || n.posY === undefined) continue;
    nodes.add(n.id);
    if (n.lane) lanes.add(n.lane);
  }
  for (const l of diagram.lanes) {
    if (l.posX === undefined || l.posY === undefined) continue;
    lanes.add(l.id);
  }
  return { nodes, lanes };
}

/**
 * 図の中に、 書く人が決めた位置があるか。
 *
 * 座標は縦横の 2 つが揃って初めて効くので、 揃っている時だけ「決めた」 とみなす。
 */
export function hasExplicitPositions(diagram: CdlDiagram): boolean {
  const m = manuallyPlaced(diagram);
  return m.nodes.size > 0 || m.lanes.size > 0;
}

/** 画面に出す指摘を選ぶ。 手で置いた分に関わる整列の指摘だけを外す。 */
export function visibleWarnings(violations: Violation[], diagram: CdlDiagram): Violation[] {
  const manual = manuallyPlaced(diagram);
  const hasManual = manual.nodes.size > 0 || manual.lanes.size > 0;
  return violations.filter((v) => {
    if (HIDDEN_WARNING_AXES.has(v.axis)) return false;
    if (!hasManual || !AUTO_LAYOUT_ALIGNMENT_AXES.has(v.axis)) return true;
    const t = violationTargets(v.detail);
    // 箱を名指ししている指摘は、 その箱を手で置いた時だけ外す
    if (t.node !== undefined) return !manual.nodes.has(t.node);
    // 箱を名指ししない指摘 (間隔の均一さ) は縦列単位。 その縦列に手で置いた箱があれば、
    // 間隔が揃わないのは書いた通りの結果なので外す
    if (t.lane !== undefined) return !manual.lanes.has(t.lane);
    // 対象が読み取れない指摘は残す。 隠す判断がつかないものを黙って落とさない
    return true;
  });
}
