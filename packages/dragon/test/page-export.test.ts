/**
 * mdから1つのHTMLの頁を書き出す (#3755)。
 *
 * `dragon export notes.md` とNodeの入口の`exportPage`が、mdの説明と図を見出しごとのタブに分けた頁を書く。
 * `#`は頁の題、最初の`##`より前は入口、`##`は段、`###`は項目、`####`はタブ、`#####`はタブの中のタブになる。
 * `![名前](path)`だけの行は別のfileの中身を載せ、mdの在るフォルダの外のfileは拒む。
 * 入口の図の箱は`[link: #<場所の名前>]`で項目に結び、無い項目を指す飛び先は拒む。
 *
 * ここでは頁を開かずに、書き出した file の中身と命令の終わり方を確かめる。頁を押して確かめる検査は`page-export-browser.test.ts`が持つ。
 */
import { existsSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

import { runCli } from "./export-support";
import {
  expectWritten,
  exportPageTool,
  PAY_TS,
  tempDir,
  writeFiles,
  writeNote,
} from "./page-export-support";

const ROOT = join(process.cwd(), "packages/dragon");
const EXAMPLES = join(ROOT, "examples/page");

/** 書き出したHTMLを読んで文書にする */
const documentOf = (path: string): Document =>
  new JSDOM(readFileSync(path, "utf8")).window.document;

/** 項目の頁。`id`は場所の名前 */
const pageOf = (doc: Document, id: string): Element | null =>
  doc.querySelector(`[data-page="${id}"]`);

/** 1つの項目だけを持つ小さなmd。`entry`は入口の中身、`item`は項目の頁の中身 */
const small = (entry: string, item = "#### 結果\n\n確かめた。\n", head = ""): string =>
  `${head}# 小さな頁\n\n${entry}\n\n## 段\n\n### order\n\n注文を受ける。\n\n${item}`;

describe("mdから頁を書き出す (#3755)", () => {
  it("page-includes-files-by-kind", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const md = writeNote();
    const doc = documentOf(expectWritten(await exportPage(md)));
    const order = pageOf(doc, "order");
    // .md は md として、ほかの文字の file は名前を付けた code の囲みとして載る
    expect(
      [...(order?.querySelectorAll("table") ?? [])].map((table) => table.textContent ?? ""),
      "載せた設計書の md の表",
    ).toContainEqual(expect.stringContaining("注文の番号"));
    expect(order?.textContent ?? "", "載せた設計書の md の見出し").toContain("注文の設計");
    expect(order?.textContent ?? "", "md の字のまま載った").not.toContain("|---|");
    const code = [...(order?.querySelectorAll("pre > code") ?? [])].map((c) => c.textContent);
    expect(code, "載せたコードの file").toContain(PAY_TS.trimEnd());
    expect(order?.textContent ?? "", "載せたコードの file の名前").toContain("支払い");
    // .dragon は帯つきの図として、画像の file は画像として載る
    const pay = pageOf(doc, "pay");
    const figure = pay?.querySelector("pre.dragon[data-header]");
    expect(figure?.textContent ?? "", "載せた図の file").toContain("sequence 支払いの流れ");
    const image = pay?.querySelector("img");
    expect(
      { src: image?.getAttribute("src"), alt: image?.getAttribute("alt") },
      "画像の file",
    ).toEqual({ src: "parts/pic.png", alt: "絵" });
  });

  it("page-rejects-include-outside-folder", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const base = tempDir("outside");
    writeFiles(base, { "secret.txt": "外の字\n", "note/inside.txt": "中の字\n" });
    symlinkSync(join(base, "secret.txt"), join(base, "note/link.txt"));
    for (const [target, line] of [
      ["../secret.txt", 13],
      ["link.txt", 13],
    ] as const) {
      const md = join(base, "note", "notes.md");
      writeFileSync(md, small("入口の字。", `#### 結果\n\n![外](${target})\n`));
      const result = await exportPage(md);
      expect(result.ok, `外の file ${target} を載せる md を書き出した`).toBe(false);
      const errors = result.ok ? [] : result.errors;
      expect(
        errors.map((e) => e.line),
        `外の file ${target} を載せる行`,
      ).toEqual([line]);
      expect(errors[0]?.message ?? "", "断りの文が載せた path を名指す").toContain(target);
      expect(existsSync(join(base, "note", "notes.html")), "拒んだのに頁を書いた").toBe(false);
    }
  });

  it("page-rejects-link-to-missing-item", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const dir = tempDir("missing");
    const md = join(dir, "notes.md");
    const fence =
      "```dragon\narchitecture 流れ\nbox a as 受ける [link: #order]\nbox b as 払う [link: #nowhere]\nstep 流す\n  a -> b\n```";
    writeFileSync(md, small(fence));
    const result = await exportPage(md);
    expect(result.ok, "無い項目を指す飛び先を持つ md を書き出した").toBe(false);
    const errors = result.ok ? [] : result.errors;
    expect(
      errors.map((e) => e.line),
      "無い項目を指す飛び先の行",
    ).toEqual([6]);
    expect(errors[0]?.message ?? "", "断りの文が飛び先を名指す").toContain("#nowhere");
    expect(existsSync(join(dir, "notes.html")), "拒んだのに頁を書いた").toBe(false);
  });

  it("page-rejects-broken-markdown", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const cases: [string, string, number][] = [
      ["記法の誤り", small("```dragon\nsequence 誤り\nboxx a\n```"), 5],
      ["知らない layout", small("入口の字。", undefined, "---\nlayout: grid\n---\n\n"), 2],
      [
        "最初の ## より前の ###",
        "# 早い項目\n\n入口の字。\n\n### early\n\n早い。\n\n## 段\n\n### order\n\n注文を受ける。\n",
        5,
      ],
    ];
    for (const [name, text, line] of cases) {
      const dir = tempDir("broken");
      writeFileSync(join(dir, "notes.md"), text);
      const result = await exportPage(join(dir, "notes.md"));
      expect(result.ok, `${name} を持つ md を書き出した`).toBe(false);
      expect(result.ok ? [] : result.errors.map((e) => e.line), `${name} の行`).toEqual([line]);
      expect(existsSync(join(dir, "notes.html")), `${name} を拒んだのに頁を書いた`).toBe(false);
    }
  });

  it("page-escapes-raw-html", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const dir = tempDir("html");
    writeFileSync(
      join(dir, "notes.md"),
      small(
        "入口の字。",
        '#### 結果\n\n<script>window.__dragonPage = 1</script>\n\n字の中の <img src=x onerror="window.__dragonPage = 2"> を書く。\n',
      ),
    );
    const path = expectWritten(await exportPage(join(dir, "notes.md")));
    const doc = documentOf(path);
    const scripts = [...doc.querySelectorAll("script")].map((s) => s.textContent ?? "");
    expect(
      scripts.filter((s) => s.includes("__dragonPage")),
      "md に書いた script を頁の script にした",
    ).toEqual([]);
    expect(doc.querySelectorAll("[onerror]").length, "md に書いた属性を頁の要素に付けた").toBe(0);
    expect(
      pageOf(doc, "order")?.textContent ?? "",
      "md に書いた HTML の字が頁に字のまま出ない",
    ).toContain("<script>window.__dragonPage = 1</script>");
  });

  it("page-language-follows-text", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const dir = tempDir("lang");
    writeFileSync(join(dir, "ja.md"), small("入口の字。"));
    writeFileSync(
      join(dir, "en.md"),
      "# Small page\n\nThe entry.\n\n## Group\n\n### order\n\nTake the order.\n\n#### Result\n\nChecked.\n",
    );
    const lang = (path: string): string | null =>
      documentOf(path).documentElement.getAttribute("lang");
    expect(
      lang(expectWritten(await exportPage(join(dir, "ja.md")))),
      "仮名か漢字のある md の頁の言葉",
    ).toBe("ja");
    const en = expectWritten(await exportPage(join(dir, "en.md")));
    expect(lang(en), "仮名も漢字も無い md の頁の言葉").toBe("en");
    expect(documentOf(en).body.textContent ?? "", "英語の頁に足す字").toContain("Overview");
    expect(
      lang(expectWritten(await exportPage(join(dir, "en.md"), { lang: "ja" }))),
      "言葉を渡した時の頁の言葉",
    ).toBe("ja");
  });

  // mdの書き出しは Chromium を借りないので、命令は子の process で起こす。process の中で読み込むと、束ねた命令の file を読み替えるだけで混んだ機械で 10 秒を超える。
  // 命令を起こす件は 1 件で命令を 1 回だけ起こす
  describe.for(["mdの隣", "--out のフォルダ"] as const)("%sに書く", (where) => {
    it("page-export-command-writes-html", async () => {
      const md = writeNote();
      const dir = where === "mdの隣" ? dirname(md) : tempDir("out");
      const ran = await runCli(["export", md, ...(where === "mdの隣" ? [] : ["--out", dir])]);
      expect(
        { code: ran.code, stdout: ran.stdout },
        `${where}へのmdの書き出し: ${ran.stderr}`,
      ).toEqual({
        code: 0,
        stdout: `${join(dir, "notes.html")}\n`,
      });
      expect(
        readFileSync(join(dir, "notes.html"), "utf8").startsWith("<!doctype html>"),
        `${where}に頁を書かない`,
      ).toBe(true);
    });
  });

  describe.for([
    { option: "--fps", value: "30" },
    { option: "--format", value: "html" },
    { option: "--width", value: "600" },
  ])("$option を付ける", ({ option, value }) => {
    it("page-export-refuses-diagram-options", async () => {
      const md = writeNote();
      const ran = await runCli(["export", md, option, value]);
      expect(ran.code, `${option} を付けたmdの書き出しの終わり方`).toBe(2);
      expect(ran.stderr, `${option} を付けたmdの書き出しの断り`).toContain(option);
      expect(
        readdirSync(dirname(md)).filter((name) => name.endsWith(".html")),
        `${option} を拒んだのに頁を書いた`,
      ).toEqual([]);
    });
  });

  it("node-entry-exports-page", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const md = writeNote();
    const api = tempDir("api");
    const path = expectWritten(await exportPage(md, { outDir: api }));
    expect(path, "exportPage が書いた file").toBe(join(api, "notes.html"));
    const cli = tempDir("cli");
    const ran = await runCli(["export", md, "--out", cli]);
    expect(ran.code, `命令の書き出し: ${ran.stderr}`).toBe(0);
    expect(readFileSync(path, "utf8"), "exportPage と命令が書いた頁").toBe(
      readFileSync(join(cli, "notes.html"), "utf8"),
    );
  });

  it("page-examples-export", async () => {
    const exportPage = await exportPageTool();
    if (!exportPage) return;
    const files = existsSync(EXAMPLES)
      ? readdirSync(EXAMPLES).filter((name) => name.endsWith(".md"))
      : [];
    expect(files.sort(), "見本の英語と日本語のmd").toEqual(["page.en.md", "page.md"]);
    for (const name of files) {
      const out = tempDir("example");
      const result = await exportPage(join(EXAMPLES, name), { outDir: out });
      expect(result, `見本 ${name} を書き出せない`).toEqual({
        ok: true,
        path: join(out, name.replace(/\.md$/u, ".html")),
      });
    }
  });

  it("readme-documents-page-export", () => {
    const cases: [string, string][] = [
      ["README.md", "## Write a page from Markdown"],
      ["README.ja.md", "## mdから頁を書き出す"],
    ];
    for (const [file, heading] of cases) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const start = text.indexOf(`\n${heading}\n`);
      expect(start, `${file} に見出し ${heading} が無い`).toBeGreaterThan(0);
      const section = text.slice(start + 1).split(/\n## /u)[0] ?? "";
      for (const word of [
        "dragon export",
        "layout: sidebar",
        "layout: tabs",
        "[link: #",
        "![",
        "examples/page",
      ]) {
        expect(section, `${file} の ${heading} の節が ${word} を書かない`).toContain(word);
      }
    }
  });

  it("box-link-accepts-page-anchor", () => {
    // 入口は file を読む時に 1 度だけ読み、件の時間に入れない
    const api = dragon as unknown as {
      parseNotation(text: string): {
        ok: boolean;
        diagram?: { blocks: { box?: { link?: string }[] } };
        errors?: unknown;
      };
      readDiagram(input: unknown): { ok: boolean; errors?: unknown };
      renderDiagram(input: unknown): { svg: string };
    };
    for (const link of ["#order", "#配送"]) {
      const parsed = api.parseNotation(
        `architecture 飛び先\nbox a as 受ける [link: ${link}]\nbox b as 払う\nstep 流す\n  a -> b\n`,
      );
      expect(parsed.ok, `記法の飛び先 ${link} を受けない: ${JSON.stringify(parsed.errors)}`).toBe(
        true,
      );
      expect(parsed.diagram?.blocks.box?.[0]?.link, `記法の飛び先 ${link}`).toBe(link);
      const json: unknown = JSON.parse(JSON.stringify(parsed.diagram));
      const read = api.readDiagram(json);
      expect(
        read.ok,
        `原本の JSON の飛び先 ${link} を受けない: ${JSON.stringify(read.errors)}`,
      ).toBe(true);
      if (read.ok)
        expect(api.renderDiagram(json).svg, `飛び先 ${link} の link`).toContain(`href="${link}"`);
    }
  });
});
