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
import { EDGE_SIDE_VALUES } from "../src/v05/parser";
// 欄 1 つだけを差し替えた入力の組み立ては、値の型の検査 (#1304) と共通の 1 箇所が持つ。
// 別々に持つと、階層が増えた時に片方だけが古くなる
import { 図, 欄に値を置く } from "./support/json-field-input";

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
  posRel: {
    input: 図({
      actors: [{ name: "A", posRel: { anchor: "B", dir: "right", z: 3 } }, { name: "B" }],
    }),
    path: "$.actors[0].posRel.z",
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
    // 値を見せる部品 (#1374)
    readouts: [{ id: "r", kind: "percent-ring", source: "v", max: 100 }],
    inputs: [{ id: "i", kind: "slider", min: 0, max: 100, defaultValue: 50 }],
    // 項目を 1 つずつ単独で測るため、別項目の inputs に依存しない式にする
    formulas: { doubled: "2" },
    events: [{ on: "click", box: "A", handler: "toggle" }],
    scrolls: { intro: { start: 0.9, end: 0.1 } },
    // 順序図で面が動いている間の帯 (#1466)
    bands: [{ actor: "A", from: 0, to: 0 }],
    // 矢印をいつ出すか (#1470)
    reveal: "all",
    relations: "hover",
    direction: "horizontal",
    // 図の配色 (#1553)
    palette: "celadon",
  },
  actor: {
    name: "A",
    kind: "storage",
    subtitle: "補足",
    eyebrow: "分類",
    value: "42",
    previous: "38",
    rows: ["ア"],
    // 行頭の印 (#1466)。 行と同じ数だけ並べる
    marks: ["pk"],
    // 相対で置く指定 (#2039)。 基準は 2 つ目の箱にする
    posRel: { anchor: "B", dir: "right", gap: 200 },
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
    scale: 2,
    // 見本が持つ段を使うか (#2125)
    phase: false,
    state: { v: 1 },
    pos: { x: 1, y: 2 },
    // 箱の中に描く図形 (#1374)
    shape: { kind: "wave", level: 50, amplitude: 100 },
    // その箱を出すかどうかの条件 (#1381)
    visibleIf: "{flag}",
    // 箱に出す題 (#1381)
    title: "題",
    // 値に追随する 5 欄 (#1392)
    wBind: "{barW}",
    hBind: "{barH}",
    opacity: 0.5,
    renderOffsetX: 10,
    renderOffsetY: "{dy}",
  },
  step: {
    from: "A",
    to: "B",
    label: "x",
    sub: "s",
    // クラス図の出どころ側の多重度 (#1771)
    tailSub: "1",
    tone: "success",
    style: "solid",
    guard: "g",
    // 値に追随する 3 欄 (#1396)
    widthBind: "{flow}",
    strokeBind: "{hue}",
    dashOffsetBind: "{dash}",
    // 矢印がどの辺から出るか (#1385)
    side: "left",
    head: "triangle",
    // 端の印の残り 3 欄と、関係の語 / 言づての種類 (#1466)
    tailHead: "diamond",
    headFill: "hollow",
    tailHeadFill: "solid",
    relation: "extends",
    // 辺の役目と名前の下地 (cdl#618)
    role: "main",
    labelPlate: false,
    kind: "call",
    cardinality: "1..N",
    labelOffsetX: 1,
    labelOffsetY: 2,
    overlay: true,
    pos: { x: 1, y: 2 },
    // 部品の端で繋ぐ要素の id (#1979)
    fromPartNode: "rC",
    toPartNode: "gC",
  },
  phase: {
    step: "s1",
    duration: 1.2,
    focus: ["A"],
    body: "説明",
    badge: "印",
    tween: { v: [0, 1] },
    set: { v: 2 },
    draw: "line",
    drawRatio: 0.4,
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
  axes: { x: { left: "低" }, y: { bottom: "小" } },
  axesX: { left: "低", right: "高" },
  axesY: { bottom: "小", top: "大" },
  layoutPos: { x: 1, y: 2 },
  posRel: { anchor: "B", dir: "right", gap: 200 },
};

/** その階層に、受ける項目を 1 つだけ足した入力を組む */
function 正しい値で組む(層: 階層, key: string): Record<string, unknown> {
  return 欄に値を置く(層, key, 正しい値[層][key]);
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
    axes: root.axes.properties,
    axesX: root.axes.properties.x.properties,
    axesY: root.axes.properties.y.properties,
    layoutPos: actor.pos.properties,
    posRel: actor.posRel.properties,
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

  it("矢印の side は描画側が受ける 4 値だけを通す", () => {
    const r = validateDragonJson(
      図({ flow: [{ from: "A", to: "B", label: "x", side: "diagonal" }] }),
    );
    expect(r.ok, "知らない辺が runtime validator を通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.flow[0].side");

    const sideSchema = (diagramJsonSchema as any).properties.flow.items.properties.side;
    expect(sideSchema.enum, "公開 schema と runtime validator の値が違う").toEqual([
      ...EDGE_SIDE_VALUES,
    ]);
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
      const 実装: string[] = [...ACCEPTED_KEYS[層]].sort();
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

  it("箱の中の要素ごとの位置 (nodes) は誤りになる (#1976)", () => {
    // どの図種も `{名前}-{要素名}` の箱を作らず、書くと必ず「当たらない」 と知らせるだけの欄だった。
    // 欄ごと外したので、中身の形に依らず `nodes` そのものを知らない項目として返す
    for (const nodes of [{ header: { posX: 1, posY: 2 } }, { header: { foo: 1 } }, 1]) {
      const r = validateDragonJson(図({ actors: [{ name: "A", nodes }, { name: "B" }] }));
      expect(r.ok, `nodes = ${JSON.stringify(nodes)} が通ってしまう`).toBe(false);
      if (r.ok) continue;
      expect(r.errors.map((e) => e.path)).toEqual(["$.actors[0].nodes"]);
    }
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
