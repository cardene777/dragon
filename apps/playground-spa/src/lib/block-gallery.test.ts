/**
 * ブロックの見本帳の分のうち、頁の外の文書と棚に照らす分 (#3345)。
 *
 * `docs/design/base/GRAMMAR.md` の部品と使い方の表は人が読む文書で、ブロックの置き場の `gallery/rule.ts` の行を、ブロックの並びの順に
 * `packages/dragon/scripts/build-blocks.mjs` が書き出す (#3350)。見本帳の一覧と棚と使い方の頁も、置き場の分をブロックの並びの順に並べて作る。
 * 編集画面の棚の部品の名前は `gallery/shelf.ts` が棚の部品の id ごとに持つ。
 * 写した行が表の行と食い違った時と、棚に無い部品の id を名乗った時に落とす。
 * 見る関数はこの file が持ち、正しい分に当てて通ることと、崩した分に当てて名指すことの両方を確かめる。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLOCK_DOCS } from "../catalog/blocks-docs.gen";
import { BLOCK_RULE, BLOCK_SHELF, BLOCK_TEXT } from "../catalog/blocks.gen";
import { isCommon, PARTS } from "../catalog/parts";
import { CATALOG_TEXT } from "../catalog/text";
import { DOCS, SECTIONS } from "../docs/content";
import { PART_IDS } from "../editor/shelf-items";

type Rule = { none: string } | readonly { part: string; rule: string; name: string }[];
type Shelf = { none: string } | Readonly<Record<string, unknown>>;

const GRAMMAR = join(__dirname, "../../../../docs/design/base/GRAMMAR.md");
const ROOT = join(__dirname, "../../../..");

interface RankedBlock {
  name: string;
  rank: number;
  attach: { only?: string };
}

/** ブロックの一覧をブロックの並び (`rank`) の順に */
async function rankedBlocks(): Promise<RankedBlock[]> {
  const { BLOCKS } = (await import("../../../../packages/dragon/src/blocks/index")) as unknown as { BLOCKS: Record<string, RankedBlock> };
  return Object.values(BLOCKS).sort((a, b) => a.rank - b.rank);
}

/** `none` を持たない見本帳の分。持たないブロックは `undefined` */
const own = <T extends object>(table: Readonly<Record<string, unknown>>, name: string): Exclude<T, { none: string }> | undefined => {
  const value = table[name] as T | undefined;
  return value === undefined || "none" in value ? undefined : (value as Exclude<T, { none: string }>);
};
const TABLE = "## 部品と使い方";

/** GRAMMAR.md の部品と使い方の節の、表の行 */
function tableRows(): string[] {
  const text = readFileSync(GRAMMAR, "utf8");
  const start = text.indexOf(TABLE);
  const rest = start < 0 ? "" : text.slice(start + TABLE.length);
  const end = rest.search(/^## /mu);
  return (end < 0 ? rest : rest.slice(0, end)).split("\n").filter((line) => line.startsWith("| "));
}

/** 表に同じ行が無いブロックの行を `<ブロック>: <部品>` で返す */
export function ruleProblems(rules: Record<string, Rule>, rows: readonly string[]): string[] {
  return Object.entries(rules).flatMap(([name, rule]) =>
    "none" in rule ? [] : rule.filter((row) => !rows.includes(`| ${row.part} | ${row.rule} | ${row.name} |`)).map((row) => `${name}: ${row.part}`),
  );
}

/** 棚に無い部品の id と、2 つのブロックが名乗る部品の id */
export function shelfProblems(shelves: Record<string, Shelf>, ids: readonly string[]): string[] {
  const owners = new Map<string, string[]>();
  for (const [name, shelf] of Object.entries(shelves)) if (!("none" in shelf)) for (const id of Object.keys(shelf)) owners.set(id, [...(owners.get(id) ?? []), name]);
  return [...owners].flatMap(([id, names]) => [...(ids.includes(id) ? [] : [`${id}: 棚に無い`]), ...(names.length > 1 ? [`${id}: ${names.join(", ")}`] : [])]);
}

describe("ブロックの見本帳の分 (#3345)", () => {
  it("block-rule-rows-match-grammar", () => {
    const rows = tableRows();
    expect(rows.length, "GRAMMAR.md に部品と使い方の表が無い").toBeGreaterThan(2);
    const rules = BLOCK_RULE as Record<string, Rule>;
    expect(Object.values(rules).filter((rule) => !("none" in rule)).length, "表の行を持つブロックが無い").toBeGreaterThan(0);
    expect(ruleProblems(rules, rows), "表と違うブロックの行").toEqual([]);
    expect(ruleProblems({ x: [{ part: "箱", rule: "違う決まり", name: "`E.card`" }], y: { none: "-" } }, rows)).toEqual(["x: 箱"]);
  });

  it("block-shelf-ids-on-shelf", () => {
    const shelves = BLOCK_SHELF as Record<string, Shelf>;
    expect(Object.values(shelves).filter((shelf) => !("none" in shelf)).length, "棚の部品を持つブロックが無い").toBeGreaterThan(0);
    expect(shelfProblems(shelves, PART_IDS), "棚の部品の id").toEqual([]);
    expect(shelfProblems({ a: { box: {} }, b: { box: {}, gone: {} } }, ["box"])).toEqual(["box: a, b", "gone: 棚に無い"]);
  });
});

describe("見本帳と決まりをブロックの置き場から作る (#3350)", () => {
  it("catalog-built-from-block-folders", async () => {
    const ranked = await rankedBlocks();
    expect(ranked.length, "ブロックが無い (走査の空振り)").toBeGreaterThan(0);
    const texts = BLOCK_TEXT as Readonly<Record<string, unknown>>;
    const listed = ranked.filter((block) => own<object>(texts, block.name) !== undefined);
    // 見本帳の部品の一覧は、見本帳の名前と説明を持つブロックをブロックの並びで並べた物
    expect(PARTS.map((part) => part.id), "見本帳の部品の一覧").toEqual(listed.map((block) => block.name));
    // 一覧の段は付け方で分け、段の名前をコアブロックと個別ブロックにする
    expect(PARTS.filter(isCommon).map((part) => part.id), "コアブロックの段の部品").toEqual(listed.filter((block) => block.attach.only === undefined).map((block) => block.name));
    expect([CATALOG_TEXT.ja.sections.parts.title, CATALOG_TEXT.ja.sections["kind-parts"].title], "一覧の段の名前").toEqual(["コアブロック", "個別ブロック"]);
    expect([CATALOG_TEXT.en.sections.parts.title, CATALOG_TEXT.en.sections["kind-parts"].title], "英語の一覧の段の名前").toEqual(["Core blocks", "Kind blocks"]);
    // 棚の部品は、棚の部品を持つブロックをブロックの並びで並べた物
    const shelves = BLOCK_SHELF as Readonly<Record<string, unknown>>;
    expect([...PART_IDS], "棚の部品").toEqual(ranked.flatMap((block) => Object.keys(own<object>(shelves, block.name) ?? {})));
    // 使い方の頁の段落は、段落を持つブロックの節に、ブロックの並びで入る
    const docs = BLOCK_DOCS as Readonly<Record<string, unknown>>;
    // 節の名前を書き違えた段落は、どの節にも入らずに黙って消えるので、段落の節が頁の節に在ることを確かめる
    const unplaced = ranked.filter((block) => {
      const found = own<{ section: string }>(docs, block.name);
      return found !== undefined && !(SECTIONS as readonly string[]).includes(found.section);
    });
    expect(unplaced.map((block) => block.name), "使い方の頁に無い節を名乗るブロックの段落").toEqual([]);
    for (const lang of ["ja", "en"] as const) {
      const paragraphs = new Set(ranked.flatMap((block) => own<Record<string, readonly string[]>>(docs, block.name)?.[lang] ?? []));
      for (const section of SECTIONS) {
        const expected = ranked.flatMap((block) => {
          const found = own<{ section: string } & Record<string, readonly string[]>>(docs, block.name);
          return found?.section === section ? (found[lang] ?? []) : [];
        });
        expect(DOCS[lang].sections[section].text.filter((text) => paragraphs.has(text)), `${lang} の使い方の頁の ${section} の節のブロックの段落`).toEqual(expected);
      }
    }
    // 見本帳の頁の code は、見本帳の分をブロックの名前で 1 つずつ手で引かない
    const pages = execFileSync("git", ["ls-files", "apps/playground-spa/src"], { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .filter((file) => /\.(?:ts|tsx)$/u.test(file) && !file.endsWith(".test.ts") && !file.endsWith(".gen.ts"));
    expect(pages.length, "見本帳の頁の code が無い (走査の空振り)").toBeGreaterThan(0);
    const hand = pages.filter((file) => /\bBLOCK_(?:TEXT|DOCS|SHELF|RULE)(?:\.[a-z]|\[")/u.test(readFileSync(join(ROOT, file), "utf8")));
    expect(hand, "見本帳の分をブロックの名前で手で引く file").toEqual([]);
  });

  it("part-desc-apart-from-names", async () => {
    // 部品の説明は部品の頁だけが見せるので、名前と別の file に置き、最初の画面が読む一覧に入れない (#3531)
    const ranked = await rankedBlocks();
    expect(ranked.length, "ブロックが無い (走査の空振り)").toBeGreaterThan(0);
    const gallery = (name: string, file: string): string | undefined => {
      const path = join(ROOT, "packages/dragon/src/blocks", name, "gallery", file);
      return existsSync(path) ? readFileSync(path, "utf8") : undefined;
    };
    const misplaced = ranked.flatMap(({ name }) => [
      ...(/\bdesc\s*:/u.test(gallery(name, "text.ts") ?? "") ? [`${name}: gallery/text.ts が説明を持つ`] : []),
      ...(gallery(name, "desc.ts") === undefined ? [`${name}: gallery/desc.ts が無い`] : []),
    ]);
    expect(misplaced, "部品の説明の置き場").toEqual([]);
    // 説明の表は部品の頁だけが読む file に書き出し、最初の画面が読む一覧は説明を読まない
    const catalog = readFileSync(join(ROOT, "apps/playground-spa/src/catalog/blocks.gen.ts"), "utf8");
    expect(catalog, "最初の画面が読む一覧が説明を読む").not.toMatch(/gallery\/desc"|BLOCK_DESC/u);
    const { BLOCK_DESC } = (await import("../catalog/blocks-desc.gen")) as { BLOCK_DESC: Readonly<Record<string, Readonly<Record<"ja" | "en", unknown>>>> };
    const empty = ranked.flatMap(({ name }) =>
      (["ja", "en"] as const).filter((lang) => typeof BLOCK_DESC[name]?.[lang] !== "string" || String(BLOCK_DESC[name]?.[lang]).trim() === "").map((lang) => `${name}.${lang}`),
    );
    expect(empty, "説明の表に日本語か英語の説明が無いブロック").toEqual([]);
  });

  it("grammar-parts-table-from-blocks", async () => {
    // GRAMMAR.md の部品と使い方の表は、決まりの行を持つブロックの行をブロックの並びで並べた物と同じ
    const ranked = await rankedBlocks();
    const rules = BLOCK_RULE as Readonly<Record<string, unknown>>;
    const expected = ranked.flatMap((block) => (own<readonly { part: string; rule: string; name: string }[]>(rules, block.name) ?? []).map((row) => `| ${row.part} | ${row.rule} | ${row.name} |`));
    expect(expected.length, "決まりの行を持つブロックが無い").toBeGreaterThan(0);
    const rows = tableRows().slice(1);
    expect(rows, "GRAMMAR.md の部品と使い方の表の行 (見出しの後)").toEqual(expected);
  });
});
