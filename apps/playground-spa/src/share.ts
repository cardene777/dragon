/**
 * 書いた記法を URL の `#` の後ろに詰める (#2995)。
 *
 * `#` の後ろは頁を配るサーバーに送られないので、書いた中身は手元の browser の外へ出ない。
 * 記法を URL の形にする処理は描く入口の `editorUrl` が持ち、ここは `#` の後ろだけを取る (#3644)。
 * 形は記法を UTF-8 の byte にし、URL に載る形の base64 (`-` と `_` を使い、末尾の `=` を外す) にした物で、`fromHash` が読み戻す。
 */
import { editorUrl } from "@cardenelabs/dragon/light";

const KEY = "n=";

/** 記法を `#n=...` にする */
export function toHash(text: string): string {
  return new URL(editorUrl(text)).hash;
}

/** `#n=...` から記法を戻す。形が違うか読めない時は `undefined` */
export function fromHash(hash: string): string | undefined {
  if (!hash.startsWith(`#${KEY}`)) return undefined;
  try {
    const binary = atob(hash.slice(KEY.length + 1).replaceAll("-", "+").replaceAll("_", "/"));
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    return undefined;
  }
}
