/**
 * 外のツールやサービスへ図を組み込む説明 (#3701)。
 *
 * 組み込みの置き方は、scriptの1行 (`data-header`)、npmの関数 (`mountDragon`)、Web Component (`<dragon-diagram>`)、
 * iframe (見本帳の埋め込みの頁) の4つ。
 * package の README は英語と日本語の両方の組み込みの節に4つの置き方の書き方と、置き先に合わせる設定と知らせを持ち、
 * 2つの節のコードは同じ物にする。プラグインの文書は、AIが同じ4つの置き方と設定を引ける組み込みの文書を持つ。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { codeBlocks, sectionOf } from "./markdown-sections";

const ROOT = process.cwd();
const repoText = (path: string): string => readFileSync(join(ROOT, path), "utf8");

/** README の組み込みの節の見出し */
const HEADINGS = { "packages/dragon/README.md": "## Embed it in other tools", "packages/dragon/README.ja.md": "## 他のツールに組み込む" } as const;

/** 4つの置き方のコードが持つ語。scriptの1行、npmの関数、Web Component、iframe の順 */
const WAYS = [
  { way: "scriptの1行", words: ["dist/cdn/dragon.js", '<pre class="dragon" data-header>'] },
  { way: "npmの関数", words: ['from "@cardenelabs/dragon/embed"', "mountDragon("] },
  { way: "Web Component", words: ["defineDragonElement(", "<dragon-diagram"] },
  { way: "iframe", words: ["embedUrl(", "<iframe", 'addEventListener("message"'] },
] as const;

/** 置き先に合わせる設定と、置いた頁への知らせの名前。説明の文が名指す */
const SETTINGS = ["look", "buttons", "header", "lang", "nonce"] as const;
const EVENTS = ["dragon-render", "dragon-step", "dragon-export", "dragon-share"] as const;

describe("README の組み込みの節 (#3701)", () => {
  it("readme-shows-four-embed-ways", () => {
    // 陰性でない対照。節の切り出しと囲みの読み出しが見出しとコードを見分ける
    expect(sectionOf("## A\nx\n## B\ny", "## A"), "次の見出しの前で節を切る").toBe("x");
    expect(codeBlocks("p\n```ts\na\n```\nq"), "囲みのコードを読む").toEqual(["a"]);

    const found = Object.entries(HEADINGS).map(([path, heading]) => {
      const section = sectionOf(repoText(path), heading);
      const code = codeBlocks(section).join("\n");
      return {
        path,
        section: section !== "",
        ways: WAYS.filter(({ words }) => !words.every((word) => code.includes(word))).map(({ way }) => way),
        settings: SETTINGS.filter((name) => !section.includes(`\`${name}\``)),
        events: EVENTS.filter((name) => !section.includes(`\`${name}\``)),
        code: codeBlocks(section),
      };
    });
    for (const one of found) {
      expect({ section: one.section, ways: one.ways, settings: one.settings, events: one.events }, `${one.path} の組み込みの節に無い物`).toEqual({
        section: true,
        ways: [],
        settings: [],
        events: [],
      });
    }
    // 英語と日本語の節は同じコードを持つ。言葉で替わるのは本文だけ
    expect(found[1]?.code, "日本語の README の組み込みの節のコード").toEqual(found[0]?.code);
  });
});

describe("プラグインの文書の組み込み (#3701)", () => {
  it("plugin-docs-has-embed-section", () => {
    const skill = repoText("plugins/dragon/skills/dragon/SKILL.md");
    const path = "plugins/dragon/skills/dragon/references/embed.md";
    // AIが図を見せる置き先を選ぶ表から、組み込みの文書へ辿れる
    expect(sectionOf(skill, "## 7. Show it").includes("(references/embed.md)"), "SKILL.md の 7 の表が組み込みの文書を指さない").toBe(true);
    expect(existsSync(join(ROOT, path)), "組み込みの文書 (references/embed.md) が無い").toBe(true);
    if (!existsSync(join(ROOT, path))) return;
    const doc = repoText(path);
    const code = codeBlocks(doc).join("\n");
    expect(
      {
        ways: WAYS.filter(({ words }) => !words.every((word) => code.includes(word))).map(({ way }) => way),
        settings: SETTINGS.filter((name) => !doc.includes(`\`${name}\``)),
        events: EVENTS.filter((name) => !doc.includes(`\`${name}\``)),
      },
      "組み込みの文書に無い物",
    ).toEqual({ ways: [], settings: [], events: [] });
    // 文書が書く入口の URL は、プラグインの使う URL の一覧に理由と共に在る
    const urls = repoText("plugins/dragon/skills/dragon/functional-urls.txt");
    expect(urls.includes("references/embed.md https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@<major>.<minor>/dist/cdn/dragon.js"), "functional-urls.txt に組み込みの文書の URL が無い").toBe(true);
  });
});
