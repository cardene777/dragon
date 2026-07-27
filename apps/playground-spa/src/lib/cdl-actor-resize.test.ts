import { describe, it, expect } from "vitest";
import { scaleActorInDsl, scaleDiagramInDsl, updateActorNodeBox, clampScale, nodeKeyOf, type ActorSizeSnapshot } from "./cdl-actor-resize";

const src = `title: "T"
type: sequence
actors:
  - Client
  - API
flow:
  - Client -> API: "req"
`;
const snaps: ActorSizeSnapshot[] = [
  { name: "Client", laneX: 0, laneY: 42, laneW: 340, nodes: [{ key: "header", cx: 170, cy: 164, w: 184, h: 72 }, { key: "footer", cx: 170, cy: 578, w: 184, h: 72 }] },
  { name: "API", laneX: 565, laneY: 42, laneW: 340, nodes: [{ key: "header", cx: 735, cy: 164, w: 184, h: 72 }] },
];

describe("scaleActorInDsl", () => {
  it("対象 actor の lane 幅と node サイズを倍にする", () => {
    const out = scaleActorInDsl(src, snaps, "Client", 1.5);
    expect(out).toMatch(/- Client:.*posW: 510/);
    expect(out).toMatch(/header: \{ posX: 170, posY: 164, posW: 276, posH: 108 \}/);
  });
  it("対象外の actor はサイズを変えない", () => {
    const out = scaleActorInDsl(src, snaps, "Client", 1.5);
    expect(out).toMatch(/- API:.*posW: 340/);
  });
  it("位置は現在値のまま書いて固定する", () => {
    const out = scaleActorInDsl(src, snaps, "Client", 2);
    expect(out).toMatch(/- Client:.*posX: 0/);
    expect(out).toMatch(/- API:.*posX: 565/);
  });
  it("node の posY は書かない (書くと縦に割れる)", () => {
    const out = scaleActorInDsl(src, snaps, "Client", 1.5);
    expect(out).toMatch(/header: \{[^}]*posY: 164/);
  });
});

describe("scaleDiagramInDsl", () => {
  it("全 actor のサイズと間隔を倍にする", () => {
    const out = scaleDiagramInDsl(src, snaps, 2);
    expect(out).toMatch(/- Client:.*posW: 680/);
    expect(out).toMatch(/- API:.*posW: 680/);
    // 間隔も広がる (565 → 1130)
    expect(out).toMatch(/- API:.*posX: 1130/);
  });
  it("原点 (最左上) は動かさない", () => {
    const out = scaleDiagramInDsl(src, snaps, 2);
    expect(out).toMatch(/- Client:.*posX: 0/);
  });
  it("縮小もできる", () => {
    const out = scaleDiagramInDsl(src, snaps, 0.5);
    expect(out).toMatch(/- API:.*posX: 283/);
  });
});

describe("clampScale", () => {
  it("下限 / 上限に丸める", () => {
    expect(clampScale(0.01)).toBe(0.4);
    expect(clampScale(99)).toBe(4);
    expect(clampScale(1.5)).toBe(1.5);
  });
  it("不正値は 1", () => {
    expect(clampScale(NaN)).toBe(1);
    expect(clampScale(0)).toBe(1);
    expect(clampScale(-2)).toBe(1);
  });
});

describe("updateActorNodeBox", () => {
  it("nodes が無ければ作る", () => {
    const s = "actors:\n  - Client: { posX: 0 }\n";
    expect(updateActorNodeBox(s, "Client", "header", 10, 20, 100, 50)).toContain("nodes: { header: { posX: 10, posY: 20, posW: 100, posH: 50 } }");
  });
  it("既存 nodes に追記する", () => {
    const s = "actors:\n  - Client: { nodes: { footer: { posW: 1 } } }\n";
    const out = updateActorNodeBox(s, "Client", "header", 10, 20, 100, 50);
    expect(out).toContain("footer:");
    expect(out).toContain("header: { posX: 10, posY: 20, posW: 100, posH: 50 }");
  });
  it("同 node の既存 posW/posH を置換する (重複しない)", () => {
    const s = "actors:\n  - Client: { nodes: { header: { posW: 1, posH: 2 } } }\n";
    const out = updateActorNodeBox(s, "Client", "header", 10, 20, 100, 50);
    expect(out.match(/posW:/g)).toHaveLength(1);
    expect(out).toContain("posW: 100");
  });
  it("同 node の他 field を保持する", () => {
    const s = "actors:\n  - Client: { nodes: { header: { label: \"A, B\" } } }\n";
    const out = updateActorNodeBox(s, "Client", "header", 10, 20, 100, 50);
    expect(out).toContain('label: "A, B"');
    expect(out).toContain("posW: 100");
  });
  it("actor の他 field を壊さない", () => {
    const s = "actors:\n  - Client: { kind: person, posX: 5 }\n";
    const out = updateActorNodeBox(s, "Client", "header", 10, 20, 100, 50);
    expect(out).toContain("kind: person");
    expect(out).toContain("posX: 5");
  });
  it("該当 actor が無ければ不変", () => {
    const s = "actors:\n  - Client: { posX: 0 }\n";
    expect(updateActorNodeBox(s, "zzz", "header", 1, 1, 1, 1)).toBe(s);
  });
});

describe("nodeKeyOf", () => {
  it("suffix 形式", () => { expect(nodeKeyOf("client-header", "Client", "client")).toBe("header"); });
  it("step box 形式", () => { expect(nodeKeyOf("s0-client", "Client", "client")).toBe("s0"); });
  it("parts merge 形式", () => { expect(nodeKeyOf("client__ring", "Client", "client")).toBe("ring"); });
  it("別 actor は null", () => { expect(nodeKeyOf("api-header", "Client", "client")).toBeNull(); });
});
