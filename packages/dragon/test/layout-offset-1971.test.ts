/**
 * 位置のずらし (JSON の `pos` / 記法の `offsetX` / `offsetY`) が図に効くことの検証 (#1971)。
 *
 * JSON は箱・矢印・縦列に `pos: { x, y }` を受け付け、型の説明も「自動で決まった位置からずらす」 と
 * 書いていたが、組み立ては 1 度も読まず、書いても配置は変わらず知らせも出なかった。
 *
 * ## 期待値は書かない図の配置から取る
 *
 * 座標を固定値で書くと、描画側の間隔が変わった時に検査だけが古くなる。 同じ図を `pos` 無しで
 * 組み立てて配置し、そこからの差 (書いたずらしの量) で比べる。
 */
import { describe, it, expect } from "vitest";
import { diagram, layout, type CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";

type Json = Record<string, unknown>;

const 組む = (j: Json, 知らせ?: CompileNotice[]): CdlDiagram =>
  jsonToDiagram(j, 知らせ ? { onNotice: (n) => 知らせ.push(n) } : undefined);

const 箱の中心 = (d: CdlDiagram): Map<string, { cx: number; cy: number }> =>
  new Map(layout(d).nodes.map((n) => [n.id, { cx: n.cx, cy: n.cy }] as const));

const 縦列の枠 = (d: CdlDiagram): Map<string, { x: number; y: number; w: number; h: number }> =>
  new Map(
    layout(d).lanes.map(
      (l) => [l.id, { x: l.x ?? 0, y: l.y ?? 0, w: l.width, h: l.height ?? 0 }] as const,
    ),
  );

/** 3 本の縦列に 4 つの箱を置いたフロー。 `A` と `B` は同じ縦列 */
const フロー = (差し替え: { actors?: Json[]; lanes?: Json; flow?: Json[] } = {}): Json => ({
  title: "t",
  type: "flow",
  lanes: 差し替え.lanes ?? { l1: { width: 300 }, l2: { width: 300 }, l3: { width: 300 } },
  actors: 差し替え.actors ?? [
    { name: "A", lane: "l1" },
    { name: "B", lane: "l1", stack: 1 },
    { name: "C", lane: "l2" },
    { name: "D", lane: "l3" },
  ],
  flow: 差し替え.flow ?? [
    { from: "A", to: "C", label: "x" },
    { from: "B", to: "D", label: "y" },
  ],
});

describe("JSON の箱の pos で箱が書いた量だけ動く (#1971)", () => {
  it("箱 A の中心が (60, 40) 動き、別の縦列の箱と同じ縦列の離れた箱は動かない", () => {
    const 前 = 箱の中心(組む(フロー()));
    const 後 = 箱の中心(
      組む(
        フロー({
          actors: [
            { name: "A", lane: "l1", pos: { x: 60, y: 40 } },
            { name: "B", lane: "l1", stack: 1 },
            { name: "C", lane: "l2" },
            { name: "D", lane: "l3" },
          ],
        }),
      ),
    );
    expect(前.size, "箱を測れていない (検査が空振りしている)").toBe(4);
    expect(後.get("a")!.cx - 前.get("a")!.cx).toBeCloseTo(60, 0);
    expect(後.get("a")!.cy - 前.get("a")!.cy).toBeCloseTo(40, 0);
    for (const id of ["b", "c", "d"]) {
      expect(後.get(id), `${id} が動いた`).toEqual(前.get(id));
    }
  });

  it("同じ縦列ですぐ下の箱に近づくと、ずらした箱は狙いに置かれ、下の箱は描画側が押し下げる", () => {
    // 静止したフローは 1 本の縦列に上から積む。 A を 40 下げると B との間が描画側の下限を割る
    const 基 = (a: Json): Json => ({
      title: "t",
      type: "flow",
      actors: [a, { name: "B" }, { name: "C" }],
      flow: [
        { from: "A", to: "B", label: "x" },
        { from: "B", to: "C", label: "y" },
      ],
    });
    const 前 = 箱の中心(組む(基({ name: "A" })));
    const 後 = 箱の中心(組む(基({ name: "A", pos: { x: 60, y: 40 } })));
    expect(後.get("a")!.cy - 前.get("a")!.cy).toBeCloseTo(40, 0);
    expect(後.get("b")!.cy, "下の箱が押し下げられていない").toBeGreaterThan(前.get("b")!.cy);
  });

  it("座標 (posX / posY) も書いた箱は、座標で置いた位置からずらす", () => {
    const 基 = (a: Json): Json =>
      フロー({
        actors: [
          a,
          { name: "B", lane: "l1", stack: 1 },
          { name: "C", lane: "l2" },
          { name: "D", lane: "l3" },
        ],
      });
    const 座標だけ = 箱の中心(組む(基({ name: "A", lane: "l1", posX: 500, posY: 600 })));
    const 両方 = 箱の中心(
      組む(基({ name: "A", lane: "l1", posX: 500, posY: 600, pos: { x: 60, y: 40 } })),
    );
    expect(
      座標だけ.get("a")!.cx - 箱の中心(組む(フロー())).get("a")!.cx,
      "座標が効いていない",
    ).not.toBeCloseTo(0, 0);
    expect(両方.get("a")!.cx - 座標だけ.get("a")!.cx).toBeCloseTo(60, 0);
    expect(両方.get("a")!.cy - 座標だけ.get("a")!.cy).toBeCloseTo(40, 0);
  });

  /**
   * 図種ごとに配置の組み立てが違う。 同じ 3 人と 2 本の矢印を 7 図種で組み、ずらした箱だけが
   * 書いた量だけ動くことを見る。
   */
  const 図種 = ["flow", "state", "er", "topology", "swimlane", "class", "c4"] as const;
  for (const t of 図種) {
    it(`type: ${t} でも書いた量だけ動く`, () => {
      const 基 = (a: Json): Json => ({
        title: "t",
        type: t,
        actors: [a, { name: "B" }, { name: "C" }],
        flow: [
          { from: "A", to: "B", label: "x" },
          { from: "B", to: "C", label: "y" },
        ],
      });
      const 知らせ: CompileNotice[] = [];
      const 前 = 箱の中心(組む(基({ name: "A" })));
      const 後 = 箱の中心(組む(基({ name: "A", pos: { x: 60, y: 40 } }), 知らせ));
      expect(前.get("a"), "箱 a を測れていない").toBeDefined();
      expect(後.get("a")!.cx - 前.get("a")!.cx).toBeCloseTo(60, 0);
      expect(後.get("a")!.cy - 前.get("a")!.cy).toBeCloseTo(40, 0);
      expect(知らせ.filter((n) => n.kind === "position-offset-ignored")).toEqual([]);
    });
  }
});

describe("JSON の縦列の pos で縦列が書いた量だけ動く (#1971)", () => {
  it("縦列 l1 の左端が 100 動き、幅と高さと他の縦列は書かない図と同じ", () => {
    const 前 = 縦列の枠(組む(フロー()));
    const 後図 = 組む(
      フロー({
        lanes: {
          l1: { width: 300, pos: { x: 100, y: 0 } },
          l2: { width: 300 },
          l3: { width: 300 },
        },
      }),
    );
    const 後 = 縦列の枠(後図);
    expect(前.size, "縦列を測れていない (検査が空振りしている)").toBe(3);
    expect(後.get("l1")!.x - 前.get("l1")!.x).toBeCloseTo(100, 0);
    expect(後.get("l1")!.y).toBeCloseTo(前.get("l1")!.y, 0);
    expect(後.get("l1")!.w).toBe(前.get("l1")!.w);
    expect(後.get("l1")!.h).toBe(前.get("l1")!.h);
    expect(後.get("l2")).toEqual(前.get("l2"));
    expect(後.get("l3")).toEqual(前.get("l3"));
  });

  it("縦列の中の箱は縦列と一緒に横にも縦にも動く", () => {
    // 縦にもずらす。 縦列を固定しただけでは箱は縦列の並ぶ向き (横) にしか付いて来ない (実測)
    const 前 = 箱の中心(組む(フロー()));
    const 後 = 箱の中心(
      組む(
        フロー({
          lanes: {
            l1: { width: 300, pos: { x: 100, y: 40 } },
            l2: { width: 300 },
            l3: { width: 300 },
          },
        }),
      ),
    );
    for (const id of ["a", "b"]) {
      expect(後.get(id)!.cx - 前.get(id)!.cx, `${id} が縦列と一緒に横へ動いていない`).toBeCloseTo(
        100,
        0,
      );
      expect(後.get(id)!.cy - 前.get(id)!.cy, `${id} が縦列と一緒に縦へ動いていない`).toBeCloseTo(
        40,
        0,
      );
    }
    for (const id of ["c", "d"]) expect(後.get(id), `${id} が動いた`).toEqual(前.get(id));
  });

  it("縦列と箱を一緒にずらしても、ずらした箱が近づいた下の箱は押し下げられる", () => {
    // 別の縦列をずらすと、ずらさない箱を元の位置に留める。 留める基準に箱のずらしを含めないと、
    // 押し下げられた箱が元の位置へ戻されて重なる
    const 基 = (a: Json, lanes: Json): Json =>
      フロー({
        lanes,
        actors: [
          a,
          { name: "B", lane: "l1", stack: 1 },
          { name: "C", lane: "l2" },
          { name: "D", lane: "l3" },
        ],
      });
    const 縦列 = { l1: { width: 300 }, l2: { width: 300 }, l3: { width: 300 } };
    const 前 = 箱の中心(組む(基({ name: "A", lane: "l1" }, 縦列)));
    const 箱だけ = 箱の中心(組む(基({ name: "A", lane: "l1", pos: { x: 0, y: 150 } }, 縦列)));
    expect(
      箱だけ.get("b")!.cy,
      "箱だけのずらしで下の箱が押し下げられていない (前提が崩れた)",
    ).toBeGreaterThan(前.get("b")!.cy);
    const 知らせ: CompileNotice[] = [];
    const 両方 = 箱の中心(
      組む(
        基(
          { name: "A", lane: "l1", pos: { x: 0, y: 150 } },
          { ...縦列, l3: { width: 300, pos: { x: 50, y: 0 } } },
        ),
        知らせ,
      ),
    );
    expect(両方.get("a")!.cy - 前.get("a")!.cy).toBeCloseTo(150, 0);
    expect(両方.get("b"), "押し下げられた箱が元の位置へ戻された").toEqual(箱だけ.get("b"));
    expect(両方.get("d")!.cx - 前.get("d")!.cx).toBeCloseTo(50, 0);
    expect(知らせ.filter((n) => n.kind === "position-offset-ignored")).toEqual([]);
  });

  /**
   * 囲いを持つ縦列 (`topology` / `c4`) は、縦列だけを配置後の位置で固定すると縦に 32 ずれた (実測)。
   * 中の箱も一緒に固定する形で、縦列と箱の両方が書いた量だけ動くことを見る。
   */
  for (const t of ["topology", "c4"] as const) {
    it(`type: ${t} の縦列も書いた量だけ動く (固定するとずれる図種)`, () => {
      const 基 = {
        title: "t",
        type: t,
        actors: [{ name: "A" }, { name: "B" }],
        flow: [{ from: "A", to: "B", label: "x" }],
      };
      const 前図 = 組む(基);
      const 縦列id = 前図.lanes[0]!.id;
      const 知らせ: CompileNotice[] = [];
      const 後図 = 組む({ ...基, lanes: { [縦列id]: { pos: { x: 100, y: 20 } } } }, 知らせ);
      const 後 = 縦列の枠(後図);
      const 前 = 縦列の枠(前図);
      expect(後.get(縦列id)!.x - 前.get(縦列id)!.x).toBeCloseTo(100, 0);
      expect(後.get(縦列id)!.y - 前.get(縦列id)!.y).toBeCloseTo(20, 0);
      const 中の箱 = 前図.nodes.filter((n) => n.lane === 縦列id).map((n) => n.id);
      expect(中の箱.length, "縦列の中の箱が無い (箱が付いて来るかを見ていない)").toBeGreaterThan(0);
      const 箱前 = 箱の中心(前図);
      const 箱後 = 箱の中心(後図);
      for (const id of 中の箱) {
        expect(箱後.get(id)!.cx - 箱前.get(id)!.cx, `${id} が横へ付いて来ない`).toBeCloseTo(100, 0);
        expect(箱後.get(id)!.cy - 箱前.get(id)!.cy, `${id} が縦へ付いて来ない`).toBeCloseTo(20, 0);
      }
      expect(知らせ.filter((n) => n.kind === "position-offset-ignored")).toEqual([]);
    });
  }
});

describe("JSON の矢印の pos は名前のずらしに足す (#1971)", () => {
  it("pos だけを書くと labelOffsetX / labelOffsetY がその値になる", () => {
    const d = 組む(
      フロー({
        flow: [
          { from: "A", to: "C", label: "x", pos: { x: 10, y: 5 } },
          { from: "B", to: "D", label: "y" },
        ],
      }),
    );
    const e = d.edges.find((x) => x.label === "x")!;
    expect(e.labelOffsetX).toBe(10);
    expect(e.labelOffsetY).toBe(5);
    expect(d.edges.find((x) => x.label === "y")!.labelOffsetX).toBeUndefined();
  });

  it("名前のずらしと両方書くと足した量になる", () => {
    const d = 組む(
      フロー({
        flow: [
          {
            from: "A",
            to: "C",
            label: "x",
            labelOffsetX: 7,
            labelOffsetY: -3,
            pos: { x: 10, y: 5 },
          },
        ],
      }),
    );
    const e = d.edges.find((x) => x.label === "x")!;
    expect(e.labelOffsetX).toBe(17);
    expect(e.labelOffsetY).toBe(2);
  });

  it("名前の無い矢印に書くと動かすものが無いと知らせる", () => {
    const 知らせ: CompileNotice[] = [];
    組む(フロー({ flow: [{ from: "A", to: "C", label: "", pos: { x: 10, y: 5 } }] }), 知らせ);
    const 該当 = 知らせ.filter((n) => n.kind === "position-offset-ignored");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("名前の無い矢印");
  });

  it("順序図の板では名前のずらしが効かないと知らせる", () => {
    const 知らせ: CompileNotice[] = [];
    組む(
      {
        title: "t",
        type: "sequence",
        actors: [{ name: "A" }, { name: "B", pos: { x: 10, y: 0 } }],
        flow: [{ from: "A", to: "B", label: "x", pos: { x: 10, y: 5 } }],
      },
      知らせ,
    );
    const 言づて = 知らせ.find((n) => n.kind === "message-option-not-honored");
    expect(言づて?.message).toContain("名前のずらし");
    const 面 = 知らせ.find((n) => n.kind === "actor-kind-not-honored" && n.actor === "B");
    expect(面?.message).toContain("位置");
  });
});

describe("記法の offsetX / offsetY は JSON の pos と同じ図になる (#1971)", () => {
  const 記法 = (箱: string, 縦列: string): string =>
    `title: "t"\ntype: flow\nlanes:\n  l1: { width: 300${縦列} }\n  l2: { width: 300 }\n\nactors:\n${箱}\n  - C: { lane: l2 }\n\nflow:\n  - A -> C: "x"\n`;

  it("箱の中括弧の形", () => {
    const y = textDslToDiagram(記法(`  - A: { lane: l1, offsetX: 60, offsetY: 40 }`, ""));
    const j = 組む({
      title: "t",
      type: "flow",
      lanes: { l1: { width: 300 }, l2: { width: 300 } },
      actors: [
        { name: "A", lane: "l1", pos: { x: 60, y: 40 } },
        { name: "C", lane: "l2" },
      ],
      flow: [{ from: "A", to: "C", label: "x" }],
    });
    expect(JSON.stringify(y)).toBe(JSON.stringify(j));
    expect(y.nodes.find((n) => n.id === "a")!.posX, "ずらしが効いていない").toBeDefined();
  });

  it("箱の縦に並べた形", () => {
    const y = textDslToDiagram(
      記法(`  - A:\n      lane: l1\n      offsetX: 60\n      offsetY: 40`, ""),
    );
    const j = textDslToDiagram(記法(`  - A: { lane: l1, offsetX: 60, offsetY: 40 }`, ""));
    expect(JSON.stringify(y)).toBe(JSON.stringify(j));
  });

  it("縦列の中括弧の形", () => {
    const y = textDslToDiagram(記法(`  - A: { lane: l1 }`, ", offsetX: 100, offsetY: 0"));
    const j = 組む({
      title: "t",
      type: "flow",
      lanes: { l1: { width: 300, pos: { x: 100, y: 0 } }, l2: { width: 300 } },
      actors: [
        { name: "A", lane: "l1" },
        { name: "C", lane: "l2" },
      ],
      flow: [{ from: "A", to: "C", label: "x" }],
    });
    expect(JSON.stringify(y)).toBe(JSON.stringify(j));
    expect(y.lanes.find((l) => l.id === "l1")!.posX, "ずらしが効いていない").toBeDefined();
  });

  it("片方だけ書くと残りは 0 として読む", () => {
    const y = textDslToDiagram(記法(`  - A: { lane: l1, offsetX: 60 }`, ""));
    const j = textDslToDiagram(記法(`  - A: { lane: l1, offsetX: 60, offsetY: 0 }`, ""));
    expect(JSON.stringify(y)).toBe(JSON.stringify(j));
  });
});

describe("見本 (parts) の箱は見本 1 つ分まとめて動く (#1971)", () => {
  const 見本 = (id: string): CdlDiagram =>
    diagram(id, { topic: id })
      .lane("l", { width: 300 })
      .node("top", { lane: "l", stack: 0, kind: "card", title: "上" })
      .node("bottom", { lane: "l", stack: 1, kind: "card", title: "下" })
      .build();
  const 見本帳 = { tile: 見本("tile"), "parts-tile": 見本("tile") };

  it("見本の要素が全て (60, 40) 動く", () => {
    const 基 = (a: Json): Json => ({
      title: "t",
      type: "flow",
      actors: [a, { name: "B" }],
      flow: [{ from: "P", to: "B", label: "x" }],
    });
    const 前 = 箱の中心(jsonToDiagram(基({ name: "P", kind: "tile" }), { partsCatalog: 見本帳 }));
    const 後 = 箱の中心(
      jsonToDiagram(基({ name: "P", kind: "tile", pos: { x: 60, y: 40 } }), {
        partsCatalog: 見本帳,
      }),
    );
    const 見本の要素 = [...前.keys()].filter((id) => id.startsWith("P__"));
    expect(見本の要素.length, "見本の要素を測れていない (検査が空振りしている)").toBe(2);
    for (const id of 見本の要素) {
      expect(後.get(id)!.cx - 前.get(id)!.cx, `${id} の横`).toBeCloseTo(60, 0);
      expect(後.get(id)!.cy - 前.get(id)!.cy, `${id} の縦`).toBeCloseTo(40, 0);
    }
  });
});

describe("ずらしを載せる相手が無い図では知らせる (#1971)", () => {
  it("図表 (pie) の箱に書くと載せる箱が無いと知らせる", () => {
    const 知らせ: CompileNotice[] = [];
    組む(
      {
        title: "t",
        type: "pie",
        actors: [
          { name: "A", value: "3", pos: { x: 10, y: 0 } },
          { name: "B", value: "2" },
        ],
        flow: [],
      },
      知らせ,
    );
    const 該当 = 知らせ.filter((n) => n.kind === "position-offset-ignored");
    expect(該当.map((n) => n.actor)).toEqual(["A"]);
  });

  it("mind は放射に描けない欄として 1 度だけ知らせる (2 度知らせない)", () => {
    const 知らせ: CompileNotice[] = [];
    組む(
      {
        title: "t",
        type: "mind",
        actors: [{ name: "A", pos: { x: 10, y: 0 } }, { name: "B" }],
        flow: [{ from: "A", to: "B", label: "x" }],
      },
      知らせ,
    );
    const ずらしの知らせ = 知らせ.filter((n) => n.message.includes("ずらし"));
    expect(ずらしの知らせ.map((n) => n.kind)).toEqual(["chart-value-unreadable"]);
  });

  it("ずらしを書かない図は箱にも縦列にも座標を書かない", () => {
    const d = 組む(フロー());
    expect(d.nodes.length, "箱が無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(d.nodes.filter((n) => n.posX !== undefined)).toEqual([]);
    expect(d.lanes.filter((l) => l.posX !== undefined)).toEqual([]);
  });
});
