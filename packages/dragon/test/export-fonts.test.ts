/**
 * 書き出しが埋める字の file を、Chromium が全て読める (#3212)。
 *
 * 字の file は描く字だけに削る。空白の類のように形を持たない字だけに削った file は Chromium が読まず、
 * 撮る頁の字の読み込みが落ちる。`Noto Sans JP` は file `[119]` の範囲にも空白を、file `[117]` の範囲に全角空白を含むため、
 * 日本語の字を描かない図と、全体で止めて見せる図で全角空白を描く図がこれに当たる。
 * 空白の類だけが入る file には、同じ file の形のある字を 1 つ足して読める形にし、足した字は範囲に載せない。
 * 書き出しと字の file を組む仕事は 1 回の実行の準備の段で済ませ (`export-fonts.prepare.ts`、#3734)、件は組んだ物を読んで確かめる。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import prepare, { BLANKS, code, FONT_CASES, ONE_FILE_CHARS, OVERLAP_CHARS, OVERLAP_GROUPS, RANGE_SETS } from "./export-fonts.prepare";
import { casesNamed, embeddedFonts, fontChars, isBlank, unreadableFonts } from "./export-support";
import { prepared } from "./prepared";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 準備の段が書き出し、組んだ結果 */
const done = (): Awaited<ReturnType<typeof prepare>> => prepared(import.meta.url);

describe("書き出しが埋める字の file (#3212)", () => {
  it("blank-font-file-adds-one-shaped-char", async () => {
    for (const [k, blank] of BLANKS.entries()) {
      const faces = embeddedFonts(done().blanks[k] ?? "");
      expect(faces.length, `${code(blank)} を描く字の file が 1 つも無い`).toBeGreaterThan(0);
      for (const face of faces) {
        const added = [...(await fontChars(face.woff2))].filter((char) => char !== blank);
        expect(added.map(code), `${face.family} の ${code(blank)} だけが入る file に足した字が 1 つでない`).toHaveLength(1);
        expect(isBlank(added[0] ?? " "), `${face.family} の ${code(blank)} だけが入る file に足した字が形を持たない`).toBe(false);
      }
    }
  });

  it("font-subset-range-lists-drawn-chars", () => {
    for (const [k, chars] of RANGE_SETS.entries()) {
      const faces = embeddedFonts(done().ranges[k] ?? "");
      expect(faces.length, `${chars.map(code).join(" ")} を描く字の file が 1 つも無い`).toBeGreaterThan(0);
      for (const face of faces) {
        const outside = face.range.filter((char) => !chars.includes(char));
        expect(outside.map(code), `${face.family} の範囲に描かない字が載っている`).toEqual([]);
      }
    }
  });

  // 英語の見本ごとの件と、全角空白の図の件に分ける (#3421)。全ての見本を 1 件で書き出すと、混み 42 で 5 秒かかり、見本を足すたびに遅くなった
  describe.for(FONT_CASES.map(({ name }, k) => ({ name, k })))("$name", ({ name, k }) => {
    it(
      "export-font-faces-all-load",
      async () => {
        const html = readFileSync(done().fontCases[k] as string, "utf8");
        expect(embeddedFonts(html).length, `${name} の HTML に字の file が 1 つも無い`).toBeGreaterThan(0);
        expect(await unreadableFonts([[name, html]]), "Chromium が読めない字の file を埋めている").toEqual([]);
      },
    );
  });
});

describe("字の file の件の分け方 (#3421、#3424)", () => {
  it("font-faces-cases-cover-english-examples", ({ task }) => {
    // 字の file の件は、英語の見本ごとの件と全角空白の図の件に分かれる。全ての見本を 1 件で書き出すと、混み 42 で 5 秒かかり、見本を足すたびに遅くなった
    const english = readdirSync(EXAMPLES).filter((name) => name.endsWith(".en.json"));
    expect(casesNamed(task.file, "export-font-faces-all-load").sort(), "字の file の件が入る describe の名前").toEqual([...english, "全角空白の図"].sort());
  });

  it("font-overlap-split-into-four-groups", ({ task }) => {
    // 字の file の重なりの件は、見本の字を符号の順に分けた 4 組の件に分かれる (#3424)。全ての字 (518 字) を 1 件で選ぶと、混み 65 で 9.9 秒かかった
    expect(casesNamed(task.file, "export-font-files-do-not-overlap"), "字の file の重なりの件の数").toHaveLength(4);
  });
});

/** 同じ字の名前の字の file どうしで、2 つ以上の `unicode-range` に載った字。`<字の名前> <字>` の形 */
function overlaps(css: string): string[] {
  const seen = new Map<string, number>();
  for (const face of embeddedFonts(css)) for (const char of face.range) seen.set(`${face.family} ${code(char)}`, (seen.get(`${face.family} ${code(char)}`) ?? 0) + 1);
  return [...seen].filter(([, count]) => count > 1).map(([key]) => key);
}

describe("書き出しが同じ字を 1 つの字の file にだけ埋める (#3213)", () => {
  it("font-chars-in-one-file-each", () => {
    const css = done().oneFile;
    expect(overlaps(css), "同じ字の名前の字の file どうしで、範囲が重なって載った字").toEqual([]);
    const sans = embeddedFonts(css).filter((face) => face.family === "Noto Sans JP Variable");
    for (const char of ONE_FILE_CHARS) expect(sans.filter((face) => face.range.includes(char)).length, `${code(char)} を範囲に載せた Noto Sans JP の file が 1 つでない`).toBe(1);
  });

  // 字の file は字ごとに、後に並ぶ file の範囲にも入る字をそちらにだけ入れて決める (`fontFaces`)。ほかの字に左右されないので、
  // 見本ごとに書き出す代わりに、全ての見本の字を選ぶ (#3381)。見本ごとに書き出すと 1 件の上限 (10 秒) に収まらない。
  // 字を符号の順に 4 組に分けて組ごとに選ぶ (#3424)。全ての字 (518 字) を 1 件で選ぶと、混み 65 で 9.9 秒かかった
  describe.for(OVERLAP_GROUPS.map(({ name, chars }, k) => ({ name, chars, k })))("$name", ({ chars, k }) => {
    it("export-font-files-do-not-overlap", () => {
      expect(OVERLAP_CHARS.length, "見本の字を数え損ねた").toBeGreaterThan(100);
      expect(chars.length, "組に字が無い").toBeGreaterThan(0);
      const css = done().groups[k] ?? "";
      expect(overlaps(css), "同じ字を 2 つ以上の字の file の範囲に載せた").toEqual([]);
      // 落とした字も無い。Noto Sans JP は仮名、漢字、英数字を持つので、それらは Noto Sans JP の file のどれか 1 つに必ず入る
      const sans = embeddedFonts(css).filter((face) => face.family === "Noto Sans JP Variable");
      const lost = chars.filter((char) => /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}A-Za-z0-9]/u.test(char) && sans.filter((face) => face.range.includes(char)).length !== 1);
      expect(lost.map(code), "Noto Sans JP の file のちょうど 1 つに入らない字").toEqual([]);
    });
  });

  it(
    "order-en-embeds-under-20kb",
    () => {
      const bytes = embeddedFonts(readFileSync(done().orderEn, "utf8")).reduce((sum, face) => sum + face.woff2.length, 0);
      expect(bytes, `order.en.json の HTML が埋めた字の file の合計 ${bytes} byte が 20000 byte を下回らない`).toBeLessThan(20000);
    },
  );
});
