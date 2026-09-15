/**
 * 押下 (`events:`) と巻き上げ (`scrolls:`) の検査 (#1393)。
 *
 * 記法は図を書くためのもので、読む人の操作に応じて値が動く仕掛けを持たなかった。
 * カタログの「動く見本」 3 件がこれだけを理由に記法を持てなかった。
 *
 * ## この検査が見るもの
 *
 * 書いた仕掛けが図まで届くこと。 記法と JSON の 2 経路で見る。
 *
 * **相手の指し方を重点的に見る**。 記法は識別子を書けないため名前で指し、組み立てが識別子へ
 * 直す。 直せなかった時に黙って落とすと「書いたのに押しても何も起きない」 が手掛かりなしで
 * 起きるので、知らせることも併せて確かめる。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram, validateDragonJson, jsonToDiagram, compileToCdl } from "../src";
import { parseTextDslV05 } from "../src/v05";
import { EVENT_KINDS } from "../src/v05/parser";
import { MAX_INPUT_ELEMENTS } from "../src/input-size";
import { diagramJsonSchema } from "../src/schema";
import type { CompileNotice } from "../src/compile";

type 図 = {
  eventBindings?: {
    id: string;
    event: string;
    target: Record<string, unknown>;
    handlerId: string;
  }[];
  scrollTriggers?: Record<string, unknown>[];
};

const 元 = (中身: string) => `title: "t"
type: flow

lanes:
  col1: { x: 0, width: 260 }

${中身}

actors:
  - Button: { kind: card, lane: col1, stack: 0 }
  - Handler: { kind: card, lane: col1, stack: 1 }

flow:
  - Button -> Handler: "呼ぶ"

animation:
  - step: "p" 1s
`;

const 記法 = (中身: string) => textDslToDiagram(元(中身)) as unknown as 図;

const JSONの図 = (extra: Record<string, unknown>) => ({
  title: "t",
  type: "flow",
  lanes: { col1: { x: 0, width: 260 } },
  actors: [
    { name: "Button", kind: "card", lane: "col1", stack: 0 },
    { name: "Handler", kind: "card", lane: "col1", stack: 1 },
  ],
  flow: [{ from: "Button", to: "Handler", label: "呼ぶ" }],
  animation: [{ step: "p", duration: 1 }],
  ...extra,
});

describe("押下が記法から図に届く (#1393)", () => {
  it("書かなければ欄ごと付かない", () => {
    expect(記法("").eventBindings).toBeUndefined();
  });

  it("4 種の指し方がそれぞれ図の識別子へ直る", () => {
    const d = 記法(`events:
  - { on: click, box: Button, handler: toggle }
  - { on: drag, lane: col1, handler: onDrag }
  - { on: drop, arrow: Button -> Handler, handler: onDrop }
  - { on: keydown, diagram: true, handler: onKey }`);
    expect(d.eventBindings?.map((e) => [e.event, e.target.kind, e.handlerId])).toEqual([
      ["click", "node", "toggle"],
      ["drag", "lane", "onDrag"],
      ["drop", "edge", "onDrop"],
      ["keydown", "diagram", "onKey"],
    ]);
    // 相手の識別子は図に実在するものへ直る
    expect(d.eventBindings?.[0]?.target.id).toBe("button");
    expect(d.eventBindings?.[1]?.target.id).toBe("col1");
    expect(typeof d.eventBindings?.[2]?.target.id).toBe("string");
  });

  it("識別子は書いた順に evt-1 から振る", () => {
    // 組み立て API も同じ振り方をする。 ずれると同じ図にならない
    const d = 記法(`events:
  - { on: click, box: Button, handler: a }
  - { on: hover, box: Handler, handler: b }`);
    expect(d.eventBindings?.map((e) => e.id)).toEqual(["evt-1", "evt-2"]);
  });

  it("順序図では指す矢印が無く、相手を解けないことを伝える", () => {
    // #1466 で順序図は 1 枚の板になり、言づては矢印ではなく板の中の行になった =
    // `arrow:` で指す相手が図に無い
    const 出た: string[] = [];
    const d = textDslToDiagram(`title: "t"
type: sequence
events:
  - { on: click, arrow: A -> B, handler: h }
actors:
  - A
  - B
flow:
  - A -> B: "呼ぶ"
animation:
  - step: "p" 1s
`, { onNotice: (n) => 出た.push(n.kind) }) as unknown as 図;
    expect(d.eventBindings?.[0]?.target, "指せない相手を解いている").toBeUndefined();
    expect(出た, "相手を解けないことを伝えていない").toContain("event-target-missing");
  });

  it("名前から作る識別子が重なっても箱と矢印を指せる", () => {
    const d = textDslToDiagram(`title: "t"
type: flow
events:
  - { on: click, box: a_b, handler: node }
  - { on: click, arrow: a_b -> a-b, handler: edge }
actors:
  - a_b
  - a-b
flow:
  - a_b -> a-b: "呼ぶ"
animation:
  - step: "p" 1s
`) as unknown as 図;
    expect(d.eventBindings?.map((event) => event.target.kind)).toEqual(["node", "edge"]);
    expect(d.eventBindings?.every((event) => typeof event.target.id === "string")).toBe(true);
  });

  it.each(EVENT_KINDS)("%s を書ける", (kind) => {
    const d = 記法(`events:\n  - { on: ${kind}, box: Button, handler: h }`);
    expect(d.eventBindings?.[0]?.event).toBe(kind);
  });

  it("知らない種類は使える一覧を添えて知らせる", () => {
    expect(() => 記法("events:\n  - { on: swipe, box: Button, handler: h }")).toThrow(
      /出来事の種類が読めません/,
    );
  });

  it.each([
    ["相手を書かない", "events:\n  - { on: click, handler: h }", /相手が書かれていません/],
    [
      "相手を 2 つ書く",
      "events:\n  - { on: click, box: Button, lane: col1, handler: h }",
      /相手を 2 つ以上書いています/,
    ],
    ["handler を書かない", "events:\n  - { on: click, box: Button }", /handler が空です/],
    [
      "handler が空白だけ",
      'events:\n  - { on: click, box: Button, handler: "   " }',
      /handler が空です/,
    ],
    [
      "diagram を true 以外で書く",
      "events:\n  - { on: click, diagram: false, handler: h }",
      /diagram が読めません/,
    ],
    [
      "知らない項目",
      "events:\n  - { on: click, box: Button, handler: h, foo: 1 }",
      /項目名が読めません/,
    ],
    ["矢印の形が違う", "events:\n  - { on: click, arrow: Button, handler: h }", /矢印が読めません/],
    ["中括弧でない", "events:\n  - click Button", /行が読めません/],
  ])("%s 形を知らせる", (_名, 中身, 期待) => {
    expect(() => 記法(中身)).toThrow(期待);
  });

  it("1 行にまとめた形は受けない", () => {
    expect(() => 記法("events: [{ on: click }]")).toThrow(/1 行にまとめて書けない/);
  });
});

describe("指す先が無い出来事は載せずに知らせる (#1393)", () => {
  const 知らせを集める = (中身: string): CompileNotice[] => {
    const r = parseTextDslV05(元(中身));
    if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
    const 出た: CompileNotice[] = [];
    compileToCdl(r.doc, { onNotice: (n) => 出た.push(n) });
    return 出た;
  };

  it("居ない箱を指すと知らせる", () => {
    const 出た = 知らせを集める("events:\n  - { on: click, box: 居ない箱, handler: h }");
    const 知らせ = 出た.filter((n) => n.kind === "event-target-missing");
    expect(知らせ.length, "知らせが出ていない").toBe(1);
    expect(知らせ[0]?.actor).toBe("h");
  });

  it("知らせた出来事は図に載らない", () => {
    // 描画側は知らない識別子を黙って無視する。 残すと「押しても何も起きない」 だけが残る
    const r = parseTextDslV05(元("events:\n  - { on: click, box: 居ない箱, handler: h }"));
    if (!r.ok) throw new Error("読めない");
    const d = compileToCdl(r.doc) as unknown as 図;
    expect(d.eventBindings).toBeUndefined();
  });

  it("居る箱を指す出来事は知らせずに載る", () => {
    // 0 件を見る検査なので、対になる形も固定する
    const 出た = 知らせを集める("events:\n  - { on: click, box: Button, handler: h }");
    expect(出た.filter((n) => n.kind === "event-target-missing")).toEqual([]);
  });
});

describe("巻き上げが記法から図に届く (#1393)", () => {
  it("書かなければ欄ごと付かない", () => {
    expect(記法("").scrollTriggers).toBeUndefined();
  });

  it("欄がそのまま届く", () => {
    const d = 記法('scrolls:\n  intro: { start: 0.9, end: 0.1, scrub: 1, label: "導入" }');
    expect(d.scrollTriggers).toEqual([
      { id: "intro", start: 0.9, end: 0.1, scrub: 1, label: "導入" },
    ]);
  });

  it("書かない欄は付かない", () => {
    // 書かなかった欄に既定値を入れると、描画側の既定と食い違った時に気付けない
    const d = 記法("scrolls:\n  intro: { start: 0.5 }");
    expect(d.scrollTriggers).toEqual([{ id: "intro", start: 0.5 }]);
  });

  it("知らない項目を知らせる", () => {
    expect(() => 記法("scrolls:\n  intro: { speed: 1 }")).toThrow(/項目名が読めません/);
  });

  it("数でない値を知らせる", () => {
    expect(() => 記法("scrolls:\n  intro: { start: はやい }")).toThrow(/巻き上げ intro の start/);
  });

  it.each([
    ["名前", "scrolls:\n  1intro: { start: 0.5 }", /invalid value name/],
    ["重複した名前", "scrolls:\n  intro: { start: 0.5 }\n  intro: { end: 0.5 }", /重複しています/],
    ["start", "scrolls:\n  intro: { start: 1.1 }", /start は 0 から 1/],
    ["end", "scrolls:\n  intro: { end: -0.1 }", /end は 0 から 1/],
    ["scrub", "scrolls:\n  intro: { scrub: 2 }", /scrub は 0 から 1/],
  ])("使えない %s を知らせる", (_名, 中身, 期待) => {
    expect(() => 記法(中身)).toThrow(期待);
  });

  it.each([
    [
      "inputs",
      "inputs:\n  same: { kind: slider, min: 0, max: 1, defaultValue: 0 }\nscrolls:\n  same: { start: 1 }",
    ],
    ["formulas", 'formulas:\n  same: "2"\nscrolls:\n  same: { start: 1 }'],
  ])("%s と同じ名前は拒む", (_種類, 中身) => {
    expect(() => 記法(中身)).toThrow(/inputs または formulas と重なっています/);
  });
});

describe("大量に並べた入力を組み立て前の上限で止める (#1393)", () => {
  /*
   * **図の側は既に数えている**。 記法側だけ数えないと、箱が少ないまま押下や巻き上げを
   * 大量に並べた入力が組み立て前の上限をすり抜け、組み立て終わってから弾かれる
   * (= 時間をかけてから止まる)。 つまみ (#1389) / 部品 (#1374) と同じ守り方に揃える。
   */
  it("押下だけを大量に並べた入力も止める", () => {
    const entries = Array.from(
      { length: MAX_INPUT_ELEMENTS },
      () => "  - { on: click, box: A, handler: h }",
    ).join("\n");
    expect(() =>
      textDslToDiagram(`title: "t"
type: flow

actors:
  - A

events:
${entries}
`),
    ).toThrow(/要素が/);
  });

  it("巻き上げだけを大量に並べた入力も止める", () => {
    const entries = Array.from(
      { length: MAX_INPUT_ELEMENTS },
      (_, i) => `  s${i}: { start: 0.9 }`,
    ).join("\n");
    expect(() =>
      textDslToDiagram(`title: "t"
type: flow

actors:
  - A

scrolls:
${entries}
`),
    ).toThrow(/要素が/);
  });
});

describe("JSON でも押下と巻き上げを書ける (#1393)", () => {
  it("正しい形は通り、図まで届く", () => {
    const json = JSONの図({
      events: [{ on: "click", box: "Button", handler: "toggle" }],
      scrolls: { intro: { start: 0.9, end: 0.1 } },
    });
    const v = validateDragonJson(json);
    expect(v.ok, v.ok ? "" : v.errors.map((e) => e.path).join(" ")).toBe(true);
    const d = jsonToDiagram(json) as unknown as 図;
    expect(d.eventBindings?.[0]?.target).toEqual({ kind: "node", id: "button" });
    expect(d.scrollTriggers).toEqual([{ id: "intro", start: 0.9, end: 0.1 }]);
  });

  it.each([
    ["並びでない", { events: 1 }, "$.events"],
    ["object でない要素", { events: [1] }, "$.events[0]"],
    ["知らない種類", { events: [{ on: "swipe", box: "Button", handler: "h" }] }, "$.events[0].on"],
    ["handler 無し", { events: [{ on: "click", box: "Button" }] }, "$.events[0].handler"],
    [
      "handler が空白だけ",
      { events: [{ on: "click", box: "Button", handler: "   " }] },
      "$.events[0].handler",
    ],
    ["相手 0 個", { events: [{ on: "click", handler: "h" }] }, "$.events[0]"],
    [
      "相手 2 個",
      { events: [{ on: "click", box: "Button", lane: "col1", handler: "h" }] },
      "$.events[0]",
    ],
    [
      "知らない項目",
      { events: [{ on: "click", box: "B", handler: "h", foo: 1 }] },
      "$.events[0].foo",
    ],
    [
      "端が空の矢印",
      { events: [{ on: "click", arrow: "A -> ", handler: "h" }] },
      "$.events[0].arrow",
    ],
  ])("押下の %s 形を拒む", (_名, extra, path) => {
    const r = validateDragonJson(JSONの図(extra));
    expect(r.ok, "誤った形が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(path);
  });

  it.each([
    ["object でない", { scrolls: [] }, "$.scrolls"],
    ["使えない名前", { scrolls: { "1a": {} } }, "$.scrolls.1a"],
    ["知らない項目", { scrolls: { a: { speed: 1 } } }, "$.scrolls.a.speed"],
    ["数でない", { scrolls: { a: { start: "x" } } }, "$.scrolls.a.start"],
    ["範囲外", { scrolls: { a: { scrub: 1.1 } } }, "$.scrolls.a.scrub"],
    [
      "input と同じ名前",
      {
        inputs: [{ id: "same", kind: "slider", min: 0, max: 1, defaultValue: 0 }],
        scrolls: { same: { start: 1 } },
      },
      "$.scrolls.same",
    ],
    [
      "式と同じ名前",
      { formulas: { same: "2" }, scrolls: { same: { start: 1 } } },
      "$.scrolls.same",
    ],
  ])("巻き上げの %s 形を拒む", (_名, extra, path) => {
    const r = validateDragonJson(JSONの図(extra));
    expect(r.ok, "誤った形が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(path);
  });
});

describe("公開している形が押下と巻き上げを持つ (#1393)", () => {
  const props = (
    diagramJsonSchema as unknown as {
      properties: Record<
        string,
        {
          type?: string;
          items?: {
            properties?: Record<string, { enum?: string[]; pattern?: string }>;
            oneOf?: unknown[];
          };
        }
      >;
    }
  ).properties;

  it("公開している形を読めている", () => {
    expect(props.events, "events が無い").toBeDefined();
    expect(props.scrolls, "scrolls が無い").toBeDefined();
  });

  it("出来事の種類が記法と一致する", () => {
    // 片方だけ増えると、記法で書けるのに JSON が拒む状態が生まれる
    expect(props.events?.items?.properties?.on?.enum).toEqual([...EVENT_KINDS]);
  });

  it("相手をちょうど 1 つだけ書く形になっている", () => {
    expect(props.events?.items?.oneOf, "相手の指し方が 1 つに絞られていない").toHaveLength(4);
  });

  it("矢印は両端の名前を持つ形に限られる", () => {
    expect(props.events?.items?.properties?.arrow?.pattern).toBeDefined();
  });

  it("handler は空白以外の文字を持つ形に限られる", () => {
    expect(props.events?.items?.properties?.handler?.pattern).toBe("\\S");
  });

  it("巻き上げの数は 0 から 1 に限られる", () => {
    const scroll = props.scrolls as {
      additionalProperties?: {
        properties?: Record<string, { minimum?: number; maximum?: number }>;
      };
    };
    for (const 欄 of ["start", "end", "scrub"]) {
      expect(scroll.additionalProperties?.properties?.[欄]).toMatchObject({
        minimum: 0,
        maximum: 1,
      });
    }
  });
});
