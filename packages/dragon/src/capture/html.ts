/**
 * 記法から、1 file で開ける HTML の頁を作る (`captureHtml`、#3667)。
 *
 * 頁の組み方は命令の書き出し (`dragon export --format html`) と同じ処理 (`export/page.ts` と `export/html.ts`) を使うので、
 * 同じ記法なら字の `@font-face` のほかは `dragon export` と同じ文字列になる。組む処理は `dragon embed` の頁と分け合う (`page-html.ts`、#3792)。
 * 字は頁が読み込んだ `@font-face` から、頁と再生の帯で描かれうる字の範囲に当たる字の file を丸ごと埋める (`fonts.ts`)。
 * 字の file を読めない時は、読めない字の名前と範囲を名指して断り、字の無い頁を返さない。
 *
 * 頁に埋める再生の script (`player.global.js`) は 1MB を超えるので、この入口に束ねない。
 * build は入口と同じ dir に置くので、初めて呼んだ時にそこから 1 度だけ読み、2 度目からは読んだ物を使う。
 */
import type { NotationLang } from "../words";
import { type HtmlOptions, notationPage } from "./page-html";

export type { HtmlOptions };

/** 断りの文 */
const TEXT: Record<NotationLang, { player: (why: string) => string }> = {
  ja: { player: (why) => `頁に埋める再生の script (player.global.js) を読めない (${why})` },
  en: { player: (why) => `Cannot read the player script to embed in the page (player.global.js: ${why})` },
};

/** 再生の script の、この file から見た場所。build が入口ごとに入れる (`tsup.config.ts`、#3699) */
declare const __DRAGON_PLAYER_SCRIPT__: string;

/** 読んでいる再生の script。読めなかった時は消し、次に呼んだ時に読み直す */
let player: Promise<string> | undefined;

/** 再生の script を読む。npm の入口では隣、script の1行の入口では1つ上の dir に在る */
function loadPlayer(): Promise<string> {
  if (player === undefined) {
    const reading = fetch(new URL(__DRAGON_PLAYER_SCRIPT__, import.meta.url)).then((response) => {
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
export function captureHtml(source: string, options: HtmlOptions = {}): Promise<string> {
  return notationPage(source, options, (said) =>
    loadPlayer().catch((error: unknown) => {
      throw new Error(TEXT[said].player(error instanceof Error ? error.message : String(error)));
    }),
  );
}
