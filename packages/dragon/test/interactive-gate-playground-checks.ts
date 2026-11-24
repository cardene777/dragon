/**
 * `interactive-gate.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "../src/kind-use/pipe";
import "../src/kind-use/try";

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

describe("書き方の文書 (#3476)", () => {
  it("docs-describe-try-gate", () => {
    /** 見出し `heading` から次の同じ深さの見出しまで */
    const sectionOf = (text: string, heading: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const next = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, next < 0 ? undefined : next);
    };
    const forms = {
      ja: "check <節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>]",
      en: "check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]",
    } as const;
    for (const [path, heading, form] of [
      ["packages/dragon/examples/quick-start.md", "### 試す図", forms.ja],
      ["packages/dragon/examples/quick-start.en.md", "### Try diagram", forms.en],
    ] as const) {
      const section = sectionOf(readRepo(path), heading);
      expect(section, `${path} に試す図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の試す図の小節に check で関門を書く書き方 (${form}) が無い`).toContain(form);
    }
    const docs = readRepo("apps/playground-spa/src/docs/content.ts");
    for (const form of Object.values(forms)) expect(docs, `使い方の頁に check で関門を書く書き方 (${form}) が無い`).toContain(form);
  });
});
