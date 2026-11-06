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
import { describe, expect, it, type RunnerTask } from "vitest";
import { fontFaces } from "../src/export/fonts";
import { exampleJson, type Json } from "./diagram-support";
import { embeddedFonts, exporter, fontChars, isBlank, unreadableFonts } from "./export-support";

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

/** 字の file を Chromium に読ませる図。英語の見本の全てと、全角空白の図 (#3212、#3421) */
const FONT_CASES: { name: string; diagram: () => Json; lang: "ja" | "en" }[] = [
  ...readdirSync(EXAMPLES)
    .filter((name) => name.endsWith(".en.json"))
    .sort()
    .map((name) => ({ name, diagram: () => exampleJson(name), lang: "en" as const })),
  { name: "全角空白の図", diagram: ideographicSpace, lang: "ja" },
];

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

  // 英語の見本ごとの件と、全角空白の図の件に分ける (#3421)。全ての見本を 1 件で書き出すと、混み 42 で 5 秒かかり、見本を足すたびに遅くなった
  describe.for(FONT_CASES)("$name", ({ name, diagram, lang }) => {
    it(
      "export-font-faces-all-load",
      async () => {
        const exportDiagram = await exporter();
        const result = await exportDiagram(diagram(), { outDir: scratch(), formats: ["html"], lang });
        const html = readFileSync(result.files.html as string, "utf8");
        expect(embeddedFonts(html).length, `${name} の HTML に字の file が 1 つも無い`).toBeGreaterThan(0);
        expect(await unreadableFonts([[name, html]]), "Chromium が読めない字の file を埋めている").toEqual([]);
      },
    );
  });
});

describe("字の file の件の分け方 (#3421)", () => {
  it("font-faces-cases-cover-english-examples", ({ task }) => {
    // 字の file の件は、英語の見本ごとの件と全角空白の図の件に分かれる。全ての見本を 1 件で書き出すと、混み 42 で 5 秒かかり、見本を足すたびに遅くなった
    const cases: string[] = [];
    const walk = (seen: RunnerTask): void => {
      // describe.for の `$name` は字の列を引用符で囲んだ名前にする
      if (seen.type === "test" && seen.name === "export-font-faces-all-load") cases.push((seen.suite?.name ?? "").replace(/^'(.*)'$/, "$1"));
      if (seen.type === "suite") seen.tasks.forEach(walk);
    };
    task.file.tasks.forEach(walk);
    const english = readdirSync(EXAMPLES).filter((name) => name.endsWith(".en.json"));
    expect(cases.sort(), "字の file の件が入る describe の名前").toEqual([...english, "全角空白の図"].sort());
  });
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


/** 見本の原本の JSON が持つ字の全て */
function exampleChars(): string[] {
  const chars = new Set<string>();
  const walk = (value: unknown): void => {
    if (typeof value === "string") for (const char of value) chars.add(char);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (typeof value === "object" && value !== null) Object.values(value).forEach(walk);
  };
  for (const [name] of examples()) walk(exampleJson(name));
  return [...chars];
}

describe("書き出しが同じ字を 1 つの字の file にだけ埋める (#3213)", () => {
  it("font-chars-in-one-file-each", async () => {
    // Noto Sans JP では英字、空白、改行しない空白、ä が番号付きの file と latin の両方の範囲に入り、`あ` と全角空白は番号付きの file だけに入る
    const chars = ["A", " ", "\u00a0", "ä", "あ", "\u3000"];
    const css = await fontFaces(chars);
    expect(overlaps(css), "同じ字の名前の字の file どうしで、範囲が重なって載った字").toEqual([]);
    const sans = embeddedFonts(css).filter((face) => face.family === "Noto Sans JP Variable");
    for (const char of chars) expect(sans.filter((face) => face.range.includes(char)).length, `${code(char)} を範囲に載せた Noto Sans JP の file が 1 つでない`).toBe(1);
  });

  it("export-font-files-do-not-overlap", async () => {
    // 字の file は字ごとに、後に並ぶ file の範囲にも入る字をそちらにだけ入れて決める (`fontFaces`)。ほかの字に左右されないので、
    // 見本ごとに書き出す代わりに、全ての見本の字をまとめて 1 度選ぶ (#3381)。見本ごとに書き出すと 1 件の上限 (10 秒) に収まらない
    const chars = exampleChars();
    expect(chars.length, "見本の字を数え損ねた").toBeGreaterThan(100);
    const css = await fontFaces(chars);
    expect(overlaps(css), "同じ字を 2 つ以上の字の file の範囲に載せた").toEqual([]);
    // 落とした字も無い。Noto Sans JP は仮名、漢字、英数字を持つので、それらは Noto Sans JP の file のどれか 1 つに必ず入る
    const sans = embeddedFonts(css).filter((face) => face.family === "Noto Sans JP Variable");
    const lost = chars.filter((char) => /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}A-Za-z0-9]/u.test(char) && sans.filter((face) => face.range.includes(char)).length !== 1);
    expect(lost.map(code), "Noto Sans JP の file のちょうど 1 つに入らない字").toEqual([]);
  });

  it(
    "order-en-embeds-under-20kb",
    async () => {
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("order.en.json"), { outDir: scratch(), formats: ["html"], lang: "en" });
      const bytes = embeddedFonts(readFileSync(result.files.html as string, "utf8")).reduce((sum, face) => sum + face.woff2.length, 0);
      expect(bytes, `order.en.json の HTML が埋めた字の file の合計 ${bytes} byte が 20000 byte を下回らない`).toBeLessThan(20000);
    },
  );
});
