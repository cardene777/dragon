import { existsSync } from "node:fs";

import {
  CLASS_RELATION_LOOK,
  classDiagram,
  type ClassRelationType,
  type CdlEdge,
} from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";

import { compileToCdl } from "../src/compile";
import { PRESET_NAMES } from "../src/keywords";
import { validateDragonJson } from "../src/json-parser";
import type { DslActor, DslDocument, DslStep } from "../src/types";
import { parseTextDslV05, PRESET_TYPES, TYPE_ALIASES } from "../src/v05/parser";

const actor = (name: string): DslActor => ({
  name,
  kind: "actor",
  pos: { line: 1 },
});

const step = (over: Partial<DslStep> = {}): DslStep => ({
  no: 1,
  from: "Child",
  to: "Parent",
  label: "関係",
  pos: { line: 1 },
  ...over,
});

const 文書 = (flow: DslStep[]): DslDocument => ({
  title: "関係の図",
  type: "record",
  actors: [actor("Child"), actor("Parent")],
  flow,
  pos: { line: 1 },
});

const 見た目の欄 = (edge: CdlEdge) => ({
  tone: edge.tone,
  style: edge.style,
  head: edge.head,
  headFill: edge.headFill,
  tailHead: edge.tailHead,
  tailHeadFill: edge.tailHeadFill,
});

const 関係の種類 = Object.keys(CLASS_RELATION_LOOK) as ClassRelationType[];

describe("class を record に畳む (#2783)", () => {
  it("記法が配る図種と別名に class が無い", () => {
    expect(PRESET_NAMES).not.toContain("class");
    expect(PRESET_TYPES.has("class" as never)).toBe(false);
    expect(TYPE_ALIASES.has("class")).toBe(false);
  });

  it("type: class は読めない図種として知らせる", () => {
    const result = parseTextDslV05(`title: "古い型"
type: class

actors:
  - A
  - B

flow:
  - A -> B: "つなぐ"
`);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((error) => error.message.includes("図種が読めません"))).toBe(true);
  });

  it("JSON の type: class も読めない図種として知らせる", () => {
    const result = validateDragonJson({
      title: "古い型",
      type: "class",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "つなぐ" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((error) => error.path === "$.type")).toBe(true);
  });

  it("class 専用の組み立て経路が残っていない", () => {
    expect(existsSync(new URL("../src/compile/class.ts", import.meta.url))).toBe(false);
  });
});

describe("record の関係の意匠 (#2783)", () => {
  it.each(関係の種類)("%s が classDiagram と同じ線と端になる", (relation) => {
    const expected = classDiagram({ id: "expected", topic: "expected" })
      .class({ id: "Child", title: "Child" })
      .class({ id: "Parent", title: "Parent" })
      .relation({ from: "Child", to: "Parent", type: relation, label: "関係" })
      .build().edges[0];
    const actual = compileToCdl(文書([step({ relation })])).edges[0];

    expect(expected, "比較する classDiagram の矢印が無い").toBeDefined();
    expect(actual, "record の矢印が無い").toBeDefined();
    expect(見た目の欄(actual!)).toEqual(見た目の欄(expected!));
  });

  it("relation 付きの sub / tailSub は両端の多重度になる", () => {
    const edge = compileToCdl(
      文書([step({ relation: "aggregates", sub: "1..*", tailSub: "1" })]),
    ).edges[0];

    expect(edge).toBeDefined();
    expect(edge?.headLabel).toBe("1..*");
    expect(edge?.tailLabel).toBe("1");
    expect(edge?.sub).toBeUndefined();
  });

  it("relation の無い sub はこれまでどおり名前の下の行になる", () => {
    const edge = compileToCdl(文書([step({ sub: "補足" })])).edges[0];

    expect(edge).toBeDefined();
    expect(edge?.sub).toBe("補足");
    expect(edge?.headLabel).toBeUndefined();
  });

  it("record 以外では relation があっても sub は名前の下の行のまま", () => {
    const edge = compileToCdl({
      ...文書([step({ relation: "aggregates", sub: "補足" })]),
      type: "flow",
    }).edges[0];

    expect(edge).toBeDefined();
    expect(edge?.sub).toBe("補足");
    expect(edge?.headLabel).toBeUndefined();
  });
});

describe("record の行頭の印 (#2783)", () => {
  it("公開と非公開の持ち物・振る舞いが classDiagram と同じ形と並びになる", () => {
    const expected = classDiagram({ id: "expected", topic: "expected" })
      .class({
        id: "Account",
        title: "Account",
        attributes: ["+name: string", "-secret: string"],
        methods: ["+login(): Session", "-hash(): string"],
      })
      .build().nodes[0];
    const result = parseTextDslV05(`title: "行頭の印"
type: record

actors:
  - Account: { rows: ["name: string", "secret: string", "login: Session", "hash: string"], marks: ["", "条件", "外", "外 条件"] }

flow:
`);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const actual = compileToCdl(result.doc).nodes[0];

    expect(actual?.rows).toEqual(expected?.rows);
    expect(actual?.rowMarks).toEqual(expected?.rowMarks);
  });
});
