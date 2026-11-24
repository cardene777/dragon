/**
 * `interactive-group-log.test.ts` から移した見本帳の確かめ (#3763)。
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

describe("書き方の文書 (#3441)", () => {
  it("docs-describe-try-log", () => {
    /** 見出し `heading` から次の同じ深さの見出しまで */
    const sectionOf = (text: string, heading: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const next = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, next < 0 ? undefined : next);
    };
    for (const [path, heading, intoField] of [
      ["packages/dragon/examples/quick-start.md", "### 試す図", "`into` に欄"],
      ["packages/dragon/examples/quick-start.en.md", "### Try diagram", "`into` names a field"],
    ] as const) {
      const section = sectionOf(readRepo(path), heading);
      expect(section, `${path} に試す図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の試す図の小節に log の行の書き方が無い`).toContain("log <");
      expect(section, `${path} の試す図の小節に log の all の書き方が無い`).toContain("all:");
      expect(section, `${path} の試す図の小節に into に欄を書く書き方が無い`).toContain(intoField);
    }
    const docs = readRepo("apps/playground-spa/src/docs/content.ts");
    for (const words of ["log <", "all:", "`into` に欄", "`into` names a field"]) expect(docs, `使い方の頁に ${words} が無い`).toContain(words);
  });
});
