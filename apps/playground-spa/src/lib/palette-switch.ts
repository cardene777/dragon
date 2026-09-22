import type { CdlDiagram } from "@cardenelabs/cdl";
import { 字を引く, type 二言語 } from "./bilingual";
import type { Locale } from "./i18n";

/**
 * 図の色味の切替 (#1569)。
 *
 * 配色は 2 組ある (生成りに茶 / 青磁に墨) が、カタログでは図に書いた方しか見られなかった。
 * もう一方を見るには開発者の道具で `data-cdl-palette` を手で書き換えるしかなく、
 * 意匠を決める時に 2 つを見比べられない。
 *
 * 描き手は色を持たない = 図に載るのは名前だけで、色は画面側 (`cdl-theme.css`) が当てる。
 * だから切替も **名前を差し替えるだけ** で済む。
 *
 * 速さ (`playback-speed.ts`) / 描き方 (`redraw-mode.ts`) と同じ形にしてある。
 */

/**
 * 図に載せる名前と、画面に出す札 (#2460)。
 *
 * **値の側を key にする**。 札の字をそのまま値にしていた間、英語で開いても札だけ日本語で
 * 出ていた = 字を訳すと型と状態の値が同時に変わるため、訳す側だけを動かせなかった。
 */
const 値と札 = {
  kinari: { ja: "生成りに茶", en: "Ecru and brown" },
  celadon: { ja: "青磁に墨", en: "Celadon and ink" },
} as const satisfies Record<string, 二言語>;

/** 画面に出す順は、値を並べた順に従う (生成りに茶 → 青磁に墨) */
export const 配色の選択肢 = Object.keys(値と札) as 配色[];

export type 配色 = keyof typeof 値と札;

/** 画面に出す札を引く */
export function 配色の札(配色: 配色, locale: Locale): string {
  return 字を引く(値と札[配色], locale);
}

/** 既定。 見本の source に書いたとおり (ER 図とクラス図は生成りに茶) */
export const 既定の配色: 配色 = "kinari";

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
  if (diagram.palette === 配色) return diagram;
  return { ...diagram, palette: 配色 };
}
