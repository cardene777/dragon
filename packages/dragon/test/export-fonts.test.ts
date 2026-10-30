/**
 * 書き出しが埋める字の file を、Chromium が全て読める (#3212)。
 *
 * 字の file は描く字だけに削る。空白の類のように形を持たない字だけに削った file は Chromium が読まず、
 * 撮る頁の字の読み込みが落ちる。`Noto Sans JP` は file `[119]` の範囲にも空白を、file `[117]` の範囲に全角空白を含むため、
 * 日本語の字を描かない図と、全体で止めて見せる図で全角空白を描く図がこれに当たる。
 * 空白の類だけが入る file には、同じ file の形のある字を 1 つ足して読める形にし、足した字は範囲に載せない。
 */
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { launch, stage, still } from "../src/export/capture";
import { fontFaces } from "../src/export/fonts";
import { renderDiagram } from "../src/render/svg";
import { exampleJson, type Json } from "./diagram-support";
import { embeddedFonts, exporter, facesBeforeDedupe, fontChars, fontCssOf, isBlank, svgChars, unreadableFonts } from "./export-support";

/** 書き出し 1 回に許す時間。Chromium の起動を含む */
const SLOW = 180_000;
const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-fonts-"));

/** 形を持たない字。半角の空白、全角空白、改行しない空白 */
const BLANKS = [" ", "　", " "];

const code = (char: string): string => `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase()}`;

/** 全体で止めて見せる、仮名と全角空白だけで書いた図。全角空白の入る file `[117]` の他の字を描かない */
function ideographicSpace(): Json {
  return {
    version: 1,
    kind: "sequence",
    view: "fixed",
    title: "あ　い",
    boxes: [
      { id: "a", name: "うけつけ" },
      { id: "b", name: "くら" },
    ],
    steps: [
      {
        title: "よぶ",
        body: "うけつけが　くらを　よぶ。",
        events: [{ type: "edge", from: "a", to: "b", label: "とりだす", carry: { kind: "envelope" } }],
      },
    ],
    sequence: { lifelines: ["a", "b"] },
  };
}

describe("書き出しが埋める字の file (#3212)", () => {
  it("blank-font-file-adds-one-shaped-char", async () => {
    for (const blank of BLANKS) {
      const faces = embeddedFonts(await fontFaces([blank]));
      expect(faces.length, `${code(blank)} を描く字の file が 1 つも無い`).toBeGreaterThan(0);
      for (const face of faces) {
        const added = [...(await fontChars(face.woff2))].filter((char) => char !== blank);
        expect(added.map(code), `${face.family} の ${code(blank)} だけが入る file に足した字が 1 つでない`).toHaveLength(1);
        expect(isBlank(added[0] ?? " "), `${face.family} の ${code(blank)} だけが入る file に足した字が形を持たない`).toBe(false);
      }
    }
  });

  it("font-subset-range-lists-drawn-chars", async () => {
    const sets = [...BLANKS.map((blank) => [blank]), [" ", "A", "あ", "　"]];
    for (const chars of sets) {
      const faces = embeddedFonts(await fontFaces(chars));
      expect(faces.length, `${chars.map(code).join(" ")} を描く字の file が 1 つも無い`).toBeGreaterThan(0);
      for (const face of faces) {
        const outside = face.range.filter((char) => !chars.includes(char));
        expect(outside.map(code), `${face.family} の範囲に描かない字が載っている`).toEqual([]);
      }
    }
  });

  it(
    "export-font-faces-all-load",
    async () => {
      const exportDiagram = await exporter();
      const english = readdirSync(EXAMPLES).filter((name) => name.endsWith(".en.json"));
      expect(english.length, "英語の見本が 1 つも無い").toBeGreaterThan(0);
      const cases: [string, Json, "ja" | "en"][] = [...english.map((name): [string, Json, "en"] => [name, exampleJson(name), "en"]), ["全角空白の図", ideographicSpace(), "ja"]];
      const htmls: [string, string][] = [];
      for (const [name, diagram, lang] of cases) {
        const result = await exportDiagram(diagram, { outDir: scratch(), formats: ["html"], lang });
        const html = readFileSync(result.files.html as string, "utf8");
        expect(embeddedFonts(html).length, `${name} の HTML に字の file が 1 つも無い`).toBeGreaterThan(0);
        htmls.push([name, html]);
      }
      expect(await unreadableFonts(htmls), "Chromium が読めない字の file を埋めている").toEqual([]);
    },
    SLOW,
  );
});

/** 見本の原本の JSON と、書き出す言葉 */
const examples = (): [string, "ja" | "en"][] =>
  readdirSync(EXAMPLES)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => [name, name.endsWith(".en.json") ? "en" : "ja"]);

/** 同じ字の名前の字の file どうしで、2 つ以上の `unicode-range` に載った字。`<字の名前> <字>` の形 */
function overlaps(css: string): string[] {
  const seen = new Map<string, number>();
  for (const face of embeddedFonts(css)) for (const char of face.range) seen.set(`${face.family} ${code(char)}`, (seen.get(`${face.family} ${code(char)}`) ?? 0) + 1);
  return [...seen].filter(([, count]) => count > 1).map(([key]) => key);
}

/** 図を撮る時間。見本 24 個を HTML に書き出して 2 度ずつ撮る */
const SLOWER = 600_000;

describe("書き出しが同じ字を 1 つの字の file にだけ埋める (#3213)", () => {
  it("font-chars-in-one-file-each", async () => {
    // Noto Sans JP では英字、空白、改行しない空白、ä が番号付きの file と latin の両方の範囲に入り、`あ` と全角空白は番号付きの file だけに入る
    const chars = ["A", " ", "\u00a0", "ä", "あ", "\u3000"];
    const css = await fontFaces(chars);
    expect(overlaps(css), "同じ字の名前の字の file どうしで、範囲が重なって載った字").toEqual([]);
    const sans = embeddedFonts(css).filter((face) => face.family === "Noto Sans JP Variable");
    for (const char of chars) expect(sans.filter((face) => face.range.includes(char)).length, `${code(char)} を範囲に載せた Noto Sans JP の file が 1 つでない`).toBe(1);
  });

  it(
    "export-font-files-do-not-overlap",
    async () => {
      const exportDiagram = await exporter();
      const list = examples();
      expect(list.length, "見本の原本の JSON が 1 つも無い").toBeGreaterThan(0);
      const found: string[] = [];
      for (const [name, lang] of list) {
        const result = await exportDiagram(exampleJson(name), { outDir: scratch(), formats: ["html"], lang });
        const twice = overlaps(fontCssOf(readFileSync(result.files.html as string, "utf8")));
        if (twice.length) found.push(`${name} ${twice.length} 字 (${twice.slice(0, 3).join("、")} …)`);
      }
      expect(found, "同じ字を 2 つ以上の字の file の範囲に載せた見本").toEqual([]);
    },
    SLOWER,
  );

  it(
    "order-en-embeds-under-20kb",
    async () => {
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("order.en.json"), { outDir: scratch(), formats: ["html"], lang: "en" });
      const bytes = embeddedFonts(readFileSync(result.files.html as string, "utf8")).reduce((sum, face) => sum + face.woff2.length, 0);
      expect(bytes, `order.en.json の HTML が埋めた字の file の合計 ${bytes} byte が 20000 byte を下回らない`).toBeLessThan(20000);
    },
    SLOW,
  );

  it(
    "export-png-unchanged-by-font-dedupe",
    async () => {
      // 図の字を直す前と同じく入る file の全てに埋めて撮った絵と、書き出しの字の CSS で撮った絵を比べる
      const exportDiagram = await exporter();
      const differ: string[] = [];
      for (const lang of ["ja", "en"] as const) {
        const browser = await launch(lang);
        try {
          for (const [name] of examples().filter(([, l]) => l === lang)) {
            const result = await exportDiagram(exampleJson(name), { outDir: scratch(), formats: ["html"], lang });
            const css = fontCssOf(readFileSync(result.files.html as string, "utf8"));
            const rendered = renderDiagram(exampleJson(name), { lang });
            const at = rendered.timeline.stills[rendered.timeline.stills.length - 1] ?? 0;
            const shoot = async (fontCss: string): Promise<Buffer> => {
              const shot = await stage(browser, rendered.svg, fontCss, "", lang);
              try {
                return await still(shot, at);
              } finally {
                await shot.page.close();
              }
            };
            const now = await shoot(css);
            const before = await shoot(await facesBeforeDedupe(svgChars(rendered.svg), css));
            if (!now.equals(before)) differ.push(name);
          }
        } finally {
          await browser.close();
        }
      }
      expect(differ, "直す前の埋め方で撮った絵と画素が違う見本").toEqual([]);
    },
    SLOWER,
  );
});
