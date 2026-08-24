/**
 * 箱の欄を値に追随させる 5 欄の検査 (#1392)。
 *
 * 描画側の箱は `wBind` / `hBind` / `opacity` / `renderOffsetX` / `renderOffsetY` を持つが、
 * 記法にも JSON にも書く項目が無かった。 見本帳の「動く見本」 2 件がこれだけを理由に
 * 記法を持てなかった。
 *
 * ## この検査が見るもの
 *
 * 書いた値が図の箱まで届くこと。 3 つの書き方 (中括弧 / 縦に並べる / JSON) すべてで見る =
 * 1 つだけ配線し忘れると、その書き方でだけ黙って消える。
 *
 * 併せて、空の値を捨てずに知らせることも見る。 描画側は空文字を 0 として読むため、
 * `opacity: ""` は書いた人には「箱が消えた」 としか見えない。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram, validateDragonJson, jsonToDiagram, parseTextDslV05 } from "../src";
import { INLINE_ACTOR_KEYS, ACTOR_ITEM_KEYS } from "../src/v05/parser";
import { diagramJsonSchema } from "../src/schema";

/** 本 Issue で足した 5 欄。 3 経路すべてがこの一覧を覆う */
const 五欄 = ["wBind", "hBind", "opacity", "renderOffsetX", "renderOffsetY"] as const;

type 箱 = Record<string, unknown>;

const 箱たち = (d: unknown): 箱[] => (d as { nodes: 箱[] }).nodes;

/** 中括弧の形で 1 箱を書いた図 */
const 中括弧 = (中身: string) =>
  textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  barW: 120
  fade: 0.5

actors:
  - A: { kind: card, lane: l, stack: 0${中身 === "" ? "" : `, ${中身}`} }

animation:
  - step: "p" 1s
`);

/** 縦に並べる形で 1 箱を書いた図 */
const 縦並び = (行: string) =>
  textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  barW: 120
  fade: 0.5

actors:
  - A:
      kind: card
      lane: l
      stack: 0
${行}

animation:
  - step: "p" 1s
`);

const JSONの基本 = {
  title: "t",
  type: "flow",
  lanes: { l: { x: 0, width: 400 } },
  flow: [],
  states: { barW: 120, fade: 0.5 },
  animation: [{ step: "p", duration: 1 }],
};

const JSONの図 = (extra: Record<string, unknown>) => ({
  ...JSONの基本,
  actors: [{ name: "A", kind: "card", lane: "l", stack: 0, ...extra }],
});

describe("値に追随する 5 欄が記法から図に届く (#1392)", () => {
  it("5 欄が中括弧と縦に並べる形の両方で読める項目に載っている", () => {
    // 片方だけに載せると、その書き方でだけ「項目名が読めません」 になる
    const 中括弧に無い = 五欄.filter((k) => !INLINE_ACTOR_KEYS.has(k));
    const 縦に無い = 五欄.filter((k) => !ACTOR_ITEM_KEYS.has(k));
    expect(中括弧に無い, "中括弧の形で読めない欄がある").toEqual([]);
    expect(縦に無い, "縦に並べる形で読めない欄がある").toEqual([]);
  });

  it("中括弧の形で 5 欄がそのまま届く", () => {
    const d = 中括弧(
      'wBind: "{barW}", hBind: "{barW}", opacity: "{fade}", renderOffsetX: 30, renderOffsetY: "{fade}"',
    );
    const n = 箱たち(d)[0]!;
    expect({
      wBind: n.wBind,
      hBind: n.hBind,
      opacity: n.opacity,
      renderOffsetX: n.renderOffsetX,
      renderOffsetY: n.renderOffsetY,
    }).toEqual({
      wBind: "{barW}",
      hBind: "{barW}",
      opacity: "{fade}",
      renderOffsetX: 30,
      renderOffsetY: "{fade}",
    });
  });

  it("縦に並べる形でも同じ値が届く", () => {
    const d = 縦並び(
      '      wBind: "{barW}"\n      opacity: 0.5\n      renderOffsetX: -20\n      renderOffsetY: "{fade}"',
    );
    const n = 箱たち(d)[0]!;
    expect({
      wBind: n.wBind,
      opacity: n.opacity,
      renderOffsetX: n.renderOffsetX,
      renderOffsetY: n.renderOffsetY,
    }).toEqual({ wBind: "{barW}", opacity: 0.5, renderOffsetX: -20, renderOffsetY: "{fade}" });
  });

  it("書かなければ欄ごと付かない", () => {
    const n = 箱たち(中括弧(""))[0]!;
    for (const 欄 of 五欄) expect(n[欄], `${欄} が書かないのに付いている`).toBeUndefined();
  });

  it.each(["opacity", "renderOffsetX", "renderOffsetY"] as const)(
    "%s は数として読めれば数、読めなければ文字列のまま渡す",
    (欄) => {
      // 数のまま渡さないと、描画側が文字列として扱って計算に使えない
      expect(箱たち(中括弧(`${欄}: 0.25`))[0]![欄]).toBe(0.25);
      expect(箱たち(中括弧(`${欄}: "{fade}"`))[0]![欄]).toBe("{fade}");
    },
  );

  it.each(五欄)("%s の空は中括弧でも縦に並べても知らせる", (欄) => {
    // 描画側は空文字を数として読む。 黙って渡すと「箱が消えた」 としか見えない
    expect(() => 中括弧(`${欄}: ""`)).toThrow(new RegExp(`箱の ${欄} が空です`));
    expect(() => 縦並び(`      ${欄}: ""`)).toThrow(new RegExp(`箱の ${欄} が空です`));
  });

  it("大きさの欄は数を書いても文字列のまま渡す", () => {
    // 描画側は `wBind?: string` で、数を直に書いても追随のしようが無い。
    // 数として読み替えると型が合わなくなるため、文字列のまま渡す
    expect(箱たち(中括弧("wBind: 120"))[0]!.wBind).toBe("120");
  });
});

describe("値に追随する 5 欄が JSON から図に届く (#1392)", () => {
  it("正しい形は通り、図まで届く", () => {
    const json = JSONの図({
      wBind: "{barW}",
      hBind: "{barW}",
      opacity: 0.5,
      renderOffsetX: 30,
      renderOffsetY: "{fade}",
    });
    const v = validateDragonJson(json);
    expect(v.ok, v.ok ? "" : v.errors.map((e) => e.path).join(" ")).toBe(true);
    const n = 箱たち(jsonToDiagram(json as never))[0]!;
    expect({
      wBind: n.wBind,
      hBind: n.hBind,
      opacity: n.opacity,
      renderOffsetX: n.renderOffsetX,
      renderOffsetY: n.renderOffsetY,
    }).toEqual({
      wBind: "{barW}",
      hBind: "{barW}",
      opacity: 0.5,
      renderOffsetX: 30,
      renderOffsetY: "{fade}",
    });
  });

  it.each(["wBind", "hBind"] as const)("%s に数を書くと誤りになる", (欄) => {
    // 描画側は文字列だけを取る。 数を通すと型の合わない値が図に載る
    const r = validateDragonJson(JSONの図({ [欄]: 120 }));
    expect(r.ok, `${欄} に数が通っている`).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(`$.actors[0].${欄}`);
  });

  it.each(["opacity", "renderOffsetX", "renderOffsetY"] as const)(
    "%s に真偽を書くと誤りになる",
    (欄) => {
      const r = validateDragonJson(JSONの図({ [欄]: true }));
      expect(r.ok, `${欄} に真偽が通っている`).toBe(false);
      if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(`$.actors[0].${欄}`);
    },
  );

  it.each(五欄)("%s の空文字と空白だけの文字列は誤りになる", (欄) => {
    for (const 値 of ["", "   "]) {
      const r = validateDragonJson(JSONの図({ [欄]: 値 }));
      expect(r.ok, `${欄} の ${JSON.stringify(値)} が通っている`).toBe(false);
      if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(`$.actors[0].${欄}`);
    }
  });
});

describe("parts で同じ名前を書いた時は状態の上書きになる (#1392)", () => {
  it.each([
    "- A: { kind: some-part, opacity: 0.5 }",
    "- A:\n      opacity: 0.5\n      kind: some-part",
  ])("中括弧と縦に並べる形の両方で届く", (actor) => {
    const r = parseTextDslV05(`title: "t"
type: flow
actors:
  ${actor}
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.actors[0]?.stateOverride).toEqual({ opacity: 0.5 });
    expect(r.doc.actors[0]?.opacity).toBeUndefined();
  });

  it("2 つの書き方で状態の値が同じ型になる", () => {
    /*
     * **型まで見る** (Round 2 の指摘)。 縦に並べた形で専用の読み取りを先に通すと、
     * `wBind: 120` が中括弧では数、縦では文字列になって書き方で割れる。
     * 状態の値は描画側が計算に使うため、型が違うと同じ記述が別の絵になる。
     */
    const 読む = (actor: string) => {
      const r = parseTextDslV05(`title: "t"\ntype: flow\nactors:\n  ${actor}\n`);
      if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
      return r.doc.actors[0]?.stateOverride;
    };
    const 中括弧 = 読む("- A: { kind: some-part, wBind: 120, hBind: 80, opacity: 0.5 }");
    const 縦 = 読む(
      "- A:\n      wBind: 120\n      hBind: 80\n      opacity: 0.5\n      kind: some-part",
    );
    expect(中括弧, "中括弧の形で状態に届いていない").toEqual({
      wBind: 120,
      hBind: 80,
      opacity: 0.5,
    });
    expect(縦, "縦に並べた形が中括弧と違う値になる").toEqual(中括弧);
  });
});

describe("公開している形が 5 欄を持つ (#1392)", () => {
  const 箱の形 = (
    diagramJsonSchema as unknown as {
      properties: {
        actors: {
          items: {
            oneOf: {
              type?: string;
              properties?: Record<string, { type?: unknown; minLength?: number; pattern?: string }>;
            }[];
          };
        };
      };
    }
  ).properties.actors.items.oneOf.find((b) => b.type === "object");

  it("箱の形を読めている", () => {
    expect(箱の形?.properties, "箱の形を読めていない (検査が空振りしている)").toBeDefined();
  });

  it("5 欄すべてが公開している形にある", () => {
    const 無い = 五欄.filter((k) => !(k in (箱の形?.properties ?? {})));
    expect(無い, "記法で書けるのに公開している形が持たない欄がある").toEqual([]);
  });

  it("大きさの欄は文字列、濃さとずらしは数と文字列の両方を受ける", () => {
    // 記法 / JSON validator / 公開している形 の 3 つで受ける型が割れると、
    // 書けるのに拒まれる (逆もある) 状態が生まれる
    const 型 = (欄: string): unknown => 箱の形?.properties?.[欄]?.type;
    expect(型("wBind")).toBe("string");
    expect(型("hBind")).toBe("string");
    for (const 欄 of ["opacity", "renderOffsetX", "renderOffsetY"]) {
      expect(型(欄), `${欄} が数と文字列の両方を受けていない`).toEqual(["number", "string"]);
    }
  });

  it("5 欄とも空または空白だけの文字列を生成しない", () => {
    for (const 欄 of 五欄) {
      expect(箱の形?.properties?.[欄]?.minLength, `${欄} が空文字を許している`).toBe(1);
      expect(箱の形?.properties?.[欄]?.pattern, `${欄} が空白だけを許している`).toBe("\\S");
    }
  });
});
