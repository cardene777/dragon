/**
 * 箱の名前の高さ (#3307)。
 *
 * 箱の名前の基準線は、アイコンを名前の上に置く箱に合わせて箱の真ん中から 12 下に置いている。
 * アイコンを持つ箱が 1 つも無い図では名前だけが下半分に寄るので、その図に限って真ん中から 5 下に置き、名前を箱の真ん中に寄せる。
 * アイコンを持つ箱が 1 つでもある図は、同じ行の名前の高さを揃えるため、アイコンの無い箱も 12 下のまま置く。
 * 置き場の枠はアイコンと同じ段に出るので、アイコンの無い箱でも枠を持てば同じく 12 下に揃える。
 * 3 つの案を絵で並べて本人が選んだ形 (#3307)。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, smallArchitecture, smallSequence } from "./diagram-support";
import { draw, type Rendered } from "./render-support";

/** アイコンを持つ箱が無い図の、名前の基準線の箱の真ん中からの下がり */
const CENTERED = 5;
/** アイコンを持つ箱が在る図の、名前の基準線の箱の真ん中からの下がり (アイコンの下に名前を置く高さ) */
const UNDER_ICON = 12;

const CATALOG_SEQUENCE = join(process.cwd(), "apps/playground-spa/src/catalog/parts/edge-label.sequence.dragon");

/** 箱ごとの、名前の基準線の箱の真ん中からの下がり */
function nameDrops(rendered: Rendered): Map<string, number> {
  const ys = new Map<string, number>();
  for (const m of rendered.svg.matchAll(/<text class="dg-sn" x="[^"]*" y="([^"]*)"[^>]*>([^<]*)<\/text>/gu)) ys.set(m[2] as string, Number(m[1]));
  const drops = new Map<string, number>();
  for (const box of rendered.layout.boxes) {
    const y = ys.get(box.name);
    expect(y, `箱「${box.name}」の名前が図に無い`).toBeDefined();
    drops.set(box.name, Math.round(((y as number) - (box.y + box.h / 2)) * 100) / 100);
  }
  return drops;
}

function parsed(text: string): Json {
  const result = api("parseNotation")(text);
  expect(result.ok, `記法を読めない: ${JSON.stringify(result)}`).toBe(true);
  return (result as { ok: true; diagram: Json }).diagram;
}

describe("箱の名前の高さ (#3307)", () => {
  it("アイコンを持つ箱が無い時系列図 edge-label.sequence.dragon は、どの箱も名前の基準線が箱の真ん中から5下", () => {
    const rendered = draw("renderDiagram")(parsed(readFileSync(CATALOG_SEQUENCE, "utf8")));
    const drops = nameDrops(rendered);
    expect([...drops.keys()], "見本の箱").toEqual(["甲", "乙"]);
    for (const [name, drop] of drops) expect(drop, `箱「${name}」の名前の基準線の、箱の真ん中からの下がり`).toBe(CENTERED);
  });

  it("アイコンを持つ箱とアイコンの無い箱が並ぶ図は、どの箱も名前の基準線が箱の真ん中から12下のまま", () => {
    const diagram = smallSequence() as { boxes: { id: string; name: string; icon?: string }[] };
    (diagram.boxes[0] as { icon?: string }).icon = "user";
    const drops = nameDrops(draw("renderDiagram")(diagram));
    expect(drops.size, "箱の数").toBe(2);
    for (const [name, drop] of drops) expect(drop, `箱「${name}」の名前の基準線の、箱の真ん中からの下がり`).toBe(UNDER_ICON);
  });

  it("アイコンが無くても置き場の枠を持つ箱が在る図は、名前を枠の下の高さに揃える", () => {
    // 置き場の枠はアイコンと同じ名前の上の段に出る。真ん中に寄せると名前が枠に重なる
    const rendered = draw("renderDiagram")(smallArchitecture());
    expect(rendered.svg, "運ぶ物を受ける箱に置き場の枠を出す").toContain('class="dg-slot"');
    expect(rendered.svg, "アイコンを描かない").not.toContain('class="dg-ic"');
    for (const [name, drop] of nameDrops(rendered)) expect(drop, `箱「${name}」の名前の基準線の、箱の真ん中からの下がり`).toBe(UNDER_ICON);
  });

  it("知らないアイコンの名前は、アイコンを持つ箱として数えない", () => {
    // 描かれないアイコンで名前の高さを揃えると、真ん中に寄せる図で名前だけが下に寄る
    const diagram = smallSequence() as { boxes: { id: string; name: string; icon?: string }[] };
    (diagram.boxes[0] as { icon?: string }).icon = "constructor";
    const rendered = draw("renderDiagram")(diagram);
    expect(rendered.svg, "知らないアイコンの名前で絵柄を描かない").not.toContain('class="dg-ic"');
    for (const [name, drop] of nameDrops(rendered)) expect(drop, `箱「${name}」の名前の基準線の、箱の真ん中からの下がり`).toBe(CENTERED);
  });
});
