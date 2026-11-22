/**
 * 記法から、1 file で開ける HTML の頁の文字列を組む (#3667)。頁に埋める再生の script の中身は呼ぶ側が渡す (#3792)。
 *
 * npm と script の1行の入口の書き出す部品 (`html.ts`) は、入口の隣の再生の script (`player.global.js`) を読んで渡す。
 * `dragon embed` の頁 (`offline.ts`) は再生の script を読めないので、頁に埋めた自分の script を渡す。
 * 頁の組み方は命令の書き出し (`dragon export --format html`) と同じ処理 (`export/page.ts` と `export/html.ts`) を使う。
 * 字は頁が読み込んだ `@font-face` から、頁と再生の帯で描かれうる字の範囲に当たる字の file を丸ごと埋める (`fonts.ts`)。
 */
import { pageHtml } from "../export/html";
import { planPage } from "../export/page";
import type { Theme } from "../look/values";
import type { LineStyle } from "../render/pen-store";
import { parseNotation } from "../parser";
import type { UserBlocks } from "../user-blocks";
import { DEFAULT_LANG, type NotationLang } from "../words";
import { pageFontCss } from "./fonts";

export interface HtmlOptions {
  /**
   * 図の中の字と断りの文の言葉。書かなければ、図の中の字は図の題か段の本文 (`say`) に仮名か漢字があれば日本語、
   * 無ければ英語にし、断りの文は英語にする。`dragon export` の `lang` と同じ
   */
  lang?: NotationLang;
  /** 色味の名前。書かなければ図の色味 */
  palette?: string;
  theme?: Theme;
  /** 記法の頭に書かずに渡す、使う人が足すブロックの定義。`readBlocks` が読んだ物 */
  blocks?: UserBlocks;
  /** 線の描き方 (#3643)。`pen` は手描きのペンの線で描く。書かなければ定規の線。`dragon export --line` と同じ */
  line?: LineStyle;
}

/** 断りの文 */
const TEXT: Record<NotationLang, { notation: (errors: string[]) => string; page: string }> = {
  ja: {
    notation: (errors) => `記法を読めない (${errors.join("、")})`,
    page: "字を読み込んだ頁が無い。captureHtml はブラウザの頁で呼ぶ",
  },
  en: {
    notation: (errors) => `Cannot read the notation (${errors.join("; ")})`,
    page: "No page with the fonts loaded. Call captureHtml on a page in the browser",
  },
};

/**
 * 記法 `source` の図を、外を読まずに開ける HTML の頁の文字列にする。
 * `player` は断りの文の言葉を受けて再生の script の中身を返し、読めない時はその言葉の断りの文で断る
 */
export async function notationPage(source: string, options: HtmlOptions, player: (said: NotationLang) => Promise<string>): Promise<string> {
  const said = options.lang ?? DEFAULT_LANG;
  if (typeof document === "undefined") throw new Error(TEXT[said].page);
  const blocks = options.blocks ? { blocks: options.blocks } : {};
  const parsed = parseNotation(source, { lang: said, ...blocks });
  if (!parsed.ok) throw new Error(TEXT[said].notation(parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`)));
  const plan = planPage(parsed.diagram, options);
  const [fontCss, script] = await Promise.all([pageFontCss(document, plan.texts, said), player(said)]);
  return pageHtml(plan, fontCss, script);
}
