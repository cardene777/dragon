/**
 * 原本の版2 (#3346)。
 *
 * 版2の原本は、図の宣言を `blocks` の中にブロックの名前ごとの欄で持つ (`blocks.box`、`blocks.group` など)。段の書き方は版1と同じ。
 * 版1の原本を読むと版2へ移して警告を返し、`migrateFile` は版1の file を版2の形に書き換える。
 * 形の検査は、骨組みと各ブロックの形の欠片を build の時に束ねて書き出す。
 *
 * 版1の原本は `fixtures/version-1/` に図の種類ごとに置く。版2を足す前の読む処理が見本の記法から作った物で、
 * 見本の原本 (`examples/*.json`) を版2へ書き換えた後も、版1を読む検査の入力として残す。
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrateFile } from "@cardenelabs/dragon/node";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { BLOCKS } from "../src/blocks/index";
import { api } from "./diagram-support";

type Obj = Record<string, unknown>;

const VERSION_1 = join(__dirname, "fixtures/version-1");
const KINDS = readdirSync(VERSION_1)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.slice(0, -".json".length))
  .sort();
const version1 = (kind: string): Obj => JSON.parse(readFileSync(join(VERSION_1, `${kind}.json`), "utf8")) as Obj;

/** 版2の原本の根の欄。これ以外を持たない */
const ROOT_FIELDS = ["version", "kind", "title", "view", "blocks", "steps"];

/** 版1の欄から版2の `blocks` の欄への移し先。図の種類の欄の中の欄は `<種類の欄>.<欄>` で書く */
const MOVED: [string, string][] = [
  ["regions", "group"],
  ["boxes", "box"],
  ["strip", "strip"],
  ["state.paths", "path"],
  ["git.branches", "branch"],
  ["time.scale", "scale"],
  ["time.period", "period"],
  ["time.rows", "row"],
  ["time.points", "point"],
  ["time.zoom", "zoom"],
  ["lineup.items", "item"],
];

const at = (source: Obj, path: string): unknown => path.split(".").reduce<unknown>((value, key) => (value as Obj | undefined)?.[key], source);

/** 版1の原本を移した時に `blocks` が持つべき欄。空の並びは書かない */
function expectedBlocks(source: Obj): Obj {
  const blocks: Obj = {};
  for (const [from, to] of MOVED) {
    const value = at(source, from);
    if (value === undefined || (Array.isArray(value) && value.length === 0)) continue;
    blocks[to] = value;
  }
  return blocks;
}

const pointers = (result: { ok: boolean; errors?: { pointer: string }[] }): string[] => (result.ok ? [] : (result.errors ?? []).map((error) => error.pointer));

describe("原本の版2 (#3346)", () => {
  it("read-version-1-upgrades-to-blocks", () => {
    // 版1の原本を読むと、図の宣言を blocks のブロックの名前ごとの欄へ移した版2になり、版1を移したことを警告で返す
    const read = api("readDiagram");
    expect(KINDS, "版1の原本の見本").toEqual(["architecture", "git", "lineup", "sequence", "state", "time", "tree"]);
    for (const kind of KINDS) {
      const source = version1(kind);
      const result = read(source);
      expect(result.ok, `${kind}: 版1の原本を読めない`).toBe(true);
      if (!result.ok) continue;
      const diagram = result.diagram as Obj;
      expect(diagram.version, `${kind}: 版2へ移していない`).toBe(2);
      expect(Object.keys(diagram).filter((key) => !ROOT_FIELDS.includes(key)), `${kind}: 版2の根に無い欄`).toEqual([]);
      expect(diagram.blocks, `${kind}: blocks の欄`).toEqual(expectedBlocks(source));
      expect(diagram.steps, `${kind}: 段`).toEqual(source.steps);
      expect(result.warnings.length, `${kind}: 版1を移した警告の数`).toBe(1);
      expect(result.warnings[0], `${kind}: 警告が移した版を示さない`).toMatch(/1.*2/u);
    }
  });

  it("version-2-draws-same-svg-as-version-1", () => {
    // 版1を移した版2を描いた SVG は、版1を描いた SVG と1字も変わらない (図の id も変わらない)
    const read = api("readDiagram");
    for (const kind of KINDS) {
      const source = version1(kind);
      const result = read(source);
      expect(result.ok && (result.diagram as Obj).version, `${kind}: 版2へ移していない`).toBe(2);
      if (!result.ok) continue;
      expect(dragon.renderDiagram(result.diagram).svg === dragon.renderDiagram(source).svg, `${kind}: 版1と版2で SVG が違う`).toBe(true);
    }
  });

  it("read-version-1-errors-point-at-version-1-fields", () => {
    // 版1の原本の誤りは、版1の欄の場所で返す
    const read = api("readDiagram");
    const architecture = structuredClone(version1("architecture")) as { regions: Obj[]; boxes: Obj[] };
    (architecture.regions[0] as Obj).name = "";
    (architecture.boxes[1] as Obj).color = "pink";
    const git = structuredClone(version1("git")) as { git: { branches: Obj[] } };
    (git.git.branches[0] as Obj).note = "";
    const time = structuredClone(version1("time")) as { time: { rows: Obj[]; scale: Obj } };
    (time.time.rows[0] as Obj).color = "pink";
    time.time.scale.length = "12 seconds";
    expect(pointers(read(architecture))).toEqual(["/regions/0/name", "/boxes/1/color"]);
    expect(pointers(read(git))).toEqual(["/git/branches/0/note"]);
    expect(pointers(read(time)).sort()).toEqual(["/time/rows/0/color", "/time/scale/length"]);
  });

  it("version-2-refuses-block-of-other-kind", () => {
    // 版2の原本で、図の種類が書けないブロックの欄を書くと、その欄の場所と書ける図の種類を示して断る
    const read = api("readDiagram");
    const sequence = { version: 2, kind: "sequence", title: "t", blocks: { box: [{ id: "a", name: "A" }], branch: [{ id: "main" }] }, steps: [{ title: "s", body: "b", events: [] }] };
    const git = { version: 2, kind: "git", title: "t", blocks: { group: [{ id: "g", name: "G" }], branch: [{ id: "main" }] }, steps: [{ title: "s", body: "b", events: [] }] };
    const refused = read(sequence);
    expect(pointers(refused)).toEqual(["/blocks/branch"]);
    expect(refused.ok ? "" : (refused.errors[0]?.message ?? ""), "書ける図の種類を示さない").toContain("git");
    expect(pointers(read(git))).toEqual(["/blocks/group"]);
  });
});

describe("原本の file を版2へ移す (#3346)", () => {
  it("migrate-file-writes-version-2", async () => {
    // 版1の file を、版2の形の JSON (2 字の字下げと末尾の改行) に書き換える
    const dir = mkdtempSync(join(tmpdir(), "dragon-migrate-v2-"));
    try {
      for (const kind of KINDS) {
        const file = join(dir, `${kind}.json`);
        const source = version1(kind);
        writeFileSync(file, `${JSON.stringify(source, null, 2)}\n`);
        await expect(migrateFile(file), `${kind}: 移した結果`).resolves.toEqual({ changed: true, from: 1, to: 2 });
        const text = readFileSync(file, "utf8");
        const written = JSON.parse(text) as Obj;
        expect(written.version, `${kind}: 書き換えた版`).toBe(2);
        expect(written.blocks, `${kind}: 書き換えた blocks`).toEqual(expectedBlocks(source));
        expect(text, `${kind}: 書き換えた file の書き方`).toBe(`${JSON.stringify(written, null, 2)}\n`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("migrate-file-leaves-version-2", async () => {
    // 版2の file には触れない
    const dir = mkdtempSync(join(tmpdir(), "dragon-migrate-v2-"));
    try {
      const file = join(dir, "sequence.json");
      const text = `${JSON.stringify({ version: 2, kind: "sequence", title: "t", blocks: { box: [{ id: "a", name: "A" }] }, steps: [{ title: "s", body: "b", events: [] }] }, null, 2)}\n`;
      writeFileSync(file, text);
      await expect(migrateFile(file)).resolves.toEqual({ changed: false, from: 2, to: 2 });
      expect(readFileSync(file, "utf8")).toBe(text);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("形の検査を束ねて書き出す (#3346)", () => {
  it("validator-built-from-block-shapes", async () => {
    // 書き出した形と検査の関数は、骨組みとブロックの形の欠片を束ねた物で、ブロックの形を変えると書き出す形も変わる
    const builder = (await import("../scripts/build-validator.mjs")) as unknown as {
      generate: (blocks?: unknown) => { schema?: string; validator?: string };
      SCHEMA?: string;
      OUT: string;
    };
    const written = builder.generate();
    expect(typeof written.schema, "書き出す形が無い").toBe("string");
    expect(typeof builder.SCHEMA, "形を書き出す先が無い").toBe("string");
    expect(written.schema === readFileSync(builder.SCHEMA ?? "", "utf8"), "書き出した形を書き出し直していない").toBe(true);
    expect(written.validator === readFileSync(builder.OUT, "utf8"), "書き出した検査の関数を書き出し直していない").toBe(true);

    const schema = JSON.parse(written.schema ?? "{}") as { definitions: Obj; properties: { blocks: { properties: Obj } } };
    const blocks = BLOCKS as unknown as Record<string, { shape: { definitions?: Obj; field?: unknown } | { none: string } }>;
    for (const [name, block] of Object.entries(blocks)) {
      if ("none" in block.shape) continue;
      for (const [key, value] of Object.entries(block.shape.definitions ?? {})) expect(schema.definitions[key], `${name} の形の欠片 ${key}`).toEqual(value);
      if (block.shape.field !== undefined) expect(schema.properties.blocks.properties[name], `${name} の blocks の欄`).toEqual(block.shape.field);
    }

    const box = blocks.box?.shape as { definitions: { box: Obj } };
    const changed = { ...blocks, box: { ...blocks.box, shape: { ...box, definitions: { ...box.definitions, box: { ...box.definitions.box, required: ["id"] } } } } };
    const other = JSON.parse(builder.generate(changed).schema ?? "{}") as { definitions: { box: { required: unknown } } };
    expect(other.definitions.box.required, "ブロックの形を変えても書き出す形が変わらない").toEqual(["id"]);
  });
});
