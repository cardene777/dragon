/**
 * 見本と部品の図の記法を、頁が最初に読む script から外して後から読む (#3246)。
 *
 * 最初に読む script は、build した頁の `index.html` が名指す script と CSS (`firstLoadFiles`)。
 * 後から読む塊は、見本の記法を持つ塊と部品の図の記法を持つ塊の 2 つで、最初の画面を描いた後に裏で読み始め、一度読んだら持ち続ける。
 * 概要の頁の 3 つの見本と編集画面の最初の見本は、待たずに出すため最初に読む script に残す。
 * 記法が script の中にあるかは、記法の file の中身が script の字の並び (字の並びの書き方 2 通りのどちらか) として現れるかで決める。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { builtDir, firstLoadFiles, partFigureDirs, root } from "./playground-support";

/** 概要の頁の用例と編集画面の最初の見本。最初に読む script に残す */
const FIRST_SCREEN_EXAMPLES = ["intro", "oauth", "ccip"] as const;

const EXAMPLES = join(root, "packages/dragon/examples");

interface Notation {
  /** repo の root からの path */
  path: string;
  text: string;
}

const notationsIn = (dir: string, keep: (name: string) => boolean): Notation[] =>
  readdirSync(dir)
    .filter((name) => name.endsWith(".dragon") && keep(name))
    .sort()
    .map((name) => ({ path: join(dir, name).slice(root.length + 1), text: readFileSync(join(dir, name), "utf8") }));

const isFirstScreen = (name: string): boolean => FIRST_SCREEN_EXAMPLES.some((key) => name === `${key}.dragon` || name === `${key}.en.dragon`);
/** 後から読む見本の記法 */
const laterExamples = (): Notation[] => notationsIn(EXAMPLES, (name) => !isFirstScreen(name));
/** 最初に読む見本の記法 */
const firstExamples = (): Notation[] => notationsIn(EXAMPLES, isFirstScreen);
/** 部品の図の記法。ブロックの置き場へ移した部品の図も見る (#3345) */
const partNotations = (): Notation[] => partFigureDirs().flatMap((dir) => notationsIn(dir, () => true));

/** 記法が script の中で取りうる字の並び。build は字の並びを `` ` `` の囲みか `"` の囲みで書く */
function literalForms(text: string): string[] {
  const body = text.trimEnd();
  return [body.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${"), JSON.stringify(body).slice(1, -1)];
}

const carries = (code: string, notation: Notation): boolean => literalForms(notation.text).some((form) => code.includes(form));

const assets = (): string => join(builtDir(), "assets");
const scriptsOf = (names: string[]): string => names.map((name) => readFileSync(join(assets(), name), "utf8")).join("\n");
const firstScripts = (): string[] => firstLoadFiles(builtDir()).filter((name) => name.endsWith(".js"));
/** 後から読む塊。build した script のうち、最初に読む script でない物 */
const laterScripts = (): string[] => {
  const first = new Set(firstLoadFiles(builtDir()));
  return readdirSync(assets())
    .filter((name) => name.endsWith(".js") && !first.has(name))
    .sort();
};

/** 後から読む塊のうち、見本の記法を持つ塊と部品の図の記法を持つ塊 */
function notationChunks(): { examples: string[]; parts: string[] } {
  const later = laterScripts().map((name) => ({ name, code: scriptsOf([name]) }));
  const examples = laterExamples();
  const parts = partNotations();
  return {
    examples: later.filter((chunk) => examples.some((n) => carries(chunk.code, n))).map((chunk) => chunk.name),
    parts: later.filter((chunk) => parts.some((n) => carries(chunk.code, n))).map((chunk) => chunk.name),
  };
}

/** 見本の塊と部品の図の塊の名前。どちらかが 1 つでなければ落とす */
function twoChunks(): { examples: string; parts: string } {
  const { examples, parts } = notationChunks();
  expect(examples, "後から読む塊のうち、見本の記法を持つ塊").toHaveLength(1);
  expect(parts, "後から読む塊のうち、部品の図の記法を持つ塊").toHaveLength(1);
  return { examples: examples[0] ?? "", parts: parts[0] ?? "" };
}

describe("見本と部品の図の記法を後から読む (#3246)", () => {

  it("first-load-carries-no-catalog-notation", () => {
    const code = scriptsOf(firstScripts());
    expect(code, "build した頁が最初に読む script が無い").not.toBe("");
    const notations = [...laterExamples(), ...partNotations()];
    expect(notations.length, "見本と部品の図の記法の file の数").toBeGreaterThan(0);
    expect(
      notations.filter((n) => carries(code, n)).map((n) => n.path),
      "最初に読む script が持つ、後から読むはずの見本と部品の図の記法",
    ).toEqual([]);
  });

  it("catalog-notation-in-two-chunks", () => {
    const { examples, parts } = twoChunks();
    expect(examples, "見本の記法と部品の図の記法が同じ塊に入っている").not.toBe(parts);
    const exampleCode = scriptsOf([examples]);
    const partCode = scriptsOf([parts]);
    expect(laterExamples().filter((n) => !carries(exampleCode, n)).map((n) => n.path), "見本の塊に無い見本の記法").toEqual([]);
    expect(partNotations().filter((n) => !carries(partCode, n)).map((n) => n.path), "部品の図の塊に無い部品の図の記法").toEqual([]);
  });

  it("first-load-keeps-home-examples", () => {
    const code = scriptsOf(firstScripts());
    const examples = firstExamples();
    expect(examples.map((n) => n.path.split("/").pop()), "概要の頁と編集画面の最初の見本の file").toHaveLength(FIRST_SCREEN_EXAMPLES.length * 2);
    expect(examples.filter((n) => !carries(code, n)).map((n) => n.path), "最初に読む script に無い、概要の頁と編集画面の最初の見本の記法").toEqual([]);
  });
});
