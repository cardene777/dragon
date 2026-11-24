/**
 * `interactive-accept-gather.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "../src/kind-use/try";

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

describe("書き方の文書 (#3453)", () => {
  it("docs-describe-try-accept-gather", () => {
    /** 見出し `heading` から次の同じ深さの見出しまで */
    const sectionOf = (text: string, heading: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const next = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, next < 0 ? undefined : next);
    };
    for (const [path, heading, accept, gather] of [
      ["packages/dragon/README.ja.md", "### 試す図", "accept: <名前>", 'from: "<待ち行列>, <待ち行列>"'],
      ["packages/dragon/README.md", "### Try diagram", "accept: <name>", 'from: "<queue>, <queue>"'],
    ] as const) {
      const section = sectionOf(readRepo(path), heading);
      expect(section, `${path} に試す図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の試す図の小節に accept の書き方が無い`).toContain(accept);
      expect(section, `${path} の試す図の小節に from に 2 つ以上の待ち行列を書く書き方が無い`).toContain(gather);
    }
    // 使い方の頁の文は JS の字の中に書くので、`"` の前に `\` が付いていてもよい
    const docs = readRepo("apps/playground-spa/src/docs/content.ts");
    for (const words of ["accept: <名前>", "accept: <name>"]) expect(docs, `使い方の頁に ${words} が無い`).toContain(words);
    for (const [queue, form] of [["待ち行列", /from: \\?"<待ち行列>, <待ち行列>\\?"/u], ["queue", /from: \\?"<queue>, <queue>\\?"/u]] as const)
      expect(docs, `使い方の頁に from: "<${queue}>, <${queue}>" が無い`).toMatch(form);
  });
});
