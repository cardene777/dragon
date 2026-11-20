/**
 * エディタで開く URL (#3644)。
 *
 * 描く入口 (`@cardenelabs/dragon`) の `editorUrl` は、記法の文字列を受けて、エディタの `editor` の頁の URL を返す。
 * 記法は URL の `#n=` の後ろに、UTF-8 の byte を URL に載る形の base64 (`-` と `_` を使い、末尾の `=` を外す) にして詰める。
 * 見本帳のエディタは同じ `#n=` を `apps/playground-spa/src/share.ts` の `fromHash` で読み戻す。
 * 往復して同じ記法に戻るかは、見本帳の確かめを集めた検査 (`kind-playground.test.ts`) が確かめる (#3763)。
 * 見本帳の共有の URL も同じ関数で作り、記法を URL の形にする処理を 1 か所に持つ。
 */

import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
// 組み立てが本体に埋める共有のブロック集と絵柄集を、src を読む検査にも置く (#3763)
import "./built-globals";

type EditorUrl = (source: string, options?: { base?: string }) => string;

/** 描く入口が出す `editorUrl`。出ていない時は判定に出してから止める */
function editorUrl(): EditorUrl {
  const found = (dragon as Record<string, unknown>).editorUrl;
  expect(typeof found, "描く入口 (@cardenelabs/dragon) が editorUrl を出していない").toBe("function");
  return found as EditorUrl;
}

/** 公開したエディタの置き場 */
const PUBLISHED = "https://cardene777.github.io/dragon/";

/**
 * 往復を確かめる記法。日本語と絵文字 (UTF-8 で 4 byte) を含み、base64 にすると `+` と `/` と末尾の `=` が出る並びを持つ。
 * 3 byte ごとの区切りの余りが 0、1、2 の 3 つを並べ、外す `=` の数 (0、2、1) をどれも通す
 */
const SOURCES = [
  "時系列図 注文\n箱 a 🐉 店\n箱 b 🧾 帳簿\n段 1 受ける\n  a -> b 注文 ✅",
  "~~~>>>???",
  "~~~>>>??",
  "~~~>>>?",
  "",
];

describe("エディタで開く URL (#3644)", () => {

  it("editor-url-base", () => {
    const make = editorUrl();
    const source = "時系列図 🐉";
    const hash = (url: string): string => url.slice(url.indexOf("#"));
    const published = make(source);
    expect(published.slice(0, published.indexOf("#")), "置き場を渡さない時の頁").toBe(`${PUBLISHED}editor`);
    const cases = [
      { base: "http://localhost:5173/", page: "http://localhost:5173/editor" },
      { base: "https://example.test/dragon/", page: "https://example.test/dragon/editor" },
      // 置き場の末尾の `/` を書き忘れても、置き場の下の editor を指す
      { base: "https://example.test/dragon", page: "https://example.test/dragon/editor" },
      { base: "/dragon/", page: "/dragon/editor" },
    ];
    for (const { base, page } of cases) {
      const url = make(source, { base });
      expect(url.slice(0, url.indexOf("#")), `置き場 ${base} の頁`).toBe(page);
      expect(hash(url), `置き場 ${base} でも # の後ろは同じ`).toBe(hash(published));
    }
  });
});

/** 描く入口が出す `embedUrl`。出ていない時は判定に出してから止める */
type EmbedUrl = (source: string, options?: { base?: string; lang?: "ja" | "en" }) => Promise<string>;
function embedUrl(): EmbedUrl {
  const found = (dragon as Record<string, unknown>).embedUrl;
  expect(typeof found, "描く入口 (@cardenelabs/dragon) が embedUrl を出していない").toBe("function");
  return found as EmbedUrl;
}

describe("見本帳の埋め込みの頁のURL (#3701)", () => {
  // iframeで図を置く人は、記法を縮めて詰めた見本帳の埋め込みの頁のURLを embedUrl で作る。
  // 埋め込みの頁はエディタと同じく #z= を readPackedEditorHash で読み戻し、?lang で帯の言葉を決める (#3700)
  it("embed-url-opens-embed-page", async () => {
    const make = embedUrl();
    const read = (dragon as unknown as { readPackedEditorHash: (hash: string) => Promise<string | undefined> }).readPackedEditorHash;
    for (const source of SOURCES) {
      const url = new URL(await make(source, { lang: "ja" }));
      expect(`${url.origin}${url.pathname}`, "埋め込みの頁の置き場").toBe(`${PUBLISHED}embed`);
      expect(url.search, "帯の言葉").toBe("?lang=ja");
      expect(url.hash.startsWith("#z="), `${JSON.stringify(source)} を縮めて詰める`).toBe(true);
      expect(await read(url.hash), `${JSON.stringify(source)} が同じ記法に戻る`).toBe(source);
    }
    // 言葉を渡さない時は ?lang を持たず、置き場を渡すとその下の embed の頁を指す
    const own = new URL(await make(SOURCES[0] ?? "", { base: "http://localhost/dragon" }));
    expect(`${own.origin}${own.pathname}${own.search}`, "置き場を渡した埋め込みの頁の URL").toBe("http://localhost/dragon/embed");
  });
});
