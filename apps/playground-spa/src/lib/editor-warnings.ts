/**
 * 編集画面に出す指摘を選ぶ。
 *
 * cdl の検証は図の全ての軸を返すが、 そのまま出すと「書いた通りに置いたこと」 まで
 * 誤りとして並ぶ。 書く人が直せることだけを残す。
 */

import type { CdlDiagram, Violation } from "@cardenelabs/cdl";

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

/**
 * 箱の id から、書き手が書いた名前を引く表。
 *
 * **名前を持たない箱は載せない** (`a-spacer` のような組み立てが作る詰め物)。 載せると
 * 空文字に置き換わり、何を指しているか読めなくなる。
 *
 * 指摘ごとに作り直さず、表示する分をまとめて読み替える時に 1 度だけ作る。
 */
function 箱の名前(diagram: CdlDiagram): ReadonlyMap<string, string> {
  const 名前 = new Map<string, string>();
  for (const n of diagram.nodes) {
    const t = (n.title ?? "").trim();
    if (t !== "") 名前.set(n.id, t);
  }
  return 名前;
}

/** 引いた表で 1 件の文面を読み替える。 表を作る側と分けてあるのは作り直しを避けるため。 */
function 箱のidを名前にする(detail: string, 名前: ReadonlyMap<string, string>): string {
  // `node "<id>"` の形だけを見る。 文面の他の場所に同じ文字列があっても触らない
  return detail.replace(/node "([^"]+)"/gu, (元, id: string) => {
    const t = 名前.get(id);
    return t === undefined ? 元 : `名札 "${t}"`;
  });
}

/**
 * 描画側の指摘に出る箱の id を、書き手が書いた名前に読み替える (#1324)。
 *
 * 描画側は `node "a-header"` のように **組み立てが作った id** で指す。 書き手が書いたのは
 * `A` で、`a-header` は source のどこにも現れない。 id の作り方も書き手に見えていないため、
 * 対応付けを頭の中でやることになる。
 *
 * **読み替えるのは id だけ**。 同じ文面に出る種別名 (`shape-smart-contract`) は記法に
 * そのまま書ける語で、記法一覧の「箱の種類」 にも並んでいる。 書き手が `contract` と
 * 書いたか `shape-smart-contract` と書いたかは組み立ての後に残らないため、書いた方に
 * 戻すこともできない。 置き換えてよいのは書き手が絶対に書かない語に限る。
 *
 * 1 件だけ読み替える入口。 表示する分をまとめて通す経路は `visibleWarnings` が持つ。
 */
export function 書き手の名前で読める(detail: string, diagram: CdlDiagram): string {
  return 箱のidを名前にする(detail, 箱の名前(diagram));
}

/**
 * 画面に出す指摘を選ぶ。 手で置いた分に関わる整列の指摘だけを外す。
 *
 * 残した指摘は `書き手の名前で読める` を通してから返す。 **絞り込みは元の文面で行う** =
 * 対象を読み取る `violationTargets` は `node "<id>"` を探すため、読み替えた後だと引けない。
 */
export function visibleWarnings(violations: Violation[], diagram: CdlDiagram): Violation[] {
  const manual = manuallyPlaced(diagram);
  const hasManual = manual.nodes.size > 0 || manual.lanes.size > 0;
  const 残す = violations.filter((v) => {
    /*
     * 軸の単位で丸ごと隠す仕組みは持たない (`cdl#783`)。
     *
     * 元は「書く人が本文で直せない滲み」 として軸 33 (`subpixel-precision`) の `warn` を
     * 隠していた。 その軸が描画側から外れて一覧の要素が 0 個になったため、 ふるい分けごと
     * 外している。 隠したい軸がまた出たら、 隠す理由と検査を一緒に作る。
     */
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
  const 名前 = 箱の名前(diagram);
  return 残す.map((v) => ({ ...v, detail: 箱のidを名前にする(v.detail, 名前) }));
}
