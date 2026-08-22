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
import { textDslToDiagram, lintDiagram, compileToCdl } from "../src/index";
import type { CdlDiagram, CompileNotice } from "../src/index";
import type { DslActor } from "../src/types";

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
  it("矢印は線にならず、 枝の親になる (#1251)", () => {
    // 放射の図は線を描かない。 矢印は「どの枝の下に置くか」 の指定として読む。
    // 以前は矢印を落として伝えていたが、 それだと階層を書く手段が無かった
    const 知らせ: CompileNotice[] = [];
    const d = textDslToDiagram(
      記法(["Core", "Idea1", "Idea2"], `\nflow:\n  - Idea1 -> Idea2: "x"\n`),
      { onNotice: (n) => 知らせ.push(n) },
    );
    expect(d.edges, "線を描いている").toEqual([]);
    expect(知らせ.filter((n) => n.kind === "chart-edge-dropped"), "使えた矢印を落としている").toEqual([]);
    const 枝 = (d.nodes[0] as { mindData?: { branches?: { id: string; parent?: string }[] } }).mindData?.branches;
    expect(枝?.find((x) => x.id === "idea2")?.parent, "枝の親になっていない").toBe("idea1");
  });

  it("親にできない矢印は落として伝える", () => {
    // 書いていない名前を指した矢印は親にできない。 黙って捨てると図から関係が消える
    const 知らせ: CompileNotice[] = [];
    textDslToDiagram(記法(["Core", "Idea1"], `\nflow:\n  - Idea1 -> 居ない: "x"\n`), {
      onNotice: (n) => 知らせ.push(n),
    });
    const 該当 = 知らせ.filter((n) => n.kind === "chart-edge-dropped");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("書いていない名前を子にしています");
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

describe("描けない欄を表から導く (Round 4)", () => {
  /** 記法を通さず、 組み立てた AST を直接渡す。 記法が受けない欄も確かめるため */
  const 直接組む = (枝: Partial<DslActor>) => {
    const 出た: CompileNotice[] = [];
    const doc = {
      title: "アイデア",
      type: "mind" as const,
      actors: [
        { name: "Core", kind: "actor" as const, kindWritten: false, pos: { line: 1 } },
        { name: "Idea1", kind: "actor" as const, kindWritten: false, pos: { line: 2 }, ...枝 },
      ],
      flow: [],
    };
    compileToCdl(doc as never, { onNotice: (n) => 出た.push(n) });
    return 出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"));
  };

  it.each([
    ["initial", { initial: true }, "始まり / 終わり の印"],
    ["final", { final: true }, "始まり / 終わり の印"],
    ["nodes", { nodes: { spacer: { posX: 1 } } }, "中の箱ごとの指定"],
    ["layoutPos", { layoutPos: { dx: 1, dy: 2 } }, "配置のずらし"],
    ["scale", { scale: 1.5 }, "倍率"],
    ["scaleKeys", { scaleKeys: ["k"] }, "倍率"],
    ["stateOverride", { stateOverride: { v: 1 } }, "状態の上書き"],
  ])("%s を書くと伝える", (_名, 枝, 説明) => {
    // 記法が受けない欄もある。 組み立てた AST を直接渡す入口 (`compileToCdl`) は公開されており、
    // そこからは書けるため「届かない」 とは言えない
    const 該当 = 直接組む(枝 as Partial<DslActor>);
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain(説明);
  });

  it("何も書かなければ伝えない", () => {
    expect(直接組む({})).toEqual([]);
  });

  it.each([
    ["kind (書いた時だけ)", { kind: "service", kindWritten: true }, "種類"],
    ["eyebrow", { eyebrow: "見出し" }, "上の小見出し"],
    ["rows", { rows: ["a: 1"] }, "行"],
    ["lane", { lane: "l" }, "枠の指定"],
    ["stack", { stack: 2 }, "積む順"],
    ["colorHex", { colorHex: "#ff0000" }, "色番号"],
    ["posW", { posW: 100 }, "大きさ"],
    ["posRel", { posRel: { anchor: "Core", dir: "right" as const, gap: 10 } }, "位置 (相対)"],
  ])("%s も伝える (Round 5)", (_名, 枝, 説明) => {
    // 全ての欄を 1 つの式で見る形にしたので、 1 欄でも骨抜きにすると全ての欄が落ちる
    const 該当 = 直接組む(枝 as Partial<DslActor>);
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain(説明);
  });

  it("書いていない種類は伝えない (既定値が入るため)", () => {
    // `kind` は必ず値が入る。 書いたかどうかの印で見ないと、 誰も書いていない図で毎回出る
    expect(直接組む({ kind: "actor", kindWritten: false })).toEqual([]);
  });

  it("false を書いた印は伝えない (既定と同じ意味)", () => {
    expect(直接組む({ initial: false, final: false })).toEqual([]);
  });

  it("同じ名前を持つ欄は 1 度だけ出す", () => {
    // `posX` と `posY` はどちらも「位置 (座標)」
    const 該当 = 直接組む({ posX: 1, posY: 2 });
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message.match(/位置 \(座標\)/g)).toHaveLength(1);
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

  it("枝の行 / 上の小見出しを伝える", () => {
    // 箱ごとに描いていた頃は載っていた欄。 1 箱では名前と副題 / 値、 枝の色しか描けない
    const 出た = 知らせを集める(記法(["Core", 'Idea1: { rows: ["a: 1"], eyebrow: "見出し" }']));
    const 該当 = 出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("行");
    expect(該当[0]!.message).toContain("上の小見出し");
    expect(該当[0]!.message).toContain("type: tree");
  });

  it("枝の副題 / 値は補足として渡す (#1230 / #1332)", () => {
    // `#1230` は名前の後ろに連結していた。 1 行に全部入るため箱幅を超えて切られるので、
    // `#1332` で **名前と補足に分けて渡す** 形に変えた (描画側が 2 行に積む)
    const d = 図(["Core", 'Idea1: { subtitle: "案 1", value: "42" }']);
    const 枝 = 放射の箱(d).mindData!.branches;
    expect(枝[0]!.title).toBe("Idea1");
    expect(枝[0]!.subtitle, "副題と値が補足に渡っていない").toBe("案 1 42");
    const 出た = 知らせを集める(記法(["Core", 'Idea1: { subtitle: "案 1", value: "42" }']));
    expect(
      出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません")),
      "描く欄を伝えている",
    ).toHaveLength(0);
  });

  it("中心の副題 / 値も補足として渡す (枝だけを見ていない)", () => {
    const d = 図(['Core: { subtitle: "中心テーマ", value: "3" }', "Idea1"]);
    const m = 放射の箱(d).mindData!;
    expect(m.rootTitle).toBe("Core");
    expect(m.rootSubtitle, "中心の副題と値が補足に渡っていない").toBe("中心テーマ 3");
  });

  it("副題も値も書かない枝は名前だけになる", () => {
    // 変更前と同じ文字列になることを固定する = 空白が末尾に付く形を作らない
    const d = 図(["Core", "Idea1"]);
    expect(放射の箱(d).mindData!.branches[0]!.title).toBe("Idea1");
    expect(放射の箱(d).mindData!.rootTitle).toBe("Core");
  });

  it("位置と大きさも伝える (Round 2)", () => {
    // 箱が 1 つの図では置く先が無い。 黙って無効になると「書いたのに効かない」 が残る
    const 出た = 知らせを集める(記法(["Core", "Idea1:\n      kind: card\n      位置: 300,200"]));
    const 該当 = 出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("位置 (座標)");
  });

  it("大きさも伝える (Round 2)", () => {
    const 出た = 知らせを集める(記法(["Core", "Idea1:\n      kind: card\n      大きさ: 400,200"]));
    const 該当 = 出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("大きさ");
  });

  it("相対の位置も伝える (Round 2)", () => {
    const 出た = 知らせを集める(
      記法(["Core", "Idea1", "Idea2:\n      kind: card\n      位置: Idea1 の右 200"]),
    );
    const 該当 = 出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("位置 (相対)");
  });

  it("種類 / 枠 / 積む順 / 色番号 も伝える (Round 3)", () => {
    const 出た = 知らせを集める(
      記法(["Core", 'Idea1:\n      kind: service\n      lane: l\n      stack: 2\n      色: "#ff0000"']),
    );
    const 該当 = 出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    for (const 欄 of ["種類", "枠の指定", "積む順", "色番号"]) {
      expect(該当[0]!.message, `${欄} を伝えていない`).toContain(欄);
    }
  });

  it("行 (rows) も伝える", () => {
    const 出た = 知らせを集める(記法(["Core", 'Idea1: { rows: ["件数: 3"] }']));
    const 該当 = 出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("行");
  });

  it("中心の色は持てないので伝える", () => {
    // `MindBranchPayload` に中心の色の欄が無い
    const 出た = 知らせを集める(記法(["Core: { tone: error }", "Idea1"]));
    const 該当 = 出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"));
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("色 (中心は持てない)");
  });

  it("枝の色は描けるので伝えない", () => {
    const 出た = 知らせを集める(記法(["Core", "Idea1: { tone: error }"]));
    expect(出た.filter((n) => n.message.includes("名前と副題 / 値、 枝の色しか描けません"))).toEqual([]);
  });

  it("名前だけの記法では何も伝えない", () => {
    expect(知らせを集める(記法(["Core", "Idea1", "Idea2"]))).toEqual([]);
  });
});

describe("見本 (parts) を重ねた登場人物 (Round 1 / 2)", () => {
  /** 見本 1 件を持つ図録。 名前は parser が小文字に揃えるため、 鍵も小文字で持つ */
  const 見本の図録 = { trophy: { id: "trophy", topic: "見本", lanes: [{ id: "l", x: 0, width: 200 }], nodes: [{ id: "cup", lane: "l", stack: 0, kind: "card" as const, title: "杯" }], edges: [], states: [], phases: [] } };

  const 組む = (actors: string[]) => {
    const 出た: CompileNotice[] = [];
    const d = textDslToDiagram(記法(actors), {
      onNotice: (n) => 出た.push(n),
      partsCatalog: 見本の図録,
    });
    return { d, 出た };
  };

  it("見本は枝にせず、 載せないことを伝える", () => {
    // 後段が見本の中身を別の箱として足すため、 枝にも載せると同じ登場人物が 2 箇所に描かれる
    const { d, 出た } = 組む(["Core", "見本1: trophy", "Idea1"]);
    expect(放射の箱(d).mindData!.branches.map((b) => b.title), "見本が枝に残っている").toEqual([
      "Idea1",
    ]);
    // 見本の中身は別の箱として描かれる (二重にならず、 消えてもいない)
    expect(d.nodes.some((n) => n.title === "杯"), "見本の中身が描かれていない").toBe(true);
    const 該当 = 出た.filter((n) => n.kind === "part-not-drawn");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.actor).toBe("見本1");
  });

  it("中心が見本でも載せない (Round 2)", () => {
    // 中心だけ外し忘れると、 中心の名前と展開した見本が併存する
    const { d, 出た } = 組む(["見本1: trophy", "Idea1", "Idea2"]);
    const m = 放射の箱(d).mindData!;
    expect(m.rootTitle, "見本が中心に残っている").toBe("Idea1");
    expect(m.branches.map((b) => b.title)).toEqual(["Idea2"]);
    expect(出た.filter((n) => n.kind === "part-not-drawn")).toHaveLength(1);
  });

  it("見本が複数あっても全部外す (Round 2)", () => {
    const { d, 出た } = 組む(["見本1: trophy", "見本2: trophy", "Core", "Idea1"]);
    const m = 放射の箱(d).mindData!;
    expect(m.rootTitle).toBe("Core");
    expect(m.branches.map((b) => b.title)).toEqual(["Idea1"]);
    expect(出た.filter((n) => n.kind === "part-not-drawn")).toHaveLength(2);
  });

  it("見本と同じ id になる名前を「同じ id」 として数えない (Round 2)", () => {
    // 見本は放射に載らないので、 同じ id になっても枝が消えることはない。 数えると
    // 起きていない衝突を伝えることになる
    const { 出た } = 組む(["Core", "見本1: trophy", "見本1"]);
    expect(
      出た.filter((n) => n.message.includes("同じ id")),
      "見本を同じ id の衝突として数えている",
    ).toEqual([]);
  });

  it("見本しか居ない記法で矢印を書いても伝える (Round 3)", () => {
    // 早期 return より後ろで伝えると、 この形で矢印が黙って消える
    const 出た: CompileNotice[] = [];
    textDslToDiagram(記法(["見本1: trophy"], `\nflow:\n  - 見本1 -> 見本1: "x"\n`), {
      onNotice: (n) => 出た.push(n),
      partsCatalog: 見本の図録,
    });
    const 該当 = 出た.filter((n) => n.kind === "chart-edge-dropped");
    expect(該当, "矢印が黙って消えている").toHaveLength(1);
    // 枝が 1 本も無いため、 どの矢印も親にできない
    expect(該当[0]!.message).toContain("書いていない名前を親にしています");
  });

  it("見本しか居ない記法では放射の箱も枠も作らない (Round 2)", () => {
    const { d, 出た } = 組む(["見本1: trophy"]);
    expect(d.nodes.filter((n) => n.kind === "mind-map"), "空の放射の箱が残っている").toEqual([]);
    expect(d.lanes.some((l) => l.id === "chart"), "中身の無い枠が残っている").toBe(false);
    // 見本そのものは描かれる
    expect(d.nodes.some((n) => n.title === "杯")).toBe(true);
    expect(出た.filter((n) => n.kind === "part-not-drawn")).toHaveLength(1);
  });
});


describe("枝の親を矢印で書く (#1251)", () => {
  const 枝 = (src: string) => {
    const d = textDslToDiagram(src);
    return (d.nodes[0] as { mindData?: { rootId?: string; branches?: { id: string; parent?: string }[] } })
      .mindData;
  };

  const 本文 = (矢印 = "") =>
    `title: "T"\ntype: mind\n\nactors:\n  - Project\n  - Features\n  - Auth\n  - Launch\n${矢印}`;

  it("矢印を書かなければ全ての枝が中心の直下 (陰性対照)", () => {
    // 従来の図が変わらないことを見る。 これが落ちれば既に描いてある図が動く
    const m = 枝(本文());
    expect(m?.branches?.map((b) => b.parent)).toEqual(["project", "project", "project"]);
  });

  it("矢印を書いた枝だけが下に入る", () => {
    const m = 枝(本文(`\nflow:\n  - Features -> Auth: ""\n`));
    expect(m?.branches?.map((b) => [b.id, b.parent])).toEqual([
      ["features", "project"],
      ["auth", "features"],
      ["launch", "project"],
    ]);
  });

  it("中心を親に指した矢印は書かなかったのと同じ", () => {
    expect(枝(本文(`\nflow:\n  - Project -> Features: ""\n`))?.branches?.[0]?.parent).toBe("project");
  });

  it("親を辿ると輪になる形は枝を切って伝える", () => {
    // 規則は type: tree と共有するため、輪の扱いも揃う
    const 知らせ: CompileNotice[] = [];
    const src = 本文(`\nflow:\n  - Features -> Auth: ""\n  - Auth -> Features: ""\n`);
    textDslToDiagram(src, { onNotice: (n) => 知らせ.push(n) });
    expect(知らせ.some((n) => n.message.includes("親を辿ると輪になります")), "輪を伝えていない").toBe(true);
    // **伝えるだけでなく実際に切れていることを見る**。 残すと親を辿って戻る図ができ、
    // 描画側が扱えない (伝えるだけの実装でも知らせの検査は通ってしまう)
    const 親一覧 = new Map((枝(src)?.branches ?? []).map((b) => [b.id, b.parent]));
    const 輪 = 親一覧.get("auth") === "features" && 親一覧.get("features") === "auth";
    expect(輪, "輪が残っている").toBe(false);
  });

  it("同じ枝に親が 2 つある形を伝える", () => {
    const 知らせ: CompileNotice[] = [];
    textDslToDiagram(本文(`\nflow:\n  - Features -> Auth: ""\n  - Launch -> Auth: ""\n`), {
      onNotice: (n) => 知らせ.push(n),
    });
    expect(知らせ.some((n) => n.message.includes("親が 2 つあります")), "2 つ目の親を伝えていない").toBe(true);
  });

  it("自分を親にする形を伝える", () => {
    const 知らせ: CompileNotice[] = [];
    textDslToDiagram(本文(`\nflow:\n  - Auth -> Auth: ""\n`), { onNotice: (n) => 知らせ.push(n) });
    expect(知らせ.some((n) => n.message.includes("自分を親にしています")), "自分への矢印を伝えていない").toBe(true);
  });

  // 親を決める規則は type: tree と共有する。 **知らせの図種名まで共有してはいけない** =
  // 放射の図で `type: tree` と書かれると、書いていない図種の名前で直し方を案内することになる
  it.each([
    ["書いていない名前", `\nflow:\n  - Features -> 居ない: ""\n`],
    ["自分を親にする", `\nflow:\n  - Auth -> Auth: ""\n`],
    ["親が 2 つ", `\nflow:\n  - Features -> Auth: ""\n  - Launch -> Auth: ""\n`],
    ["輪になる", `\nflow:\n  - Features -> Auth: ""\n  - Auth -> Features: ""\n`],
  ])("%s の知らせに type: mind が入る", (_name, 矢印) => {
    const 知らせ: CompileNotice[] = [];
    textDslToDiagram(本文(矢印), { onNotice: (n) => 知らせ.push(n) });
    const 該当 = 知らせ.filter((n) => n.message.includes("type: "));
    expect(該当.length, "知らせが出ていない").toBeGreaterThan(0);
    for (const n of 該当) {
      expect(n.message, "別の図種の名前で案内している").toContain("type: mind");
    }
  });
});

describe("中心を子にする矢印 (Round 1 の指摘)", () => {
  const 本文 = (矢印: string) =>
    `title: "T"\ntype: mind\n\nactors:\n  - Project\n  - Features\n  - Auth\n${矢印}`;

  const 知らせを取る = (src: string) => {
    const out: CompileNotice[] = [];
    textDslToDiagram(src, { onNotice: (n) => out.push(n) });
    return out.filter((n) => n.kind === "chart-edge-dropped");
  };

  it("中心を子にする矢印を伝える", () => {
    // 中心は枝の並びに居ないため親を持てない。 解決はできても誰にも読まれずに消えるため、
    // 黙って捨てると「書いたのに図が変わらない」 が手掛かりなしで起きる
    const 該当 = 知らせを取る(本文(`\nflow:\n  - Features -> Project: ""\n`));
    expect(該当, "黙って消えている").toHaveLength(1);
    expect(該当[0]!.message).toContain("中心 (Project) を子にはできません");
  });

  it("知らせに書いた行が入る", () => {
    const 該当 = 知らせを取る(本文(`\nflow:\n  - Features -> Project: ""\n`));
    expect(該当[0]!.line, "行番号が違う").toBe(10);
  });

  it("枝の親は従来どおり決まる", () => {
    // 中心を子にする矢印を伝えるだけで、他の矢印の扱いは変わらない
    const src = 本文(`\nflow:\n  - Features -> Project: ""\n  - Features -> Auth: ""\n`);
    const d = textDslToDiagram(src);
    const 枝 = (d.nodes[0] as { mindData?: { branches?: { id: string; parent?: string }[] } })
      .mindData?.branches;
    expect(枝?.find((b) => b.id === "auth")?.parent).toBe("features");
  });

  it("中心を親にする矢印では知らせない (陰性対照)", () => {
    // 向きが逆なら表せる。 両方を伝えると正しい記法が警告だらけになる
    expect(知らせを取る(本文(`\nflow:\n  - Project -> Features: ""\n`))).toEqual([]);
  });

  it("中心が絡まない矢印では知らせない (陰性対照)", () => {
    expect(知らせを取る(本文(`\nflow:\n  - Features -> Auth: ""\n`))).toEqual([]);
  });
});
