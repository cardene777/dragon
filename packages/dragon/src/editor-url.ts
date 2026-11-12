/**
 * 記法をエディタで開く URL (#3644)。
 *
 * 記法は URL の `#n=` の後ろに詰める。`#` の後ろは頁を配るサーバーに送られないので、書いた中身は手元のブラウザの外へ出ない。
 * 記法を UTF-8 の byte にし、URL に載る形の base64 (`-` と `_` を使い、末尾の `=` を外す) にする。
 * 見本帳のエディタは同じ形を読み戻す (`apps/playground-spa/src/share.ts` の `fromHash`)。形を変える時は両方を変える。
 */

/** 公開したエディタの置き場 */
export const EDITOR_BASE = "https://cardene777.github.io/dragon/";

export interface EditorUrlOptions {
  /** エディタの置き場。この下の `editor` の頁を開く。書かなければ公開したエディタ (`EDITOR_BASE`) */
  base?: string;
}

/** 記法 `source` をエディタの `editor` の頁で開く URL (`<置き場>editor#n=<記法>`) */
export function editorUrl(source: string, options: EditorUrlOptions = {}): string {
  const base = options.base ?? EDITOR_BASE;
  let binary = "";
  for (const byte of new TextEncoder().encode(source)) binary += String.fromCharCode(byte);
  const hash = btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  return `${base.endsWith("/") ? base : `${base}/`}editor#n=${hash}`;
}
