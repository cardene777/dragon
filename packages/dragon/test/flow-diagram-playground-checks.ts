/**
 * `flow-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { api } from "./diagram-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/chart";
import "../src/kind-use/flow";
import "../src/kind-use/git";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/time";
import "../src/kind-use/tree";

const ROOT = process.cwd();

interface SourceEdge {
  type: string;
  from: string;
  to: string;
  label?: string;
}

interface Source {
  kind: string;
  title: string;
  blocks: {
    box?: { id: string; name: string; color?: string }[];
    choice?: { id: string; name: string }[];
    path?: { from: string; to: string; label?: string }[];
  };
  steps: { title: string; body?: string; events: SourceEdge[] }[];
}

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

describe("手順の図の書き方の文書 (#3561)", () => {
  it("docs-describe-flow-diagram", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `flow` と、`choice <名札> as <問い>` の行の形 */
    const forms: [string, RegExp][] = [
      ["flow", /(^|[\s`])flow [^\s`]/mu],
      ["choice", /(^|[\s`])choice (<[^>]+>|[^\s:`]+) as [^\s`]/mu],
    ];
    const flowFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as unknown as Source).kind === "flow";
      }).length;
    /** 手引きは日本語と英語の 2 つを持つ */
    const dotted = (path: string, text: string): void => {
      const ja = path === "packages/dragon/examples/quick-start.md";
      expect(ja ? text.includes("点線") : /dotted/iu.test(text), `${path} に最初の段より前の線が点線になることが無い`).toBe(true);
    };
    // 種類ごとの書き方は README から記法の手引きへ移した (#3881)
    for (const path of ["packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      for (const [word, form] of forms) expect(form.test(text), `${path} に ${word} の行の書き方が無い`).toBe(true);
      dotted(path, text);
      expect(flowFences(text), `${path} に手順の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"flow"/u.test(content), "使い方の頁の節に手順の図 (flow) が無い").toBe(true);
    const sections = ["flow.dragon", "flow.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const parsed = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(parsed.ok && (parsed.diagram as unknown as Source).kind, `使い方の頁の手順の図の節の例 (${i === 0 ? "flow.dragon" : "flow.en.dragon"}) が手順の図として読めない`).toBe("flow");
    }
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    for (const [word, form] of forms) expect(form.test(page), `使い方の頁に ${word} の行の書き方が無い`).toBe(true);
    expect(page.includes("点線") && /dotted/iu.test(page), "使い方の頁に最初の段より前の線が点線になることが無い").toBe(true);
    // 変更の一覧の手順の図の項 (#3561) を持つ節 (Unreleased か版の節) の Added に手順の図が載る
    const added = (path: string): string => changelogEntry(join(ROOT, path), 3561).split(/^### /mu).find((p) => p.startsWith("Added")) ?? "";
    expect(added("CHANGELOG.md").includes("`flow`") && added("CHANGELOG.md").includes("`choice"), "CHANGELOG.md の Added に手順の図 (flow と choice) が無い").toBe(true);
    expect(added("CHANGELOG.ja.md").includes("`flow`") && added("CHANGELOG.ja.md").includes("手順の図"), "CHANGELOG.ja.md の Added に手順の図が無い").toBe(true);
    // 前提が手順の図を描ける図の種類に数える
    const kinds = repoText(".ikkan/premises/product.md").split("\n").find((line) => line.startsWith("- 描ける図の種類は")) ?? "";
    expect(kinds.includes("手順の図 (`flow`"), "前提 (product.md) の描ける図の種類に手順の図 (flow) が無い").toBe(true);
  });
});
