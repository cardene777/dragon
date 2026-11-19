/**
 * `pipe-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import { ROOT, PIPE_WORDS, type Source, repoText } from "./pipe-diagram-support";
import "../src/kind-use/architecture";
import "../src/kind-use/git";
import "../src/kind-use/lineup";
import "../src/kind-use/pipe";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/time";
import "../src/kind-use/tree";
import "../src/kind-use/try";

describe("配管の図の書き方の文書 (#3389)", () => {
  it("docs-describe-pipe-diagram", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `pipe` と、行の形 (`hold <持ち主>: …` か `hold alice: …`) */
    const forms: [string, RegExp][] = [
      ["pipe", /(^|[\s`])pipe [^\s`]/mu],
      ...PIPE_WORDS.map((word): [string, RegExp] => [word, new RegExp(`(^|[\\s\`])${word} (<[^>]+>|[^\\s:\`]+):`, "mu")]),
    ];
    const marks = ["[value: ", "[call: ", "[fold]", "[fail]"];
    const describes = (where: string, text: string): void => {
      for (const [word, form] of forms) expect(form.test(text), `${where} に ${word} の行の書き方が無い`).toBe(true);
      for (const mark of marks) expect(text, `${where} に印 ${mark.trim()} の書き方が無い`).toContain(mark);
    };
    const pipeFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as unknown as Source).kind === "pipe";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      describes(path, text);
      if (path !== "README.md") expect(pipeFences(text), `${path} に配管の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"pipe"/u.test(content), "使い方の頁の節に配管の図 (pipe) が無い").toBe(true);
    const sections = ["pipe.dragon", "pipe.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const parsed = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(parsed.ok && (parsed.diagram as unknown as Source).kind, `使い方の頁の配管の図の節の例 (${i === 0 ? "pipe.dragon" : "pipe.en.dragon"}) が配管の図として読めない`).toBe("pipe");
    }
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    describes("使い方の頁", [content, ...sections, ...paragraphs].join("\n"));
  });
});
