/**
 * 部品へ引いた矢印を部品の要素に繋ぐことの検証 (#1979)。
 *
 * 部品を置くと組み立ては仮の箱を消して部品の図の要素を足す。 仮の箱へ引いた矢印は一緒に消えており、
 * 知らせも出なかった (実測 = 部品の一覧を渡すと矢印が 1 本から 0 本になり、知らせは 0 件)。
 *
 * ## 何を見るか
 *
 * | 部品 | 矢印に書いたもの | 結果 |
 * |---|---|---|
 * | 要素 1 つ | 何も書かない | その要素に繋ぐ |
 * | 要素 2 つ以上 | `fromPartNode` / `toPartNode` | 名指しした要素に繋ぐ |
 * | 要素 2 つ以上 | 何も書かない | 外して `part-edge-dropped` |
 * | 名指しした要素が無い | — | 外して `part-edge-dropped` |
 * | 取り込まなかった部品 | — | 外して `part-edge-dropped` |
 * | 部品でない端 / 順序図 / 一覧に無い部品 | 名指し | 繋ぎ先は変えず `part-node-ignored` |
 *
 * 判定の順は「取り込んだか → 名指し → 要素の数」。 2 つの条件を同時に満たす入力で順を固定する
 * (要素 1 つの部品に無い要素を名指しした時は、自動で繋がず外す)。
 */
import { describe, it, expect } from "vitest";
import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram, jsonToDiagram, MAX_INPUT_ELEMENTS } from "../src/index";
import type { CompileNotice } from "../src/compile";

/** 要素 1 つの部品 */
const 一灯: CdlDiagram = diagram("parts-one", { topic: "one" })
  .lane("l", { width: 200 })
  .node("ind", { lane: "l", stack: 0, kind: "card", title: "ind", w: 160, h: 120 })
  .build();

/** 要素 3 つの部品 (外枠を持たず同格の要素が並ぶ) */
const 三灯: CdlDiagram = diagram("parts-three", { topic: "three" })
  .lane("l", { width: 200 })
  .node("rC", { lane: "l", stack: 0, kind: "card", title: "赤", w: 160, h: 120 })
  .node("yC", { lane: "l", stack: 1, kind: "card", title: "黄", w: 160, h: 120 })
  .node("gC", { lane: "l", stack: 2, kind: "card", title: "緑", w: 160, h: 120 })
  .build();

/** 上限を超えて取り込まれない部品 */
function 大きすぎる部品(): CdlDiagram {
  const b = diagram("parts-big", { topic: "big" }).lane("l", { width: 400 });
  for (let i = 0; i <= MAX_INPUT_ELEMENTS; i += 1) {
    b.node(`n${i}`, { lane: "l", stack: i, kind: "card", title: `n${i}`, w: 100, h: 40 });
  }
  return b.build();
}

const 部品の一覧: Record<string, CdlDiagram> = { one: 一灯, three: 三灯 };

function 組み立てる(
  src: string,
  一覧: Record<string, CdlDiagram> = 部品の一覧,
): { 端: string[]; 知らせ: CompileNotice[]; 図: CdlDiagram } {
  const 知らせ: CompileNotice[] = [];
  const 図 = textDslToDiagram(src, { partsCatalog: 一覧, onNotice: (n) => 知らせ.push(n) });
  return { 端: 図.edges.map((e) => `${e.from} -> ${e.to}`), 知らせ, 図 };
}

/** 部品の知らせだけを `種類 行 文` で並べる */
const 部品の知らせ = (知らせ: CompileNotice[]): string[] =>
  知らせ
    .filter((n) => n.kind === "part-edge-dropped" || n.kind === "part-node-ignored")
    .map((n) => `${n.kind} ${n.line} ${n.message}`);

/** 箱の行と流れの行を差し替えた本文。 流れの 1 行目は 10 行目 */
const 本文 = (型: string, 箱: string, 流れ: string): string => `title: "t"
type: ${型}

actors:
  - 受付: { kind: card }
${箱}
  - 出荷: { kind: card }

flow:
${流れ}
`;

describe("部品へ引いた矢印を部品の要素に繋ぐ (#1979)", () => {
  it("Issue の本文 = 部品の一覧を渡すと矢印が 1 本残り、端が部品の要素を指す", () => {
    const src = `title: "t"
type: flow

actors:
  - 受付: { kind: card }
  - 印: { kind: one }

flow:
  - 受付 -> 印: "送る"
`;
    const { 端, 知らせ, 図 } = 組み立てる(src);
    expect(端).toEqual(["受付 -> 印__ind"]);
    expect(
      図.nodes.some((n) => n.id === "印__ind"),
      "繋ぎ先の要素が図に無い",
    ).toBe(true);
    expect(部品の知らせ(知らせ)).toEqual([]);
  });

  it.each(["flow", "swimlane", "topology", "state", "c4"])(
    "%s でも、要素 1 つの部品は両向きとも繋がる",
    (型) => {
      const { 端, 知らせ } = 組み立てる(
        本文(型, "  - 印: { kind: one }", '  - 受付 -> 印: "送る"\n  - 印 -> 出荷: "出す"'),
      );
      expect(端).toEqual(["受付 -> 印__ind", "印__ind -> 出荷"]);
      expect(部品の知らせ(知らせ)).toEqual([]);
    },
  );

  it("要素 2 つ以上の部品は、名指しした要素に両向きとも繋がる", () => {
    const { 端, 知らせ } = 組み立てる(
      本文(
        "swimlane",
        "  - 信号: { kind: three }",
        '  - 受付 -> 信号: "止める" { toPartNode: rC }\n  - 信号 -> 出荷: "進める" { fromPartNode: gC }',
      ),
    );
    expect(端).toEqual(["受付 -> 信号__rC", "信号__gC -> 出荷"]);
    expect(部品の知らせ(知らせ)).toEqual([]);
  });

  it("要素 2 つ以上の部品で名指しが無いと、外した矢印の数と同じ件数を行番号付きで知らせる", () => {
    const { 端, 知らせ } = 組み立てる(
      本文(
        "swimlane",
        "  - 信号: { kind: three }",
        '  - 受付 -> 信号: "止める"\n  - 信号 -> 出荷: "進める"',
      ),
    );
    expect(端).toEqual([]);
    expect(部品の知らせ(知らせ)).toEqual([
      'part-edge-dropped 10 "受付" から "信号" への矢印は、"信号" (three) の中のどの要素に繋ぐかが決まらないため外しました',
      'part-edge-dropped 11 "信号" から "出荷" への矢印は、"信号" (three) の中のどの要素に繋ぐかが決まらないため外しました',
    ]);
    const 添え書き = 知らせ.filter((n) => n.kind === "part-edge-dropped").map((n) => n.hint);
    expect(添え書き).toEqual([
      "要素が 2 つ以上ある部品は、矢印に toPartNode: <要素の id> を書いて繋ぐ要素を選ぶ (要素 = rC, yC, gC)",
      "要素が 2 つ以上ある部品は、矢印に fromPartNode: <要素の id> を書いて繋ぐ要素を選ぶ (要素 = rC, yC, gC)",
    ]);
  });

  it("名指しした要素が部品に無いと、外して部品の要素の一覧を添える", () => {
    const { 端, 知らせ } = 組み立てる(
      本文(
        "swimlane",
        "  - 信号: { kind: three }",
        '  - 受付 -> 信号: "止める" { toPartNode: zz }',
      ),
    );
    expect(端).toEqual([]);
    expect(部品の知らせ(知らせ)).toEqual([
      'part-edge-dropped 10 "受付" から "信号" への矢印は、"信号" (three) の中に toPartNode に書いた "zz" という要素が無いため外しました',
    ]);
    expect(知らせ.find((n) => n.kind === "part-edge-dropped")?.hint).toBe(
      "この部品の要素 = rC, yC, gC",
    );
  });

  it("要素 1 つの部品でも、名指しが先に効く (2 条件を同時に満たす入力で順を固定する)", () => {
    // 要素が 1 つ かつ 無い要素を名指し = 自動で繋がずに外す
    const 無い = 組み立てる(
      本文("swimlane", "  - 印: { kind: one }", '  - 受付 -> 印: "送る" { toPartNode: zz }'),
    );
    expect(無い.端).toEqual([]);
    expect(部品の知らせ(無い.知らせ)).toEqual([
      'part-edge-dropped 10 "受付" から "印" への矢印は、"印" (one) の中に toPartNode に書いた "zz" という要素が無いため外しました',
    ]);
    // 要素が 1 つ かつ 在る要素を名指し = その要素に繋ぐ
    const 在る = 組み立てる(
      本文("swimlane", "  - 印: { kind: one }", '  - 受付 -> 印: "送る" { toPartNode: ind }'),
    );
    expect(在る.端).toEqual(["受付 -> 印__ind"]);
  });

  it("取り込まなかった部品へ引いた矢印は、名指しが在っても外して知らせる", () => {
    // 取り込まなかった かつ 名指しあり = 取り込みの判定が先に効く
    const { 端, 知らせ } = 組み立てる(
      本文("swimlane", "  - 大: { kind: big }", '  - 受付 -> 大: "送る" { toPartNode: n0 }'),
      { big: 大きすぎる部品() },
    );
    expect(端).toEqual([]);
    expect(部品の知らせ(知らせ)).toEqual([
      'part-edge-dropped 10 "受付" から "大" への矢印は、"大" (big) を図に取り込まなかったため外しました',
    ]);
    expect(
      知らせ.some((n) => n.kind === "part-not-drawn"),
      "部品の知らせが消えた",
    ).toBe(true);
  });

  it("矢印を書かずに並び順で作られた矢印は、繋がずに知らせも出さない", () => {
    // 静止した flow は行を書かなくても箱を並び順で繋ぐ。 書き手が部品へ引いた矢印ではない
    const src = `title: "t"
type: flow

actors:
  - 受付: { kind: card }
  - 印: { kind: one }
`;
    const { 端, 知らせ } = 組み立てる(src);
    const 一覧なし = textDslToDiagram(src, {});
    expect(一覧なし.edges.length, "並び順の矢印が作られていない (前提が崩れた)").toBe(1);
    expect(端).toEqual([]);
    expect(部品の知らせ(知らせ)).toEqual([]);
  });

  it("部品を指す行があると部品は鎖に残り、行の出どころが部品でない並び順の矢印は繋がない", () => {
    // 静止した flow は矢印と行を「行き先の名前」 で対応させる (#1267)。 `受付 -> 出荷` の行は
    // 並び順の矢印 `印 -> 出荷` に対応するが、行の出どころは部品ではない = 書き手が部品から引いた矢印ではない。
    // 行が在ることだけで繋ぐと、書いていない矢印が部品から出る。
    //
    // 部品を指す行 (`受付 -> 印`) を足して部品を鎖に残す。 部品を指す行が無いと部品は鎖に入らない (#1987)
    const src = `title: "t"
type: flow

actors:
  - 受付: { kind: card }
  - 印: { kind: one }
  - 出荷: { kind: card }

flow:
  - 受付 -> 印: "送る"
  - 受付 -> 出荷: "出す"
`;
    const { 端, 知らせ } = 組み立てる(src);
    const 一覧なし = textDslToDiagram(src, {});
    expect(
      一覧なし.edges.map((e) => `${e.from} -> ${e.to}`),
      "並び順の矢印が作られていない (前提が崩れた)",
    ).toEqual(["受付 -> 印", "印 -> 出荷"]);
    expect(端).toEqual(["受付 -> 印__ind"]);
    expect(部品の知らせ(知らせ)).toEqual([]);
  });

  it("繋いだ矢印は段の点灯に残り、外した矢印は段の点灯から消える", () => {
    const src = `title: "t"
type: swimlane

actors:
  - 受付: { kind: card }
  - 印: { kind: one }
  - 信号: { kind: three }

flow:
  - 受付 -> 印: "送る"
  - 受付 -> 信号: "止める"

animation:
  - step: "送る" 1s
    focus: ["受付 -> 印", "受付 -> 信号"]
`;
    // 部品の一覧を渡さない図で、2 本の矢印の id を先に取る (繋ぎ直しても id は変えない)
    const 仮の箱のまま = textDslToDiagram(src, {});
    const id = (to: string) => 仮の箱のまま.edges.find((e) => e.to === to)?.id;
    expect([id("印"), id("信号")].every(Boolean), "矢印の id を取れない (前提が崩れた)").toBe(true);
    expect(仮の箱のまま.phases.flatMap((p) => p.activate)).toEqual([id("印"), id("信号")]);

    const { 図 } = 組み立てる(src);
    expect(図.edges.map((e) => [e.id, e.to])).toEqual([[id("印"), "印__ind"]]);
    expect(図.phases.flatMap((p) => p.activate)).toEqual([id("印")]);
  });

  it("JSON で書いても同じ矢印になる", () => {
    const json = {
      title: "t",
      type: "swimlane",
      actors: [
        { name: "受付", kind: "card" },
        { name: "信号", kind: "three" },
        { name: "出荷", kind: "card" },
      ],
      flow: [
        { from: "受付", to: "信号", label: "止める", toPartNode: "rC" },
        { from: "信号", to: "出荷", label: "進める", fromPartNode: "gC" },
      ],
    };
    const 図 = jsonToDiagram(json, { partsCatalog: 部品の一覧 });
    expect(図.edges.map((e) => `${e.from} -> ${e.to}`)).toEqual([
      "受付 -> 信号__rC",
      "信号__gC -> 出荷",
    ]);
  });
});

describe("部品の要素の名指しが効かない時に知らせる (#1979)", () => {
  it("部品でない箱の端に書くと、繋ぎ先は変えずに知らせる", () => {
    const { 端, 知らせ } = 組み立てる(
      本文(
        "swimlane",
        "  - 印: { kind: one }",
        '  - 受付 -> 出荷: "送る" { toPartNode: ind, fromPartNode: ind }',
      ),
    );
    expect(端).toEqual(["受付 -> 出荷"]);
    expect(部品の知らせ(知らせ)).toEqual([
      'part-node-ignored 10 "受付" は部品ではないため、fromPartNode に書いた "ind" は効きません',
      'part-node-ignored 10 "出荷" は部品ではないため、toPartNode に書いた "ind" は効きません',
    ]);
  });

  it.each(["sequence", "solidity"])("%s は部品の端に書いても効かないと知らせる", (型) => {
    const { 知らせ } = 組み立てる(
      本文(型, "  - 印: { kind: one }", '  - 受付 -> 印: "送る" { toPartNode: ind }'),
    );
    expect(部品の知らせ(知らせ)).toEqual([
      'part-node-ignored 10 順序図の言づては "印" の縦の線に届くため、toPartNode に書いた "ind" は効きません',
    ]);
  });

  it("部品の一覧に無い部品に書くと、仮の箱に繋いだまま知らせる", () => {
    const { 端, 知らせ } = 組み立てる(
      本文("swimlane", "  - 印: { kind: missing }", '  - 受付 -> 印: "送る" { toPartNode: ind }'),
    );
    expect(端).toEqual(["受付 -> 印"]);
    expect(部品の知らせ(知らせ)).toEqual([
      'part-node-ignored 10 "印" (missing) は部品の一覧に無いため、toPartNode に書いた "ind" は効きません',
    ]);
  });

  it("名指しを書かない矢印は知らせない", () => {
    // 陰性対照 = 同じ図で名指しを外すと、名指しの知らせは 0 件
    const { 知らせ } = 組み立てる(
      本文("swimlane", "  - 印: { kind: one }", '  - 受付 -> 出荷: "送る"'),
    );
    expect(知らせ.filter((n) => n.kind === "part-node-ignored")).toEqual([]);
  });
});

/**
 * 静止した流れ図の鎖は、どの行にも書かれていない部品を飛ばす (#1987)。
 *
 * 部品も鎖に入れると、`受付 / 印 / 出荷` は `受付 -> 印` / `印 -> 出荷` になり、書いていない並び順の
 * 矢印は部品へ繋がずに外すため 2 本とも消えていた (実測 = カタログの図で矢印 0 本、知らせ 0 件)。
 * 編集画面は部品を抜いてから鎖を作るので `受付 -> 出荷` の 1 本を描き、絵が食い違っていた。
 *
 * **飛ばすのは部品の一覧が持つ部品だけ**。 一覧に無い部品は仮の箱のまま描かれるので、鎖に残す。
 */
describe("静止した流れ図の鎖は、行に現れない部品を飛ばす (#1987)", () => {
  /** 登場人物の並びを差し替えた静止した流れ図 */
  const 流れ図 = (登場人物: string[], 流れ = ""): string =>
    `title: "t"\ntype: flow\n\nactors:\n${登場人物.map((a) => `  - ${a}`).join("\n")}\n${流れ ? `\nflow:\n${流れ}\n` : ""}`;
  const 受付 = "受付: { kind: card }";
  const 出荷 = "出荷: { kind: card }";
  const 印 = "印: { kind: one }";

  /** 部品と端の知らせ */
  const 知らせの種類 = (知らせ: CompileNotice[]): string[] =>
    知らせ
      .filter((n) =>
        ["part-edge-dropped", "part-node-ignored", "flow-endpoint-not-honored"].includes(n.kind),
      )
      .map((n) => n.kind);

  it.each([
    ["途中", [受付, 印, 出荷]],
    ["先頭", [印, 受付, 出荷]],
    ["末尾", [受付, 出荷, 印]],
    ["途中に 2 つ続けて", [受付, 印, "灯: { kind: three }", 出荷]],
  ])("部品を%s に置くと、前後の箱を繋ぐ 1 本になり知らせは出ない", (_位置, 並び) => {
    const { 端, 知らせ, 図 } = 組み立てる(流れ図(並び));
    expect(端).toEqual(["受付 -> 出荷"]);
    expect(知らせの種類(知らせ)).toEqual([]);
    // 部品は鎖から外れても図には描く
    expect(
      図.nodes.some((n) => n.id === "印__ind"),
      "部品の要素が図に無い",
    ).toBe(true);
  });

  it("部品を指さない行は、部品を飛ばした鎖の矢印に載り、端の知らせが出ない", () => {
    const 行 = new Map<string, number>();
    const 知らせ: CompileNotice[] = [];
    const 図 = textDslToDiagram(
      流れ図([受付, 印, 出荷], '  - 受付 -> 出荷: "出す" { head: none }'),
      {
        partsCatalog: 部品の一覧,
        onNotice: (n) => 知らせ.push(n),
        onEdgeSource: (id, line) => 行.set(id, line),
      },
    );
    expect(
      図.edges.map((e) => ({
        端: `${e.from} -> ${e.to}`,
        名: e.label,
        head: e.head,
        行: 行.get(e.id),
      })),
    ).toEqual([{ 端: "受付 -> 出荷", 名: "出す", head: "none", 行: 10 }]);
    expect(知らせの種類(知らせ)).toEqual([]);
  });

  it("部品の一覧を渡さない時は、部品の名前の仮の箱も鎖に入る", () => {
    // 陰性対照。 一覧が無いと部品は描かれず、仮の箱が普通の箱として並ぶ
    const 図 = textDslToDiagram(流れ図([受付, 印, 出荷]), {});
    expect(図.edges.map((e) => `${e.from} -> ${e.to}`)).toEqual(["受付 -> 印", "印 -> 出荷"]);
  });

  it("一覧に無い部品は仮の箱のまま描かれるので、鎖に残す", () => {
    const { 端 } = 組み立てる(流れ図([受付, "印: { kind: missing }", 出荷]));
    expect(端).toEqual(["受付 -> 印", "印 -> 出荷"]);
  });

  it("大きすぎて取り込まなかった部品も、行に現れなければ鎖から外す", () => {
    // 図に入らない部品の場所へ鎖を通すと、前後の箱の矢印が消える
    const { 端, 知らせ } = 組み立てる(流れ図([受付, "大: { kind: big }", 出荷]), {
      big: 大きすぎる部品(),
    });
    expect(端).toEqual(["受付 -> 出荷"]);
    expect(
      知らせ.some((n) => n.kind === "part-not-drawn"),
      "部品の知らせが消えた",
    ).toBe(true);
  });

  it("部品だけの流れ図は矢印を作らず、中身の無い縦列を残さない", () => {
    const { 端, 図 } = 組み立てる(流れ図([印, "灯: { kind: three }"]));
    expect(端).toEqual([]);
    const 箱のある縦列 = new Set(図.nodes.map((n) => n.lane));
    expect(図.lanes.length, "縦列が 1 本も無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(図.lanes.filter((l) => !箱のある縦列.has(l.id)).map((l) => l.id)).toEqual([]);
  });
});
