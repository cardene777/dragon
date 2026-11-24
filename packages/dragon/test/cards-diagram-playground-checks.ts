/**
 * 持ち主ごとのカードの図 (#3846) の見本帳の確かめ。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfile (`cards-diagram.test.ts`) から外し、`kind-playground.test.ts`が読む (#3763)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import "../src/kind-use/architecture";
import "../src/kind-use/sequence";

/** 持ち主ごとのカードの図の種類の登録のfile。まだ無い間もこのfileを読み込めるよう、名前を字で持って読む */
const CARDS_USE = "../src/kind-use/cards";
await import(/* @vite-ignore */ CARDS_USE).catch(() => undefined);

const ROOT = process.cwd();

/** ブロックの置き場。書き方の文書の段落を読む。packageの根を字で書くと、関係する検査を選ぶ命令がpackageの全てのcodeへたどり着く (#3763) */
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

/** repoのfileの中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 記法の手引きと、その中の持ち主ごとのカードの図の節の見出し */
const GUIDES: readonly [string, string][] = [
  ["packages/dragon/examples/quick-start.md", "持ち主ごとのカードの図"],
  ["packages/dragon/examples/quick-start.en.md", "Owner card diagram"],
];

/** `### <見出し>`の節の本文。次の見出しの前まで。無ければ空 */
const sectionOf = (text: string, heading: string): string => text.split(new RegExp(`^### ${heading}$`, "mu"))[1]?.split(/^##+ /mu)[0] ?? "";

/** 書き方の文書が書くと読める形。頭の語、カードの行 (`in`で列を並べる)、断る行、合計に足さない量、印を出す列 */
const FORMS: readonly [string, RegExp][] = [
  ["cardsの行", /(^|[\s`])cards [^\s`]/mu],
  ["カードの行 (item <id> as <名前> in <列>)", /item (<[^>]+>|[^\s`]+) as (<[^>]+>|[^`\n]+?) in (<[^>]+>|[^\s`,\]]+)/u],
  ["断る行 (refuse <カード>: <理由>)", /refuse (<[^>]+>|[^\s`:]+): [^\s`]/u],
  ["合計に足さない量 (total: none)", /total: none/u],
  ["印を出す列 (mark: <列>)", /mark: [^\s`\]]/u],
];

describe("持ち主ごとのカードの図の書き方の文書 (#3846)", () => {
  it("cards-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const cardsFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as { kind?: string }).kind === "cards";
      }).length;
    // 記法の手引き2つは、持ち主ごとのカードの図の節に書き方と、読める例を持つ
    for (const [path, heading] of GUIDES) {
      const text = repoText(path);
      expect(text, `${path}が無い`).not.toBe("");
      const section = sectionOf(text, heading);
      expect(section, `${path}に持ち主ごとのカードの図の節 (### ${heading}) が無い`).not.toBe("");
      for (const [name, form] of FORMS) expect(form.test(section), `${path}の${heading}の節に${name}の書き方が無い`).toBe(true);
      expect(cardsFences(section), `${path}の${heading}の節に持ち主ごとのカードの図として読めるdragonの囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"cards"/u.test(content), "使い方の頁の節に持ち主ごとのカードの図 (cards) が無い").toBe(true);
    const files = ["cards.dragon", "cards.en.dragon"];
    const sections = files.map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as { kind?: string }).kind, `使い方の頁の持ち主ごとのカードの図の節の例 (${files[i]}) が持ち主ごとのカードの図として読めない`).toBe("cards");
    }
    const paragraphs = readdirSync(BLOCKS).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    for (const [name, form] of FORMS) expect(form.test(page), `使い方の頁に${name}の書き方が無い`).toBe(true);
  });
});
