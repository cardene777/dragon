/**
 * 線の描き方 (#3643) の名前と、手描きの線に描き替える処理の置き場。
 *
 * 描き替える処理 (`pen.ts`) は大きいので、軽い入口が最初に読む量に入れず、置き場だけを最初から持つ。
 * 全部を持つ入口と書き出しは読み込みの時に処理を置き (`pen-all.ts`)、軽い入口は `loadLine` が後から読んで置く (`light.ts`)。
 * 描く処理は描き終えた SVG をここへ渡し、手描きの線を選んだ時だけ描き替えさせる。
 */
import { FIGURE_TEXT } from "../figure-text";
import type { NotationLang } from "../words";

/** 線の描き方。`ruler` は定規の線、`pen` は手描きのペンの線 */
export type LineStyle = "ruler" | "pen";
export const LINE_STYLES: readonly LineStyle[] = ["ruler", "pen"];

let pen: ((svg: string) => string) | undefined;

/** 手描きの線に描き替える処理を置く */
export function registerPen(draw: (svg: string) => string): void {
  pen = draw;
}

/** 手描きの線に描き替える処理を今すぐ使える形で持っているか */
export const penLoaded = (): boolean => pen !== undefined;

/** 描いた図の SVG を線の描き方 `line` で描き直す。定規の線はそのまま返し、手描きの線の処理を読んでいない時は `lang` の言葉で断る */
export function drawLines(svg: string, line: LineStyle | undefined, lang: NotationLang): string {
  if (line !== "pen") return svg;
  if (pen === undefined) throw new Error(FIGURE_TEXT[lang].penNotLoaded);
  return pen(svg);
}
