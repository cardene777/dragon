/**
 * canvas pivot UX 修正 (B1 individual node isolation) の unit test。
 *
 * DSL `- ユーザー: { nodes: { header: { posX: 100, posY: 50, posW: 200, posH: 60 } } }`
 * 形式を parse し、対応する箱があればその posX/Y/W/H に反映する。
 *
 * `#1466` で順序図が 1 枚の板になり、`{名前}-{小名}` の形の箱を作る図種は無くなった =
 * いま反映する先は無い。 記法は読めるので、**当たる箱が無いことを伝える** ところまでを見る。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/index";

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

  describe("compile 経路 (当たる箱が無いことを伝える)", () => {
    /*
     * `#1466` で順序図は 1 枚の板になり、面ごとの箱 (名札 / 余白 / 足 / 段の箱) が消えた。
     * `{名前}-{小名}` / `{小名}-{名前}` の形の箱を作る図種はいま 1 つも無い = 反映する先が
     * 無い。 黙って落とすと、書いた側は効いていると思い込む。
     */
    const 知らせ = (src: string): string[] => {
      const r = parseTextDslV05(src);
      if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
      const 出た: string[] = [];
      compileToCdl(r.doc, {
        onNotice: (n) => {
          if (n.kind === "sub-node-not-found") 出た.push(n.message);
        },
      });
      return 出た;
    };

    it("当たる箱が無いことを伝える", () => {
      const 出た = 知らせ(`title: "t"
type: topology

actors:
  - User: { nodes: { header: { posX: 100, posY: 50 } } }
  - API

flow:
  - User -> API: "req"
`);
      expect(出た.length, "書いた位置が黙って落ちている").toBe(1);
      expect(出た[0]).toContain("header");
    });

    it("nodes を書かなければ何も伝えない", () => {
      expect(知らせ(`title: "t"
type: topology

actors:
  - User
  - API

flow:
  - User -> API: "req"
`)).toEqual([]);
    });

    it("位置を片方しか書かない指定は対象にしない", () => {
      // 反映しない指定で知らせを出すと、書き途中の記法が毎回鳴る
      expect(知らせ(`title: "t"
type: topology

actors:
  - User: { nodes: { header: { posX: 100 } } }
  - API

flow:
  - User -> API: "req"
`)).toEqual([]);
    });
  });
});
