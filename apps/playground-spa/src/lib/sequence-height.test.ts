/**
 * 見本の時系列図が縦に詰まり、線の名前の札が線に食い込まない (#3177)。
 *
 * 部品「絵」の時系列図の見本 (英語) は、詰める前は高さ 302 だった。
 * 見本帳の部品の見本、使い方の頁の例、`packages/dragon/examples` の時系列図を全て描き、札が自分の線にも他の線にも食い込まないかを見る。
 * 札は線を隠すので、エンジンが返す重なりの一覧 (`overlaps`) には出ない。ここで置き場所から確かめる。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation, type Rendered, renderDiagram } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

import { app, root } from "./playground-support";

type Rect = { x: number; y: number; w: number; h: number };
type Point = [number, number];

const PARTS = join(app, "src/catalog/parts");
const DIRS = [PARTS, join(app, "src/docs/examples"), join(root, "packages/dragon/examples")];

function draw(dir: string, file: string): Rendered {
  const text = readFileSync(join(dir, file), "utf8");
  const lang = /\.en\.(dragon|json)$/.test(file) ? "en" : "ja";
  if (file.endsWith(".json")) return renderDiagram(JSON.parse(text), { lang });
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`${file} を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang });
}

/** 折れ線が四角の内側を通るか */
function crosses(rect: Rect, points: Point[]): boolean {
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (let k = 0; k <= n; k++) {
      const x = ax + ((bx - ax) * k) / n;
      const y = ay + ((by - ay) * k) / n;
      if (x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h) return true;
    }
  }
  return false;
}

describe("見本の時系列図を縦に詰める (#3177)", () => {
  it("icon-sequence-example-shorter", () => {
    const { layout } = draw(PARTS, "icon.sequence.en.dragon");
    expect(layout.height, "部品「絵」の時系列図の見本 (英語) の高さ").toBeLessThanOrEqual(250);
  });

  it("sequence-labels-clear-of-lines-in-every-example", () => {
    const found: string[] = [];
    let seen = 0;
    for (const dir of DIRS) {
      for (const file of readdirSync(dir).filter((f) => /\.(dragon|json)$/.test(f)).sort()) {
        const { layout } = draw(dir, file);
        if (layout.kind !== "sequence") continue;
        seen++;
        for (const label of layout.labels) {
          for (const line of layout.edges) if (crosses(label, line.points)) found.push(`${file} 段 ${label.step + 1}: 札「${label.text}」が線 ${line.from} → ${line.to} (段 ${line.step + 1}) に食い込む`);
        }
      }
    }
    expect(seen, "時系列図の見本が少なすぎる").toBeGreaterThanOrEqual(40);
    expect(found, `札が線に食い込む所 ${found.length} 件\n${found.join("\n")}`).toEqual([]);
  });
});
