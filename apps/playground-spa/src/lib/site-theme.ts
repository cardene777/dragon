import type { CdlDiagram } from "@cardenelabs/cdl";
import { THEMES, type DslTheme } from "@cardenelabs/dragon";

import { 図の意匠, 図の配色を変える, 意匠か } from "./palette-switch";

/**
 * 画面の意匠 (#2962)。
 *
 * サイトの見た目は記法の意匠と同じ 7 つの名前で決め、値は `site-theme.css` の意匠ごとの表が持つ。
 * 開く意匠は住所の `?theme=` に書いた名前で、無い時と記法に無い名前は活版。
 * 明暗の切り替えは持たない = 明暗は意匠の地から決まる。
 *
 * 描く前に html へ付けるのは `public/site-theme.js` で、ここと同じ規則を持つ
 * (束ねずに配る script なので、この file を import できない)。
 */

/** `?theme=` が無い時と、記法に無い名前を書いた時の意匠 */
export const 既定の意匠: DslTheme = "letterpress";

/** 付いた名前から描く意匠を決める。 記法の意匠の名前でなければ (無い時も) 活版 */
export const 名前の意匠 = (名前: string | null): DslTheme => (意匠か(名前) ? 名前 : 既定の意匠);

/**
 * 地が暗い意匠。 `site-theme.css` の表の `color-scheme` と同じ組
 * (`site-theme-table.test.ts` が表と突き合わせ、表の `color-scheme` は地の色と突き合わせる)。
 *
 * 編集画面の記述欄 (CodeMirror) は明暗の別を描く前に受け取るので、表の値を読まずにここから渡す。
 */
const 地が暗い意匠: ReadonlySet<DslTheme> = new Set<DslTheme>(["catalog", "terminal", "neon"]);

export const 地が暗いか = (意匠: DslTheme): boolean => 地が暗い意匠.has(意匠);

/** 住所の `?theme=` から開く意匠を決める */
export function 住所の意匠(住所: string): DslTheme {
  return 名前の意匠(new URL(住所).searchParams.get("theme"));
}

/**
 * 当てた図の控え。 意匠ごとに、元の図から当てた図を引く。
 *
 * **同じ図と同じ意匠には同じ object を返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、段が最初へ戻る (`diagram-lang.ts` と同じ理由)。
 */
const 控え = new Map<DslTheme, WeakMap<CdlDiagram, CdlDiagram>>(THEMES.map((意匠) => [意匠, new WeakMap()]));

/**
 * 図に意匠を当てる。 書いた意匠があればそのまま、無ければ画面の意匠を当てる。
 *
 * 表紙・見本帳・編集画面が描く直前にここを通す = 意匠を持たない舞台を作らない。
 * 当てる時は見本帳の切り替えと同じ `図の配色を変える` を通すので、表の行の縞や棒の角も
 * 意匠を書いた図と揃う。 記法に無い名前が残った図も画面の意匠で描く。
 */
export function 図に意匠を当てる<T extends CdlDiagram>(diagram: T, 画面の意匠: DslTheme): T {
  if (図の意匠(diagram, 画面の意匠) === diagram.palette) return diagram;
  const 控えの図 = 控え.get(画面の意匠)?.get(diagram);
  if (控えの図 !== undefined) return 控えの図 as T;
  const 当てた図 = 図の配色を変える(diagram, 画面の意匠);
  控え.get(画面の意匠)?.set(diagram, 当てた図);
  return 当てた図;
}
