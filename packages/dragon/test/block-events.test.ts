/**
 * ブロックが持つ段の中で起きること (#3345)。
 *
 * 段の中で起きることの形は 1 つの schema (`src/schemas/diagram.schema.json`) の `definitions.event` の `oneOf` が持ち、
 * ブロックは自分の出来事の種類の枝を写して持つ (`block.ts` の `shape.events`)。
 * 写しが schema の枝と食い違った時と、1 つの種類を 2 つのブロックが持つ時と、形を持つ種類を書き戻す処理が無い時に落とす。
 * 見る関数はこの file が持ち、正しい一覧に当てて通ることと、崩した一覧に当てて名指すことの両方を確かめる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface Block {
  shape: { none: string } | { events?: Record<string, unknown> };
  print: { none: string } | { events?: Record<string, unknown> };
}

const SCHEMA = join(__dirname, "../src/schemas/diagram.schema.json");

/** schema の段の中で起きることの枝を、出来事の種類で引く表 */
function schemaEvents(): Record<string, unknown> {
  const schema = JSON.parse(readFileSync(SCHEMA, "utf8")) as { definitions: { event: { oneOf: { properties: { type: { const: string } } }[] } } };
  return Object.fromEntries(schema.definitions.event.oneOf.map((branch) => [branch.properties.type.const, branch]));
}

const eventShapes = (block: Block): Record<string, unknown> => ("none" in block.shape ? {} : (block.shape.events ?? {}));
const eventPrinters = (block: Block): Record<string, unknown> => ("none" in block.print ? {} : (block.print.events ?? {}));

/** schema の枝と違う写しと、schema に無い種類の写しを `<ブロック>.<種類>` で返す */
export function eventShapeProblems(blocks: Record<string, Block>, events: Record<string, unknown>): string[] {
  return Object.entries(blocks).flatMap(([name, block]) =>
    Object.entries(eventShapes(block))
      .filter(([type, shape]) => events[type] === undefined || JSON.stringify(events[type]) !== JSON.stringify(shape))
      .map(([type]) => `${name}.${type}`),
  );
}

/** 2 つ以上のブロックが形を持つ出来事の種類と、形を持つのに書き戻す処理の無い種類 */
export function eventOwnerProblems(blocks: Record<string, Block>): string[] {
  const owners = new Map<string, string[]>();
  for (const [name, block] of Object.entries(blocks)) for (const type of Object.keys(eventShapes(block))) owners.set(type, [...(owners.get(type) ?? []), name]);
  const shared = [...owners].filter(([, names]) => names.length > 1).map(([type, names]) => `${type}: ${names.join(", ")}`);
  const unprinted = Object.entries(blocks).flatMap(([name, block]) =>
    Object.keys(eventShapes(block))
      .filter((type) => eventPrinters(block)[type] === undefined)
      .map((type) => `${name}.${type}: 書き戻す処理が無い`),
  );
  return [...shared, ...unprinted];
}

describe("ブロックが持つ段の中で起きること (#3345)", () => {
  it("block-event-shape-matches-schema", async () => {
    const { BLOCKS } = (await import("../src/blocks/index")) as unknown as { BLOCKS: Record<string, Block> };
    const events = schemaEvents();
    const owned = Object.values(BLOCKS).flatMap((block) => Object.keys(eventShapes(block)));
    expect(owned.length, "段の中で起きることの形を持つブロックが無い").toBeGreaterThan(0);
    expect(eventShapeProblems(BLOCKS, events), "schema と違う出来事の形の写し").toEqual([]);
    expect(eventOwnerProblems(BLOCKS), "出来事の種類の持ち主と書き戻す処理").toEqual([]);
  });

  it("block-event-check-flags-broken-blocks", () => {
    const events = { a: { properties: { type: { const: "a" } } } };
    const good: Block = { shape: { events: { a: events.a } }, print: { events: { a: () => "" } } };
    expect(eventShapeProblems({ good }, events)).toEqual([]);
    expect(eventOwnerProblems({ good })).toEqual([]);
    const changed: Block = { shape: { events: { a: { properties: {} } } }, print: { events: { a: () => "" } } };
    const unknown: Block = { shape: { events: { b: {} } }, print: { events: { b: () => "" } } };
    expect(eventShapeProblems({ changed, unknown }, events)).toEqual(["changed.a", "unknown.b"]);
    const silent: Block = { shape: { events: { a: events.a } }, print: { none: "-" } };
    expect(eventOwnerProblems({ good, silent })).toEqual(["a: good, silent", "silent.a: 書き戻す処理が無い"]);
  });
});
