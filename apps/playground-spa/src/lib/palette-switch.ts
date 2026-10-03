import type { CdlDiagram } from "@cardenelabs/cdl";
import { THEMES, type DslTheme } from "@cardenelabs/dragon";
import { 字を引く, type 二言語 } from "./bilingual";
import type { Locale } from "./i18n";

/**
 * 図の色味の切替 (#1569)。
 *
 * 15 種のどの図でも意匠を当てて見比べられるよう、図に意匠が書かれていない時も切替を出す (#2790)。
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
  blueprint: { ja: "図面", en: "Blueprint" },
  letterpress: { ja: "活版", en: "Letterpress" },
} as const satisfies Record<DslTheme, 二言語>;

/** 画面に出す意匠は記法が受ける正の名前から導く (#2790)。 */
export const 配色の選択肢: readonly DslTheme[] = THEMES;

/** 図の `palette` を外し、site の色で描く選択。 意匠の一覧には含めない。 */
export const 画面の色 = "site-colours" as const;

export type 配色 = DslTheme | typeof 画面の色;
/** `null` は選んでいない状態で、図に書かれた意匠をそのまま使う。 */
export type 配色の選択 = 配色 | null;

/** 画面に出す札を引く */
export function 配色の札(配色: DslTheme, locale: Locale): string {
  return 字を引く(値と札[配色], locale);
}

/** 意匠を図から外す選択の札。 */
export function 画面の色の札(locale: Locale): string {
  return locale === "ja" ? "画面の色" : "Site colours";
}

/**
 * 押されている札。 未選択なら図に書かれた意匠、それも無ければ画面の色を返す。
 */
export function 押される配色(diagram: CdlDiagram, 選択: 配色の選択): 配色 {
  if (選択 !== null) return 選択;
  return (THEMES as readonly string[]).includes(diagram.palette ?? "")
    ? (diagram.palette as DslTheme)
    : 画面の色;
}

/**
 * 図の配色の名前を差し替える。
 *
 * **未選択では元の object をそのまま返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、切替を触っていない図が最初へ戻る
 * (`playback-speed.ts` と同じ理由)。
 */
export function 図の配色を変える(diagram: CdlDiagram, 選択: 配色の選択): CdlDiagram {
  if (選択 === null) return diagram;
  if (選択 === 画面の色) {
    if (diagram.palette === undefined) return diagram;
    const 次 = { ...diagram };
    delete 次.palette;
    return 次;
  }
  if (diagram.palette === 選択) return diagram;
  return { ...diagram, palette: 選択 };
}
