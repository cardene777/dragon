/**
 * @vitest-environment jsdom
 *
 * canvas pivot UX 修正 (B1 individual node isolation) の interaction helper unit test。
 *
 * cover:
 * - findDragTarget が sub-node key を抽出 (`{slug}-header` → subNodeKey='header'、 `s0-{slug}` → 's0')
 * - updateActorNodePosition が nested `nodes: { subKey: { posX/Y/W/H } }` を追加 / 更新
 * - extractActorNodePosition で書出し 値を読み戻せる round-trip
 * - actor 全体 posX (updateActorPosition) と subKey posX (updateActorNodePosition) が独立に共存
 */
import { describe, it, expect } from "vitest";
import {
  findDragTarget,
  updateActorNodePosition,
  extractActorNodePosition,
  extractActorPosition,
  updateActorPosition,
  slugify,
} from "./canvas-pivot-interaction";

function mkEl(attrs: Record<string, string>): Element {
  const el = document.createElement("div");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

describe("findDragTarget (sub-node key 抽出)", () => {
  it("data-cdl-node=`{slug}-header` から subNodeKey='header' を抽出", () => {
    const el = mkEl({ "data-cdl-node": `${slugify("ユーザー")}-header` });
    const r = findDragTarget(el, ["ユーザー"]);
    expect(r).toEqual({ name: "ユーザー", kind: "node", subNodeKey: "header" });
  });

  it("`{slug}-footer` → subNodeKey='footer'", () => {
    const el = mkEl({ "data-cdl-node": `${slugify("api")}-footer` });
    const r = findDragTarget(el, ["api"]);
    expect(r).toEqual({ name: "api", kind: "node", subNodeKey: "footer" });
  });

  it("`s0-{slug}` (step box) → subNodeKey='s0'", () => {
    const el = mkEl({ "data-cdl-node": `s0-${slugify("ユーザー")}` });
    const r = findDragTarget(el, ["ユーザー"]);
    expect(r).toEqual({ name: "ユーザー", kind: "node", subNodeKey: "s0" });
  });

  it("`{slug}` bare (単独 node preset) → subNodeKey なし", () => {
    const el = mkEl({ "data-cdl-node": slugify("client") });
    const r = findDragTarget(el, ["client"]);
    expect(r).toEqual({ name: "client", kind: "node" });
  });

  it("`{slug}-spacer` → subNodeKey='spacer'", () => {
    const el = mkEl({ "data-cdl-node": `${slugify("api")}-spacer` });
    const r = findDragTarget(el, ["api"]);
    expect(r).toEqual({ name: "api", kind: "node", subNodeKey: "spacer" });
  });
});

describe("updateActorNodePosition (nested nodes 書出し)", () => {
  const base = `title: "t"
type: sequence

actors:
  - user
  - api

flow:
  - user -> api: "call"
`;

  it("bare actor に nested nodes を新規追加", () => {
    const out = updateActorNodePosition(base, "user", "header", 100, 50, 200, 60);
    expect(out).toContain("- user: { nodes: { header: { posX: 100, posY: 50, posW: 200, posH: 60 } } }");
  });

  it("同 subKey を 2 回書出しで最新値上書き (round-trip)", () => {
    let out = updateActorNodePosition(base, "user", "header", 100, 50);
    out = updateActorNodePosition(out, "user", "header", 200, 80, 240, 70);
    const pos = extractActorNodePosition(out, "user", "header");
    expect(pos).toEqual({ posX: 200, posY: 80, posW: 240, posH: 70 });
  });

  it("複数 subKey (header + footer) を独立に書出せる", () => {
    let out = updateActorNodePosition(base, "user", "header", 100, 50);
    out = updateActorNodePosition(out, "user", "footer", 300, 400, 200, 60);
    expect(extractActorNodePosition(out, "user", "header")!.posX).toBe(100);
    expect(extractActorNodePosition(out, "user", "footer")).toEqual({ posX: 300, posY: 400, posW: 200, posH: 60 });
  });

  it("actor 全体 posX (updateActorPosition) と subKey posX が独立共存", () => {
    let out = updateActorPosition(base, "user", 500, 200);
    out = updateActorNodePosition(out, "user", "header", 520, 210, 180, 60);
    expect(extractActorPosition(out, "user")!.posX).toBe(500);
    expect(extractActorNodePosition(out, "user", "header")!.posX).toBe(520);
  });

  it("short form `- name: kind` からも書出せる", () => {
    const src = `title: "t"
type: flow

actors:
  - orders: storage
`;
    const out = updateActorNodePosition(src, "orders", "header", 10, 20);
    expect(out).toContain("orders: { kind: storage, nodes: { header: { posX: 10, posY: 20 } } }");
  });

  it("既存 inline map (posX + subtitle 等) を保持して nodes だけ追加", () => {
    const src = `title: "t"
type: sequence

actors:
  - user: { posX: 100, posY: 50, subtitle: "顧客" }
`;
    const out = updateActorNodePosition(src, "user", "header", 200, 80, 180, 60);
    expect(out).toContain("posX: 100");
    expect(out).toContain("subtitle: \"顧客\"");
    expect(out).toContain("nodes: { header: { posX: 200, posY: 80, posW: 180, posH: 60 } }");
  });
});
