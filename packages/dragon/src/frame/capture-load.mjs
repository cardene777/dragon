/**
 * 帯と帯を出さない図のエクスポートが、HTMLとGIFとMP4を作る時に書き出す部品 (`capture.js`) を読む処理 (#3786)。
 * 書き出す部品は、この file を束ねた入口の file の隣に在る (npm の入口は`dist/`、script の1行の入口は`dist/cdn/`)。
 * 読む行を帯の部品 (`diagram-actions.mjs`) から分け、入口が帯へ渡す。外を読めない`dragon embed`の頁の入口はこの file を読まず、
 * 帯はHTMLとGIFとMP4を出さない。帯の部品が読む行を持つと、埋める script に帯を束ねた時に読む先が無くて build が止まる
 */
export const loadCapture = () => import('./capture.js');
