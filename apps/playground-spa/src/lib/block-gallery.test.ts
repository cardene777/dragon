/**
 * ブロックの見本帳の分のうち、頁の外の文書と棚に照らす分 (#3345)。
 *
 * `docs/design/base/GRAMMAR.md` の部品と使い方の表は人が読む文書で、ブロックの置き場の `gallery/rule.ts` が同じ行を写して持つ。
 * 編集画面の棚の部品の名前は `gallery/shelf.ts` が棚の部品の id ごとに持つ。
 * 写した行が表の行と食い違った時と、棚に無い部品の id を名乗った時に落とす。
 * 見る関数はこの file が持ち、正しい分に当てて通ることと、崩した分に当てて名指すことの両方を確かめる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLOCK_RULE } from "../catalog/blocks-docs.gen";
import { BLOCK_SHELF } from "../catalog/blocks.gen";
import { PART_IDS } from "../editor/shelf-items";

type Rule = { none: string } | readonly { part: string; rule: string; name: string }[];
type Shelf = { none: string } | Readonly<Record<string, unknown>>;

const GRAMMAR = join(__dirname, "../../../../docs/design/base/GRAMMAR.md");
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
