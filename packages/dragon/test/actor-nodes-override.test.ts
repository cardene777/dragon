/**
 * canvas pivot UX 修正 (B1 individual node isolation) の unit test。
 *
 * DSL `- ユーザー: { nodes: { header: { posX: 100, posY: 50, posW: 200, posH: 60 } } }`
 * 形式を parse し、 compile 経路で対応 CDL node (id = `{slug}-header`) の posX/Y/W/H に反映される
 * ことを assert する。 actor 全体 (lane) には反映されない = 他 sub-node (spacer / footer / s{N}) の
 * auto layout は保持される (= B1 fail 解消の core spec)。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";
import { textDslToDiagram } from "../src/index";

describe("actor.nodes override (canvas pivot UX 修正 B1)", () => {
  describe("parser 経路", () => {
    it("actor entry の inline map から nodes: { header: {...} } を parse する", () => {
      const src = `title: "t"
type: sequence

actors:
  - ユーザー: { nodes: { header: { posX: 100, posY: 50, posW: 220, posH: 70 } } }

flow:
  - ユーザー -> ユーザー: "self"
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const actor = r.doc.actors[0]!;
      expect(actor.name).toBe("ユーザー");
      expect(actor.nodes).toBeDefined();
      expect(actor.nodes!.header).toEqual({ posX: 100, posY: 50, posW: 220, posH: 70 });
    });

    it("複数 sub-node を同時 parse (header / footer / spacer)", () => {
      const src = `title: "t"
type: sequence

actors:
  - u: { nodes: { header: { posX: 10, posY: 20 }, footer: { posX: 30, posY: 40 }, spacer: { posX: 50, posY: 60 } } }

flow:
  - u -> u: "s"
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const nodes = r.doc.actors[0]!.nodes!;
      expect(Object.keys(nodes).sort()).toEqual(["footer", "header", "spacer"]);
      expect(nodes.header).toEqual({ posX: 10, posY: 20, posW: undefined, posH: undefined });
      expect(nodes.footer!.posY).toBe(40);
      expect(nodes.spacer!.posX).toBe(50);
    });

    it("nodes と actor-level posX/Y を並存指定できる", () => {
      const src = `title: "t"
type: sequence

actors:
  - u: { posX: 300, posY: 200, nodes: { header: { posX: 320, posY: 210, posW: 180, posH: 60 } } }

flow:
  - u -> u: "s"
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const actor = r.doc.actors[0]!;
      expect(actor.posX).toBe(300);
      expect(actor.posY).toBe(200);
      expect(actor.nodes!.header).toEqual({ posX: 320, posY: 210, posW: 180, posH: 60 });
    });

    it("nodes 未指定 actor は undefined、 stateOverride 経路に流れない", () => {
      const src = `title: "t"
type: sequence

actors:
  - u

flow:
  - u -> u: "s"
`;
      const r = parseTextDslV05(src);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.doc.actors[0]!.nodes).toBeUndefined();
      expect(r.doc.actors[0]!.stateOverride).toBeUndefined();
    });
  });

  describe("compile 経路 (sequence preset で `{slug}-header` に per-node 座標反映)", () => {
    it("nodes.header の posX/Y/W/H が対応 CDL node に個別反映される", () => {
      const src = `title: "test"
type: sequence

actors:
  - user: { nodes: { header: { posX: 400, posY: 100, posW: 200, posH: 50 } } }
  - api

flow:
  - user -> api: "call"
`;
      const diagram = textDslToDiagram(src);
      const headerNode = diagram.nodes.find((n) => n.id === "user-header");
      expect(headerNode, `user-header node が存在 (nodes=${diagram.nodes.map((n) => n.id).join(",")})`).toBeDefined();
      expect(headerNode!.posX).toBe(400);
      expect(headerNode!.posY).toBe(100);
      expect(headerNode!.posW).toBe(200);
      expect(headerNode!.posH).toBe(50);
    });

    it("nodes 単独指定時、 対応 lane 側は posX/Y 未反映 (actor.posX 未指定なら)", () => {
      const src = `title: "test"
type: sequence

actors:
  - user: { nodes: { header: { posX: 400, posY: 100 } } }
  - api

flow:
  - user -> api: "call"
`;
      const diagram = textDslToDiagram(src);
      const userLane = diagram.lanes.find((l) => l.id === "user");
      expect(userLane).toBeDefined();
      expect(userLane!.posX, "actor.posX 未指定なら lane は auto layout 継続").toBeUndefined();
      expect(userLane!.posY).toBeUndefined();
    });

    it("nodes.header 個別 resize しても spacer / footer の auto layout は不変", () => {
      const srcA = `title: "test"
type: sequence

actors:
  - user
  - api

flow:
  - user -> api: "call"
`;
      const srcB = `title: "test"
type: sequence

actors:
  - user: { nodes: { header: { posX: 400, posY: 100, posW: 200, posH: 50 } } }
  - api

flow:
  - user -> api: "call"
`;
      const dA = textDslToDiagram(srcA);
      const dB = textDslToDiagram(srcB);
      // spacer / footer は override 未指定なので B 側でも A 側と同じ auto layout の node 定義になる
      const spacerA = dA.nodes.find((n) => n.id === "user-spacer");
      const spacerB = dB.nodes.find((n) => n.id === "user-spacer");
      expect(spacerA).toBeDefined();
      expect(spacerB).toBeDefined();
      expect(spacerB!.posX, "spacer は override 未指定なので auto layout 継続").toBeUndefined();
      expect(spacerB!.posY).toBeUndefined();
      const footerB = dB.nodes.find((n) => n.id === "user-footer");
      expect(footerB!.posX).toBeUndefined();
      expect(footerB!.posY).toBeUndefined();
    });
  });
});
