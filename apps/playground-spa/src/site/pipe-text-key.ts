/**
 * 見本帳が収めた配管の図の並べ方の file の名前 (#3748)。build (`vite-pipe-layouts.ts`) と頁 (`pipe-layouts.ts`) が同じ名前を作る。
 *
 * 記法の字と言葉から FNV-1a (32 bit) の 16 進で作る。見本帳は記法の末尾の空白を外して図へ渡すので、外した字で作る。
 * 名前が重なっても、並べ方の鍵 (code の指紋と図から作る) が合わない並べ方は使わずにその場で組むので、図は崩れない
 */
export function pipeTextKey(text: string, lang: string): string {
  let hash = 0x811c9dc5;
  for (const ch of `${lang}\n${text.trimEnd()}`) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
