/**
 * 部品の図を JSON のまま本文に埋め込んだ形 (先頭行が `#!parts`) を判定し、読み出す処理の検査。
 *
 * 画面はこの形を作らないが、共有 URL や保存した本文に残る形を開けるよう読み取りを残している。
 * 本文は、この形を作っていた頃と同じ書き方 (印の行の下に 2 字下げの JSON) で組む。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { isPartsMarker, deserializePart, PARTS_MARKER } from "./parts-serializer";
import * as partsMod from "@/topics/catalog/parts.cdl";

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
    },
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
    },
  ],
};

/** 図を印の形の本文にする。 印の行の下に、2 字下げで整えた JSON を置く */
function 印の形の本文(diagram: CdlDiagram): string {
  return `${PARTS_MARKER}\n${JSON.stringify(diagram, null, 2)}`;
}

describe("部品の図を埋め込んだ本文の読み取り", () => {
  describe("isPartsMarker", () => {
    it("先頭の空白と空行を除いた 1 行目が印なら真", () => {
      expect(isPartsMarker(`${PARTS_MARKER}\n{}`)).toBe(true);
      expect(isPartsMarker(`  \n\n${PARTS_MARKER}\n{}`)).toBe(true);
      expect(isPartsMarker(`\t${PARTS_MARKER}`)).toBe(true);
    });

    it("印の無い本文と、印に似た別の行は偽", () => {
      expect(isPartsMarker("title: foo")).toBe(false);
      expect(isPartsMarker("")).toBe(false);
      expect(isPartsMarker("#!other")).toBe(false);
      expect(isPartsMarker("# parts")).toBe(false); // space 挟むと不一致
      expect(isPartsMarker(`${PARTS_MARKER}-draft\n{}`)).toBe(false); // 印で始まる別の行
    });
  });

  describe("deserializePart", () => {
    it("印の形の本文から図を読み出す", () => {
      const restored = deserializePart(印の形の本文(SAMPLE_DIAGRAM));
      expect(restored).not.toBeNull();
      expect(restored?.id).toBe("test-part");
      expect(restored?.nodes.length).toBe(1);
      expect(restored?.phases.length).toBe(1);
    });

    it("印の無い本文は null", () => {
      expect(deserializePart("title: foo")).toBeNull();
      expect(deserializePart("")).toBeNull();
      expect(deserializePart('{"id":"x","nodes":[]}')).toBeNull(); // JSON 単独 (marker なし)
      // 印と同じ長さの別の行の下に、読める JSON を置いた形。 印の判定を通さないと読めてしまう
      expect(deserializePart('#!other\n{"id":"x","nodes":[]}')).toBeNull();
    });

    it("印より後が JSON として読めない本文は、投げずに null", () => {
      expect(deserializePart(`${PARTS_MARKER}\n{ invalid`)).toBeNull();
      expect(deserializePart(`${PARTS_MARKER}\n{"id":`)).toBeNull();
      expect(deserializePart(`${PARTS_MARKER}\n`)).toBeNull();
      expect(deserializePart(`${PARTS_MARKER}\n{"id":"x","nodes":[]}\nextra`)).toBeNull();
    });

    it("`id` と `nodes` を持つ object でない JSON は null", () => {
      expect(deserializePart(`${PARTS_MARKER}\n{}`)).toBeNull();
      expect(deserializePart(`${PARTS_MARKER}\n{"id":"x"}`)).toBeNull(); // nodes 不在
      expect(deserializePart(`${PARTS_MARKER}\n{"nodes":[]}`)).toBeNull(); // id 不在
      expect(deserializePart(`${PARTS_MARKER}\n{"id":"x","nodes":"invalid"}`)).toBeNull(); // nodes 型 array 以外
      expect(deserializePart(`${PARTS_MARKER}\n[1,2,3]`)).toBeNull(); // root が array
      expect(deserializePart(`${PARTS_MARKER}\nnull`)).toBeNull();
    });
  });

  describe("部品の一覧の全件", () => {
    it("印の形に埋め込むと、どの部品も id / nodes / phases を保って読み出せる", () => {
      const allParts = Object.entries(partsMod).filter(
        ([, v]) => v && typeof v === "object" && !Array.isArray(v) && typeof (v as { id?: unknown }).id === "string",
      );
      expect(allParts.length).toBeGreaterThanOrEqual(80);
      const failures: string[] = [];
      for (const [name, part] of allParts) {
        const diagram = part as CdlDiagram;
        try {
          const restored = deserializePart(印の形の本文(diagram));
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
        throw new Error(`読み出しが元の図と合わない部品 = ${failures.length} / ${allParts.length}:\n${failures.slice(0, 10).join("\n")}`);
      }
    });
  });
});
