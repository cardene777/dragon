/**
 * 記法をエディタで開く URL (#3644)。
 *
 * 記法は URL の `#n=` の後ろに詰める。`#` の後ろは頁を配るサーバーに送られないので、書いた中身は手元のブラウザの外へ出ない。
 * 記法を UTF-8 の byte にし、URL に載る形の base64 (`-` と `_` を使い、末尾の `=` を外す) にする。
 * 帯のエディタのボタンは、記法をブラウザの内で`deflate-raw`に縮めてから同じ base64 にし、`#z=` の後ろに詰める (#3697)。
 * 縮めても URL が `EDITOR_URL_LIMIT` を超える記法は、記法をクリップボードに写して `#paste` のエディタを開く。
 * 読み戻す処理 (`readEditorHash`、`readPackedEditorHash`) もここに置き、見本帳のエディタはこれを呼ぶ。
 * iframe で置く見本帳の埋め込みの頁の URL (`embedUrl`、#3701) も、同じ形で記法を詰める。
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

/** 記法 `source` を縮めずに詰めた `#` の後ろ (`#n=<記法>`) */
const plainHash = (source: string): string => `${PLAIN}${toBase64Url(new TextEncoder().encode(source))}`;

/** 記法 `source` を縮めて詰めた `#` の後ろ (`#z=<縮めた記法>`)。縮める処理を持たない環境では `#n=` の形 */
async function packedHash(source: string): Promise<string> {
  try {
    return `${PACKED}${toBase64Url(await pipe(new TextEncoder().encode(source), new CompressionStream(FORMAT)))}`;
  } catch {
    return plainHash(source);
  }
}

/** 記法 `source` をエディタの `editor` の頁で開く URL (`<置き場>editor#n=<記法>`) */
export function editorUrl(source: string, options: EditorUrlOptions = {}): string {
  return `${pageOf(options.base ?? EDITOR_BASE)}${plainHash(source)}`;
}

/**
 * 記法 `source` をブラウザの内で縮めて詰めた、エディタの `editor` の頁で開く URL (`<置き場>editor#z=<縮めた記法>`、#3697)。
 * 縮める処理 (`CompressionStream` の `deflate-raw`) を持たない環境では、縮めない `editorUrl` の形を返す
 */
export async function packedEditorUrl(source: string, options: EditorUrlOptions = {}): Promise<string> {
  return `${pageOf(options.base ?? EDITOR_BASE)}${await packedHash(source)}`;
}

export interface EmbedUrlOptions {
  /** 見本帳の置き場。この下の `embed` の頁を開く。書かなければ公開した見本帳 (`EDITOR_BASE`) */
  base?: string;
  /** 帯と再生の部品の言葉。書かなければ英語 */
  lang?: "ja" | "en";
}

/**
 * 記法 `source` を縮めて詰めた、見本帳の埋め込みの頁の URL (`<置き場>embed?lang=<言葉>#z=<縮めた記法>`、#3701)。
 * iframe の `src` に渡すと、埋め込みの頁が記法を帯つきの図にし、4つの知らせを置いた頁へ `postMessage` で送る (#3700)。
 * 縮める処理を持たない環境では `#n=` の形で詰める
 */
export async function embedUrl(source: string, options: EmbedUrlOptions = {}): Promise<string> {
  const base = options.base ?? EDITOR_BASE;
  const query = options.lang ? `?lang=${options.lang}` : "";
  return `${base.endsWith("/") ? base : `${base}/`}embed${query}${await packedHash(source)}`;
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
