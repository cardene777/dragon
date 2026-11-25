/**
 * `dragon embed` の頁の帯が、HTML と GIF と MP4 を作る時に使う書き出す部品 (#3792)。埋める script (`script-offline.ts`) に束ねる。
 *
 * 埋めた頁は外を読めないので、帯は入口の隣の書き出す部品 (`capture.js`) を後から読めない。
 * GIF と MP4 は、書き出す部品と同じ詰める処理 (`captureFrames`) と詰める道具 (`gifenc`、`mediabunny`) で作る。
 * HTML は入口の隣の再生の script (`player.global.js`) も読めないので、頁に埋めた自分の script を再生の script として頁に埋める。
 * 埋める script は `DragonPlayer.mountDiagram` を出すので、書き出した頁はこの script で図を置ける。
 * 埋める script は字を読み込まないので、書き出した頁も字を埋めず端末の字で描く。
 *
 * PNG と SVG は帯が書き出す部品を読まずに作る。判定の表だけは書き出す絵の形 (例を帯に置いた SVG、#3945) を、
 * 書き出す部品と同じ`capturePng`と`captureSvg`と`captureFilm`で撮る。埋めた頁は字を読み込まないので、絵にも字を埋めない。
 */
import type { CaptureLoader } from "../frame/diagram-actions.mjs";
import type { NotationLang } from "../words";
import { captureFilm, captureFrames, capturePng, captureSvg } from "./index";
import { notationPage } from "./page-html";

/** 断りの文 */
const TEXT: Record<NotationLang, string> = {
  ja: "頁に埋めた script の中身を読めない。dragon embed が書いた頁で書き出す",
  en: "Cannot read the script embedded in the page. Export from a page written by dragon embed",
};

/** 頁に埋めた script の中身 `script` を再生の script として HTML に埋める、帯の書き出す部品を読む処理 */
export function offlineCapture(script: string): CaptureLoader {
  const parts = {
    captureFrames,
    capturePng,
    captureSvg,
    captureFilm,
    captureHtml: (source: string) => notationPage(source, {}, (said) => (script ? Promise.resolve(script) : Promise.reject(new Error(TEXT[said])))),
  };
  return () => Promise.resolve(parts);
}
