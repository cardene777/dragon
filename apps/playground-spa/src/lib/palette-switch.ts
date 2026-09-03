import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 図の色味の切替 (#1569)。
 *
 * 配色は 2 組ある (生成りに茶 / 青磁に墨) が、見本帳では図に書いた方しか見られなかった。
 * もう一方を見るには開発者の道具で `data-cdl-palette` を手で書き換えるしかなく、
 * 意匠を決める時に 2 つを見比べられない。
 *
 * 描き手は色を持たない = 図に載るのは名前だけで、色は画面側 (`cdl-theme.css`) が当てる。
 * だから切替も **名前を差し替えるだけ** で済む。
 *
 * 速さ (`playback-speed.ts`) / 描き方 (`redraw-mode.ts`) と同じ形にしてある。
 */

/** 表に出す名前と、図に載せる名前の対応 */
const 表と名前 = {
  生成りに茶: "kinari",
  青磁に墨: "celadon",
} as const;

export const 配色の選択肢 = ["生成りに茶", "青磁に墨"] as const;

export type 配色 = (typeof 配色の選択肢)[number];

/** 既定。 見本の source に書いたとおり (ER 図とクラス図は生成りに茶) */
export const 既定の配色: 配色 = "生成りに茶";

/**
 * その図で切替えられるか。
 *
 * **配色を持つ図に限る**。 配色を書かない図で名前を足すと、いままで site の色で描かれて
 * いた図が急に別の色みになる = 切替が「見比べる」 ではなく「着せ替える」 道具になる。
 *
 * 押しても何も起きない操作を置かないのは `描き方を選べる` と同じ判断。
 */
export function 配色を選べる(diagram: CdlDiagram): boolean {
  return typeof diagram.palette === "string" && diagram.palette.length > 0;
}

/**
 * 図の配色の名前を差し替える。
 *
 * **既定では元の object をそのまま返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、切替を触っていない図が最初へ戻る
 * (`playback-speed.ts` と同じ理由)。
 */
export function 図の配色を変える(diagram: CdlDiagram, 配色: 配色): CdlDiagram {
  if (!配色を選べる(diagram)) return diagram;
  const 名前 = 表と名前[配色];
  if (diagram.palette === 名前) return diagram;
  return { ...diagram, palette: 名前 };
}
