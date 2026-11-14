/**
 * 書いた記法を URL の `#` の後ろに詰める (#2995)。
 *
 * `#` の後ろは頁を配るサーバーに送られないので、書いた中身は手元の browser の外へ出ない。
 * 記法を URL の形にする処理は描く入口の `editorUrl` が持ち、ここは `#` の後ろだけを取る (#3644)。
 * 形は記法を UTF-8 の byte にし、URL に載る形の base64 (`-` と `_` を使い、末尾の `=` を外す) にした物で、`fromHash` が読み戻す。
 * 読み戻す処理も描く入口が持ち、帯のエディタのボタンが縮めて詰めた `#z=` は `fromPackedHash` が読み戻す (#3697)。
 */
import { editorHashKind, editorUrl, readEditorHash, readPackedEditorHash } from "@cardenelabs/dragon/light";

/** 記法を `#n=...` にする */
export function toHash(text: string): string {
  return new URL(editorUrl(text)).hash;
}

/** `#n=...` から記法を戻す。形が違うか読めない時は `undefined` */
export const fromHash: (hash: string) => string | undefined = readEditorHash;

/** 帯のエディタのボタンが縮めて詰めた `#z=...` と、`#n=...` から記法を戻す (#3697)。形が違うか読めない時は `undefined` */
export const fromPackedHash: (hash: string) => Promise<string | undefined> = readPackedEditorHash;

/** `#` の後ろの形。縮めていない記法、縮めた記法、貼るよう頼む形、どれでもない (#3697) */
export const hashKind: (hash: string) => "plain" | "packed" | "paste" | undefined = editorHashKind;
