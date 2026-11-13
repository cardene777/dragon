/**
 * 記法から、1 file で開ける HTML の頁を作る (`captureHtml`、#3667)。
 *
 * 頁の組み方は命令の書き出し (`dragon export --format html`) と同じ処理 (`export/page.ts` と `export/html.ts`) を使うので、
 * 同じ記法なら字の `@font-face` のほかは `dragon export` と同じ文字列になる。
 * 字は頁が読み込んだ `@font-face` から、頁と再生の帯で描かれうる字の範囲に当たる字の file を丸ごと埋める (`fonts.ts`)。
 * 字の file を読めない時は、読めない字の名前と範囲を名指して断り、字の無い頁を返さない。
 *
 * 頁に埋める再生の script (`player.global.js`) は 1MB を超えるので、この入口に束ねない。
 * build は入口と同じ dir に置くので、初めて呼んだ時にそこから 1 度だけ読み、2 度目からは読んだ物を使う。
 */
import { pageHtml } from "../export/html";
import { planPage } from "../export/page";
import type { Theme } from "../look/values";
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
}

/** 断りの文 */
const TEXT: Record<NotationLang, { notation: (errors: string[]) => string; player: (why: string) => string; page: string }> = {
  ja: {
    notation: (errors) => `記法を読めない (${errors.join("、")})`,
    player: (why) => `頁に埋める再生の script (player.global.js) を読めない (${why})`,
    page: "字を読み込んだ頁が無い。captureHtml はブラウザの頁で呼ぶ",
  },
  en: {
    notation: (errors) => `Cannot read the notation (${errors.join("; ")})`,
    player: (why) => `Cannot read the player script to embed in the page (player.global.js: ${why})`,
    page: "No page with the fonts loaded. Call captureHtml on a page in the browser",
  },
};

/** 読んでいる再生の script。読めなかった時は消し、次に呼んだ時に読み直す */
let player: Promise<string> | undefined;

/** 入口と同じ dir の再生の script を読む */
function loadPlayer(): Promise<string> {
  if (player === undefined) {
    const reading = fetch(new URL("./player.global.js", import.meta.url)).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    });
    player = reading;
    reading.catch(() => {
      if (player === reading) player = undefined;
    });
  }
  return player;
}

/** 記法 `source` の図を、外を読まずに開ける HTML の頁の文字列にする */
export async function captureHtml(source: string, options: HtmlOptions = {}): Promise<string> {
  const said = options.lang ?? DEFAULT_LANG;
  if (typeof document === "undefined") throw new Error(TEXT[said].page);
  const blocks = options.blocks ? { blocks: options.blocks } : {};
  const parsed = parseNotation(source, { lang: said, ...blocks });
  if (!parsed.ok) throw new Error(TEXT[said].notation(parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`)));
  const plan = planPage(parsed.diagram, options);
  const [fontCss, script] = await Promise.all([
    pageFontCss(document, plan.texts, said),
    loadPlayer().catch((error: unknown) => {
      throw new Error(TEXT[said].player(error instanceof Error ? error.message : String(error)));
    }),
  ]);
  return pageHtml(plan, fontCss, script);
}
