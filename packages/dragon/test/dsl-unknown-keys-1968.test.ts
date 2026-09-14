/**
 * 記法 (YAML) のどの欄に知らない項目名を書いても知らせることの検証 (#1968)。
 *
 * 箱と段は綴り違いを行番号付きで知らせていたが、縦列 / 視点 / 矢印の中括弧 / 組 / 軸の名前 は
 * 読む欄だけを拾って残りを黙って捨てていた。 実測 = 縦列に `widht: 280` と書くと幅が既定のまま
 * 描かれ、知らせは 1 件も出なかった。
 *
 * ## 走査する欄は最上位の項目の一覧から導く
 *
 * 見本の表は `TOP_LEVEL_KEYS` の全ての項目を鍵に持つ (型で強制する)。 項目名を持つ欄は綴り違いの
 * 見本を、持たない欄はその理由を書く。 最上位の項目を足した時に表へ書き足さなければ型検査と
 * 下の検査の両方が落ちるので、新しい欄が黙って知らせの外に残らない。
 */
import { describe, it, expect } from "vitest";
import { validateDragonJson } from "@cardenelabs/dragon";
import {
  AXIS_X_KEYS,
  AXIS_Y_KEYS,
  GROUP_INLINE_KEYS,
  LANE_INLINE_KEYS,
  TOP_LEVEL_KEYS,
  VIEWPORT_VALUE_KINDS,
  parseTextDslV05,
} from "../src/v05/parser";
import { ACCEPTED_KEYS } from "../src/json-parser";
import { 図 } from "./support/json-field-input";

type 最上位 = (typeof TOP_LEVEL_KEYS)[number];

type 綴り違いの見本 = {
  /** 見本の呼び名 (検査名に出す) */
  名: string;
  /** 綴り違いを 1 つだけ含む記法 */
  記法: string;
  /** 知らせに載るべき読めない項目名 */
  項目名: string;
  /** 知らせが指すべき行 (1 始まり) */
  行: number;
  /** 綴り違いを正しい項目名に直した記法。 知らせが 0 件になることを確かめる */
  正しい記法: string;
  /** 同じ綴り違いを JSON の入口に渡した入力と、誤りが出るべき path */
  json: { input: Record<string, unknown>; path: string };
};

type 項目名を持たない = { 項目名を持たない理由: string };

const 頭 = `title: "t"\ntype: flow\n`;

/** `綴り` を `正` に直した見本を 1 件組む */
const 見本 = (
  名: string,
  記法: (綴り: string) => string,
  綴り: string,
  正: string,
  json: 綴り違いの見本["json"],
): 綴り違いの見本 => {
  const src = 記法(綴り);
  const 行 = src.split("\n").findIndex((l) => l.includes(`${綴り}:`)) + 1;
  return { 名, 記法: src, 項目名: 綴り, 行, 正しい記法: 記法(正), json };
};

const 見本の表: Record<最上位, 綴り違いの見本[] | 項目名を持たない> = {
  title: { 項目名を持たない理由: "図の題 1 つを書く欄で、値は文字列" },
  type: { 項目名を持たない理由: "図種の語を 1 つ書く欄" },
  eyebrow: { 項目名を持たない理由: "小見出しの文字列を 1 つ書く欄" },
  reveal: { 項目名を持たない理由: "矢印を出す時期の語を 1 つ書く欄" },
  relations: { 項目名を持たない理由: "関係の強調の語を 1 つ書く欄" },
  direction: { 項目名を持たない理由: "並ぶ向きの語を 1 つ書く欄" },
  palette: { 項目名を持たない理由: "配色の語を 1 つ書く欄" },
  states: { 項目名を持たない理由: "`名前: 初期値` を並べる欄で、左辺は書き手が決める名前" },
  values: { 項目名を持たない理由: "`名前: 式` を並べる欄で、左辺は書き手が決める名前" },
  formulas: { 項目名を持たない理由: "`名前: 式` を並べる欄で、左辺は書き手が決める名前" },
  bands: { 項目名を持たない理由: "`- 面の名前: 1..2` を並べる欄で、左辺は書き手が決める名前" },
  actors: [
    見本("箱の中括弧", (k) => `${頭}actors:\n  - A: { ${k}: card }\n  - B\n`, "knid", "kind", {
      input: 図({ actors: [{ name: "A", knid: "card" }, { name: "B" }] }),
      path: "$.actors[0].knid",
    }),
  ],
  flow: [
    見本(
      "矢印の中括弧",
      (k) => `${頭}actors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x" { ${k}: open }\n`,
      "haed",
      "head",
      {
        input: 図({ flow: [{ from: "A", to: "B", label: "x", haed: "open" }] }),
        path: "$.flow[0].haed",
      },
    ),
  ],
  animation: [
    見本(
      "段",
      (k) => `${頭}actors:\n  - A\n\nanimation:\n  - step: "s" 1s\n    ${k}: [A]\n`,
      "fcous",
      "focus",
      { input: 図({ animation: [{ step: "s1", fcous: ["A"] }] }), path: "$.animation[0].fcous" },
    ),
  ],
  viewport: [
    見本(
      "視点 (1 行の形)",
      (k) => `${頭}viewport: { ${k}: 800 }\n\nactors:\n  - A\n`,
      "widht",
      "width",
      { input: 図({ viewport: { widht: 800 } }), path: "$.viewport.widht" },
    ),
    見本(
      "視点 (縦に並べる形)",
      (k) => `${頭}viewport:\n  height: 600\n  ${k}: 800\n\nactors:\n  - A\n`,
      "widht",
      "width",
      { input: 図({ viewport: { height: 600, widht: 800 } }), path: "$.viewport.widht" },
    ),
    見本(
      "視点 (縦に並べる形で値を書かない)",
      (k) => `${頭}viewport:\n  ${k}:\n\nactors:\n  - A\n`,
      "widht",
      "width",
      { input: 図({ viewport: { widht: 800 } }), path: "$.viewport.widht" },
    ),
  ],
  lanes: [
    見本(
      "縦列",
      (k) => `${頭}lanes:\n  l1: { x: 0, ${k}: 280 }\n\nactors:\n  - A: { lane: l1 }\n`,
      "widht",
      "width",
      { input: 図({ lanes: { l1: { x: 0, widht: 280 } } }), path: "$.lanes.l1.widht" },
    ),
    見本(
      "縦列 (値を書かない)",
      (k) => `${頭}lanes:\n  l1: { x: 0, ${k}: }\n\nactors:\n  - A: { lane: l1 }\n`,
      "widht",
      "width",
      { input: 図({ lanes: { l1: { x: 0, widht: 280 } } }), path: "$.lanes.l1.widht" },
    ),
  ],
  groups: [
    見本(
      "組",
      (k) =>
        `${頭}lanes:\n  l1: { x: 0, width: 280 }\n\ngroups:\n  g1: { ${k}: "x", lanes: [l1] }\n\nactors:\n  - A: { lane: l1 }\n`,
      "lable",
      "label",
      {
        input: 図({ lanes: { l1: {} }, groups: { g1: { lable: "x", lanes: ["l1"] } } }),
        path: "$.groups.g1.lable",
      },
    ),
  ],
  axes: [
    見本(
      "横軸の名前",
      (k) =>
        `title: "t"\ntype: quadrant\naxes:\n  x: { ${k}: "安い", right: "高い" }\n\nactors:\n  - A\n`,
      "lft",
      "left",
      {
        input: 図({ type: "quadrant", axes: { x: { lft: "安い", right: "高い" } } }),
        path: "$.axes.x.lft",
      },
    ),
    見本(
      "縦軸の名前",
      (k) =>
        `title: "t"\ntype: quadrant\naxes:\n  y: { bottom: "少ない", ${k}: "多い" }\n\nactors:\n  - A\n`,
      "tpo",
      "top",
      {
        input: 図({ type: "quadrant", axes: { y: { bottom: "少ない", tpo: "多い" } } }),
        path: "$.axes.y.tpo",
      },
    ),
  ],
  readouts: [
    見本(
      "値を見せる部品",
      (k) =>
        `${頭}states:\n  total: 10\n\nreadouts:\n  ring: { kind: percent-ring, source: total, max: 500, ${k}: "x" }\n\nactors:\n  - A\n`,
      "lable",
      "label",
      {
        input: 図({
          states: { total: 10 },
          readouts: [{ id: "ring", kind: "percent-ring", source: "total", max: 500, lable: "x" }],
        }),
        path: "$.readouts[0].lable",
      },
    ),
  ],
  inputs: [
    見本(
      "つまみ",
      (k) =>
        `${頭}inputs:\n  v: { kind: slider, min: 0, max: 100, defaultValue: 50, ${k}: "x" }\n\nactors:\n  - A\n`,
      "lable",
      "label",
      {
        input: 図({
          inputs: [{ id: "v", kind: "slider", min: 0, max: 100, defaultValue: 50, lable: "x" }],
        }),
        path: "$.inputs[0].lable",
      },
    ),
  ],
  events: [
    見本(
      "出来事",
      (k) => `${頭}actors:\n  - A\n\nevents:\n  - { on: click, box: A, ${k}: toggle }\n`,
      "handelr",
      "handler",
      {
        input: 図({ events: [{ on: "click", box: "A", handelr: "toggle" }] }),
        path: "$.events[0].handelr",
      },
    ),
  ],
  scrolls: [
    見本(
      "巻き上げ",
      (k) => `${頭}scrolls:\n  intro: { start: 0.9, end: 0.1, ${k}: 1 }\n\nactors:\n  - A\n`,
      "scrbu",
      "scrub",
      {
        input: 図({ scrolls: { intro: { start: 0.9, end: 0.1, scrbu: 1 } } }),
        path: "$.scrolls.intro.scrbu",
      },
    ),
  ],
};

const 知らせ = (src: string) => {
  const r = parseTextDslV05(src);
  return r.ok ? [] : r.errors;
};

const 項目名の知らせ = (src: string) =>
  知らせ(src).filter((e) => e.message.includes("項目名が読めません"));

const 走査する見本 = (Object.entries(見本の表) as [最上位, 綴り違いの見本[] | 項目名を持たない][])
  .filter((kv): kv is [最上位, 綴り違いの見本[]] => Array.isArray(kv[1]))
  .flatMap(([鍵, 並び]) => 並び.map((s) => ({ 鍵, ...s })));

describe("記法のどの欄に知らない項目名を書いても知らせる (#1968)", () => {
  it("見本の表は最上位の項目を全て鍵に持つ", () => {
    expect(
      TOP_LEVEL_KEYS.length,
      "最上位の項目が 1 つも無い (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(Object.keys(見本の表).sort()).toEqual([...TOP_LEVEL_KEYS].sort());
  });

  it("項目名を持たないとした欄は理由を書いている", () => {
    const 理由が空 = Object.entries(見本の表)
      .filter(([, v]) => !Array.isArray(v) && v.項目名を持たない理由.trim() === "")
      .map(([k]) => k);
    expect(理由が空).toEqual([]);
  });

  it("走査する見本が 1 件以上ある", () => {
    // 表の書き方を誤ると flatMap が空になり、下の検査が 1 件も回らずに通る
    expect(走査する見本.length, "走査する見本が無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  for (const s of 走査する見本) {
    describe(`${s.鍵} — ${s.名}`, () => {
      it("見本の行番号を読み取れている", () => {
        expect(s.行, "綴り違いの行が見本の中に見つからない").toBeGreaterThan(0);
      });

      it("綴り違いを行番号と使える項目つきで知らせる", () => {
        const 該当 = 項目名の知らせ(s.記法).filter((e) => e.message.includes(`"${s.項目名}"`));
        expect(該当, `"${s.項目名}" の知らせが無い`).toHaveLength(1);
        expect(該当[0]!.line).toBe(s.行);
        expect(該当[0]!.hint ?? "").toContain("使える項目");
        expect(該当[0]!.message, "助詞が重なっている").not.toContain("の の");
      });

      it("正しい項目名に直すと項目名の知らせは出ない", () => {
        expect(項目名の知らせ(s.正しい記法)).toEqual([]);
      });

      it("同じ綴り違いを JSON の入口も誤りにする", () => {
        const r = validateDragonJson(s.json.input);
        expect(r.ok, "JSON の入口が綴り違いを通している").toBe(false);
        if (r.ok) return;
        expect(r.errors.map((e) => e.path)).toContain(s.json.path);
      });
    });
  }
});

describe("視点を縦に並べる形で、欄の形に合わない行を捨てない (#1968)", () => {
  it("欄の形に合わない行を行番号つきで知らせる", () => {
    const src = `${頭}viewport:\n  laneGap: 300\n  - x\n\nactors:\n  - A\n`;
    const 該当 = 知らせ(src).filter((e) => e.message.includes("viewport の行が読めません"));
    expect(該当, "読めない行を黙って捨てている").toHaveLength(1);
    expect(該当[0]!.line).toBe(5);
  });

  it("先頭に `- ` を付けた欄は読む", () => {
    const r = parseTextDslV05(`${頭}viewport:\n  laneGap: 300\n  - scale: 2\n\nactors:\n  - A\n`);
    expect(r.ok, "欄の形の行を誤りにしている").toBe(true);
    if (r.ok) expect(r.doc.viewport).toMatchObject({ laneGap: 300, scale: 2 });
  });
});

describe("使える項目の一覧が JSON の入口と揃っている (#1968)", () => {
  /**
   * 記法の一覧は各欄の表から導く。 JSON の一覧 (`ACCEPTED_KEYS`) と食い違うと、同じ項目が
   * 片方の入口でだけ誤りになる。
   *
   * 縦列の位置のずらしは、JSON が `pos` 1 欄、記法が `offsetX` / `offsetY` の 2 欄で書く (#1971)。
   * 記法の `pos:` は箱の座標の意味で使われているため別の名前にしてあり、どちらも同じ `layoutPos` に入る。
   */
  const 記法だけに無い: Record<string, readonly string[]> = { lane: ["pos"] };
  const JSONだけに無い: Record<string, readonly string[]> = { lane: ["offsetX", "offsetY"] };

  const 組: [string, readonly string[], readonly string[]][] = [
    ["viewport", Object.keys(VIEWPORT_VALUE_KINDS), ACCEPTED_KEYS.viewport],
    ["lane", LANE_INLINE_KEYS, ACCEPTED_KEYS.lane],
    ["group", GROUP_INLINE_KEYS, ACCEPTED_KEYS.group],
    ["axesX", AXIS_X_KEYS, ACCEPTED_KEYS.axesX],
    ["axesY", AXIS_Y_KEYS, ACCEPTED_KEYS.axesY],
  ];

  for (const [層, 記法, json] of 組) {
    it(`${層}`, () => {
      expect(記法.length, `${層} の一覧が空 (検査が空振りしている)`).toBeGreaterThan(0);
      const 除く = 記法だけに無い[層] ?? [];
      const 記法で除く = JSONだけに無い[層] ?? [];
      expect([...記法].filter((k) => !記法で除く.includes(k)).sort()).toEqual(
        json.filter((k) => !除く.includes(k)).sort(),
      );
    });
  }
});
