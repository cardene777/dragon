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

describe("cdl 側の規則でだけ重なる名前 (Round 1 r1-f1)", () => {
  // dragon は `-` と `_` を残すが、 cdl はどちらも `-` に潰す。 このため `a_b` と `a-b` は
  // **dragon では別 id、 cdl では同じ id** になる
  const 片方だけ重なる2人 = ["a_b", "a-b"];

  for (const type of 箱を作る図種) {
    it(`${type} で組み立てが通る`, () => {
      const { 図 } = 組む(記法(type, 片方だけ重なる2人, ['a_b -> a-b: "x"']));
      expect(() => compile(図)).not.toThrow();
    });
  }

  it("それぞれ別の箱になり、 題は書いた名前のまま", () => {
    const { 図 } = 組む(記法("sequence", 片方だけ重なる2人, ['a_b -> a-b: "x"']));
    const 題 = 図.nodes.map((n) => n.title).filter((t) => t !== "");
    expect(new Set(題)).toEqual(new Set(["a_b", "a-b"]));
  });

  it("dragon の規則だけで重なる名前も引き続き通る", () => {
    const { 図 } = 組む(記法("sequence", ["foo-bar", "Foo Bar"], ['foo-bar -> Foo Bar: "x"']));
    expect(() => compile(図)).not.toThrow();
  });
});

describe("長い名前でも尾が落ちない (Round 1 r1-f2)", () => {
  // id は 64 字で切られる。 尾を後ろに足すだけだと、 同じ頭を持つ長い名前で尾が落ちる
  const 長い = (末尾: string): string => "a".repeat(64) + 末尾;

  it("64 字を超える同じ頭の名前 2 つで組み立てが通る", () => {
    const { 図 } = 組む(記法("state", [長い("x"), 長い("y")]));
    expect(() => compile(図)).not.toThrow();
  });

  it("id が重ならず、 長さの上限も超えない", () => {
    const { 図 } = 組む(記法("state", [長い("x"), 長い("y")]));
    const ids = 図.nodes.map((n) => n.id);
    expect(new Set(ids).size, `id が重なっている: ${ids.join(", ")}`).toBe(ids.length);
    for (const id of ids) expect(id.length, `id が長すぎる: ${id}`).toBeLessThanOrEqual(64);
  });

  it("長い名前でも題は書いたまま", () => {
    const { 図 } = 組む(記法("state", [長い("x"), 長い("y")]));
    expect(図.nodes.map((n) => n.title).sort()).toEqual([長い("x"), 長い("y")].sort());
  });
});

describe("見本と素の登場人物が重なる時 (Round 1 r1-f3)", () => {
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
  const 組む見本 = (actors: string[], flow: string[] = []): CdlDiagram =>
    textDslToDiagram(記法("sequence", actors, flow), { partsCatalog: 図録 });

  it("素の登場人物の箱が消えない", () => {
    // 仮置きの id を共有すると、 見本を片付ける時に素の登場人物の箱まで消える
    const 図 = 組む見本(["A", "a: { kind: badge }", "B"], ['A -> B: "x"']);
    expect(図.nodes.some((n) => n.title === "A"), "素の登場人物の箱が消えている").toBe(true);
    expect(図.nodes.some((n) => n.id.startsWith("a__")), "見本の中身が消えている").toBe(true);
  });

  it("見本の別名は変わらない", () => {
    // 見本を作り替えると、 見本の id が総入れ替えになる
    const 図 = 組む見本(["A", "a: { kind: badge }"], ['A -> A: "x"']);
    expect(図.nodes.some((n) => n.id.startsWith("a__"))).toBe(true);
  });

  it("素の登場人物どうしが重なる図でも見本は無事", () => {
    const 図 = 組む見本(["foo-bar", "Foo Bar", "b: { kind: badge }"], ['foo-bar -> Foo Bar: "x"']);
    expect(図.nodes.some((n) => n.id.startsWith("b__"))).toBe(true);
    expect(図.nodes.filter((n) => n.title === "foo-bar" || n.title === "Foo Bar").length).toBeGreaterThan(1);
  });
});

describe("表示を戻す相手を取り違えない (Round 1 r1-f4)", () => {
  it("後から足された箱の題を書き換えない", () => {
    // 出口で題の文字だけを見て戻すと、 見本の中の箱がたまたま同じ題を持っていた時に
    // その表示まで書き換える。 組み立て直後に控えた箱だけを戻す
    const 作り替え後の題 = (): string => {
      const { 図 } = 組む(記法("sequence", 衝突する2人, ['foo-bar -> Foo Bar: "x"']));
      // 作り替えた名前は表示に出ないので、 図録側から同じ文字を作って渡す
      return 図.nodes.map((n) => n.title).join("");
    };
    expect(作り替え後の題()).toContain("Foo Bar");

    const 図録 = {
      badge: {
        id: "badge",
        topic: "見本",
        lanes: [{ id: "l", x: 0, width: 200 }],
        // 作り替えた名前と同じ形の題を持つ箱 (尾は名前から決まるので同じ値になる)
        nodes: [{ id: "mark", lane: "l", stack: 0, kind: "card" as const, title: "Foo Bar 13df66" }],
        edges: [],
        states: [],
        phases: [],
      },
    };
    const 図 = textDslToDiagram(
      記法("sequence", [...衝突する2人, "見本1: { kind: badge }"], ['foo-bar -> Foo Bar: "x"']),
      { partsCatalog: 図録 },
    );
    const 見本の箱 = 図.nodes.find((n) => n.id.includes("__mark"));
    expect(見本の箱, "見本の箱が無い").toBeDefined();
    expect(見本の箱!.title, "見本の箱の題を書き換えている").toBe("Foo Bar 13df66");
  });
});

describe("尾を付けた先も既に使われている時 (Round 1 r1-f2)", () => {
  // 作り替えた名前が、 既に居る登場人物の id とぶつかる形。 できあがる id を見ずに配ると、
  // 作り替えた先で新しい重なりを作る
  const ぶつかる3人 = ["foo-bar", "Foo Bar", "foo-bar 360878"];

  it("組み立てが通り、 id が重ならない", () => {
    const { 図 } = 組む(記法("state", ぶつかる3人));
    const ids = 図.nodes.map((n) => n.id);
    expect(new Set(ids).size, `id が重なっている: ${ids.join(", ")}`).toBe(ids.length);
    expect(() => compile(図)).not.toThrow();
  });

  it("先に居た方の id は変わらない", () => {
    // 作り替えるのは重なっている 2 人だけ。 既に居る `foo-bar 360878` は動かさない
    const { 図 } = 組む(記法("state", ぶつかる3人));
    const 先に居た = 図.nodes.find((n) => n.title === "foo-bar 360878");
    expect(先に居た?.id).toBe("foo-bar-360878");
  });

  it("ぶつかった時の付け方も書き順に依らない", () => {
    const idの表 = (actors: string[]): Record<string, string> => {
      const { 図 } = 組む(記法("state", actors));
      return Object.fromEntries(図.nodes.map((n) => [n.title, n.id]));
    };
    expect(idの表(ぶつかる3人)).toEqual(idの表([...ぶつかる3人].reverse()));
  });
});

describe("枠の名札も控えた相手だけ戻す (Round 1 r1-f4)", () => {
  it("後から足された枠の名札を書き換えない", () => {
    const 図録 = {
      badge: {
        id: "badge",
        topic: "見本",
        // 作り替えた名前と同じ名札を持つ枠
        lanes: [{ id: "l", x: 0, width: 200, label: "Foo Bar 13df66" }],
        nodes: [{ id: "mark", lane: "l", stack: 0, kind: "card" as const, title: "印" }],
        edges: [],
        states: [],
        phases: [],
      },
    };
    const 図 = textDslToDiagram(
      記法("swimlane", [...衝突する2人, "見本1: { kind: badge }"], ['foo-bar -> Foo Bar: "x"']),
      { partsCatalog: 図録 },
    );
    const 見本の枠 = 図.lanes.find((l) => l.id.includes("__l"));
    expect(見本の枠, "見本の枠が無い").toBeDefined();
    expect(見本の枠!.label, "見本の枠の名札を書き換えている").toBe("Foo Bar 13df66");
  });
});

describe("cdl 側の逃げ先と重なる名前 (Round 2)", () => {
  // cdl は形が空になった時に並びの位置へ逃げる (`lane-<位置>` / `actor-<位置>`)。
  // 逃げ先と同じ名前の登場人物が居ると重なる
  it("sequence で 😀 と actor-0 が重ならない", () => {
    const { 図 } = 組む(記法("sequence", ["😀", "actor-0"], ['😀 -> actor-0: "x"']));
    expect(() => compile(図)).not.toThrow();
  });

  it("swimlane で 😀 と lane-0 が重ならない", () => {
    const { 図 } = 組む(記法("swimlane", ["😀", "lane-0"], ['😀 -> lane-0: "x"']));
    expect(() => compile(図)).not.toThrow();
  });

  it("見本と逃げ先が重なっても素の箱が消えない", () => {
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
    const 図 = textDslToDiagram(記法("sequence", ["😀: { kind: badge }", "actor-0", "B"], ['actor-0 -> B: "x"']), {
      partsCatalog: 図録,
    });
    expect(図.nodes.some((n) => n.title === "actor-0"), "素の登場人物の箱が消えている").toBe(true);
  });

  it("逃げ先と重ならない図では id を変えない", () => {
    // 形が空になるだけでは作り替えない = 衝突していない図の id を変えないため
    const { 図 } = 組む(記法("flow", ["!!!", "B"], ['!!! -> B: "x"']));
    expect(図.nodes.some((n) => n.id === "n"), "重なっていないのに作り替えている").toBe(true);
  });
});

describe("尾が同じになる 2 つの名前 (Round 2)", () => {
  // 尾 (6 桁) が偶然重なる組。 配る順で結果が変わると、 並べ替えただけで id が入れ替わる
  const 尾が同じ2人 = ["AbcDEfGhIJKlmnopqrstuvwx", "abcDeFGhIJKlMnopqrstuvwx"];

  it("組み立てが通り、 id が重ならない", () => {
    const { 図 } = 組む(記法("state", 尾が同じ2人));
    const ids = 図.nodes.map((n) => n.id);
    expect(new Set(ids).size, `id が重なっている: ${ids.join(", ")}`).toBe(ids.length);
    expect(() => compile(図)).not.toThrow();
  });

  it("並べ替えても同じ名前が同じ id になる", () => {
    const idの表 = (actors: string[]): Record<string, string> => {
      const { 図 } = 組む(記法("state", actors));
      return Object.fromEntries(図.nodes.map((n) => [n.title, n.id]));
    };
    expect(idの表(尾が同じ2人)).toEqual(idの表([...尾が同じ2人].reverse()));
  });
});

describe("64 字を超える名前の id (Round 2)", () => {
  // 元の名前を切らないと、 最初の 1 人の id が元のまま (64 字ぎりぎり) になる
  const 長い = (末尾: string): string => "a".repeat(64) + 末尾;

  it("作り替えた id に尾が入る", () => {
    const { 図 } = 組む(記法("state", [長い("x"), 長い("y")]));
    for (const n of 図.nodes) {
      expect(n.id, `尾が入っていない: ${n.id}`).not.toBe("a".repeat(64));
      expect(n.id.length).toBeLessThanOrEqual(64);
    }
  });
});

describe("逃げ先は図種ごとに違う (Round 3)", () => {
  // cdl は形が空になった名前を並びの位置へ逃がすが、 逃げ先は図種ごとに違う。
  // 両方を鍵に入れると、 その図種では使われない逃げ先まで衝突とみなして id を変える
  const 絵文字のid = (type: string, 相手: string): string | undefined => {
    const { 図 } = 組む(記法(type, ["😀", 相手], [`😀 -> ${相手}: "x"`]));
    return 図.lanes.find((l) => l.label === "😀")?.id ?? 図.nodes.find((n) => n.title === "😀")?.id;
  };

  it("sequence は actor- に逃げるので actor-0 とだけ重なる", () => {
    // 重なる方は作り替える
    expect(絵文字のid("sequence", "actor-0")).not.toBe("actor-0");
    // 重ならない方は触らない
    expect(絵文字のid("sequence", "lane-0")).toBe("actor-0");
  });

  it("swimlane は lane- に逃げるので lane-0 とだけ重なる", () => {
    expect(絵文字のid("swimlane", "lane-0")).not.toBe("lane-0");
    expect(絵文字のid("swimlane", "actor-0")).toBe("lane-0");
  });

  it("cdl の逃げ道を通らない図種はどちらでも触らない", () => {
    // これらは dragon 側の逃げ先 (`n`) に落ちるので、 cdl の逃げ先とは重ならない
    for (const type of ["flow", "er", "state", "topology", "class", "c4"]) {
      for (const 相手 of ["lane-0", "actor-0"]) {
        expect(絵文字のid(type, 相手), `${type} / ${相手} で作り替えている`).toBe("n");
      }
    }
  });
});

