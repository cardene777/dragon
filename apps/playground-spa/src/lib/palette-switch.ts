import type { CdlDiagram } from "@cardenelabs/cdl";
import { THEMES, type DslTheme, 意匠を箱に当てる } from "@cardenelabs/dragon";
import { 字を引く, type 二言語 } from "./bilingual";
import type { Locale } from "./i18n";

/**
 * 図の色味の切替 (#1569)。
 *
 * 15 種のどの図でも意匠を当てて見比べられるよう、図に意匠が書かれていない時も切替を出す (#2790)。
 * 選ぶのは 7 つの意匠だけ。 意匠を外す選択は持たない = 図は必ず意匠のどれかで描く (#2962)。
 *
 * 色は図に載せる名前を差し替え、画面側 (`cdl-theme.css`) が当てる。見本帳の字幅は
 * 配色へ依存せず、比例・等幅の広い方で先に組むため、ここでは載せ替えない (#2908)。
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
  blueprint: { ja: "図面", en: "Blueprint" },
  letterpress: { ja: "活版", en: "Letterpress" },
  catalog: { ja: "図録", en: "Catalog" },
  terminal: { ja: "端末", en: "Terminal" },
  sketch: { ja: "手描き", en: "Sketch" },
  neon: { ja: "電飾", en: "Neon" },
  relief: { ja: "浮彫", en: "Relief" },
} as const satisfies Record<DslTheme, 二言語>;

/** 画面に出す意匠は記法が受ける正の名前から導く (#2790)。 */
export const 配色の選択肢: readonly DslTheme[] = THEMES;

/** `null` は選んでいない状態で、図に書かれた意匠 (無ければ画面の意匠) を使う。 */
export type 配色の選択 = DslTheme | null;

/** 画面に出す札を引く */
export function 配色の札(配色: DslTheme, locale: Locale): string {
  return 字を引く(値と札[配色], locale);
}

/**
 * 記法の意匠の名前か。 図に書いた名前と、住所や html に付いた名前の両方をこれで判定する
 * (`site-theme.ts` はこの file を import するので、判定はこちらに置く)。
 */
export const 意匠か = (名前: string | null | undefined): 名前 is DslTheme =>
  (THEMES as readonly (string | null | undefined)[]).includes(名前);

/** 図を描く意匠。 書いた意匠があればそれ、無ければ画面の意匠 (#2962) */
export function 図の意匠(diagram: CdlDiagram, 画面の意匠: DslTheme): DslTheme {
  return 意匠か(diagram.palette) ? diagram.palette : 画面の意匠;
}

/**
 * 押されている札。 未選択なら図を描く意匠 (書いた意匠、無ければ画面の意匠) を返す。
 */
export function 押される配色(diagram: CdlDiagram, 選択: 配色の選択, 画面の意匠: DslTheme): DslTheme {
  return 選択 ?? 図の意匠(diagram, 画面の意匠);
}

/**
 * 図の配色を差し替える。
 *
 * **未選択では元の object をそのまま返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、切替を触っていない図が最初へ戻る
 * (`playback-speed.ts` と同じ理由)。
 *
 * `textMetrics` は触らない。dragon の組み立てと見本帳の直接記述は配置前に `"widest"` を
 * 当てており、切替はその値を保つ。
 */
export function 図の配色を変える<T extends CdlDiagram>(diagram: T, 選択: 配色の選択): T {
  if (選択 === null) return diagram;

  // 記法で意匠を書いた図と同じ `意匠を箱に当てる` を通す = 棒の角と行の縞が書いた図と揃う (#2960)
  const 次の節 = diagram.nodes.map((node) => 意匠を箱に当てる(node, 選択));
  const 節が同じ = diagram.nodes.every((node, index) => 次の節[index] === node);
  if (diagram.palette === 選択 && 節が同じ) return diagram;

  const 次: T = { ...diagram, palette: 選択 };
  if (!節が同じ) 次.nodes = 次の節;
  return 次;
}
