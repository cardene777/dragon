import { describe, it, expect } from "vitest";
import { textDslToDiagram, jsonToDiagram, validateDragonJson } from "../src";
import { 部品の表 } from "../src/v05/parser";

/**
 * #1381 で記法に足した 3 つの検証。
 *
 * | 足したもの | なぜ要ったか |
 * |---|---|
 * | 部品 7 種 | 部品の表が 9 種しか持たず、見本帳の 10 件が書けなかった |
 * | `visibleIf:` | 場所だけを空ける見えない箱を書けず、7 件が書けなかった |
 * | `title:` | 同じ題の箱を並べる図と、題を持たない箱を、名前と切り離せなかった |
 *
 * どれも「書いたのに図に出ない」 形で表に出るため、読めない書き方を黙って捨てないことも
 * 合わせて見る。
 */

const 図にする = (中身: string) =>
  textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  st: "online"
  v: 10

${中身}

animation:
  - step: "p" 1s
`);

const 誤り = (中身: string): string[] => {
  try {
    図にする(中身);
    return [];
  } catch (e) {
    return String((e as Error).message).split("\n");
  }
};

describe("部品 7 種を読む (#1381)", () => {
  const 見本: readonly [string, string, Record<string, unknown>][] = [
    [
      "donut",
      '  d: { kind: donut, source: v, viewW: 200, viewH: 180, colors: ["#4e9dc4", "#22c55e"], innerRatio: 0.6, label: "内訳" }',
      {
        id: "d",
        kind: "donut",
        source: "v",
        viewW: 200,
        viewH: 180,
        colors: ["#4e9dc4", "#22c55e"],
        innerRatio: 0.6,
        label: "内訳",
      },
    ],
    [
      "radar",
      '  r: { kind: radar, source: v, max: 100, viewW: 200, viewH: 200, color: "#4e9dc4", labelSource: "ax", label: "5 軸" }',
      {
        id: "r",
        kind: "radar",
        source: "v",
        max: 100,
        viewW: 200,
        viewH: 200,
        color: "#4e9dc4",
        labelSource: "ax",
        label: "5 軸",
      },
    ],
    [
      "step-progress",
      '  sp: { kind: step-progress, source: v, stepsSource: steps, color: "#2563eb", label: "工程" }',
      {
        id: "sp",
        kind: "step-progress",
        source: "v",
        stepsSource: "steps",
        color: "#2563eb",
        label: "工程",
      },
    ],
    [
      "status-dot",
      '  dot: { kind: status-dot, source: st, map: [{ value: "online", color: "#22c55e", label: "在席" }, { value: "away", color: "#f59e0b" }], label: "状態" }',
      {
        id: "dot",
        kind: "status-dot",
        source: "st",
        map: [
          { value: "online", color: "#22c55e", label: "在席" },
          { value: "away", color: "#f59e0b" },
        ],
        label: "状態",
      },
    ],
    [
      "notification",
      '  n: { kind: notification, kindSource: nk, titleSource: nt, bodySource: nb, label: "通知" }',
      {
        id: "n",
        kind: "notification",
        kindSource: "nk",
        titleSource: "nt",
        bodySource: "nb",
        label: "通知",
      },
    ],
    [
      "kpi-card",
      '  k: { kind: kpi-card, source: v, historySource: h, comparisonSource: c, unit: " 件", colorPos: "#22c55e", colorNeg: "#dc2626", label: "売上" }',
      {
        id: "k",
        kind: "kpi-card",
        source: "v",
        historySource: "h",
        comparisonSource: "c",
        unit: " 件",
        colorPos: "#22c55e",
        colorNeg: "#dc2626",
        label: "売上",
      },
    ],
    [
      "status-timeline",
      '  stl: { kind: status-timeline, source: evt, colorMap: [{ status: "active", color: "#22c55e" }], max: 8, label: "推移" }',
      {
        id: "stl",
        kind: "status-timeline",
        source: "evt",
        colorMap: [{ status: "active", color: "#22c55e" }],
        max: 8,
        label: "推移",
      },
    ],
  ];

  it.each(見本)("%s が書ける", (_名, 行, 期待) => {
    const d = 図にする(`readouts:\n${行}`);
    expect(d.readouts).toEqual([期待]);
  });

  it("7 種すべてを見ている (検査が空振りしていない)", () => {
    const 見た = new Set(見本.map(([名]) => 名));
    expect(見た.size, "同じ種類を 2 度書いている").toBe(見本.length);
    for (const 名 of 見た) {
      expect(部品の表[名], `${名} が部品の表に無い`).toBeDefined();
    }
  });

  it("知らない種類は誤りになる", () => {
    const e = 誤り("readouts:\n  x: { kind: sunburst, source: v }");
    expect(e.join("\n")).toContain("部品の種類が読めません");
  });

  it("知らない欄は誤りになる", () => {
    const e = 誤り("readouts:\n  d: { kind: donut, source: v, thickness: 3 }");
    expect(e.join("\n")).toContain("thickness");
  });

  it("足りない必須の欄は誤りになる", () => {
    const e = 誤り("readouts:\n  k: { kind: kpi-card, source: v }");
    expect(e.join("\n")).toContain("historySource");
    expect(e.join("\n")).toContain("comparisonSource");
  });
});

describe("組の並びの欄 (#1381)", () => {
  it("中括弧を含む並びが割れる", () => {
    const d = 図にする(
      'readouts:\n  dot: { kind: status-dot, source: st, map: [{ value: "a", color: "#111" }, { value: "b", color: "#222" }] }',
    );
    expect((d.readouts?.[0] as { map: unknown[] }).map).toHaveLength(2);
  });

  it("数で書いた値は数として読む", () => {
    const d = 図にする(
      'readouts:\n  dot: { kind: status-dot, source: st, map: [{ value: "a", color: "#111", weight: 3 }] }',
    );
    expect((d.readouts?.[0] as { map: Record<string, unknown>[] }).map[0]!.weight).toBe(3);
  });

  const 読めない: readonly [string, string][] = [
    ["中括弧が無い", "[a, b]"],
    ["閉じていない", '[{ value: "a" ]'],
    ["中括弧の外に値がある", '[a, { value: "b" }]'],
    // 組の中身は葉だけを取る。 入れ子を許すと値が中括弧のままの文字列になる
    ["中括弧が入れ子", "[{ a: { b: 1 } }]"],
    ["閉じた後に中括弧が続く", "[{}{]"],
    ["空の並び", "[]"],
    ["中身が空の組", "[{}]"],
    ["並びですらない", '"online"'],
  ];

  it.each(読めない)("%s は誤りになる", (_名, 値) => {
    const e = 誤り(`readouts:\n  dot: { kind: status-dot, source: st, map: ${値} }`);
    expect(e.length, "誤りが 1 件も出ていない").toBeGreaterThan(0);
    expect(e.join("\n")).toContain("map");
  });
});

describe("箱を出す条件 (#1381)", () => {
  it("書いた条件がそのまま箱に渡る", () => {
    const d = 図にする('actors:\n  - 場所取り: { kind: card, lane: l, stack: 0, visibleIf: "0" }');
    expect(d.nodes[0]!.visibleIf).toBe("0");
  });

  it("状態を差し込める", () => {
    const d = 図にする('actors:\n  - A: { kind: card, lane: l, stack: 0, visibleIf: "{v}" }');
    expect(d.nodes[0]!.visibleIf).toBe("{v}");
  });

  it("書かなければ欄が付かない", () => {
    const d = 図にする("actors:\n  - A: { kind: card, lane: l, stack: 0 }");
    expect(d.nodes[0]!.visibleIf).toBeUndefined();
  });

  it("空で書くと誤りになる (常に出ない箱を黙って作らない)", () => {
    const e = 誤り("actors:\n  - A: { kind: card, lane: l, stack: 0, visibleIf: }");
    expect(e.join("\n")).toContain("visibleIf");
  });

  it("縦に並べた形でも書ける", () => {
    const d = 図にする('actors:\n  - A:\n      kind: card\n      lane: l\n      出す条件: "0"');
    expect(d.nodes[0]!.visibleIf).toBe("0");
  });
});

describe("箱に出す題 (#1381)", () => {
  it("名前と別の題を出せる", () => {
    const d = 図にする('actors:\n  - star1: { kind: card, lane: l, stack: 0, title: "★" }');
    expect(d.nodes[0]!.id).toBe("star1");
    expect(d.nodes[0]!.title).toBe("★");
  });

  it("同じ題の箱を並べられる", () => {
    const d = 図にする(
      'actors:\n  - star1: { kind: card, lane: l, stack: 0, title: "★" }\n  - star2: { kind: card, lane: l, stack: 1, title: "★" }',
    );
    expect(d.nodes.map((n) => n.title)).toEqual(["★", "★"]);
    expect(new Set(d.nodes.map((n) => n.id)).size, "識別子が重なっている").toBe(2);
  });

  it("題を空にできる", () => {
    const d = 図にする('actors:\n  - _h: { kind: card, lane: l, stack: 0, title: "" }');
    expect(d.nodes[0]!.title).toBe("");
  });

  it("書かなければ名前が題になる", () => {
    const d = 図にする("actors:\n  - A: { kind: card, lane: l, stack: 0 }");
    expect(d.nodes[0]!.title).toBe("A");
  });

  it("題を変えても名前で光らせられる", () => {
    const d = 図にする('actors:\n  - star1: { kind: card, lane: l, stack: 0, title: "★" }');
    expect(d.phases[0]!.activate).toEqual([]);
    const d2 = textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

actors:
  - star1: { kind: card, lane: l, stack: 0, title: "★" }

animation:
  - step: "p" 1s
    focus: ["star1"]
`);
    expect(d2.phases[0]!.activate).toEqual(["star1"]);
  });
});

describe("JSON でも同じことが書ける (#1381)", () => {
  const 基本 = {
    title: "t",
    type: "flow",
    lanes: { l: { x: 0, width: 400 } },
    flow: [],
    states: { st: "online", v: 10 },
    animation: [{ step: "p", duration: 1 }],
  };

  it("部品 7 種と組の並びが読める", () => {
    const d = jsonToDiagram({
      ...基本,
      readouts: [
        { id: "d", kind: "donut", source: "v", colors: ["#111", "#222"] },
        {
          id: "dot",
          kind: "status-dot",
          source: "st",
          map: [{ value: "online", color: "#22c55e" }],
        },
      ],
      actors: [{ name: "A", kind: "card", lane: "l", stack: 0 }],
    });
    expect(d.readouts).toHaveLength(2);
  });

  it("出す条件と題が読める", () => {
    const d = jsonToDiagram({
      ...基本,
      actors: [{ name: "star1", kind: "card", lane: "l", stack: 0, title: "★", visibleIf: "0" }],
    });
    expect(d.nodes[0]!.title).toBe("★");
    expect(d.nodes[0]!.visibleIf).toBe("0");
  });

  const だめな形: readonly [string, unknown, string][] = [
    ["組の並びが並びでない", "online", "map"],
    ["組の並びが空", [], "map"],
    ["組の中身が値でない", [{ value: { a: 1 } }], "map"],
    ["組が組でない", ["online"], "map"],
  ];

  it.each(だめな形)("%s は誤りになる", (_名, map, 欄) => {
    const r = validateDragonJson({
      ...基本,
      readouts: [{ id: "dot", kind: "status-dot", source: "st", map }],
      actors: [{ name: "A", kind: "card", lane: "l", stack: 0 }],
    });
    expect(r.ok, "誤りが出ていない").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path).join(" ")).toContain(欄);
  });

  it("出す条件が文字列でないと誤りになる", () => {
    const r = validateDragonJson({
      ...基本,
      actors: [{ name: "A", kind: "card", lane: "l", stack: 0, visibleIf: 1 }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path).join(" ")).toContain("visibleIf");
  });

  it("知らない部品の種類は誤りになる (陽性対照)", () => {
    const r = validateDragonJson({
      ...基本,
      readouts: [{ id: "x", kind: "sunburst", source: "v" }],
      actors: [{ name: "A", kind: "card", lane: "l", stack: 0 }],
    });
    expect(r.ok).toBe(false);
  });

  it("正しく書けば誤りが出ない (陰性対照)", () => {
    const r = validateDragonJson({
      ...基本,
      readouts: [{ id: "d", kind: "donut", source: "v" }],
      actors: [{ name: "A", kind: "card", lane: "l", stack: 0, title: "★", visibleIf: "1" }],
    });
    expect(r.ok, r.ok ? "" : r.errors.map((e) => `${e.path}: ${e.message}`).join("\n")).toBe(true);
  });
});
