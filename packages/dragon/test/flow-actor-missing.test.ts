/**
 * 矢印が `actors` に無い名前を指した時の扱い (#1209)。
 *
 * 知らせずに通すと、 **どちらに転んでも書いた人の意図が消える**。
 *
 * | 動き | 旧挙動 |
 * |---|---|
 * | 書いていない | 種類ごとの組み立てが actors を順に繋ぐため、 書いた矢印が捨てられ label も消える |
 * | 書いた | 名前がそのまま下流へ渡り、 存在しない node を指す図ができて描画の直前で落ちる |
 *
 * 前者は静かに違う図になり、 後者は本文から遠い場所で落ちる。 どちらも書いた行を指して
 * 知らせ、 動きの経路では壊れた図を作らない。
 */
import { describe, it, expect } from "vitest";
import { compile } from "@cardenelabs/cdl";
import type { CompileNotice } from "../src/index";
import { textDslToDiagram } from "../src/index";

/** 知らせを集めながら組み立てる */
const 組み立てる = (src: string) => {
  const 知らせ: CompileNotice[] = [];
  const d = textDslToDiagram(src, { onNotice: (n) => 知らせ.push(n) });
  return { d, 知らせ, 未知: 知らせ.filter((n) => n.kind === "flow-actor-missing") };
};

/** Issue の最小再現。 `as v` は別名にならず名前の一部になるため、 `v` は actors に無い */
const 再現 = (animation: boolean) => `title: "t"
type: flow
actors:
  - 検証 as v: { kind: process }
  - 変換 as c: { kind: process }
flow:
  - v -> c: "変換"
${animation ? 'animation:\n  - step: "s" 1.0s\n' : ""}`;

/** 名前を素直に書いた図 (矢印が actors を指す) */
const 素直な図 = (animation: boolean) => `title: "t"
type: flow
actors:
  - 検証
  - 変換
flow:
  - 検証 -> 変換: "変換"
${animation ? 'animation:\n  - step: "s" 1.0s\n' : ""}`;

describe("矢印が actors に無い名前を指した時 (#1209)", () => {
  it.each([false, true])("動き %s でも組み立てが落ちない", (animation) => {
    // 旧挙動は動きを書いた側だけ `unknown-ref` で落ちていた
    const { d } = 組み立てる(再現(animation));
    expect(() => compile(d)).not.toThrow();
  });

  it.each([false, true])("動き %s で、 指せていない名前を知らせる", (animation) => {
    const { 未知 } = 組み立てる(再現(animation));
    expect(未知.map((n) => n.actor).sort()).toEqual(["c", "v"]);
    // 書いた行を指す (本文から遠い場所で落ちる / 消えるのを防ぐのが目的)
    for (const n of 未知) expect(n.line).toBe(7);
    // 何を書けばよいかを添える
    for (const n of 未知) expect(n.hint).toContain("検証 as v");
  });

  it("同じ名前を 2 度知らせない", () => {
    const { 未知 } = 組み立てる(`title: "t"
type: flow
actors:
  - 検証
flow:
  - 検証 -> 未知: "1"
  - 未知 -> 検証: "2"
`);
    expect(未知.map((n) => n.actor)).toEqual(["未知"]);
  });

  it("順序図の動き経路でも、 解決できない矢印を落とす", () => {
    // 順序図は別の組み立て経路を通る。 汎用の経路だけ直しても、 こちらは名前をそのまま
    // lane id として使い、 存在しない lane に箱を置いた図を作る
    const { d, 未知 } = 組み立てる(`title: "t"
type: sequence
actors:
  - 検証
  - 変換
flow:
  - v -> c: "変換"
animation:
  - step: "s" 1.0s
`);
    expect(未知.map((n) => n.actor).sort()).toEqual(["c", "v"]);
    expect(d.edges).toEqual([]);
    expect(() => compile(d)).not.toThrow();
    // lane は actors の分だけ。 存在しない lane を作っていない
    expect(d.lanes.map((l) => l.id).sort()).toEqual(["検証", "変換"].map((n) => n).sort());
  });

  it("動きを書いた図では、 解決できない矢印を落とす", () => {
    // 名前をそのまま id として使うと、 存在しない node を指す矢印が図に残る
    const { d } = 組み立てる(再現(true));
    expect(d.edges).toEqual([]);
    // node は actors の分だけ残る (矢印だけを落とす)
    expect(d.nodes.map((n) => n.id)).toEqual(["検証-as-v", "変換-as-c"]);
  });
});

describe("素直に書いた図は変わらない (#1209)", () => {
  it.each([false, true])("動き %s で知らせが出ない", (animation) => {
    const { 未知 } = 組み立てる(素直な図(animation));
    expect(未知).toEqual([]);
  });

  it.each([false, true])("動き %s で矢印が残る", (animation) => {
    const { d } = 組み立てる(素直な図(animation));
    expect(d.edges.length).toBeGreaterThan(0);
    expect(() => compile(d)).not.toThrow();
  });

  it.each([
    ["flow", false],
    ["flow", true],
    ["swimlane", false],
    ["swimlane", true],
  ] as const)("%s (動き %s) で slugで指しても、 名前で指したのと同じ図になる", (種類, animation) => {
    // **図種と動きの有無で扱いが割れてはいけない** (Round 1 の指摘)。
    //
    // 動きを書いた図は slug に落として引き、 書いていない図は名前の完全一致で引く。
    // 揃える前は `api-gateway -> db` と書くと、 知らせは出ないのに flow の label が
    // "→" に変わり、 swimlane の題が slug に化けていた (実測)。
    const 本文 = (指し方: [string, string]) => `title: "t"
type: ${種類}
actors:
  - API Gateway
  - DB
flow:
  - ${指し方[0]} -> ${指し方[1]}: "問い合わせ"
${animation ? 'animation:\n  - step: "s" 1.0s\n' : ""}`;

    const slugで = 組み立てる(本文(["api-gateway", "db"]));
    const 名前で = 組み立てる(本文(["API Gateway", "DB"]));

    expect(slugで.未知).toEqual([]);
    expect(slugで.d.edges.map((e) => e.label)).toEqual(名前で.d.edges.map((e) => e.label));
    expect(slugで.d.nodes.map((n) => n.title)).toEqual(名前で.d.nodes.map((n) => n.title));
    // 題が slug に化けていないことを直接も見る
    expect(slugで.d.nodes.map((n) => n.title)).toEqual(["API Gateway", "DB"]);
    expect(slugで.d.edges.map((e) => e.label)).toEqual(["問い合わせ"]);
  });

  it("slug で書いた矢印を光らせても誤報しない", () => {
    // 流れは入口で名前へ揃えている一方、 光らせる指定は生のまま来る。 揃えずに比べると
    // 実際は光るのに「見つかりません」 と誤報する (Round 2 の指摘)
    const 知らせ: CompileNotice[] = [];
    const d = textDslToDiagram(
      `title: "t"
type: flow
actors:
  - API Gateway
  - DB
flow:
  - api-gateway -> db: "問い合わせ"
animation:
  - step: "s" 1.0s
    focus: [api-gateway -> db]
`,
      { onNotice: (n) => 知らせ.push(n) },
    );
    expect(知らせ.filter((n) => n.kind === "focus-target-missing")).toEqual([]);
    // 誤報が消えただけでなく、 実際に光っていることも見る
    expect(d.phases?.[0]?.activate).toContain("e0-api-gateway-db");
  });

  it("知らせの hint は actors が多くても短いまま", () => {
    // 知らせごとに全 actor 名を並べ直すと、 名前も矢印も上限まで書いた図で数百 MB になる
    const 名前 = Array.from({ length: 200 }, (_, i) => `  - actor${i}`).join("\n");
    const { 未知 } = 組み立てる(`title: "t"
type: flow
actors:
${名前}
flow:
  - 居ない -> actor0: "x"
`);
    expect(未知).toHaveLength(1);
    expect(未知[0]!.hint!.length).toBeLessThan(200);
    expect(未知[0]!.hint).toContain("ほか 192 件");
  });

  it("2 つの名前が同じ slug になる時は受けない", () => {
    // どちらを指したか決められない。 受けると「知らせは出ないのに矢印が別の相手を指す」
    const { 未知 } = 組み立てる(`title: "t"
type: flow
actors:
  - "A B"
  - "A  B"
flow:
  - a-b -> "A B": "x"
`);
    expect(未知.map((n) => n.actor)).toEqual(["a-b"]);
  });
});

/**
 * `as` は dragon の記法ではない (#1209 の前提の訂正)。
 *
 * Issue は「`as` で別名を付けた actor」 と書いているが、 `parseActor` が受ける 5 形式に
 * 別名は無い。 `検証 as v` は名前そのものになる。 実装が変わったら気付けるよう固定する。
 */
describe("as は別名にならない (#1209)", () => {
  it("名前の一部として扱う", () => {
    const { d } = 組み立てる(再現(false));
    expect(d.nodes.map((n) => n.title)).toEqual(["検証 as v", "変換 as c"]);
  });
});
