/**
 * `editor-url.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
import { fromHash, toHash } from "../../../apps/playground-spa/src/share";

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
  it("editor-url-roundtrip", () => {
    const make = editorUrl();
    // 並べた記法が base64 の `+` と `/` と末尾の `=` を本当に出す (選んだ入力が境目を通っている)
    const plain = (text: string): string => Buffer.from(text, "utf8").toString("base64");
    expect(SOURCES.some((s) => plain(s).includes("+")) && SOURCES.some((s) => plain(s).includes("/")), "並べた記法が + と / を出さない").toBe(true);
    expect(new Set(SOURCES.map((s) => (plain(s).match(/=*$/u)?.[0] ?? "").length)), "並べた記法の末尾の = の数").toEqual(new Set([0, 1, 2]));
    for (const source of SOURCES) {
      const url = make(source);
      expect(url.startsWith(`${PUBLISHED}editor#n=`), `${JSON.stringify(source)} の URL ${url} がエディタの頁を指さない`).toBe(true);
      const hash = url.slice(url.indexOf("#"));
      expect(hash, `${JSON.stringify(source)} の # の後ろが URL に載る形の base64 でない`).toMatch(/^#n=[A-Za-z0-9_-]*$/u);
      expect(fromHash(hash), `${JSON.stringify(source)} を fromHash で読み戻した記法`).toBe(source);
    }
  });
});

describe("エディタで開く URL (#3644)", () => {

  it("playground-share-uses-package", () => {
    const make = editorUrl();
    const share = readFileSync(join(process.cwd(), "apps/playground-spa/src/share.ts"), "utf8");
    // 記法を URL の形にする処理 (UTF-8 にする、base64 にする、`+` と `/` を替える) を share.ts が持たない
    expect(share.includes("TextEncoder"), "share.ts が記法を UTF-8 の byte にしている").toBe(false);
    expect(/\bbtoa\(/u.test(share), "share.ts が base64 にしている").toBe(false);
    expect(/from "@cardenelabs\/dragon(?:\/light)?"/u.test(share) && share.includes("editorUrl"), "share.ts が描く入口の editorUrl を読まない").toBe(true);
    for (const source of SOURCES) {
      const url = make(source);
      expect(toHash(source), `${JSON.stringify(source)} の共有の # の後ろ`).toBe(url.slice(url.indexOf("#")));
    }
  });
});
