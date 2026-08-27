/**
 * DSL parse error messages coverage (iter27、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter27。
 * 意図的に壊れた DSL について textDslToDiagram が (a) throw する or (b) 有効
 * output を返さないことを verify。 silent success (壊れた DSL が silent に空 diagram を返す)
 * regression を検知。
 */
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { textDslToDiagram } from "../src/index";
import { parseTextDslV05 } from "../src/v05";
import { ACTOR_ITEM_KEYS } from "../src/v05/parser";

describe("iter27: DSL parse error messages coverage", () => {
  it("空 DSL は空 diagram or throw (silent-empty regression check)", () => {
    const dsl = ``;
    let threw = false;
    let compiled;
    try {
      compiled = textDslToDiagram(dsl);
    } catch {
      threw = true;
    }
    // 空 DSL は throw or 空 nodes のどちらか
    if (!threw && compiled) {
      expect(compiled.nodes.length, "empty DSL empty nodes").toBe(0);
    }
  });

  it("type 欠落 DSL は throw (parse error 明示)", () => {
    const dsl = `title: "t"
actors:
  - A
flow:
  - A -> A: "x"
`;
    // type field は required、 parse error message を throw する
    expect(() => textDslToDiagram(dsl)).toThrow(/parse error|type/i);
  });

  it("actors 欠落 DSL でも compile 継続 (defensive)", () => {
    const dsl = `title: "t"
type: sequence
flow:
  - A -> A: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("flow のみ (actor 定義なし) でも throw なし", () => {
    const dsl = `title: "t"
type: sequence
flow:
  - X -> Y: "hello"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("不明 kind の parts unified syntax は catalog lookup 失敗で fallback", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - alias1: { kind: nonexistent-kind }
flow:
  - A -> A: "x"
`;
    // catalog に無い kind 指定 = fallback (throw なし or degraded compile)
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("valid 最小 DSL は成功", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "hi"
`;
    const compiled = textDslToDiagram(dsl);
    expect(compiled).toBeDefined();
    expect(compiled.nodes.length).toBeGreaterThan(0);
  });

  it("複数行 label が escape なしで throw しない", () => {
    const dsl = `title: "test"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "line1 line2"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });
});

/**
 * 縦に並べた項目名の綴り誤りを知らせるか。
 *
 * パーツでない箱に書いた見知らぬ項目は、 状態の上書きとして拾われた後どこにも入らずに
 * 消える。 黙って捨てると「書いたのに図が変わらない」 が手掛かりなしで起きる。
 */
describe("項目名の綴り誤り", () => {
  const wrap = (item: string): string => `title: "t"
type: flow
actors:
  - Web: service
  - API:
      kind: service
${item}
flow:
  - Web -> API: "a"
`;

  it("使えない項目名を書いたら行番号付きで知らせる", () => {
    const r = parseTextDslV05(wrap('      補足文: "APIサーバー"'));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.message.includes("項目名が読めません"));
    expect(e).toBeDefined();
    expect(e!.message).toContain("補足文");
    expect(e!.line).toBeGreaterThan(0);
    // 何が使えるかを並べて、 直せるようにする
    expect(e!.hint).toContain("補足");
    expect(e!.hint).toContain("位置");
    expect(e!.hint).toContain("色");
  });

  /** 項目名ごとに、 その項目が受け付ける形の値。 */
  const VALUE_OF: Record<string, string> = {
    kind: "database",
    種類: "database",
    subtitle: '"APIサーバー"',
    補足: '"APIサーバー"',
    value: "42",
    値: "42",
    previous: "38",
    前の値: "38",
    rows: '["id: PK"]',
    行: '["id: PK"]',
    位置: "300,200",
    pos: "300,200",
    posX: "300",
    posY: "200",
    大きさ: "400,180",
    size: "400,180",
    倍率: "2",
    scale: "2",
    lane: "l1",
    stack: "1",
    // 体験の道筋の欄 (#1251)。 解析は図種を見ないので、どの図種でも読める
    touchpoint: '"申込み画面"',
    opportunity: '"入力を減らす"',
    // 工程の並びの欄 (#1251)
    owner: '"デザイナー"',
    end: '"Q3"',
    色: "失敗",
    color: "失敗",
    tone: "失敗",
    // 箱の中に描く図形 (#1374)。 中括弧の中に種類ごとの欄を書く
    shape: "{ kind: wave, level: 50, amplitude: 100 }",
    図形: "{ kind: wave, level: 50, amplitude: 100 }",
    // その箱を出すかどうかの条件 (#1381)
    visibleIf: '"{flag}"',
    出す条件: '"{flag}"',
    // 箱に出す題 (#1381)
    title: '"題"',
    題: '"題"',
    // 値に追随する 5 欄 (#1392)
    wBind: '"{barW}"',
    hBind: '"{barH}"',
    opacity: "0.5",
    renderOffsetX: "30",
    renderOffsetY: '"{dy}"',
  };

  /**
   * パーツにだけ効く項目名 (#1026)。
   *
   * 倍率は図形の大きさを変えるもので、普通の箱には効かない。 普通の箱に書いた時は
   * 「書いたのに図が変わらない」 を避けるため綴り誤りとして知らせる。
   */
  const PARTS_ONLY = new Set(["倍率", "scale"]);

  /** パーツの中に項目を 1 行置いた本文。 */
  const wrapPart = (item: string): string => `title: "t"
type: flow
actors:
  - Web: service
  - g:
      kind: arc-gauge
${item}
flow:
  - Web -> Web: "a"
`;

  it("知らせに並べる項目名は全て実際に使える (一覧と実装がずれない)", () => {
    for (const key of ACTOR_ITEM_KEYS) {
      const value = VALUE_OF[key];
      expect(value, `${key} の値の例が test に無い`).toBeDefined();
      const src = PARTS_ONLY.has(key)
        ? wrapPart(`      ${key}: ${value}`)
        : wrap(`      ${key}: ${value}`);
      const r = parseTextDslV05(src);
      const detail = r.ok ? "" : r.errors.map((e) => e.message).join(" / ");
      expect(r.ok, `項目 ${key} が通らない: ${detail}`).toBe(true);
    }
  });

  it("倍率を普通の箱に書いたら知らせる (3 つの書き方すべてで)", () => {
    // 黙って捨てると「書いたのに大きさが変わらない」 が手掛かりなしで起きる。
    // 縦に並べた形だけ知らせて他が黙ると、書き方を変えた時だけ知らせが出ることになる
    const forms: Array<[string, string]> = [
      [
        "縦に並べた形",
        `title: "t"\ntype: flow\nactors:\n  - Web: service\n  - API:\n      kind: service\n      倍率: 2\nflow:\n  - Web -> API: "a"\n`,
      ],
      [
        "中括弧の形",
        `title: "t"\ntype: flow\nactors:\n  - Web: service\n  - API: { kind: service, 倍率: 2 }\nflow:\n  - Web -> API: "a"\n`,
      ],
      [
        "空白区切りの形",
        `title: "t"\ntype: flow\nactors:\n  - Web: service\n  - API: service scale=2\nflow:\n  - Web -> API: "a"\n`,
      ],
    ];
    for (const [name, src] of forms) {
      const r = parseTextDslV05(src);
      expect(r.ok, `${name} が黙って通っている`).toBe(false);
      if (r.ok) continue;
      expect(
        r.errors.some((e) => e.message.includes("項目名が読めません")),
        `${name} の知らせが無い (${r.errors.map((e) => e.message).join(" / ")})`,
      ).toBe(true);
    }
  });

  it("別名を 2 つ書いたら先に並べた名前を採る", () => {
    // 後勝ちにすると、画面側 (常に scale 優先) と経路で 2 と 3 に割れる
    const cases: Array<[string, string]> = [
      [
        "縦に並べた形",
        `title: "t"\ntype: flow\nactors:\n  - g:\n      kind: arc-gauge\n      scale: 2\n      倍率: 3\nflow:\n  - g -> g: "a"\n`,
      ],
      [
        "中括弧の形",
        `title: "t"\ntype: flow\nactors:\n  - g: { kind: arc-gauge, scale: 2, 倍率: 3 }\nflow:\n  - g -> g: "a"\n`,
      ],
      [
        "空白区切りの形",
        `title: "t"\ntype: flow\nactors:\n  - g: arc-gauge scale=2 倍率=3\nflow:\n  - g -> g: "a"\n`,
      ],
    ];
    for (const [name, src] of cases) {
      const r = parseTextDslV05(src);
      expect(r.ok, `${name} が読めない`).toBe(true);
      if (!r.ok) continue;
      expect(
        r.doc.actors.find((a) => a.name === "g")?.scale,
        `${name} で後の名前が勝っている`,
      ).toBe(2);
    }
  });

  it("実装が受け付ける項目名を 1 つも取りこぼさない (一覧が古くならない)", async () => {
    // 一覧は手書きなので、 分岐に項目を足して一覧を忘れると「使えるのに知らせに出ない」 になる。
    // 実装の分岐を読んで突き合わせる
    const src = await readFile(new URL("../src/v05/parser.ts", import.meta.url), "utf8");
    const start = src.indexOf("function applyContinuationLines");
    expect(start, "対象の関数が見つからない").toBeGreaterThan(0);
    const end = src.indexOf("\nfunction ", start + 1);
    const body = src.slice(start, end > 0 ? end : undefined);
    const cases = [...body.matchAll(/case "([^"]+)":/g)].map((m) => m[1]!);
    expect(cases.length, "分岐が読めていない").toBeGreaterThan(5);
    for (const key of cases) {
      expect(ACTOR_ITEM_KEYS.has(key), `項目 "${key}" が知らせの一覧に無い`).toBe(true);
    }
  });

  it("パーツの状態の上書きは見知らぬ名前でも通す (状態名はパーツごとに違う)", () => {
    const r = parseTextDslV05(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      v: 50
      cpuC: "#f59e0b"
flow:
  - Web -> Web: "a"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const part = r.doc.actors.find((a) => a.name === "実績")!;
    expect(part.stateOverride).toMatchObject({ v: 50, cpuC: "#f59e0b" });
  });
});
