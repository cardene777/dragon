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
import { fontFaces } from "../src/export/fonts";
import { exampleJson, type Json } from "./diagram-support";
import { embeddedFonts, exporter, fontChars, isBlank, unreadableFonts } from "./export-support";

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
