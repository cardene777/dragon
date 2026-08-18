/**
 * 記法の `type: mind` を `mind-map` 種別に寄せる (#1177)。
 *
 * 以前は `card` を 3 列 (`mind-left` / `mind-center` / `mind-right`) に並べる別実装で、
 * engine の `mind-map` を使っていなかった。 そのため 2 つの穴があった。
 *
 * | 穴 | 中身 |
 * |---|---|
 * | 枝の親を見る規則が届かない | `ruleMindMapParentReference` は `kind === "mind-map"` かつ `mindData` を持つ node にしか当たらない |
 * | `SINGLE_BOX_KINDS` の `mind-map` が到達しない | 一覧に載っているのに記法から辿り着けない項目として残る |
 *
 * **枝の親は書けない**。 記法の `actors` は「1 つ目が根、 残りが枝」 の並びで `parent` を書く
 * 場所が無く、 全ての枝を根の直下に置く。 したがって正しい記法からは規則が違反を出さない。
 * ここで見るのは **規則が届く状態になったか** = 規則の前提 (`kind` と `mindData`) を満たし、
 * 親を壊せば報告されること。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, lintDiagram } from "../src/index";
import type { CdlDiagram, CompileNotice } from "../src/index";

/** 最小の放射の記法。 登場人物だけを差し替える */
const 記法 = (actors: string[], extra = ""): string =>
  `title: "アイデア"\ntype: mind\n\nactors:\n${actors.map((a) => `  - ${a}`).join("\n")}\n${extra}`;

const 図 = (actors: string[], extra = ""): CdlDiagram => textDslToDiagram(記法(actors, extra));

const 放射の箱 = (d: CdlDiagram) => {
  const n = d.nodes.find((x) => x.kind === "mind-map");
  if (!n) throw new Error("mind-map の箱がない");
  return n;
};

describe("記法が mind-map 種別の node を 1 つ作る", () => {
  it("箱は 1 つで kind は mind-map", () => {
    const d = 図(["Core", "Idea1", "Idea2"]);
    expect(d.nodes).toHaveLength(1);
    expect(d.nodes[0]!.kind).toBe("mind-map");
  });

  it("mindData に rootId / rootTitle / branches が入る", () => {
    const m = 放射の箱(図(["Core", "Idea1", "Idea2"])).mindData!;
    expect(m.rootId).toBe("core");
    expect(m.rootTitle).toBe("Core");
    expect(m.branches).toEqual([
      { id: "idea1", title: "Idea1", parent: "core" },
      { id: "idea2", title: "Idea2", parent: "core" },
    ]);
  });

  it("枝の親は全て中心 (記法に親を書く場所が無い)", () => {
    const m = 放射の箱(図(["Core", "A", "B", "C", "D"])).mindData!;
    expect(m.branches.every((b) => b.parent === m.rootId)).toBe(true);
  });

  it("登場人物が 1 人なら枝が無い箱を作る", () => {
    expect(放射の箱(図(["Core"])).mindData!.branches).toEqual([]);
  });

  it("登場人物が 0 人なら箱も枠も作らない", () => {
    const d = textDslToDiagram(`title: "t"\ntype: mind\n\nactors: []\n`);
    expect(d.nodes).toEqual([]);
    expect(d.lanes).toEqual([]);
  });
});

describe("枝の親を見る規則が記法から作った図に届く", () => {
  it("規則の前提 (kind と mindData) を満たす", () => {
    // 以前はここが満たされず、 規則が当たるのは組立て API で組んだ図に限られていた
    const 箱 = 放射の箱(図(["Core", "Idea1"]));
    expect(箱.kind).toBe("mind-map");
    expect(箱.mindData).toBeDefined();
  });

  it("正しい記法では違反を出さない", () => {
    const r = lintDiagram(図(["Core", "Idea1", "Idea2"]));
    expect(r.issues.filter((i) => i.message.includes("parent"))).toEqual([]);
  });

  it("親を壊すと規則が報告する (記法から作った図に届いている)", () => {
    const d = 図(["Core", "Idea1", "Idea2"]);
    const 箱 = 放射の箱(d);
    const 壊した: CdlDiagram = {
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === 箱.id
          ? {
              ...n,
              mindData: {
                ...n.mindData!,
                branches: n.mindData!.branches.map((b, i) =>
                  i === 0 ? { ...b, parent: "居ない親" } : b,
                ),
              },
            }
          : n,
      ),
    };
    const r = lintDiagram(壊した);
    const 該当 = r.issues.filter((i) => i.message.includes("居ない親"));
    expect(該当.length, "枝の親を見る規則が発火していない").toBeGreaterThan(0);
  });
});

describe("SINGLE_BOX_KINDS の mind-map が記法から到達する", () => {
  it("焦点に登場人物を並べても、 指す先は 1 箱に寄る", () => {
    // 図全体を 1 箱で描く種別の焦点解決 (`SINGLE_BOX_KINDS`) を通る。 以前は登場人物ごとに
    // card があり、 焦点は箱ごとに解決していた
    const d = 図(
      ["Core", "Idea1", "Idea2"],
      `\nanimation:\n  - step: "見る" 1s\n    focus: [Core, Idea1, Idea2]\n`,
    );
    const phase = d.phases[0]!;
    expect(phase.activate).toEqual([放射の箱(d).id]);
  });

  it("記法に無い名前を焦点に書いた時は箱に寄せず、 伝える", () => {
    // 実在する名前だけを 1 箱へ寄せる。 無い名前まで寄せると、 書き間違いが黙って通る
    const 知らせ: CompileNotice[] = [];
    const d = textDslToDiagram(
      記法(["Core", "Idea1"], `\nanimation:\n  - step: "見る" 1s\n    focus: [居ない人]\n`),
      { onNotice: (n) => 知らせ.push(n) },
    );
    expect(d.phases[0]!.activate).toEqual([]);
    const 該当 = 知らせ.filter((n) => n.kind === "focus-target-missing");
    expect(該当.length, "無い名前を伝えていない").toBeGreaterThan(0);
  });
});

describe("矢印と重なる名前の扱い", () => {
  it("矢印を書いても 1 本も作らず、 書いたことを伝える", () => {
    const 知らせ: CompileNotice[] = [];
    const d = textDslToDiagram(
      記法(["Core", "Idea1", "Idea2"], `\nflow:\n  - Core -> Idea1: "x"\n`),
      { onNotice: (n) => 知らせ.push(n) },
    );
    expect(d.edges).toEqual([]);
    const 該当 = 知らせ.filter((n) => n.kind === "chart-edge-dropped");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("type: mind では矢印を描けません");
    expect(該当[0]!.message).toContain("type: tree");
  });

  it("同じ id になる名前を伝える", () => {
    const 知らせ: CompileNotice[] = [];
    textDslToDiagram(記法(["Core", "A B", "A-B"]), { onNotice: (n) => 知らせ.push(n) });
    const 該当 = 知らせ.filter((n) => n.message.includes("同じ id"));
    expect(該当.length, "同じ id になる名前を伝えていない").toBeGreaterThan(0);
  });

  it("中心と同じ id になる枝は載せない", () => {
    // 載せると自分を親にする形になり、 枝の親を見る規則の前提が壊れる
    const m = 放射の箱(図(["Core", "Core", "Idea1"])).mindData!;
    expect(m.rootId).toBe("core");
    expect(m.branches.map((b) => b.title)).toEqual(["Idea1"]);
  });
});

describe("枝が状態を読む", () => {
  it("枝の名前に {名前} を書くと図に残る", () => {
    // 中身を状態から取るのは cdl 側の解決層 (cdl #467)。 記法はその形をそのまま渡す
    const d = textDslToDiagram(
      `title: "アイデア"\ntype: mind\n\nstates:\n  stage: "下書き"\n\nactors:\n  - Core\n  - "決め手 {stage}"\n\nanimation:\n  - step: "見る" 1s\n    set:\n      stage: "選ぶ"\n`,
    );
    const m = 放射の箱(d).mindData!;
    expect(m.branches[0]!.title).toBe("決め手 {stage}");
    expect(d.states.map((s) => s.id)).toEqual(["stage"]);
    expect(d.phases[0]!.sets).toEqual([{ stateId: "stage", value: "選ぶ" }]);
  });
});

describe("1 箱で描けない欄を伝える (Round 1)", () => {
  const 知らせを集める = (src: string): CompileNotice[] => {
    const 出た: CompileNotice[] = [];
    textDslToDiagram(src, { onNotice: (n) => 出た.push(n) });
    return 出た;
  };

  it("枝の副題 / 値 / 行 / 上の小見出しを伝える", () => {
    // 箱ごとに描いていた頃は載っていた欄。 1 箱では名前と枝の色しか描けない
    const 出た = 知らせを集める(
      記法(["Core", 'Idea1: { subtitle: "案 1", value: "42", eyebrow: "見出し" }']),
    );
    const 該当 = 出た.filter((n) => n.message.includes("名前と枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("副題");
    expect(該当[0]!.message).toContain("値");
    expect(該当[0]!.message).toContain("上の小見出し");
    expect(該当[0]!.message).toContain("type: tree");
  });

  it("中心の副題 / 値 も伝える (枝だけを見ていない)", () => {
    const 出た = 知らせを集める(記法(['Core: { subtitle: "中心テーマ", value: "3" }', "Idea1"]));
    const 該当 = 出た.filter((n) => n.message.includes("名前と枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("Core の副題 / 値");
  });

  it("行 (rows) も伝える", () => {
    const 出た = 知らせを集める(記法(["Core", 'Idea1: { rows: ["件数: 3"] }']));
    const 該当 = 出た.filter((n) => n.message.includes("名前と枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("行");
  });

  it("中心の色は持てないので伝える", () => {
    // `MindBranchPayload` に中心の色の欄が無い
    const 出た = 知らせを集める(記法(["Core: { tone: error }", "Idea1"]));
    const 該当 = 出た.filter((n) => n.message.includes("名前と枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("色 (中心は持てない)");
  });

  it("枝の色は描けるので伝えない", () => {
    const 出た = 知らせを集める(記法(["Core", "Idea1: { tone: error }"]));
    expect(出た.filter((n) => n.message.includes("名前と枝の色しか描けません"))).toEqual([]);
  });

  it("名前だけの記法では何も伝えない", () => {
    expect(知らせを集める(記法(["Core", "Idea1", "Idea2"]))).toEqual([]);
  });
});

describe("見本 (parts) を重ねた登場人物 (Round 1)", () => {
  it("見本は枝にせず、 枝にしないことを伝える", () => {
    // 後段が見本の中身を別の箱として足すため、 枝にも載せると同じ登場人物が 2 箇所に描かれる
    const 出た: CompileNotice[] = [];
    const d = textDslToDiagram(記法(["Core", "見本1: partsAchievement", "Idea1"]), {
      onNotice: (n) => 出た.push(n),
      partsCatalog: {
        partsAchievement: {
          id: "partsAchievement",
          topic: "見本",
          lanes: [{ id: "l", x: 0, width: 200 }],
          nodes: [{ id: "trophy", lane: "l", stack: 0, kind: "card", title: "杯" }],
          edges: [],
          states: [],
          phases: [],
        },
      },
    });
    const m = 放射の箱(d).mindData!;
    expect(m.branches.map((b) => b.title), "見本が枝に残っている").toEqual(["Idea1"]);
    const 該当 = 出た.filter((n) => n.kind === "part-not-drawn");
    expect(該当).toHaveLength(1);
    // 見本の名前は小文字に揃えられて届く (parser の扱い)
    expect(該当[0]!.message).toContain("を枝にできません");
    expect(該当[0]!.actor).toBe("見本1");
  });
});

