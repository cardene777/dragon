/**
 * 線の無い段の番号の中心を、書き換わる箱の左上の角に置く (#3187)。
 *
 * 線を引かず箱に書き込むだけの段と、何も書かない段は、番号を箱の左上の角から 4px 内側に置いていた。
 * 箱の左上には絵柄が在るので、番号が絵柄の角に掛かって重なっていた。
 * 番号の中心を箱の角に置き、半分を箱の外へ出して絵柄から離す。
 * 中身の帯だけを書き換える段の番号は、帯の左上の角から 4px 内側のまま置く。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOOK } from "../src/look/values";
import { parseNotation } from "../src/parser";
import { describeOverlap, type Overlap } from "../src/render/ink";
import { renderDiagram } from "../src/render/svg";
import type { Diagram } from "../src/schema";

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures");

function fixture(file: string): Diagram {
  const parsed = parseNotation(readFileSync(join(FIXTURES, file), "utf8"));
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
}

/** 重なりを `段 N: 文` の形に並べる。落ちた時にどの段で何が重なったかを読めるようにする */
const report = (overlaps: Overlap[]): string[] => overlaps.map((o) => `段 ${o.step + 1}: ${describeOverlap(o)}`);

/** 線の無い段 (0 から数えた段) と、その段で番号を付ける箱 */
const CORNERS: { file: string; step: number; box: string }[] = [
  { file: "corner-note.dragon", step: 1, box: "支払い待ち" },
  { file: "corner-empty.dragon", step: 1, box: "支払い待ち" },
  { file: "corner-slot.dragon", step: 0, box: "画面" },
  { file: "corner-seq.dragon", step: 1, box: "API" },
  { file: "repeat-corner.dragon", step: 1, box: "画面" },
];

describe("線の無い段の番号を箱の左上の角に置く (#3187)", () => {
  it("corner-badge-state-note-no-overlaps", () => {
    expect(report(renderDiagram(fixture("corner-note.dragon")).overlaps)).toEqual([]);
  });

  it("corner-badge-state-empty-no-overlaps", () => {
    expect(report(renderDiagram(fixture("corner-empty.dragon")).overlaps)).toEqual([]);
  });

  it("corner-badge-architecture-slot-no-overlaps", () => {
    expect(report(renderDiagram(fixture("corner-slot.dragon")).overlaps)).toEqual([]);
  });

  it("corner-badge-centered-on-corner", () => {
    for (const { file, step, box: id } of CORNERS) {
      const { layout } = renderDiagram(fixture(file));
      const badge = layout.badges.find((b) => b.step === step);
      const box = layout.boxes.find((b) => b.id === id);
      if (!badge || !box) throw new Error(`${file} の段 ${step + 1} の番号か箱 ${id} が無い`);
      expect([badge.x, badge.y], `${file} の段 ${step + 1} の番号の中心が ${id} の左上の角に無い`).toEqual([box.x, box.y]);
    }
  });

  it("corner-badge-strip-unchanged", () => {
    const { layout } = renderDiagram(fixture("repeat-corner.dragon"));
    const { strip } = layout;
    if (!strip) throw new Error("repeat-corner.dragon に中身の帯が無い");
    // 4 段目と 5 段目は中身の帯だけを書き換える
    for (const step of [3, 4]) {
      const badge = layout.badges.find((b) => b.step === step);
      if (!badge) throw new Error(`段 ${step + 1} の番号が無い`);
      expect([badge.x, badge.y], `段 ${step + 1} の番号が帯の左上の角から内側に無い`).toEqual([strip.x + LOOK.badge.inset, strip.y + LOOK.badge.inset]);
    }
  });

  it("corner-badge-inside-figure", () => {
    const { r } = LOOK.badge;
    for (const file of ["corner-note.dragon", "corner-empty.dragon", "corner-slot.dragon", "corner-seq.dragon"]) {
      const { layout } = renderDiagram(fixture(file));
      for (const b of layout.badges) {
        const inside = b.x - r >= 0 && b.y - r >= 0 && b.x + r <= layout.width && b.y + r <= layout.height;
        expect(inside, `${file} の段 ${b.step + 1} の番号 (${b.x}, ${b.y}) が図 (${layout.width}x${layout.height}) の外へはみ出す`).toBe(true);
      }
    }
  });
});
