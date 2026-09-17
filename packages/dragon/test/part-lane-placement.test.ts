/**
 * 縦列に属する部品を、その縦列の中に描くことの検証 (#1980)。
 *
 * 位置を書かない部品は格子に並ぶが、格子は縦列の位置を読まない。 部品の要素だけが縦列に属し、
 * 描く位置は別の縦列の上になっていた (実測 = 縦列 b 480〜890 に属する部品が 60〜420 に描かれた)。
 *
 * ## 何を見るか
 *
 * | 形 | 見ること |
 * |---|---|
 * | `lane:` を書いた部品 | 書いた縦列の範囲の中に描く。 他の箱の位置は変えない |
 * | 登場人物ごとに縦列を作る図種 (`swimlane` / `state` / `er` / `class`) | 部品の名前の縦列の中に描き、縦列は書いた順に並ぶ |
 * | 縦列を 2 本以上持つ部品 | 1 本目の要素は書いた縦列、2 本目以降はすぐ右に差し込んだ縦列に入れる。 図の検査で誤りを出さない (#2145) |
 * | `lanes:` で書いた縦列 (横位置を書く / 書かない) に置いた、縦列を 2 本以上持つ部品 | 差し込んだ縦列が宿主のすぐ右に並び、書いた縦列は書いた順に並ぶ (#2147) |
 * | 縦 | 他の箱の下端から 120。 同じ縦列の部品は書いた順に積む |
 * | 位置を書いた部品 | `lane:` を書いても書いた位置 |
 * | 他の箱の位置の基準になる部品 | 縦列に置かず、知らせる |
 * | 全員が 1 本の縦列を共有する図種 (`flow` / `topology` / `c4`) | 縦列を足しても、今までどおり格子 |
 * | 名前の頭が重なる部品同士 (`設備` / `設備-予備`) | それぞれ自分の縦列に入り、配置が止まらない |
 *
 * 見るのは **配置した後の座標**。 組み立てた図の `lane` の欄だけを見ると、描く位置が別の縦列の
 * 上でも通る (直す前の状態がそれだった)。
 */
import { describe, it, expect } from "vitest";
import { diagram, layout, visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";

/** 要素 1 つの部品 (`state-indicator` と同じ大きさ) */
const 一灯: CdlDiagram = diagram("parts-one", { topic: "one" })
  .lane("l", { width: 380 })
  .node("ind", { lane: "l", stack: 0, kind: "card", title: "ind", w: 360, h: 380 })
  .build();

/** 1 本の縦列に要素を縦に 3 つ積む部品 */
const 三段: CdlDiagram = diagram("parts-stack3", { topic: "stack3" })
  .lane("l", { width: 320 })
  .node("topL", { lane: "l", stack: 0, kind: "card", title: "上", w: 300, h: 120 })
  .node("midL", { lane: "l", stack: 1, kind: "card", title: "中", w: 300, h: 120 })
  .node("botL", { lane: "l", stack: 2, kind: "card", title: "下", w: 300, h: 180 })
  .build();

/**
 * 縦列を 2 本持ち、要素を横に並べる部品。
 *
 * カタログの部品と同じく縦列の横位置 (`x`) を持つ (実物 = `parts-gauge-cluster` は 0 / 260 / 520)。
 * 組み込みは部品の頁で配置した要素の中心の間隔で要素を並べる (#1992)。 書いた縦列の間隔 (340) では
 * 要素の間が 40 しか空かないため、頁は縦列を広げて間を空ける
 */
const 横二つ: CdlDiagram = {
  id: "parts-side2",
  topic: "side2",
  lanes: [
    { id: "l1", x: 0, width: 320 },
    { id: "l2", x: 340, width: 320 },
  ],
  nodes: [
    { id: "left", lane: "l1", stack: 0, kind: "card", title: "左", w: 300, h: 200 },
    { id: "right", lane: "l2", stack: 0, kind: "card", title: "右", w: 300, h: 200 },
  ] as CdlDiagram["nodes"],
  edges: [],
  states: [],
  phases: [] as CdlDiagram["phases"],
};

/**
 * 入口 1 つを出口 2 つへ分ける部品 (#2145)。 カタログの `parts-split-router` と同じ形 =
 * 左の縦列に入口、右の縦列に出口を 2 つ縦に積み、部品の中に矢印を 2 本持つ
 */
const 分岐: CdlDiagram = {
  id: "parts-split2",
  topic: "split2",
  lanes: [
    { id: "sl1", x: 0, width: 200, label: "入口" },
    { id: "sl2", x: 220, width: 200, label: "出口" },
  ],
  nodes: [
    { id: "inP", lane: "sl1", stack: 0, kind: "card", title: "入口", w: 180, h: 180 },
    { id: "outA", lane: "sl2", stack: 0, kind: "card", title: "出口 A", w: 180, h: 180 },
    { id: "outB", lane: "sl2", stack: 1, kind: "card", title: "出口 B", w: 180, h: 180 },
  ] as CdlDiagram["nodes"],
  edges: [
    { id: "a", from: "inP", to: "outA", label: "7 割", tone: "success" },
    { id: "b", from: "inP", to: "outB", label: "3 割", tone: "warning" },
  ] as CdlDiagram["edges"],
  states: [],
  phases: [] as CdlDiagram["phases"],
};

/** 縦列を 3 本持ち、要素を 1 つずつ横に並べる部品 (#2145)。 カタログの `parts-queue-depth` と同じ形 */
const 三列: CdlDiagram = {
  id: "parts-queue3",
  topic: "queue3",
  lanes: [
    { id: "q1", x: 0, width: 180, label: "入る" },
    { id: "q2", x: 200, width: 200, label: "待ち" },
    { id: "q3", x: 420, width: 180, label: "出る" },
  ],
  nodes: [
    { id: "qIn", lane: "q1", stack: 0, kind: "card", title: "入る", w: 160, h: 320 },
    { id: "qBody", lane: "q2", stack: 0, kind: "card", title: "待ち行列", w: 180, h: 320 },
    { id: "qOut", lane: "q3", stack: 0, kind: "card", title: "出る", w: 160, h: 320 },
  ] as CdlDiagram["nodes"],
  edges: [
    { id: "in", from: "qIn", to: "qBody", label: "届く", tone: "info" },
    { id: "out", from: "qBody", to: "qOut", label: "捌く", tone: "success" },
  ] as CdlDiagram["edges"],
  states: [],
  phases: [] as CdlDiagram["phases"],
};

const 部品の一覧: Record<string, CdlDiagram> = {
  one: 一灯,
  stack3: 三段,
  side2: 横二つ,
  split2: 分岐,
  queue3: 三列,
};

type 範囲 = { x0: number; x1: number; y0: number; y1: number };

function 配置する(src: string): {
  箱: Map<string, 範囲 & { lane: string }>;
  縦列: { id: string; x0: number; x1: number }[];
  知らせ: CompileNotice[];
  図: CdlDiagram;
} {
  const 知らせ: CompileNotice[] = [];
  const 図 = textDslToDiagram(src, { partsCatalog: 部品の一覧, onNotice: (n) => 知らせ.push(n) });
  const laid = layout(図);
  const 箱 = new Map(
    laid.nodes.map((n) => [
      n.id,
      {
        lane: n.lane,
        x0: n.cx - n.w / 2,
        x1: n.cx + n.w / 2,
        y0: n.cy - n.h / 2,
        y1: n.cy + n.h / 2,
      },
    ]),
  );
  const 縦列 = laid.lanes.map((l) => ({ id: l.id, x0: l.x, x1: l.x + l.width }));
  return { 箱, 縦列, 知らせ, 図 };
}

/** 部品の要素をまとめた範囲 */
function 部品の範囲(箱: Map<string, 範囲 & { lane: string }>, 名前: string): 範囲 {
  const 要素 = [...箱].filter(([id]) => id.startsWith(`${名前}__`)).map(([, b]) => b);
  expect(要素.length, `${名前} の要素が図に無い (前提が崩れた)`).toBeGreaterThan(0);
  return {
    x0: Math.min(...要素.map((b) => b.x0)),
    x1: Math.max(...要素.map((b) => b.x1)),
    y0: Math.min(...要素.map((b) => b.y0)),
    y1: Math.max(...要素.map((b) => b.y1)),
  };
}

function 縦列の中にある(r: 範囲, 縦列: { x0: number; x1: number } | undefined): boolean {
  return 縦列 !== undefined && r.x0 >= 縦列.x0 - 0.5 && r.x1 <= 縦列.x1 + 0.5;
}

/** Issue の本文 */
const Issueの本文 = `title: "t"
type: swimlane

lanes:
  a: { label: "A" }
  b: { label: "B" }

actors:
  - 受付: { kind: card, lane: a }
  - 出荷: { kind: card, lane: b }
  - 印: { kind: one, lane: b }
`;

describe("lane: を書いた部品を、書いた縦列の中に描く (#1980)", () => {
  it("Issue の本文 = 印の要素が縦列 b の範囲の中に入る", () => {
    const { 箱, 縦列 } = 配置する(Issueの本文);
    const b = 縦列.find((l) => l.id === "b");
    expect(b, "縦列 b が無い (前提が崩れた)").toBeDefined();
    const 印 = 部品の範囲(箱, "印");
    expect(縦列の中にある(印, b), `印 ${印.x0}〜${印.x1} が縦列 b ${b!.x0}〜${b!.x1} の外`).toBe(
      true,
    );
    // 縦列の中心に部品の中心が来る
    expect((印.x0 + 印.x1) / 2).toBeCloseTo((b!.x0 + b!.x1) / 2, 0);
  });

  it("同じ本文で、縦列 a の受付と縦列 b の出荷の位置は変わらない", () => {
    // 直す前の実測 = 受付 40〜360 / 128〜196、出荷 525〜845 / 128〜196
    const { 箱 } = 配置する(Issueの本文);
    const 位置 = (id: string) => {
      const r = 箱.get(id)!;
      return [r.x0, r.x1, r.y0, r.y1].map((v) => Math.round(v));
    };
    expect(位置("受付")).toEqual([40, 360, 128, 196]);
    expect(位置("出荷")).toEqual([525, 845, 128, 196]);
  });

  it("flow に書いた縦列でも同じく縦列の中に入る", () => {
    const { 箱, 縦列 } = 配置する(Issueの本文.replace("type: swimlane", "type: flow"));
    expect(
      縦列の中にある(
        部品の範囲(箱, "印"),
        縦列.find((l) => l.id === "b"),
      ),
    ).toBe(true);
  });

  it("部品の上端は他の箱の下端から 120 空き、同じ縦列の 2 つ目は 1 つ目の下に積む", () => {
    const { 箱 } = 配置する(
      `${Issueの本文}  - 在庫: { kind: stack3, lane: b }\n  - 札: { kind: one, lane: a }\n`,
    );
    const 他の箱の下端 = Math.max(箱.get("受付")!.y1, 箱.get("出荷")!.y1);
    const 印 = 部品の範囲(箱, "印");
    const 在庫 = 部品の範囲(箱, "在庫");
    const 札 = 部品の範囲(箱, "札");
    expect(印.y0).toBeCloseTo(他の箱の下端 + 120, 0);
    // 同じ縦列 b に書いた順に積む
    expect(在庫.y0).toBeCloseTo(印.y1 + 120, 0);
    // 別の縦列 a の部品は、縦列 b の 1 つ目と同じ高さから始める
    expect(札.y0).toBeCloseTo(印.y0, 0);
  });
});

describe("登場人物ごとに縦列を作る図種では、部品の名前の縦列の中に描く (#1980)", () => {
  const 本文 = (型: string) => `title: "t"
type: ${型}

actors:
  - 点検: { kind: card }
  - 保全: { kind: card }
  - 設備: { kind: one }

flow:
  - 点検 -> 保全: "送る"
`;

  it.each(["swimlane", "state", "er", "class"])("%s", (型) => {
    const { 箱, 縦列, 図 } = 配置する(本文(型));
    const 設備の要素 = [...箱].filter(([id]) => id.startsWith("設備__"));
    expect(設備の要素.length, "部品の要素が図に無い (前提が崩れた)").toBe(1);
    const 設備の縦列 = 縦列.find((l) => l.id === 設備の要素[0]![1].lane);
    expect(縦列の中にある(部品の範囲(箱, "設備"), 設備の縦列)).toBe(true);
    // 部品用の縦列 (`設備__l`) を足さず、仮の箱の縦列をそのまま使う
    expect(図.lanes.some((l) => l.id.startsWith("設備__"))).toBe(false);
    // 縦列は書いた順 (点検 → 保全 → 設備) に左から並ぶ
    const 並び = [...縦列].sort((p, q) => p.x0 - q.x0).map((l) => l.id);
    const 点検の縦列 = 箱.get("点検")!.lane;
    const 保全の縦列 = 箱.get("保全")!.lane;
    expect(並び).toEqual([点検の縦列, 保全の縦列, 設備の縦列!.id]);
  });

  it.each(["swimlane", "state"])(
    "%s で名前の頭が重なる部品同士 (設備 / 設備-予備) も、それぞれの縦列に入る",
    (型) => {
      // `設備` の仮の箱を探す判定が `設備-予備` の仮の箱まで拾うと、`設備` を消す時に `設備-予備` の
      // 縦列まで消し、配置が止まる (`node "設備-予備__ind" の lane "設備-予備" が定義されていない`)
      const src = `title: "t"\ntype: ${型}\n\nactors:\n  - 点検: { kind: card }\n  - 設備: { kind: one }\n  - 設備-予備: { kind: one }\n\nflow:\n  - 点検 -> 設備: "送る"\n  - 点検 -> 設備-予備: "送る"\n`;
      const { 箱, 縦列 } = 配置する(src);
      for (const 名前 of ["設備", "設備-予備"]) {
        const 要素 = [...箱].find(([id]) => id === `${名前}__ind`);
        expect(要素, `${名前} の要素が図に無い (前提が崩れた)`).toBeDefined();
        const 入った縦列 = 縦列.find((l) => l.id === 要素![1].lane);
        expect(入った縦列?.id, `${名前} が部品用の縦列に入った`).toMatch(
          new RegExp(`^(lane-)?${名前}$`),
        );
        expect(縦列の中にある(部品の範囲(箱, 名前), 入った縦列)).toBe(true);
      }
    },
  );

  it("流れに現れない swimlane の登場人物 (仮の箱が作られない) でも、名前の縦列に入る", () => {
    const src = `title: "t"
type: swimlane

actors:
  - 点検: { kind: card }
  - 設備: { kind: one }
  - 保全: { kind: card }

flow:
  - 点検 -> 保全: "送る"
`;
    const { 箱, 縦列 } = 配置する(src);
    const 設備の縦列 = 縦列.find(
      (l) => l.id === [...箱].find(([id]) => id.startsWith("設備__"))![1].lane,
    );
    expect(設備の縦列?.id).toBe("設備");
    expect(縦列の中にある(部品の範囲(箱, "設備"), 設備の縦列)).toBe(true);
  });
});

describe("部品の形を保つ (#1980)", () => {
  it("縦に積んだ要素は、上から書いた順のまま縦列の中に入る", () => {
    const { 箱, 縦列 } = 配置する(
      Issueの本文.replace("kind: one, lane: b", "kind: stack3, lane: b"),
    );
    const [上, 中, 下] = ["印__topL", "印__midL", "印__botL"].map((id) => 箱.get(id)!);
    expect(上!.y1 < 中!.y0 && 中!.y1 < 下!.y0, "要素の縦の並びが崩れた").toBe(true);
    expect(
      縦列の中にある(
        部品の範囲(箱, "印"),
        縦列.find((l) => l.id === "b"),
      ),
    ).toBe(true);
  });

  it("縦列を 2 本持つ部品は、左の要素を書いた縦列に、右の要素をそのすぐ右の縦列に入れる", () => {
    const { 箱, 縦列 } = 配置する(
      Issueの本文.replace("kind: one, lane: b", "kind: side2, lane: b"),
    );
    const 左 = 箱.get("印__left")!;
    const 右 = 箱.get("印__right")!;
    const 並び = [...縦列].sort((p, q) => p.x0 - q.x0);
    const bの位置 = 並び.findIndex((l) => l.id === "b");
    expect(左.lane).toBe("b");
    expect(右.lane, "右の要素が b のすぐ右の縦列に入っていない").toBe(並び[bの位置 + 1]?.id);
    // 部品の頁の並び (左 → 右) を保つ
    expect((右.x0 + 右.x1) / 2).toBeGreaterThan((左.x0 + 左.x1) / 2);
    // どちらも自分の縦列の中心に揃う
    for (const 要素 of [左, 右]) {
      const l = 縦列.find((x) => x.id === 要素.lane)!;
      expect((要素.x0 + 要素.x1) / 2).toBeCloseTo((l.x0 + l.x1) / 2, 0);
      expect(縦列の中にある(要素, l)).toBe(true);
    }
    // 縦列 a の受付と重ならない
    const a = 縦列.find((l) => l.id === "a")!;
    expect(a.x1).toBeLessThanOrEqual(縦列.find((l) => l.id === "b")!.x0);
  });
});

/**
 * 図の検査 (`visualValidateAll`) の誤り。 警告 (器の幅など) は数えない。
 *
 * 座標だけを見ると、同じ縦列に中心の違う箱が並んでも通る (#2145 まで既存の検査はそうだった)。
 */
function 検査の誤り(図: CdlDiagram): string[] {
  const r = visualValidateAll([図], { profile: "catalog" });
  return r.reports
    .flatMap((x) => x.violations)
    .filter((v) => v.severity === "error")
    .map((v) => `${v.axis} — ${v.detail}`);
}

describe("縦列を 2 本以上持つ部品を縦列に置いても、図の検査で誤りを出さない (#2145)", () => {
  const 一つ置く = (種類: string, 繋ぎ先: string) => `title: "t"
type: swimlane

actors:
  - 受付: { kind: card }
  - 部品: { kind: ${種類} }

flow:
  - 受付 -> 部品: "届く" { toPartNode: ${繋ぎ先} }
`;

  it.each([
    ["side2", "left"],
    ["split2", "inP"],
    ["queue3", "qIn"],
  ])("%s を登場人物の縦列に置く", (種類, 繋ぎ先) => {
    const { 図 } = 配置する(一つ置く(種類, 繋ぎ先));
    expect(図.nodes.filter((n) => n.id.startsWith("部品__")).length).toBeGreaterThan(1);
    expect(検査の誤り(図)).toEqual([]);
  });

  it("分岐の出口から三列の入口へ要素を名指しして繋ぐ", () => {
    const { 図 } = 配置する(`title: "t"
type: swimlane

actors:
  - 受付: { kind: card }
  - router: { kind: split2 }
  - queue: { kind: queue3 }

flow:
  - 受付 -> router: "届く" { toPartNode: inP }
  - router -> queue: "7 割を回す" { fromPartNode: outA, toPartNode: qIn }
`);
    // 繋いだ矢印が残っている (繋ぎ先を落とすと検査は矢印の無い図を見て通ってしまう)
    expect(図.edges.map((e) => `${e.from} -> ${e.to}`)).toContain("router__outA -> queue__qIn");
    expect(検査の誤り(図)).toEqual([]);
  });

  it("2 本目以降の縦列は部品の縦列の順に宿主の縦列の右へ並び、名札を持たない", () => {
    const { 箱, 縦列, 図 } = 配置する(一つ置く("queue3", "qIn"));
    const 並び = [...縦列].sort((p, q) => p.x0 - q.x0).map((l) => l.id);
    const 入り先 = ["部品__qIn", "部品__qBody", "部品__qOut"].map((id) => 箱.get(id)!.lane);
    const 宿主 = 箱.get("受付")!.lane === 入り先[0] ? undefined : 入り先[0];
    expect(宿主, "1 本目の要素が宿主の縦列に入っていない").toBeDefined();
    const 宿主の位置 = 並び.indexOf(宿主!);
    expect(入り先).toEqual(並び.slice(宿主の位置, 宿主の位置 + 3));
    for (const id of 入り先.slice(1)) {
      expect(図.lanes.find((l) => l.id === id)?.label, `${id} に名札がある`).toBeUndefined();
    }
  });

  it("同じ縦列に分岐を 2 つ積むと、2 本目の縦列を共有して揃う", () => {
    const { 箱, 図 } = 配置する(
      Issueの本文.replace("kind: one, lane: b", "kind: split2, lane: b") +
        "  - 予備: { kind: split2, lane: b }\n",
    );
    expect(箱.get("印__outA")!.lane).toBe(箱.get("予備__outA")!.lane);
    // 同じ名前の縦列を 2 本作っていない (名前だけ比べると、2 本目を作っても上の比較は通る)
    const 縦列の名前 = 図.lanes.map((l) => l.id);
    expect(縦列の名前.length, `縦列の名前が重なる: ${縦列の名前.join(", ")}`).toBe(
      new Set(縦列の名前).size,
    );
    expect(箱.get("印__inP")!.lane).toBe("b");
    expect(箱.get("予備__inP")!.lane).toBe("b");
    // 揃いの誤りだけを見る。 間隔のばらつき (`column-gap-uniform`) は残る = 2 つ目は 1 つ目の
    // 一番下 (2 本目の縦列の出口 B) から 120 空けて置くので、1 本目の縦列だけ間が 400 に開く
    // (実測)。 部品は形を保って丸ごと動かすため、縦列ごとに詰めることはしない
    expect(
      検査の誤り(図).filter((e) => e.startsWith("alignment") || e.startsWith("column-alignment")),
    ).toEqual([]);
  });

  it("縦列を 1 本しか持たない部品は、書いた縦列だけを使い縦列を足さない", () => {
    const 本文 = Issueの本文.replace("kind: one, lane: b", "kind: stack3, lane: b");
    const { 図 } = 配置する(本文);
    const 部品なし = 配置する(本文.replace("  - 印: { kind: stack3, lane: b }\n", "")).図;
    expect(図.lanes.map((l) => l.id)).toEqual(部品なし.lanes.map((l) => l.id));
    expect(図.nodes.filter((n) => n.id.startsWith("印__")).every((n) => n.lane === "b")).toBe(true);
  });
});

describe("lanes: で書いた縦列に縦列を 2 本以上持つ部品を置いても、縦列が書いた順に並ぶ (#2147)", () => {
  /** 描いた縦列を左から並べた id */
  const 左から = (縦列: { id: string; x0: number }[]) =>
    [...縦列].sort((p, q) => p.x0 - q.x0).map((l) => l.id);

  /**
   * `左` と `右` の 2 本を書き、それぞれに分岐を置く。 `横位置` は各縦列に書き足す欄
   * (`, x: 0` など)。 宿主が一番右に無い形を作る = #2145 の検査は宿主が常に一番右だった
   */
  const 二本に置く = (左の欄: string, 右の欄: string, 流れ = "") => `title: "t"
type: swimlane

lanes:
  左: { label: "左"${左の欄} }
  右: { label: "右"${右の欄} }

actors:
  - 甲: { kind: split2, lane: 左 }
  - 乙: { kind: split2, lane: 右 }
${流れ}`;
  const 繋ぐ = '\nflow:\n  - 甲 -> 乙: "A 便" { fromPartNode: outA, toPartNode: inP }\n';

  it("横位置を書かない縦列 2 本では、左 → 左__列2 → 右 → 右__列2 の順に並ぶ", () => {
    // 直す前の実測 = 左 → 右 → 左__列2 → 右__列2 (書いた縦列に横位置 0 が入り、差し込んだ縦列が後ろへ回る)
    const { 箱, 縦列 } = 配置する(二本に置く("", ""));
    expect(左から(縦列)).toEqual(["左", "左__列2", "右", "右__列2"]);
    expect(箱.get("甲__outA")!.lane).toBe("左__列2");
    expect(箱.get("乙__outA")!.lane).toBe("右__列2");
  });

  it("部品どうしを矢印で繋いでも、図の検査の誤りが 0 件", () => {
    const { 図 } = 配置する(二本に置く("", "", 繋ぐ));
    // 繋いだ矢印が残っている (繋ぎ先を落とすと検査は矢印の無い図を見て通ってしまう)
    expect(図.edges.map((e) => `${e.from} -> ${e.to}`)).toContain("甲__outA -> 乙__inP");
    expect(検査の誤り(図)).toEqual([]);
  });

  it("x: 0 を書いた縦列 2 本でも、差し込んだ縦列が宿主のすぐ右に並び、誤りが 0 件", () => {
    const { 縦列, 図 } = 配置する(二本に置く(", x: 0", ", x: 0", 繋ぐ));
    expect(左から(縦列)).toEqual(["左", "左__列2", "右", "右__列2"]);
    expect(検査の誤り(図)).toEqual([]);
  });

  it("離して書いた縦列 (x: 0 と x: 900) では、間に差し込み、右の縦列を押し出しすぎない", () => {
    const { 縦列, 図 } = 配置する(二本に置く(", x: 0", ", x: 900", 繋ぐ));
    expect(左から(縦列)).toEqual(["左", "左__列2", "右", "右__列2"]);
    // 差し込んだ縦列を宿主と同じ横位置にすると、描画側が縦列の間隔を一番広い組 (差し込んだ縦列と
    // 右の間 = 980) に揃え、右の左端が 1,900 まで押し出される (実測)。 真ん中に置けば 980
    expect(縦列.find((l) => l.id === "右")!.x0).toBeLessThanOrEqual(1200);
    expect(検査の誤り(図)).toEqual([]);
  });

  it("先頭の縦列に x: 0 を書いても書かなくても、すぐ右が横位置を書かない縦列なら同じ位置に描く", () => {
    // 先頭の縦列は書かなくても 0 に置かれるので、`x: 0` を書き足しても絵は変わらないはず。
    // すぐ右の `右` は描画側が書いた順に積んで位置を決めるため、差し込めば `右` ごと右へずれる =
    // 差し込む縦列に横位置を持たせる必要が無い。 ここで真ん中 (左と右の見積もりの間) に置くと、
    // 並びは正しいまま間隔だけが変わる (実測 = 左__列2 の左端が 460 から 475)
    const 本文 = (左の欄: string) => `title: "t"
type: swimlane

lanes:
  左: { label: "左"${左の欄} }
  右: { label: "右" }

actors:
  - 甲: { kind: side2, lane: 左 }
  - 乙: { kind: one, lane: 右 }
`;
    const 書いた = 配置する(本文(", x: 0"));
    const 書かない = 配置する(本文(""));
    expect(左から(書いた.縦列)).toEqual(["左", "左__列2", "右"]);
    expect(書いた.縦列).toEqual(書かない.縦列);
    expect([...書いた.箱]).toEqual([...書かない.箱]);
  });

  it("登場人物の縦列の後に書いた縦列は、登場人物の縦列の間に割り込まない", () => {
    // 直す前の実測 = 受付 → 置き場 → 置き場__列2 → 出荷 (横位置を書いていない 置き場 に 0 が入る)
    const { 縦列 } = 配置する(`title: "t"
type: swimlane

lanes:
  置き場: { label: "置き場" }

actors:
  - 受付: { kind: card }
  - 出荷: { kind: card }
  - 印: { kind: split2, lane: 置き場 }

flow:
  - 受付 -> 出荷: "送る"
`);
    expect(左から(縦列)).toEqual(["受付", "出荷", "置き場", "置き場__列2"]);
  });
});

describe("縦列に置かない部品 (#1980)", () => {
  it("位置を書いた部品は、lane: を書いても書いた位置に描く", () => {
    const { 箱, 縦列 } = 配置する(
      Issueの本文.replace("kind: one, lane: b", "kind: one, lane: b, posX: 2000, posY: 900"),
    );
    const 印 = 部品の範囲(箱, "印");
    expect((印.x0 + 印.x1) / 2).toBeCloseTo(2000, 0);
    expect((印.y0 + 印.y1) / 2).toBeCloseTo(900, 0);
    expect(
      縦列の中にある(
        印,
        縦列.find((l) => l.id === "b"),
      ),
    ).toBe(false);
  });

  it.each(["flow", "topology"])(
    "全員が 1 本の縦列を共有する %s は、今までどおり部品用の縦列で格子に並ぶ",
    (型) => {
      const src = `title: "t"\ntype: ${型}\n\nactors:\n  - 点検: { kind: card }\n  - 設備: { kind: one }\n`;
      const { 図 } = 配置する(src);
      const 設備の要素 = 図.nodes.filter((n) => n.id.startsWith("設備__"));
      expect(設備の要素.length, "部品の要素が図に無い (前提が崩れた)").toBe(1);
      expect(設備の要素.every((n) => n.lane.startsWith("設備__"))).toBe(true);
    },
  );

  it.each(["flow", "c4"])(
    "縦列を足した %s で、部品の仮の箱が他の登場人物と同じ縦列にいる時は格子に並ぶ",
    (型) => {
      // 縦列を書いても、縦列を書かない登場人物の仮の箱は 1 本の縦列 (`flow` / `c4-l1`) を共有する。
      // そこへ置くと、他の登場人物の縦列を部品が占める
      const src = `title: "t"\ntype: ${型}\n\nlanes:\n  a: { label: "A" }\n\nactors:\n  - 受付: { kind: card }\n  - 出荷: { kind: card }\n  - 設備: { kind: one }\n\nflow:\n  - 受付 -> 出荷: "送る"\n  - 出荷 -> 設備: "見る"\n`;
      const { 図, 箱 } = 配置する(src);
      const 設備の要素 = 図.nodes.filter((n) => n.id.startsWith("設備__"));
      expect(設備の要素.length, "部品の要素が図に無い (前提が崩れた)").toBe(1);
      expect(設備の要素.map((n) => n.lane)).toEqual(["設備__l"]);
      // 共有する縦列は受付と出荷のまま
      expect(箱.get("受付")!.lane).toBe(箱.get("出荷")!.lane);
    },
  );

  it.each(["swimlane", "flow"])("部品だけの %s は、縦列が 1 本なので部品の縦列のまま描く", (型) => {
    // 見本の頁から開く本文の形。 縦列が部品の分しか無いので、寄せる先の縦列が無い
    const { 図 } = 配置する(`title: "t"\ntype: ${型}\n\nactors:\n  - 設備: { kind: one }\n`);
    const 設備の要素 = 図.nodes.filter((n) => n.id.startsWith("設備__"));
    expect(設備の要素.length, "部品の要素が図に無い (前提が崩れた)").toBe(1);
    expect(設備の要素.map((n) => n.lane)).toEqual(["設備__l"]);
  });

  it("他の箱の位置の基準になる部品は、lane: を書いても縦列に置かずに知らせる", () => {
    // 縦列を書いた かつ 相対の位置の基準 = 基準の判定が先に効く (2 条件を同時に満たす入力で順を固定する)
    const src = `${Issueの本文}  - 札:\n      kind: card\n      位置: 印 の右 200\n`;
    const { 箱, 縦列, 知らせ } = 配置する(src);
    const 印 = 部品の範囲(箱, "印");
    expect(
      縦列の中にある(
        印,
        縦列.find((l) => l.id === "b"),
      ),
    ).toBe(false);
    expect(
      知らせ.filter((n) => n.kind === "part-lane-ignored").map((n) => `${n.line} ${n.message}`),
    ).toEqual([
      '11 "印" は他の箱の位置の基準になっているため、縦列 "B" には置かず図の下に並べました',
    ]);
    // 書いた位置関係 (印 の右 200) は保たれる
    const 札 = 箱.get("札")!;
    expect(札.x0 - 印.x1).toBeCloseTo(200, 0);
  });

  it("基準にならない部品には知らせを出さない", () => {
    // 陰性対照 = 同じ本文から相対の位置を外すと、知らせは 0 件で縦列に入る
    const { 箱, 縦列, 知らせ } = 配置する(`${Issueの本文}  - 札: { kind: card, lane: a }\n`);
    expect(知らせ.filter((n) => n.kind === "part-lane-ignored")).toEqual([]);
    expect(
      縦列の中にある(
        部品の範囲(箱, "印"),
        縦列.find((l) => l.id === "b"),
      ),
    ).toBe(true);
  });
});
