/**
 * JSON 入口が知らない項目を誤りとして返すことの検証 (#1295)。
 *
 * これまで JSON 入口は **知らない項目を 1 つも弾かなかった**。 `animation` を `animations` と
 * 綴り違えた入力は検査を通り、段の無い図が出来て、書いた人には何も知らされない。
 *
 * 記法側は同じ入力を行番号付きの誤りとして返す (`unknown top-level key` /
 * `項目名が読めません`)。 入口によって扱いが変わる状態だった。
 *
 * 公開している JSON Schema は **全階層で `additionalProperties: false` を宣言している**。
 * parser が自分の契約に追いついていないだけで、新しい方針ではない。
 *
 * ## 一覧は 1 箇所から導く
 *
 * 受ける項目の一覧を型 / 検査 / schema の 3 箇所に手で置くと必ずどれかが古くなる。
 * 実装の表 (`ACCEPTED_KEYS`) を出どころにして、schema との一致を両方向で確かめる。
 */
import { describe, it, expect } from "vitest";
import { diagramJsonSchema, validateDragonJson } from "@cardenelabs/dragon";
import { ACCEPTED_KEYS, type 階層 } from "../src/json-parser";

const 図 = (o: Record<string, unknown> = {}) => ({
  title: "t",
  type: "flow",
  actors: [{ name: "A" }, { name: "B" }],
  flow: [{ from: "A", to: "B", label: "x" }],
  ...o,
});

/** 階層ごとに「知らない項目を 1 つ足した入力」 と、誤りが出るべき path */
const 未知を足す: Record<階層, { input: Record<string, unknown>; path: string }> = {
  root: { input: 図({ foo: 1 }), path: "$.foo" },
  actor: {
    input: 図({ actors: [{ name: "A", foo: 1 }, { name: "B" }] }),
    path: "$.actors[0].foo",
  },
  step: {
    input: 図({ flow: [{ from: "A", to: "B", label: "x", foo: 1 }] }),
    path: "$.flow[0].foo",
  },
  phase: { input: 図({ animation: [{ step: "s1", foo: 1 }] }), path: "$.animation[0].foo" },
  viewport: { input: 図({ viewport: { width: 800, foo: 1 } }), path: "$.viewport.foo" },
  lane: { input: 図({ lanes: { L1: { width: 300, foo: 1 } } }), path: "$.lanes.L1.foo" },
  group: {
    input: 図({ lanes: { L1: {} }, groups: { G1: { lanes: ["L1"], foo: 1 } } }),
    path: "$.groups.G1.foo",
  },
  actorNode: {
    input: 図({ actors: [{ name: "A", nodes: { header: { foo: 1 } } }, { name: "B" }] }),
    path: "$.actors[0].nodes.header.foo",
  },
  axes: {
    input: 図({ type: "quadrant", axes: { z: { left: "低" } } }),
    path: "$.axes.z",
  },
  axesX: {
    input: 図({ type: "quadrant", axes: { x: { left: "低", bottom: "小" } } }),
    path: "$.axes.x.bottom",
  },
  axesY: {
    input: 図({ type: "quadrant", axes: { y: { bottom: "小", left: "低" } } }),
    path: "$.axes.y.left",
  },
  layoutPos: {
    input: 図({ actors: [{ name: "A", pos: { x: 1, y: 2, z: 3 } }, { name: "B" }] }),
    path: "$.actors[0].pos.z",
  },
};

/** 階層ごとに、受ける項目 1 つずつに与える値 (「厳しくしすぎていない」 側の確認に使う) */
const 正しい値: Record<階層, Record<string, unknown>> = {
  root: {
    title: "t",
    type: "flow",
    eyebrow: "見出し",
    axes: { x: { left: "低", right: "高" } },
    actors: [{ name: "A" }, { name: "B" }],
    flow: [{ from: "A", to: "B", label: "x" }],
    states: { v: 1 },
    values: { w: "{v} + 1" },
    animation: [{ step: "s1" }],
    viewport: { width: 800 },
    lanes: { L1: { width: 300 } },
    groups: { G1: { lanes: ["L1"] } },
  },
  actor: {
    name: "A",
    kind: "storage",
    subtitle: "補足",
    eyebrow: "分類",
    value: "42",
    rows: ["ア"],
    lane: "L1",
    stack: 1,
    initial: true,
    final: true,
    tone: "success",
    color: "#ff0000",
    owner: "私",
    end: "Q2",
    touchpoint: "店頭",
    opportunity: "改善",
    posX: 10,
    posY: 20,
    posW: 30,
    posH: 40,
    nodes: { header: { posX: 1 } },
    scale: 2,
    state: { v: 1 },
    pos: { x: 1, y: 2 },
  },
  step: {
    from: "A",
    to: "B",
    label: "x",
    sub: "s",
    tone: "success",
    style: "solid",
    guard: "g",
    cardinality: "1..N",
    labelOffsetX: 1,
    labelOffsetY: 2,
    overlay: true,
    pos: { x: 1, y: 2 },
  },
  phase: {
    step: "s1",
    duration: 1.2,
    focus: ["A"],
    body: "説明",
    badge: "印",
    tween: { v: [0, 1] },
    set: { v: 2 },
  },
  viewport: {
    width: 800,
    height: 600,
    scale: 2,
    laneWidth: 200,
    gap: 10,
    laneGap: 20,
    nodeGap: 30,
    labelMargin: 4,
  },
  lane: { x: 10, width: 300, label: "縦列", contain: true, lifeline: true, pos: { x: 1, y: 2 } },
  group: { label: "群", lanes: ["L1"] },
  actorNode: { posX: 1, posY: 2, posW: 3, posH: 4 },
  axes: { x: { left: "低" }, y: { bottom: "小" } },
  axesX: { left: "低", right: "高" },
  axesY: { bottom: "小", top: "大" },
  layoutPos: { x: 1, y: 2 },
};

/** その階層に、受ける項目を 1 つだけ足した入力を組む */
function 正しい値で組む(層: 階層, key: string): Record<string, unknown> {
  const v = 正しい値[層][key];
  switch (層) {
    case "root":
      return 図({ [key]: v });
    case "actor":
      return 図({ actors: [{ name: "A", kind: "arc-gauge", [key]: v }, { name: "B" }] });
    case "step":
      return 図({ flow: [{ from: "A", to: "B", label: "x", [key]: v }] });
    case "phase":
      return 図({ states: { v: 0 }, animation: [{ step: "s1", [key]: v }] });
    case "viewport":
      return 図({ viewport: { [key]: v } });
    case "lane":
      return 図({ lanes: { L1: { [key]: v } } });
    case "group":
      return 図({ lanes: { L1: {} }, groups: { G1: { lanes: ["L1"], [key]: v } } });
    case "actorNode":
      return 図({ actors: [{ name: "A", nodes: { header: { [key]: v } } }, { name: "B" }] });
    case "axes":
      return 図({ type: "quadrant", axes: { [key]: v } });
    case "axesX":
      return 図({ type: "quadrant", axes: { x: { [key]: v } } });
    case "axesY":
      return 図({ type: "quadrant", axes: { y: { [key]: v } } });
    case "layoutPos":
      return 図({
        actors: [{ name: "A", pos: { x: 1, y: 2, [key]: v } }, { name: "B" }],
      });
  }
}

/** schema のどこに、その階層の項目が並んでいるか */
function schemaの項目(層: 階層): string[] {
  const s = diagramJsonSchema as unknown as Record<string, any>;
  const root = s.properties as Record<string, any>;
  const actor = root.actors.items.oneOf.find((o: any) => o.properties !== undefined).properties;
  const 場所: Record<階層, Record<string, unknown>> = {
    root,
    actor,
    step: root.flow.items.properties,
    phase: root.animation.items.properties,
    viewport: root.viewport.properties,
    lane: root.lanes.additionalProperties.properties,
    group: root.groups.additionalProperties.properties,
    actorNode: actor.nodes.additionalProperties.properties,
    axes: root.axes.properties,
    axesX: root.axes.properties.x.properties,
    axesY: root.axes.properties.y.properties,
    layoutPos: actor.pos.properties,
  };
  return Object.keys(場所[層]);
}

const 全階層 = Object.keys(ACCEPTED_KEYS) as 階層[];

describe("知らない項目を誤りとして返す (#1295)", () => {
  it("階層を 1 つ以上持っている", () => {
    // 持っていなければ、以下の走査は 1 件も回らずに通る
    expect(全階層.length, "階層が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("表の階層を全て試している", () => {
    const 抜け = 全階層.filter((層) => !(層 in 未知を足す) || !(層 in 正しい値));
    expect(抜け, "実装の表にあるのに試していない階層がある").toEqual([]);
  });

  for (const 層 of Object.keys(未知を足す) as 階層[]) {
    it(`${層} の知らない項目が誤りになる`, () => {
      const { input, path } = 未知を足す[層];
      const r = validateDragonJson(input);
      expect(r.ok, `${層} の知らない項目が通ってしまう`).toBe(false);
      if (r.ok) return;
      expect(r.errors.map((e) => e.path)).toContain(path);
    });
  }

  it("綴り違いは近い項目名を勧める", () => {
    // **「使える項目の一覧」 では区別が付かない**。 一覧にも `animation` は含まれるため、
    // 候補を出す経路を外しても `toContain("animation")` は通ってしまう (変異試験で実測)。
    // 勧める形そのものを見る
    const r = validateDragonJson(図({ animations: [{ step: "s1" }] }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.path === "$.animations");
    expect(e?.hint, "綴り違いの候補を勧めていない").toBe('"animation" のことですか');
  });

  it("遠い名前には候補を出さず、使える項目を並べる", () => {
    // 無関係な項目名を勧めると、書いた人がそちらへ直して二度手間になる
    const r = validateDragonJson(図({ 全く関係のない項目: 1 }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.path === "$.全く関係のない項目");
    expect(e?.hint).toContain("使える項目 = ");
    expect(e?.hint, "遠い名前に候補を勧めている").not.toContain("のことですか");
  });

  it("受ける項目は 1 つずつ通る (厳しくしすぎていない)", () => {
    let 測れた = 0;
    const 落ちた: string[] = [];
    for (const 層 of 全階層) {
      for (const key of ACCEPTED_KEYS[層]) {
        測れた += 1;
        const r = validateDragonJson(正しい値で組む(層, key));
        if (!r.ok) 落ちた.push(`${層}.${key}: ${r.errors.map((e) => e.path).join(",")}`);
      }
    }
    const 総数 = 全階層.reduce((n, 層) => n + ACCEPTED_KEYS[層].length, 0);
    expect(測れた, "項目を 1 つも測れていない (検査が空振りしている)").toBe(総数);
    expect(落ちた, "受けるはずの項目が誤りになる").toEqual([]);
  });

  it("値の表が受ける項目を全て覆っている", () => {
    const 覆えていない: string[] = [];
    for (const 層 of 全階層) {
      for (const key of ACCEPTED_KEYS[層]) {
        if (!(key in 正しい値[層])) 覆えていない.push(`${層}.${key}`);
      }
    }
    expect(覆えていない, "受ける項目に値を用意していない").toEqual([]);
  });
});

describe("parser と JSON Schema が同じ項目を持つ (#1295)", () => {
  it("階層ごとに両方向で一致する", () => {
    const 食い違い: string[] = [];
    let 測れた = 0;
    for (const 層 of 全階層) {
      測れた += 1;
      const 実装 = [...ACCEPTED_KEYS[層]].sort();
      const schema = schemaの項目(層).sort();
      const 実装だけ = 実装.filter((k) => !schema.includes(k));
      const schemaだけ = schema.filter((k) => !実装.includes(k));
      if (実装だけ.length > 0) 食い違い.push(`${層}: parser だけが受ける = ${実装だけ.join(", ")}`);
      if (schemaだけ.length > 0)
        食い違い.push(`${層}: schema だけが宣言 = ${schemaだけ.join(", ")}`);
    }
    expect(測れた, "階層を 1 つも測れていない (検査が空振りしている)").toBe(全階層.length);
    expect(食い違い, "parser と schema が別の項目を持つ").toEqual([]);
  });
});

describe("何も起きない項目を受けない (#1295)", () => {
  it("layout は誤りになる", () => {
    // `layout` は JSON にだけあり、記法には無く、適用する側も無い (`doc.layout` を読む場所が
    // 1 つも無い)。 検査を通るのに何も起きない = 本 Issue が塞ぐ形そのものなので受けない
    const r = validateDragonJson(図({ layout: "manual" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.layout");
  });
});

describe("viewport の型を見る (#1295)", () => {
  const 誤り = [
    { name: "width が数でない", input: { width: "x" }, path: "$.viewport.width" },
    { name: "scale が有限でない", input: { scale: Number.NaN }, path: "$.viewport.scale" },
    { name: "viewport が object でない", input: 1, path: "$.viewport" },
  ];
  for (const c of 誤り) {
    it(c.name, () => {
      const r = validateDragonJson(図({ viewport: c.input }));
      expect(r.ok, `${c.name} が通ってしまう`).toBe(false);
      if (r.ok) return;
      expect(r.errors.map((e) => e.path)).toContain(c.path);
    });
  }
});
