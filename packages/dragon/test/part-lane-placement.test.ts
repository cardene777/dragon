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
 * | 縦列を 2 本持つ部品 | 要素の横並びを保ち、縦列を部品の幅まで広げる |
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
import { diagram, layout } from "@cardenelabs/cdl";
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

const 部品の一覧: Record<string, CdlDiagram> = { one: 一灯, stack3: 三段, side2: 横二つ };

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

  it("縦列を 2 本持つ部品は横並びを保ち、縦列を部品の幅まで広げる", () => {
    // 部品の頁での要素の中心の間隔 (#1992)。 書いた縦列の中心の間隔 (340) より広い
    const 頁 = layout(横二つ);
    const 中心 = (id: string) => 頁.nodes.find((n) => n.id === id)!.cx;
    const 単体の間 = 中心("right") - 中心("left");
    expect(単体の間, "頁が書いた縦列の間隔より広げていない (前提が崩れた)").toBeGreaterThan(340);
    const { 箱, 縦列 } = 配置する(
      Issueの本文.replace("kind: one, lane: b", "kind: side2, lane: b"),
    );
    const 左 = 箱.get("印__left")!;
    const 右 = 箱.get("印__right")!;
    expect((右.x0 + 右.x1) / 2 - (左.x0 + 左.x1) / 2).toBeCloseTo(単体の間, 0);
    const b = 縦列.find((l) => l.id === "b")!;
    const 印 = 部品の範囲(箱, "印");
    expect(縦列の中にある(印, b), `印 ${印.x0}〜${印.x1} が縦列 b ${b.x0}〜${b.x1} の外`).toBe(
      true,
    );
    expect(b.x1 - b.x0, "縦列を広げていない").toBeGreaterThanOrEqual(印.x1 - 印.x0 + 50);
    // 広げた縦列が隣の縦列 a に重ならない
    const a = 縦列.find((l) => l.id === "a")!;
    expect(a.x1).toBeLessThanOrEqual(b.x0);
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
