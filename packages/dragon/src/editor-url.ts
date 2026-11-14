/**
 * 記法をエディタで開く URL (#3644)。
 *
 * 記法は URL の `#n=` の後ろに詰める。`#` の後ろは頁を配るサーバーに送られないので、書いた中身は手元のブラウザの外へ出ない。
 * 記法を UTF-8 の byte にし、URL に載る形の base64 (`-` と `_` を使い、末尾の `=` を外す) にする。
 * 帯のエディタのボタンは、記法をブラウザの内で`deflate-raw`に縮めてから同じ base64 にし、`#z=` の後ろに詰める (#3697)。
 * 縮めても URL が `EDITOR_URL_LIMIT` を超える記法は、記法をクリップボードに写して `#paste` のエディタを開く。
 * 読み戻す処理 (`readEditorHash`、`readPackedEditorHash`) もここに置き、見本帳のエディタはこれを呼ぶ。
 */

/** 公開したエディタの置き場 */
export const EDITOR_BASE = "https://cardene777.github.io/dragon/";

export interface EditorUrlOptions {
  /** エディタの置き場。この下の `editor` の頁を開く。書かなければ公開したエディタ (`EDITOR_BASE`) */
  base?: string;
}

/**
 * 帯のエディタのボタンが縮めた記法で開く URL の上限の字の数 (#3697)。
 * URL はチャットや文書へ貼って渡すこともあり、長い URL を途中で切る置き場があるので、貼っても切られにくい 8000 字に留める
 */
export const EDITOR_URL_LIMIT = 8000;

/** 記法をクリップボードに写して開くエディタの `#` の後ろ。エディタは書く欄を空にして貼るよう出す (#3697) */
export const EDITOR_PASTE_HASH = "#paste";

/** 縮めた記法の `#` の後ろの頭 */
const PACKED = "#z=";
/** 縮めていない記法の `#` の後ろの頭 */
const PLAIN = "#n=";
/** 縮める形。頭と終わりの印を持たず、印の分だけ短い */
const FORMAT = "deflate-raw";

const pageOf = (base: string): string => `${base.endsWith("/") ? base : `${base}/`}editor`;
const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};
const fromBase64Url = (text: string): Uint8Array => Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));

/** byte の並びを縮める処理か戻す処理に通す。書く側の誤りは読む側が受けるので、書く側の Promise は捨てる */
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  writer.write(bytes as Uint8Array<ArrayBuffer>).catch(() => undefined);
  writer.close().catch(() => undefined);
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const out = new Uint8Array(chunks.reduce((n, chunk) => n + chunk.length, 0));
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

/** 記法 `source` をエディタの `editor` の頁で開く URL (`<置き場>editor#n=<記法>`) */
export function editorUrl(source: string, options: EditorUrlOptions = {}): string {
  return `${pageOf(options.base ?? EDITOR_BASE)}${PLAIN}${toBase64Url(new TextEncoder().encode(source))}`;
}

/**
 * 記法 `source` をブラウザの内で縮めて詰めた、エディタの `editor` の頁で開く URL (`<置き場>editor#z=<縮めた記法>`、#3697)。
 * 縮める処理 (`CompressionStream` の `deflate-raw`) を持たない環境では、縮めない `editorUrl` の形を返す
 */
export async function packedEditorUrl(source: string, options: EditorUrlOptions = {}): Promise<string> {
  let packed: Uint8Array;
  try {
    packed = await pipe(new TextEncoder().encode(source), new CompressionStream(FORMAT));
  } catch {
    return editorUrl(source, options);
  }
  return `${pageOf(options.base ?? EDITOR_BASE)}${PACKED}${toBase64Url(packed)}`;
}

/** 記法をクリップボードに写して開くエディタの URL (`<置き場>editor#paste`、#3697) */
export function editorPasteUrl(options: EditorUrlOptions = {}): string {
  return `${pageOf(options.base ?? EDITOR_BASE)}${EDITOR_PASTE_HASH}`;
}

/** URL の `#` の後ろの形。縮めていない記法 (`plain`)、縮めた記法 (`packed`)、貼るよう頼む (`paste`)、どれでもない時は `undefined` */
export function editorHashKind(hash: string): "plain" | "packed" | "paste" | undefined {
  if (hash.startsWith(PLAIN)) return "plain";
  if (hash.startsWith(PACKED)) return "packed";
  return hash === EDITOR_PASTE_HASH ? "paste" : undefined;
}

/** 縮めていない `#n=...` から記法を戻す。形が違うか読めない時は `undefined` */
export function readEditorHash(hash: string): string | undefined {
  if (!hash.startsWith(PLAIN)) return undefined;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(fromBase64Url(hash.slice(PLAIN.length)));
  } catch {
    return undefined;
  }
}

/** 縮めた `#z=...` と縮めていない `#n=...` から記法を戻す (#3697)。形が違うか読めない時は `undefined` */
export async function readPackedEditorHash(hash: string): Promise<string | undefined> {
  if (!hash.startsWith(PACKED)) return readEditorHash(hash);
  try {
    const bytes = await pipe(fromBase64Url(hash.slice(PACKED.length)), new DecompressionStream(FORMAT));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
}
