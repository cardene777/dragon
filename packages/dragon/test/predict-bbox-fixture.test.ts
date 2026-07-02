/**
 * predict-bbox-fixture.test.ts ... engine 予測 bbox を JSON fixture として dump する Vitest test。
 *
 * 動作:
 *   1. dragon playground の全 catalog topic を Node 上で import + layout 実行
 *   2. 各 diagram の node / edge label の world 単位予測 bbox を計算
 *   3. `apps/playground/tests/visual/__fixtures__/predicted-bboxes.json` に書出
 *   4. Playwright spec (visual-diagnostics.spec.ts) が本 fixture を load して DOM 実測と diff assert
 *
 * これにより 「dragon spec 内で engine を直接呼ぶ」 経路を避けつつ、 engine 予測と DOM 実測の
 * pixel-perfect diff 検証を実現する。 fixture 更新は本 test を実行するだけ。
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  layout,
  predictLabelBBoxWorld,
  predictNodeBBoxWorld,
} from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

import * as cookbook from "../../../apps/playground/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground/src/topics/catalog/styles.cdl";

type ModuleLike = Record<string, unknown>;

interface PredictedBBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PredictedDiagram {
  diagramId: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  nodes: Array<{ id: string } & PredictedBBox>;
  labels: Array<{ id: string; text: string } & PredictedBBox>;
}

function collectDiagrams(mod: ModuleLike): CdlDiagram[] {
  const out: CdlDiagram[] = [];
  for (const value of Object.values(mod)) {
    if (isCdlDiagram(value)) out.push(value);
  }
  return out;
}

function isCdlDiagram(v: unknown): v is CdlDiagram {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    Array.isArray(o.lanes) &&
    Array.isArray(o.phases)
  );
}

function toPredicted(diagram: CdlDiagram): PredictedDiagram {
  const laid = layout(diagram);
  return {
    diagramId: diagram.id,
    viewBoxWidth: laid.viewBox.w,
    viewBoxHeight: laid.viewBox.h,
    nodes: laid.nodes.map((n) => ({ id: n.id, ...predictNodeBBoxWorld(n) })),
    labels: laid.edges
      .filter((e) => (e.label ?? "").trim() !== "" || (e.sub ?? "").trim() !== "")
      .map((e) => ({
        id: e.id,
        text: e.label ?? "",
        ...predictLabelBBoxWorld(e),
      })),
  };
}

const sources: Array<{ name: string; mod: ModuleLike }> = [
  { name: "cookbook", mod: cookbook },
  { name: "patterns", mod: patterns },
  { name: "presets", mod: presets },
  { name: "primitives", mod: primitives },
  { name: "primitives-extra", mod: primitivesExtra },
  { name: "text-dsl", mod: textDsl },
  { name: "animation", mod: animation },
  { name: "styles", mod: styles },
];

describe("predict-bbox fixture", () => {
  it("engine 予測 bbox JSON fixture を dump", () => {
    const allDiagrams: PredictedDiagram[] = [];
    for (const { mod } of sources) {
      const diagrams = collectDiagrams(mod);
      for (const d of diagrams) {
        allDiagrams.push(toPredicted(d));
      }
    }
    const byId = new Map<string, PredictedDiagram>();
    for (const p of allDiagrams) byId.set(p.diagramId, p);
    const out = Array.from(byId.values());

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const fixtureDir = path.resolve(__dirname, "../../../apps/playground/tests/visual/__fixtures__");
    fs.mkdirSync(fixtureDir, { recursive: true });
    const fixturePath = path.join(fixtureDir, "predicted-bboxes.json");
    fs.writeFileSync(fixturePath, JSON.stringify(out, null, 2));

    expect(out.length).toBeGreaterThan(0);
    expect(fs.existsSync(fixturePath)).toBe(true);
  });
});
