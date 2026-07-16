/**
 * parts-serializer unit tests (CAR-1646、 kiwa-vitest 経路生成)
 *
 * 対象 = apps/playground-spa/src/lib/parts-serializer.ts (3 pure function)
 * source spec TC-037 〜 TC-044 + TC-053 の 9 unit TC を Vitest で実装
 *
 * 配置は root vitest config `include = "packages/**\/test/**"` に合致させるため
 * packages/dragon/test/ 配下、 source は relative path で ../../../apps/... を参照。
 * spec の「不足している仕様」 で暫定 pass 経路として明示済 (別 Issue で serializer を
 * dragon package 側に正式移設予定)。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  serializePart,
  isPartsMarker,
  deserializePart,
  PARTS_MARKER,
} from "../../../apps/playground-spa/src/lib/parts-serializer";
import * as partsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";

const SAMPLE_DIAGRAM: CdlDiagram = {
  id: "test-part",
  topic: "unit test sample",
  lanes: [{ id: "l", x: 0, width: 400 }],
  nodes: [
    {
      id: "n1",
      lane: "l",
      stack: 0,
      kind: "actor",
      title: "sample",
    } as CdlDiagram["nodes"][number],
  ],
  edges: [],
  states: [],
  phases: [
    {
      id: "p",
      duration: 1000,
      title: "phase 1",
      body: "",
      activate: [],
      tweens: [],
      sets: [],
    } as CdlDiagram["phases"][number],
  ],
};

describe("parts-serializer (CAR-1646)", () => {
  // ============================================================
  // group 1: serializePart
  // ============================================================
  describe("serializePart", () => {
    it("TC-037 output format = 先頭 marker + JSON body", () => {
      const out = serializePart(SAMPLE_DIAGRAM);
      expect(out.startsWith(`${PARTS_MARKER}\n`)).toBe(true);
      const body = out.slice(PARTS_MARKER.length + 1);
      expect(JSON.parse(body)).toEqual(SAMPLE_DIAGRAM);
    });

    it("TC-053 JSON indent 2 space 一貫性", () => {
      const out = serializePart(SAMPLE_DIAGRAM);
      const body = out.slice(PARTS_MARKER.length + 1);
      const expected = JSON.stringify(SAMPLE_DIAGRAM, null, 2);
      expect(body).toBe(expected);
      // 2 space indent 具体確認 = 各インデント行が 2 の倍数の space で始まる
      const lines = body.split("\n");
      for (const line of lines) {
        const leading = /^( +)/.exec(line);
        if (leading) {
          expect(leading[1].length % 2).toBe(0);
        }
      }
    });
  });

  // ============================================================
  // group 2: isPartsMarker
  // ============================================================
  describe("isPartsMarker", () => {
    it("TC-038 true 判定 (marker only / trimStart 経路)", () => {
      expect(isPartsMarker(`${PARTS_MARKER}\n{}`)).toBe(true);
      expect(isPartsMarker(`  \n\n${PARTS_MARKER}\n{}`)).toBe(true);
      expect(isPartsMarker(`\t${PARTS_MARKER}`)).toBe(true);
    });

    it("TC-039 false 判定 (marker 不在)", () => {
      expect(isPartsMarker("title: foo")).toBe(false);
      expect(isPartsMarker("")).toBe(false);
      expect(isPartsMarker("#!other")).toBe(false);
      expect(isPartsMarker("# parts")).toBe(false); // space 挟むと不一致
    });
  });

  // ============================================================
  // group 3: deserializePart
  // ============================================================
  describe("deserializePart", () => {
    it("TC-040 happy path で CdlDiagram 復元", () => {
      const src = serializePart(SAMPLE_DIAGRAM);
      const restored = deserializePart(src);
      expect(restored).not.toBeNull();
      expect(restored?.id).toBe("test-part");
      expect(restored?.nodes.length).toBe(1);
      expect(restored?.phases.length).toBe(1);
    });

    it("TC-041 marker 不在で null", () => {
      expect(deserializePart("title: foo")).toBeNull();
      expect(deserializePart("")).toBeNull();
      expect(deserializePart('{"id":"x","nodes":[]}')).toBeNull(); // JSON 単独 (marker なし)
    });

    it("TC-042 破損 JSON で null (throw なし)", () => {
      expect(deserializePart(`${PARTS_MARKER}\n{ invalid`)).toBeNull();
      expect(deserializePart(`${PARTS_MARKER}\n{"id":`)).toBeNull();
      expect(deserializePart(`${PARTS_MARKER}\n`)).toBeNull();
      expect(deserializePart(`${PARTS_MARKER}\n{"id":"x","nodes":[]}\nextra`)).toBeNull();
    });

    it("TC-043 id / nodes 不在で null (最小 shape 未満)", () => {
      expect(deserializePart(`${PARTS_MARKER}\n{}`)).toBeNull();
      expect(deserializePart(`${PARTS_MARKER}\n{"id":"x"}`)).toBeNull(); // nodes 不在
      expect(deserializePart(`${PARTS_MARKER}\n{"nodes":[]}`)).toBeNull(); // id 不在
      expect(deserializePart(`${PARTS_MARKER}\n{"id":"x","nodes":"invalid"}`)).toBeNull(); // nodes 型 array 以外
      expect(deserializePart(`${PARTS_MARKER}\n[1,2,3]`)).toBeNull(); // root が array
      expect(deserializePart(`${PARTS_MARKER}\nnull`)).toBeNull();
    });
  });

  // ============================================================
  // group 4: round-trip (全 80 parts loop)
  // ============================================================
  describe("round-trip (parts.cdl.ts 全 80 diagram)", () => {
    it("TC-044 全 parts の serialize → deserialize で id / nodes / phases 保持", () => {
      const allParts = Object.entries(partsMod).filter(
        ([, v]) => v && typeof v === "object" && !Array.isArray(v) && typeof (v as { id?: unknown }).id === "string",
      );
      expect(allParts.length).toBeGreaterThanOrEqual(80);
      const failures: string[] = [];
      for (const [name, part] of allParts) {
        const diagram = part as CdlDiagram;
        try {
          const src = serializePart(diagram);
          const restored = deserializePart(src);
          if (!restored) {
            failures.push(`${name} (${diagram.id}): deserialize returned null`);
            continue;
          }
          if (restored.id !== diagram.id) {
            failures.push(`${name} (${diagram.id}): id mismatch = ${restored.id}`);
          }
          if (restored.nodes.length !== diagram.nodes.length) {
            failures.push(`${name} (${diagram.id}): nodes length mismatch = ${restored.nodes.length} vs ${diagram.nodes.length}`);
          }
          if (restored.phases.length !== diagram.phases.length) {
            failures.push(`${name} (${diagram.id}): phases length mismatch = ${restored.phases.length} vs ${diagram.phases.length}`);
          }
        } catch (e) {
          failures.push(`${name} (${diagram.id}): throw = ${(e as Error).message}`);
        }
      }
      if (failures.length > 0) {
        throw new Error(`round-trip failures = ${failures.length} / ${allParts.length}:\n${failures.slice(0, 10).join("\n")}`);
      }
    });
  });
});
