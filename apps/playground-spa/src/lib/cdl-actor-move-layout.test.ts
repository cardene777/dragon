import { describe, it, expect } from "vitest";
import { compileToCdl, parseTextDslV05 } from "@cardenelabs/dragon";
import { layout } from "@cardenelabs/cdl";
import { moveActorInDsl, clampDx, MIN_LANE_GAP, type ActorSnapshot } from "./cdl-actor-move";

/**
 * DSL 文字列ではなく **compile + layout 後の座標** を oracle にする test。
 *
 * `cdl-actor-move.test.ts` は出力 DSL の正規表現 match で見ているため、
 * 「書いた座標が cdl でどう解釈されるか」 の層を検証できない。 分裂 (掴んでいない actor が
 * 縦にずれる) や系統的な offset はこの層でしか捕まらない (CAR-2156 review MINOR)。
 */

const src = `title: "T"
type: sequence
actors:
  - Client
  - API
  - DB
flow:
  - Client -> API: "req"
  - API -> DB: "q"
  - DB -> API: "r"
`;

type Geom = { lanes: Record<string, { x: number; y: number; w: number }>; nodes: Record<string, { cx: number; cy: number; lane: string }> };

function geom(dsl: string): Geom {
  const p = parseTextDslV05(dsl);
  if (!p.ok) throw new Error(`parse NG: ${JSON.stringify(p.errors)}`);
  const laid = layout(compileToCdl(p.doc));
  const lanes: Geom["lanes"] = {};
  for (const l of laid.lanes) lanes[l.id] = { x: l.x, y: l.y, w: l.width };
  const nodes: Geom["nodes"] = {};
  for (const n of laid.nodes) nodes[n.id] = { cx: n.cx, cy: n.cy, lane: n.lane };
  return { lanes, nodes };
}

/** base の実 lane 座標から snapshot を組む (editor が SVG 属性から読むのと同じ値)。 */
function snapshotFrom(g: Geom, target: string): ActorSnapshot {
  return {
    name: target,
    lanes: [
      { name: "Client", laneX: g.lanes.client!.x, laneY: g.lanes.client!.y, laneW: g.lanes.client!.w },
      { name: "API", laneX: g.lanes.api!.x, laneY: g.lanes.api!.y, laneW: g.lanes.api!.w },
      { name: "DB", laneX: g.lanes.db!.x, laneY: g.lanes.db!.y, laneW: g.lanes.db!.w },
    ],
  };
}

const b = geom(src);
const snap = snapshotFrom(b, "Client");

describe("compile 後の座標 (layout oracle)", () => {
  it("掴んだ actor の全 node が同じ dx で動き、 縦は動かない", () => {
    const a = geom(moveActorInDsl(src, snap, 150));
    const moved = Object.keys(b.nodes).filter((id) => b.nodes[id]!.lane === "client");
    expect(moved.length).toBeGreaterThan(2);
    for (const id of moved) {
      expect(a.nodes[id]!.cx - b.nodes[id]!.cx).toBeCloseTo(150, 5);
      expect(a.nodes[id]!.cy - b.nodes[id]!.cy).toBeCloseTo(0, 5);
    }
  });

  it("掴んでいない actor の node が 1px も動かない", () => {
    const a = geom(moveActorInDsl(src, snap, 150));
    for (const id of Object.keys(b.nodes)) {
      if (b.nodes[id]!.lane === "client") continue;
      expect(Math.abs(a.nodes[id]!.cx - b.nodes[id]!.cx)).toBeLessThan(1);
      expect(Math.abs(a.nodes[id]!.cy - b.nodes[id]!.cy)).toBeLessThan(1);
    }
  });

  it("隣に重なる量まで drag しても、 掴んでいない actor が縦に割れない", () => {
    // clamp が無いと cdl の衝突解決が「横に重なった node を縦に逃がす」 ため、
    // 掴んでいない API の header と footer だけが 88px 下がって lifeline から外れる。
    // Phase 4 (CAR-2139) で revert した分裂と見た目上は同じ症状になる。
    for (const dx of [450, 500, 600, 700, 1200, 3000]) {
      const a = geom(moveActorInDsl(src, snap, dx));
      for (const id of Object.keys(b.nodes)) {
        if (b.nodes[id]!.lane === "client") continue;
        expect(Math.abs(a.nodes[id]!.cy - b.nodes[id]!.cy), `dx=${dx} ${id}`).toBeLessThan(1);
      }
    }
  });

  it("左方向に大きく drag しても割れない", () => {
    const s = snapshotFrom(b, "DB");
    for (const dx of [-450, -700, -1200, -3000]) {
      const a = geom(moveActorInDsl(src, s, dx));
      for (const id of Object.keys(b.nodes)) {
        if (b.nodes[id]!.lane === "db") continue;
        expect(Math.abs(a.nodes[id]!.cy - b.nodes[id]!.cy), `dx=${dx} ${id}`).toBeLessThan(1);
      }
    }
  });

  it("clamp 後も隣との間隔が MIN_LANE_GAP 以上ある", () => {
    const a = geom(moveActorInDsl(src, snap, 5000));
    const c = a.lanes.client!;
    const api = a.lanes.api!;
    expect(api.x - (c.x + c.w)).toBeGreaterThanOrEqual(MIN_LANE_GAP - 1);
  });

  it("drag を繰り返しても掴んでいない actor が系統的にずれない", () => {
    // lane 座標を bbox 実測から取ると枠線分 (strokeWidth 1.5) が乗り、
    // Math.round と合わさって 1 回ごとに 1px ずつずれ続ける。
    let dsl = src;
    for (let i = 0; i < 5; i += 1) {
      dsl = moveActorInDsl(dsl, snapshotFrom(geom(dsl), "Client"), 20);
    }
    const a = geom(dsl);
    for (const id of Object.keys(b.nodes)) {
      if (b.nodes[id]!.lane === "client") continue;
      expect(Math.abs(a.nodes[id]!.cx - b.nodes[id]!.cx), id).toBeLessThan(1);
    }
  });

  it("長い actor 名を含む図で、 掴んでいない actor が横にずれない", () => {
    // `posX` を書いた lane は幅の自動拡張を失う。 posW を併記しないと、 縮んだ幅の半分だけ
    // 配下 node が左に寄る (実測 = AuthenticationService の node が dx -112)。
    // declared 340 に対し header が 290px を超えると発火する = 和名 12 文字 / 英名 21 文字程度。
    const longSrc = `title: "T"
type: sequence
actors:
  - AuthenticationService
  - Server
  - Store
flow:
  - AuthenticationService -> Server: "x"
  - Server -> Store: "y"
  - Store -> Server: "z"
`;
    const lb = geom(longSrc);
    const laneOf = (n: string): { x: number; y: number; w: number } => {
      const hit = Object.entries(lb.lanes).find(([id]) => id.startsWith(n.toLowerCase().slice(0, 6)));
      if (!hit) throw new Error(`lane not found: ${n}`);
      return hit[1];
    };
    const ls: ActorSnapshot = {
      name: "Server",
      lanes: (["AuthenticationService", "Server", "Store"] as const).map((n) => {
        const l = laneOf(n);
        return { name: n, laneX: l.x, laneY: l.y, laneW: l.w };
      }),
    };
    const la = geom(moveActorInDsl(longSrc, ls, 100));
    for (const id of Object.keys(lb.nodes)) {
      const grabbed = lb.nodes[id]!.lane === "server";
      const delta = la.nodes[id]!.cx - lb.nodes[id]!.cx;
      // 掴んだ側は dx ちょうど動く、 それ以外は動かない。
      // grabbed 側を skip すると「長 actor 自身を掴んだ時に自分がずれる」 経路が漏れる。
      expect(Math.abs(delta - (grabbed ? 100 : 0)), id).toBeLessThan(2);
    }
  });

  it("長い actor 名の actor 自身を掴んでも、 落とした位置に着地する", () => {
    const longSrc = `title: "T"
type: sequence
actors:
  - AuthenticationService
  - Server
  - Store
flow:
  - AuthenticationService -> Server: "x"
  - Server -> Store: "y"
`;
    const lb = geom(longSrc);
    const ls: ActorSnapshot = {
      name: "AuthenticationService",
      lanes: (["AuthenticationService", "Server", "Store"] as const).map((n) => {
        const key = Object.keys(lb.lanes).find((id) => id.startsWith(n.toLowerCase().slice(0, 6)))!;
        const l = lb.lanes[key]!;
        return { name: n, laneX: l.x, laneY: l.y, laneW: l.w };
      }),
    };
    const la = geom(moveActorInDsl(longSrc, ls, -80));
    const grabbedLane = Object.keys(lb.lanes).find((id) => id.startsWith("authen"))!;
    for (const id of Object.keys(lb.nodes)) {
      const grabbed = lb.nodes[id]!.lane === grabbedLane;
      const delta = la.nodes[id]!.cx - lb.nodes[id]!.cx;
      expect(Math.abs(delta - (grabbed ? -80 : 0)), id).toBeLessThan(2);
    }
  });

  it("clampDx の戻り値どおりに lane が動く", () => {
    // 書込み側が Math.round するので 1px 未満の丸め差は許容する
    const dx = clampDx(snap, 5000);
    const a = geom(moveActorInDsl(src, snap, 5000));
    expect(Math.abs(a.lanes.client!.x - b.lanes.client!.x - dx)).toBeLessThan(1);
  });
});
