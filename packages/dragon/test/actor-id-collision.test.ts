/**
 * 名前から作る id が重なると図が組み立たない件 (#1220)。
 *
 * 箱と枠の id は登場人物の名前から作る (`slugify`)。 **違う名前が同じ id に潰れる** と、
 * どちらも正しく書いているのに図が落ちる (実測 = `foo-bar` と `Foo Bar` で 9 図種が
 * `duplicate-id`)。 知らせも出ない = どちらの名前も `actors` に在るため。
 *
 * ## なぜ名前を作り替えるのか
 *
 * id を作る所は 90 箇所を超え、 さらに **cdl 側の組み立てが名前から id を作る経路** がある
 * (`swimlane()` / `er()` は渡した名札から lane id を作る)。 dragon 側だけを直しても届かない。
 * 渡す名前を変え、 出口で表示だけ戻す。
 */
import { describe, it, expect } from "vitest";
import { compile } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { CdlDiagram, CompileNotice } from "../src/index";

/** 登場人物ごとに箱を作る 9 図種 = id が名前から決まる群 */
const 箱を作る図種 = [
  "sequence",
  "flow",
  "swimlane",
  "er",
  "state",
  "topology",
  "solidity",
  "class",
  "c4",
] as const;

/** 図全体を 1 箱で描く 9 図種 = 中身を payload が持つ群 */
const 一箱の図種 = [
  "gantt",
  "pie",
  "bar",
  "line",
  "funnel",
  "tree",
  "journey",
  "quadrant",
  "mind",
] as const;

const 記法 = (type: string, actors: string[], flow: string[] = []): string =>
  [
    'title: "t"',
    `type: ${type}`,
    "",
    "actors:",
    ...actors.map((a) => `  - ${a}`),
    ...(flow.length > 0 ? ["", "flow:", ...flow.map((f) => `  - ${f}`)] : []),
    "",
  ].join("\n");

const 組む = (src: string): { 図: CdlDiagram; 知らせ: CompileNotice[] } => {
  const 知らせ: CompileNotice[] = [];
  const 図 = textDslToDiagram(src, { onNotice: (n) => 知らせ.push(n) });
  return { 図, 知らせ };
};

/** 同じ id になる 2 つの名前 (どちらも slug は `foo-bar`) */
const 衝突する2人 = ['foo-bar: "10"', 'Foo Bar: "20"'];

describe("同じ id に潰れる名前を書いても組み立てが通る", () => {
  for (const type of 箱を作る図種) {
    it(`${type}`, () => {
      const { 図 } = 組む(記法(type, 衝突する2人, ['foo-bar -> Foo Bar: "x"']));
      expect(() => compile(図)).not.toThrow();
    });
  }

  for (const type of 一箱の図種) {
    it(`${type} (1 箱で描く群も通る)`, () => {
      const { 図 } = 組む(記法(type, 衝突する2人, ['foo-bar -> Foo Bar: "x"']));
      expect(() => compile(図)).not.toThrow();
    });
  }
});

describe("それぞれが別の箱として描かれる", () => {
  it("id が違う", () => {
    const { 図 } = 組む(記法("state", 衝突する2人, ['foo-bar -> Foo Bar: "x"']));
    const ids = 図.nodes.map((n) => n.id);
    expect(new Set(ids).size, `id が重なっている: ${ids.join(", ")}`).toBe(ids.length);
    expect(ids).toHaveLength(2);
  });

  it("題は書いた名前のまま", () => {
    // 作り替えるのは id を分けるためで、 見える文字は元のまま
    const { 図 } = 組む(記法("state", 衝突する2人, ['foo-bar -> Foo Bar: "x"']));
    expect(図.nodes.map((n) => n.title).sort()).toEqual(["Foo Bar", "foo-bar"]);
  });

  it("枠の名札も書いた名前のまま", () => {
    const { 図 } = 組む(記法("swimlane", 衝突する2人, ['foo-bar -> Foo Bar: "x"']));
    expect(図.lanes.map((l) => l.label).sort()).toEqual(["Foo Bar", "foo-bar"]);
  });

  it("矢印が別々の相手を指す", () => {
    const { 図 } = 組む(記法("state", 衝突する2人, ['foo-bar -> Foo Bar: "渡す"']));
    expect(図.edges).toHaveLength(1);
    const e = 図.edges[0]!;
    expect(e.from, "自分を指している").not.toBe(e.to);
    expect(e.label).toBe("渡す");
  });

  it("3 つ衝突しても全部 id が違う", () => {
    const { 図 } = 組む(記法("state", ["foo-bar", "Foo Bar", "FOO BAR"]));
    const ids = 図.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(3);
    expect(図.nodes.map((n) => n.title).sort()).toEqual(["FOO BAR", "Foo Bar", "foo-bar"]);
  });
});

describe("衝突していない図の id が変わらない", () => {
  it("素直に書いた図の id は名前の slug そのまま", () => {
    const { 図 } = 組む(記法("state", ["A", "B"], ['A -> B: "x"']));
    expect(図.nodes.map((n) => n.id)).toEqual(["a", "b"]);
  });

  it("衝突する組と衝突しない組が混ざっても、 衝突しない方は変わらない", () => {
    const { 図 } = 組む(記法("state", ["A", "foo-bar", "Foo Bar"]));
    const 素の = 図.nodes.filter((n) => n.title === "A");
    expect(素の.map((n) => n.id)).toEqual(["a"]);
  });
});

describe("id の付け方が書き順に依らない", () => {
  const idの表 = (actors: string[]): Record<string, string> => {
    const { 図 } = 組む(記法("state", actors));
    return Object.fromEntries(図.nodes.map((n) => [n.title, n.id]));
  };

  it("並べ替えても同じ名前は同じ id になる", () => {
    // 連番を付けると、 並べ替えただけで id が入れ替わる
    expect(idの表(["foo-bar", "Foo Bar"])).toEqual(idの表(["Foo Bar", "foo-bar"]));
  });

  it("3 つでも並べ替えに依らない", () => {
    const a = idの表(["foo-bar", "Foo Bar", "FOO BAR"]);
    const b = idの表(["FOO BAR", "foo-bar", "Foo Bar"]);
    expect(a).toEqual(b);
  });

  it("関係ない登場人物を足しても id が変わらない", () => {
    const a = idの表(["foo-bar", "Foo Bar"]);
    const b = idの表(["foo-bar", "Foo Bar", "まったく別の人"]);
    expect(b["foo-bar"]).toBe(a["foo-bar"]);
    expect(b["Foo Bar"]).toBe(a["Foo Bar"]);
  });
});

describe("1 箱で描く図種は作り替えない", () => {
  // 中身は payload が持ち、 題も payload の中に入る。 表示を戻すのは箱の題と枠の名札だけ
  // なので、 作り替えると payload の題が作り替えたまま残る
  it("木の payload の題が書いた名前のまま", () => {
    const { 図 } = 組む(記法("tree", 衝突する2人, ['foo-bar -> Foo Bar: "x"']));
    const 題 = 図.nodes[0]!.treeData!.map((n) => n.title).sort();
    expect(題, "payload の題が作り替えられている").toEqual(["Foo Bar", "foo-bar"]);
  });

  it("放射は独自の扱いのまま (中心と同じ id の枝は載せず知らせる)", () => {
    // `#1177` で決めた扱い。 中央で作り替えると id が分かれてこの知らせが出なくなる
    const { 図, 知らせ } = 組む(記法("mind", 衝突する2人));
    const m = 図.nodes[0]!.mindData!;
    expect(m.rootTitle, "中心の題が作り替えられている").toBe("foo-bar");
    expect(m.branches, "枝が載っている").toEqual([]);
    expect(知らせ.filter((n) => n.message.includes("既にある id")).length).toBeGreaterThan(0);
  });

  it("値で描く図の payload の題も書いた名前のまま", () => {
    const { 図 } = 組む(記法("pie", 衝突する2人));
    const 題 = 図.nodes[0]!.chartData!.map((d) => d.label).sort();
    expect(題).toEqual(["Foo Bar", "foo-bar"]);
  });
});

describe("まったく同じ名前は畳んで知らせる", () => {
  it("先に書いた方だけ残る", () => {
    // 名前が 1 文字も違わない登場人物は区別できない。 2 つの箱に同じ題が付くだけになる
    const { 図, 知らせ } = 組む(記法("state", ["A", "A", "B"]));
    expect(図.nodes.map((n) => n.title)).toEqual(["A", "B"]);
    const 該当 = 知らせ.filter((n) => n.message.includes("2 度書いています"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.actor).toBe("A");
  });

  it("1 度しか書いていない名前では知らせない", () => {
    const { 知らせ } = 組む(記法("state", ["A", "B"]));
    expect(知らせ.filter((n) => n.message.includes("2 度書いています"))).toEqual([]);
  });
});

describe("見本 (parts) を重ねた登場人物は数えない", () => {
  const 図録 = {
    badge: {
      id: "badge",
      topic: "見本",
      lanes: [{ id: "l", x: 0, width: 200 }],
      nodes: [{ id: "mark", lane: "l", stack: 0, kind: "card" as const, title: "印" }],
      edges: [],
      states: [],
      phases: [],
    },
  };

  it("素の名前と見本の別名が同じ slug でも、 別名を変えない", () => {
    // 見本の中身は `別名__元の id` の形で名前空間を持つため、 素の名前と id が重ならない。
    // 数えると別名が変わり、 見本の id が総入れ替えになる
    const src = 記法("sequence", ["A", "a: { kind: badge }"], ['A -> A: "x"']);
    const 図 = textDslToDiagram(src, { partsCatalog: 図録 });
    expect(図.nodes.some((n) => n.id.startsWith("a__")), "見本の別名が変わっている").toBe(true);
  });
});
