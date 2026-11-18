/**
 * `export-fonts.test.ts` の書き出しと字の file を組む仕事を、1 回の実行の準備の段で済ませる (#3734)。
 *
 * 見本ごとの書き出しと、見本の字を 4 組に分けて字の file を組む仕事は、混んだ機械で 1 件の上限 (10 秒) を超えた。
 * 件は書き出した HTML を Chromium に読ませる仕事と、組んだ字の file の範囲を数える仕事だけを行う。
 * 件ごとの入力 (見本、字の組) は、件と準備で同じ物を使うためここに置く。
 */
import { readdirSync } from "node:fs";
import { EXAMPLES, exportIn, scratch } from "../../../test-support/prepare-tools";
import { fontFaces } from "../src/export/fonts";
import { exampleJson, type Json } from "./diagram-data";

/** 形を持たない字。半角の空白、全角空白、改行しない空白 */
export const BLANKS = [" ", "　", " "];

/** 描く字の範囲を確かめる字の組。空白の類 1 字ずつと、空白と英字と仮名と全角空白の組 */
export const RANGE_SETS = [...BLANKS.map((blank) => [blank]), [" ", "A", "あ", "　"]];

/** Noto Sans JP では英字、空白、改行しない空白、ä が番号付きの file と latin の両方の範囲に入り、`あ` と全角空白は番号付きの file だけに入る */
export const ONE_FILE_CHARS = ["A", " ", " ", "ä", "あ", "　"];

export const code = (char: string): string => `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase()}`;

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
export const FONT_CASES: { name: string; diagram: () => Json; lang: "ja" | "en" }[] = [
  ...readdirSync(EXAMPLES)
    .filter((name) => name.endsWith(".en.json"))
    .sort()
    .map((name) => ({ name, diagram: () => exampleJson(name), lang: "en" as const })),
  { name: "全角空白の図", diagram: ideographicSpace, lang: "ja" },
];

/** 見本の原本の JSON と、書き出す言葉 */
const examples = (): [string, "ja" | "en"][] =>
  readdirSync(EXAMPLES)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => [name, name.endsWith(".en.json") ? "en" : "ja"]);

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

/** 見本の字を符号の順に並べ、`count` 組に分ける (#3424) */
function charGroups(chars: string[], count: number): string[][] {
  const sorted = [...chars].sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0));
  const size = Math.ceil(sorted.length / count);
  return Array.from({ length: count }, (_, k) => sorted.slice(k * size, (k + 1) * size));
}
export const OVERLAP_CHARS = exampleChars();
/** 字の file の重なりの件が組ごとに確かめる字。組の名前は最初と最後の字の符号 */
export const OVERLAP_GROUPS = charGroups(OVERLAP_CHARS, 4).map((chars, k) => ({ name: `${k + 1} 組目 (${code(chars[0] ?? "")} から ${code(chars.at(-1) ?? "")})`, chars }));

const outDir = (): string => scratch("dragon-export-fonts-");

export default async function prepare() {
  // 書き出しは thread で回し、字の file を組む仕事はその間にこの process で済ませる
  const exports = Promise.all([
    Promise.all(FONT_CASES.map(({ diagram, lang }) => exportIn(diagram(), { outDir: outDir(), formats: ["html"], lang }).then((result) => result.files.html as string))),
    exportIn(exampleJson("order.en.json"), { outDir: outDir(), formats: ["html"], lang: "en" }).then((result) => result.files.html as string),
  ]);
  const blanks: string[] = [];
  for (const blank of BLANKS) blanks.push(await fontFaces([blank]));
  const ranges: string[] = [];
  for (const chars of RANGE_SETS) ranges.push(await fontFaces(chars));
  const oneFile = await fontFaces(ONE_FILE_CHARS);
  const groups: string[] = [];
  for (const { chars } of OVERLAP_GROUPS) groups.push(await fontFaces(chars));
  const [fontCases, orderEn] = await exports;
  return { fontCases, orderEn, blanks, ranges, oneFile, groups };
}
