/**
 * カタログの部品の 3 段 (#3166)。
 *
 * カタログは今、見本を図の種類 (時系列図と構成図) だけで束ねている。描く部品 (`packages/dragon/src/render/parts.ts`) は
 * 図の種類の間で共通で、図の種類ごとに違うのは並べ方 (`packages/dragon/src/layout/`) だけなので、カタログを
 * 「どの図でも使える部品」「図の種類だけの部品」「図 (部品を組み合わせた物と見本)」の 3 段に並べ直す。
 *
 * 部品の表は `catalog/parts.ts` の `PARTS` が持ち、1 行が部品の名札と、その部品を描ける図の種類と、
 * その部品が受け持つ記法の語を持つ。図の種類を全部持つ部品が、どの図でも使える部品になる。
 * 語は `kind:<図の種類>`、`head:<行の頭の語>`、`attr:<行>.<鍵>`、線の行の `edge:->` の形で書き、
 * 記法の語の表 (`packages/dragon/src/words.ts`) の語を、どれかの部品が必ず受け持つ。
 * 部品の図は `packages/dragon/src/blocks/<名札>/gallery/<名札>.<図の種類>.dragon` と英語の `.en.dragon` の記法の file で、部品の頁はそれを描く。
 *
 * 部品の表と file が無い間も、file を読み込んだ所で落とさず、表が無いと断って落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { parseNotation, validateDiagram } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

import * as WORDS from "../../../../packages/dragon/src/words";
import { type Kind } from "../catalog/catalog";
import { PARTS } from "../catalog/parts";
import { INPUT_KINDS } from "../catalog/inputs";
import { type Lang } from "../text";
import { partFigure, partFigureNames } from "./playground-support";

const { ATTRS, HEADS, KINDS: WORD_KINDS } = WORDS;

/** 部品の表の 1 行。`kinds` が図の種類を全部持つ部品が、どの図でも使える部品 */
interface PartRow {
  readonly id: string;
  readonly kinds: readonly Kind[];
  readonly words: readonly string[];
}

/** 部品の表の置き場。無い間も file を読み込めるよう、名前を値にして読む */
const PARTS_MODULE = "../catalog/parts";

/** 部品の表。表の module が無いか `PARTS` を出さなければ `undefined` */
const loadParts = async (): Promise<readonly PartRow[] | undefined> => {
  try {
    const mod = (await import(/* @vite-ignore */ PARTS_MODULE)) as { PARTS?: readonly PartRow[] };
    return mod.PARTS;
  } catch {
    return undefined;
  }
};

/** 部品の表を読み、無いか空なら落とす */
async function partsTable(): Promise<readonly PartRow[]> {
  const parts = await loadParts();
  expect(parts, "部品の表 (`catalog/parts.ts` の `PARTS`) が無い").toBeDefined();
  expect(parts?.length ?? 0, "部品の表が空").toBeGreaterThan(0);
  return parts ?? [];
}

/**
 * 部品の表 (#3381)。検査を集める時に使うので、表を直に読む
 */
const PART_CASES: readonly PartRow[] = PARTS;

/** どの図でも使える部品か。図の種類を 2 つ以上持つ。列の図は線を持たないので、線の部品は列の図を除いた図の種類を持つ (#3239) */
const isCommon = (part: PartRow): boolean => part.kinds.length > 1;

/** 部品の図の記法の file の名前 */
const snippetName = (id: string, kind: Kind, lang: Lang): string => `${id}.${kind}${lang === "en" ? ".en" : ""}.dragon`;

/** 部品の図の記法。ブロックの置き場の見本帳の分から探し、file が無ければ `undefined` (#3345、#3348) */
const snippetOf = (id: string, kind: Kind, lang: Lang): string | undefined => {
  const path = partFigure(snippetName(id, kind, lang));
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

/** 状態遷移図の線の、始まりと終わりの予約の名前 (#3163)。語の表が持たない間は空 */
const STATE_ENDS: readonly string[] = (WORDS as { STATE_ENDS?: readonly string[] }).STATE_ENDS ?? [];
/** 枝分かれの図の行の中の語 (#3164)。枝を切る `from`、当て直しの `copy`、merge commit の `merge`。語の表が持たない間は空 */
const GIT_WORDS: readonly string[] = (WORDS as { GIT_WORDS?: readonly string[] }).GIT_WORDS ?? [];

/**
 * 記法の語の表 (`words.ts`) の語を、部品が受け持つ語の形にした物。
 * 線の行は頭の語を持たず、表には属性の鍵の行 (`ATTRS.edge`) としてだけ現れるので、行の形 `<名札> -> <名札>` の `->` を語として足す。
 * 状態遷移図の線の形も頭の語を持たないので、始まりと終わりの予約の名前 (`edge:start` `edge:finish`) と、
 * 最初の段より前に書く通らない道 (`edge:before-step`) を語として足す。段より前の線は状態遷移図だけが書ける (#3163)。
 * 枝分かれの図の行の中の語 (`from` と `copy` と `merge`) も頭の語でも属性でもないので、`git:<語>` として足す (#3164)
 */
const NOTATION_WORDS: readonly string[] = [
  ...WORD_KINDS.map((kind) => `kind:${kind}`),
  ...HEADS.map((head) => `head:${head}`),
  ...Object.entries(ATTRS).flatMap(([line, keys]) => keys.map((key) => `attr:${line}.${key}`)),
  "edge:->",
  ...STATE_ENDS.map((name) => `edge:${name}`),
  ...((WORD_KINDS as readonly string[]).includes("state") ? ["edge:before-step"] : []),
  ...GIT_WORDS.map((word) => `git:${word}`),
];

/** 記法の、空でなく注釈でもない行 */
const contentLines = (text: string): string[] => text.split("\n").filter((line) => line.trim() !== "" && !line.trim().startsWith("//"));
/** 行の頭の語 */
const headOf = (line: string): string => line.trim().split(/\s+/u)[0] ?? "";
/**
 * 線の行か。行の頭の名札の後ろに `->` が来る。配管の図の `move` と `calc` の行は中に `->` を書くが、頭の語の行 (#3389)。
 * 時間軸の図の針の行 `now -> <目盛り>` は目盛りのブロックの行で、線でない。線を持たず針だけを進める見本 (`release-plan`、#3562) を線の見本に数えないため
 */
const isEdge = (line: string): boolean => /^\s*\S+\s*->\s/u.test(line) && headOf(line) !== "now";
/** 行の種類。最初の行は図 (`diagram`)、`->` を持つ行は線 (`edge`)、それ以外は行の頭の語 */
const lineKind = (line: string, index: number): string => (index === 0 ? "diagram" : isEdge(line) ? "edge" : headOf(line));
/** 行の終わりの `[ ]` の中に書いた属性の鍵。値を持たない印 (配管の図の `[fold]` と `[fail]`、#3389) も鍵として数える */
const attrKeys = (line: string): string[] =>
  [...(/\[([^\]]*)\]\s*$/u.exec(line)?.[1] ?? "").matchAll(/(?:^|,\s*)([a-z]+)\s*(?=:|,|$)/gu)].map((m) => m[1] ?? "");

/** 記法がその語を使っているか */
const usesWord = (text: string, word: string): boolean => {
  const lines = contentLines(text);
  const [type, rest = ""] = word.split(":") as [string, string?];
  if (type === "kind") return headOf(lines[0] ?? "") === rest;
  if (type === "head") return lines.some((line, i) => i > 0 && !isEdge(line) && headOf(line) === rest);
  if (type === "edge") {
    if (rest === "->") return lines.some(isEdge);
    const firstStep = lines.findIndex((line) => headOf(line) === "step");
    if (rest === "before-step") return lines.some((line, i) => i > 0 && (firstStep < 0 || i < firstStep) && isEdge(line));
    // 始まりは線の送る側、終わりは受ける側にだけ書ける
    return lines.some((line) => isEdge(line) && line.split(" -> ")[rest === "start" ? 0 : 1]?.trim().split(/[\s:[]/u)[0] === rest);
  }
  if (type === "attr") {
    const [line, key] = rest.split(".");
    return lines.some((l, i) => lineKind(l, i) === line && attrKeys(l).includes(key ?? ""));
  }
  // 枝を切る `from` は `<枝> from <commit>` の行の 2 語目に、`copy` と `merge` は commit の行に書く。
  // 説明の文と命令の行と線の名前に書いた同じ語 (`git merge` など) は数えない
  if (type === "git")
    return lines.some((line, i) => {
      const parts = line.trim().split(/\s+/u);
      if (i === 0 || isEdge(line)) return false;
      return rest === "from" ? parts.length === 3 && parts[1] === rest && !["say", "code"].includes(headOf(line)) : headOf(line) === "commit" && parts.includes(rest);
    });
  return false;
};

describe("部品の表と記法の file (#3166)", () => {
  it("catalog-parts-cover-every-word", async () => {
    const parts = await partsTable();
    expect(NOTATION_WORDS.length, "記法の語の表から語を引けない").toBeGreaterThan(0);
    const owned = new Set([...parts.flatMap((part) => part.words), ...INPUT_KINDS.flatMap(input => input.words)]);
    const missing = NOTATION_WORDS.filter((word) => !owned.has(word));
    expect(missing, `どの部品も受け持たない記法の語が ${missing.length} 個ある`).toEqual([]);
    // 表に無い語を書いた部品は、綴りを誤ったまま語を受け持ったつもりになる
    const unknown = [...owned].filter((word) => !NOTATION_WORDS.includes(word));
    expect(unknown, "記法の語の表に無い語を受け持つ部品がある").toEqual([]);
    for (const input of INPUT_KINDS) {
      expect(input.words).toContain(`kind:${input.kind}`);
      expect(input.blocks.length, '図種専用入力の定義が空').toBeGreaterThan(0);
    }
  });

  it("catalog-part-snippets-use-their-words", async () => {
    const parts = await partsTable();
    const want = parts.flatMap((part) => part.kinds.flatMap((kind) => (["ja", "en"] as const).map((lang) => ({ part, kind, lang, name: snippetName(part.id, kind, lang) }))));
    const present = partFigureNames();
    expect(
      want.map((w) => w.name).filter((name) => !present.includes(name)),
      "部品の表の部品と図の種類と言葉に当たる記法の file が無い",
    ).toEqual([]);
    expect(
      present.filter((name) => !want.some((w) => w.name === name)),
      "部品の表に無い部品か、その部品が描けない図の種類の記法の file がある",
    ).toEqual([]);

    const errors: string[] = [];
    for (const { part, kind, lang, name } of want) {
      const text = snippetOf(part.id, kind, lang) ?? "";
      const parsed = parseNotation(text);
      if (!parsed.ok) {
        errors.push(`${name} が記法として読めない: ${parsed.errors.map((e) => `${e.line} 行目 ${e.message}`).join(" / ")}`);
        continue;
      }
      const checked = validateDiagram(parsed.diagram);
      if (!checked.ok) errors.push(`${name} が JSON Schema の検査で落ちる: ${checked.errors.map((e) => `${e.pointer} ${e.message}`).join(" / ")}`);
      if (parsed.diagram.kind !== kind) errors.push(`${name} の図の種類が ${parsed.diagram.kind} で、file の名前の ${kind} と違う`);
      const unused = part.words.filter((word) => !usesWord(text, word));
      if (unused.length > 0) errors.push(`${name} が部品の受け持つ語 ${unused.join("、")} を使わない`);
    }
    expect(errors, "部品の図の記法に、読めないか部品の語を使わない物がある").toEqual([]);
  });
});

describe("カタログの部品の頁 (#3166)", () => {
  it("strip-time-figure-uses-meter", () => {
    // 中身の帯の頁の時間軸の図は物差しを使う (#3165)
    expect(snippetOf("strip", "time", "ja") ?? "", "中身の帯の部品の時間軸の図が物差しを使わない").toContain("[meter:");
    expect(snippetOf("strip", "time", "en") ?? "", "中身の帯の部品の英語の時間軸の図が物差しを使わない").toContain("[meter:");
  });

  it("catalog-common-parts-listed", () => {
    expect(PART_CASES.filter(isCommon).length, "部品の表にどの図でも使える部品が無い").toBeGreaterThan(0);
    expect(PART_CASES.filter((part) => !isCommon(part)).length, "部品の表に図の種類だけの部品が無い").toBeGreaterThan(0);
    // どの図でも使える部品は、状態遷移図と枝分かれの図と時間軸の図と木の図でも描く (#3163、#3164、#3165、#3233)。
    for (const kind of ["state", "git", "time", "tree"] as const) {
      expect(
        PART_CASES.filter(isCommon)
          .filter((part) => !part.kinds.includes(kind))
          .map((part) => part.id),
        `${kind} の図を描かない、どの図でも使える部品がある`,
      ).toEqual([]);
    }
  });
});
