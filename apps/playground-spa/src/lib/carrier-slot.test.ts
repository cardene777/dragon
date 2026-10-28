// @vitest-environment jsdom
/**
 * 見本の運ぶ物が、箱の絵柄と字と段の番号と矢印の先を隠さない (#3176)。
 *
 * 見本帳の部品の見本、使い方の頁の例、`packages/dragon/examples` の見本を全て描き、運ぶ物を 2 つの時刻で見る。
 * 段の止め絵では着いて留まる運ぶ物を、走り出す前の時刻では出発を待つ運ぶ物を見る。
 * 落ちる時は、見本の名前と段と、何を隠したかを 1 件 1 行で出す。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation, type Rendered, renderDiagram } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

import { badgeRect, cardOf, carried, carrierRect, overlap, waiting } from "../../../../packages/dragon/test/carrier-support";
import { motionFrom } from "../../../../packages/dragon/test/motion-support";
import type { Rect } from "../../../../packages/dragon/test/render-support";
import { app, root } from "./playground-support";

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

function examples(): { name: string; rendered: Rendered }[] {
  const dirs: [string, string, RegExp][] = [
    ["catalog/parts", PARTS, /\.dragon$/],
    ["docs/examples", DOCS, /\.(dragon|json)$/],
    ["examples", PACKAGE, /\.(dragon|json)$/],
  ];
  return dirs.flatMap(([label, dir, pattern]) =>
    readdirSync(dir)
      .filter((f) => pattern.test(f))
      .sort()
      .map((file) => ({ name: `${label}/${file}`, rendered: draw(dir, file) })),
  );
}

/** 見本 1 つで、運ぶ物が隠した物を 1 件 1 行で返す */
function hidden(name: string, rendered: Rendered): string[] {
  const m = motionFrom(rendered);
  const { layout, timeline } = m.rendered;
  const kind = rendered.layout.kind;
  const out: string[] = [];
  const badgesAt = (step: number): Rect[] => layout.badges.filter((b) => b.step <= step).map(badgeRect);
  /** 箱の絵柄と、名前から下の字の並ぶ所 */
  const boxParts = (id: string): [string, Rect][] => {
    const card = cardOf(m, id);
    const box = layout.boxes.find((b) => b.id === id);
    if (!card || !box || kind === "sequence") return [];
    return [...(card.icon ? [[`${card.name} の絵柄`, card.icon] as [string, Rect]] : []), [`${card.name} の名前と下の字`, { x: box.x, y: card.nameTop, w: box.w, h: box.y + box.h - card.nameTop }]];
  };
  for (const c of carried(m)) {
    const still = timeline.stills[c.step] as number;
    if (still >= c.arrive && still < c.end) {
      const r = carrierRect(m, c, still);
      for (const [what, rect] of boxParts(c.edge.to)) if (overlap(r, rect)) out.push(`${name} 段 ${c.step + 1}: ${c.edge.to} に着いた運ぶ物が${what}を隠す`);
      for (const badge of badgesAt(c.step)) if (overlap(r, badge)) out.push(`${name} 段 ${c.step + 1}: ${c.edge.to} に着いた運ぶ物が段の番号を隠す`);
      if (kind === "sequence" && c.edge.from !== c.edge.to) {
        const [ax] = c.edge.points[0] as [number, number];
        const [tx, ty] = c.edge.points[c.edge.points.length - 1] as [number, number];
        const tip = tx > ax ? { x: tx - 9, y: ty - 5, w: 9, h: 10 } : { x: tx, y: ty - 5, w: 9, h: 10 };
        if (overlap(r, tip)) out.push(`${name} 段 ${c.step + 1}: ${c.edge.to} に着いた運ぶ物が矢印の先を隠す`);
      }
    }
    const t = waiting(c);
    if (t === undefined) continue;
    const r = carrierRect(m, c, t);
    for (const badge of badgesAt(c.step)) if (overlap(r, badge)) out.push(`${name} 段 ${c.step + 1}: ${c.edge.from} から出る運ぶ物が走り出す前に段の番号を隠す`);
    for (const [what, rect] of boxParts(c.edge.from)) if (overlap(r, rect)) out.push(`${name} 段 ${c.step + 1}: ${c.edge.from} から出る運ぶ物が走り出す前に${what}を隠す`);
  }
  return out;
}

describe("見本の運ぶ物が隠さない (#3176)", () => {
  it("carriers-clear-in-every-example", () => {
    const list = examples();
    const withCarriers = list.filter(({ rendered }) => rendered.timeline.carriers.length > 0);
    expect(withCarriers.length, "運ぶ物を持つ見本が少なすぎる").toBeGreaterThanOrEqual(20);
    const found = list.flatMap(({ name, rendered }) => hidden(name, rendered));
    expect(found, `運ぶ物が隠した物 ${found.length} 件\n${found.join("\n")}`).toEqual([]);
  });

  it("icon-state-example-describes-slot", () => {
    const ja = readFileSync(join(PARTS, "icon.state.dragon"), "utf8");
    const en = readFileSync(join(PARTS, "icon.state.en.dragon"), "utf8");
    expect(ja, "日本語の見本が、運ぶ物は絵柄の横の置き場に留まると書いていない").toContain("絵柄の横の置き場に留まる");
    expect(ja, "日本語の見本が、まだ絵の上に留まると書いている").not.toContain("絵の上に留まる");
    expect(en, "英語の見本が、運ぶ物は絵柄の横の置き場に留まると書いていない").toContain("slot beside the icon");
    expect(en, "英語の見本が、まだ絵の上に留まると書いている").not.toContain("rests on the icon");
  });
});
