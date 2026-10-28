/**
 * 見本の字が重ならない (#3175)。
 *
 * 見本帳の部品の見本、使い方の頁の例、`packages/dragon/examples` の見本を全て描き、エンジンが返す重なりの一覧 (`overlaps`) が
 * 全ての段で 0 件かを見る。落ちる時は、見本の名前と段と重なる 2 つの字を 1 件 1 行で出す。
 * 重なっていた 3 つの見本 (使い方の状態遷移図の例、部品「運ぶ物」の構成図と状態遷移図) は、直した形を置き場所で確かめる。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation, type Rendered, renderDiagram } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

import { LOOK } from "../../../../packages/dragon/src/look/values";
import { renderLayout } from "../../../../packages/dragon/src/render/svg";
import { app, root } from "./playground-support";

type Rect = { x: number; y: number; w: number; h: number };
type Point = [number, number];

interface Example {
  name: string;
  rendered: Rendered;
}

const PARTS = join(app, "src/catalog/parts");
const DOCS = join(app, "src/docs/examples");
const PACKAGE = join(root, "packages/dragon/examples");

const langOf = (file: string): "ja" | "en" => (/\.en\.(dragon|json)$/.test(file) ? "en" : "ja");

function draw(dir: string, file: string): Rendered {
  const text = readFileSync(join(dir, file), "utf8");
  const lang = langOf(file);
  if (file.endsWith(".json")) return renderDiagram(JSON.parse(text), { lang });
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`${file} を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang });
}

function examples(): Example[] {
  const out: Example[] = [];
  const dirs: [string, string, RegExp][] = [
    ["catalog/parts", PARTS, /\.dragon$/],
    ["docs/examples", DOCS, /\.(dragon|json)$/],
    ["examples", PACKAGE, /\.(dragon|json)$/],
  ];
  for (const [label, dir, pattern] of dirs) {
    for (const file of readdirSync(dir).filter((f) => pattern.test(f)).sort()) out.push({ name: `${label}/${file}`, rendered: draw(dir, file) });
  }
  return out;
}

/** 見本ごとの重なりを 1 件 1 行にする。一覧を持たない描いた結果も 1 行にして落とす。 */
function overlapReport(list: Example[]): string[] {
  return list.flatMap(({ name, rendered }) => {
    const overlaps = (rendered as Rendered & { overlaps?: { step: number; texts: [string, string] }[] }).overlaps;
    if (!Array.isArray(overlaps)) return [`${name}: 描いた結果に重なりの一覧が無い`];
    return overlaps.map((o) => `${name} 段 ${o.step + 1}: ${o.texts[0]} × ${o.texts[1]}`);
  });
}

/** 2 つの四角の隙間。重なる時は負になる。 */
function gap(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  return Math.max(dx, dy);
}

/** 点から折れ線までの最も近い距離。 */
function distanceToLine(p: Point, points: Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const len2 = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / len2));
    best = Math.min(best, Math.hypot(p[0] - (ax + t * (bx - ax)), p[1] - (ay + t * (by - ay))));
  }
  return best;
}

describe("見本の字が重ならない (#3175)", () => {
  it("state-side-label-clear-of-step-labels", () => {
    for (const file of ["state.dragon", "state.en.dragon"]) {
      const { layout } = draw(DOCS, file);
      const cancel = layout.paths.flatMap((p) => (p.label ? [p.label] : [])).find((l) => l.text === "取り消す" || l.text === "Cancel");
      expect(cancel, `${file} に通らない道の名前が無い`).toBeDefined();
      if (!cancel) continue;
      for (const label of layout.labels) expect(gap(cancel, label), `${file} の「${cancel.text}」が「${label.text}」に重なる`).toBeGreaterThan(0);
    }
  });

  it("repeated-line-badges-side-by-side", () => {
    const r = LOOK.badge.r;
    for (const file of ["carry.architecture.dragon", "carry.architecture.en.dragon", "carry.state.dragon", "carry.state.en.dragon"]) {
      const { layout } = draw(PARTS, file);
      const lineOf = (step: number) => layout.edges.find((e) => e.step === step);
      let compared = 0;
      for (const a of layout.badges) {
        for (const b of layout.badges) {
          if (b.step <= a.step) continue;
          const ea = lineOf(a.step);
          const eb = lineOf(b.step);
          if (!ea || !eb || ea.from !== eb.from || ea.to !== eb.to) continue;
          compared++;
          const apart = Math.hypot(b.x - a.x, b.y - a.y);
          expect(apart, `${file} の段の番号 ${a.step + 1} と ${b.step + 1} が重なる`).toBeGreaterThanOrEqual(r * 2);
          expect(apart, `${file} の段の番号 ${b.step + 1} が ${a.step + 1} の隣に無い`).toBeLessThanOrEqual(r * 2 + 8);
          expect(distanceToLine([b.x, b.y], eb.points), `${file} の段の番号 ${b.step + 1} が線の上に無い`).toBeLessThanOrEqual(0.5);
        }
      }
      expect(compared, `${file} に同じ線を 2 つの段で通る組が無い`).toBeGreaterThan(0);
    }
  });

  it("state-past-labels-on-one-line-clear", () => {
    for (const file of ["carry.state.dragon", "carry.state.en.dragon"]) {
      const { layout } = draw(PARTS, file);
      layout.labels.forEach((a, i) => {
        for (const b of layout.labels.slice(i + 1)) expect(gap(a, b), `${file} の「${a.text}」と「${b.text}」が重なる`).toBeGreaterThan(0);
      });
    }
  });

  it("overlaps-none-in-every-example", () => {
    const list = examples();
    expect(list.length, "見本を 1 件も読めていない").toBeGreaterThan(100);
    expect(overlapReport(list)).toEqual([]);
  });

  it("overlaps-check-names-example-step-and-texts", () => {
    // 使い方の状態遷移図の例で、通らない道の名前を始まりの線の名前に重ねた見本を混ぜる
    const rendered = draw(DOCS, "state.dragon");
    const layout = structuredClone(rendered.layout);
    const start = layout.labels.find((l) => l.text === "注文を確定");
    const cancel = layout.paths.flatMap((p) => (p.label ? [p.label] : [])).find((l) => l.text === "取り消す");
    expect(start && cancel, "重ねる 2 つの名前が見つからない").toBeTruthy();
    if (!start || !cancel) return;
    Object.assign(cancel, { x: start.x, y: start.y });
    const crossed = renderLayout(rendered.diagram, layout, rendered.timeline);
    const report = overlapReport([{ name: "docs/examples/state.dragon", rendered: crossed as Rendered }]);
    expect(report.some((line) => line.includes("docs/examples/state.dragon 段 1:") && line.includes("取り消す") && line.includes("注文を確定")), report.join("\n")).toBe(true);
  });
});
