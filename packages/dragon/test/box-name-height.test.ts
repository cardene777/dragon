/**
 * 箱の名前と下の字の高さ (#3307、#3309)。
 *
 * 箱の名前の基準線は、アイコンを名前の上に置く箱に合わせて箱の真ん中から 12 下、下の字はその 15 下 (27 下) に置いている。
 * アイコンを持つ箱が 1 つも無い図では名前だけが下半分に寄るので、その図に限って名前を真ん中から 5 下に置き、名前を箱の真ん中に寄せる。
 * 下の字も名前から同じ 15 の間で 20 下に置き、名前を上げた図で下の字だけが下の縁に残らないようにする。
 * アイコンを持つ箱が 1 つでもある図は、同じ行の名前の高さを揃えるため、アイコンの無い箱も 12 下と 27 下のまま置く。
 * 置き場の枠はアイコンと同じ段に出るので、アイコンの無い箱でも枠を持てば同じく 12 下と 27 下に揃える。
 * どちらも案を絵で並べて本人が選んだ形。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, smallArchitecture, smallSequence } from "./diagram-support";
import { draw, type Rendered } from "./render-support";

/** アイコンも置き場の枠も持つ箱が無い図の、名前と下の字の基準線の箱の真ん中からの下がり */
const CENTERED = { name: 5, sub: 20 };
/** アイコンか置き場の枠を持つ箱が在る図の、名前と下の字の基準線の箱の真ん中からの下がり (アイコンの下に名前を置く高さ) */
const UNDER_ICON = { name: 12, sub: 27 };

const CATALOG_SEQUENCE = join(process.cwd(), "apps/playground-spa/src/catalog/parts/edge-label.sequence.dragon");
const DOCS_START = join(process.cwd(), "apps/playground-spa/src/docs/examples/start.dragon");

interface Drops {
  name: number;
  subs: number[];
}

/** 箱ごとの、名前と下の字の基準線の箱の真ん中からの下がり。下の字は箱の札の中の字を全て読む */
function textDrops(rendered: Rendered): Map<string, Drops> {
  const cards = rendered.svg.split('<g style="--c:').slice(1);
  const drops = new Map<string, Drops>();
  for (const box of rendered.layout.boxes) {
    const card = cards.find((c) => new RegExp(`<text class="dg-sn"[^>]*>${box.name}</text>`, "u").test(c));
    expect(card, `箱「${box.name}」の名前が図に無い`).toBeDefined();
    const drop = (y: string | undefined): number => Math.round((Number(y) - (box.y + box.h / 2)) * 100) / 100;
    const name = drop(/<text class="dg-sn" x="[^"]*" y="([^"]*)"/u.exec(card as string)?.[1]);
    const subs = [...(card as string).matchAll(/<text class="dg-ss[^"]*" x="[^"]*" y="([^"]*)"/gu)].map((m) => drop(m[1]));
    drops.set(box.name, { name, subs });
  }
  return drops;
}

function expectDrops(drops: Map<string, Drops>, want: { name: number; sub: number }): void {
  for (const [name, d] of drops) {
    expect(d.name, `箱「${name}」の名前の基準線の、箱の真ん中からの下がり`).toBe(want.name);
    for (const s of d.subs) expect(s, `箱「${name}」の下の字の基準線の、箱の真ん中からの下がり`).toBe(want.sub);
  }
}

function parsed(text: string): Json {
  const result = api("parseNotation")(text);
  expect(result.ok, `記法を読めない: ${JSON.stringify(result)}`).toBe(true);
  return (result as { ok: true; diagram: Json }).diagram;
}

type Boxes = { boxes: { id: string; name: string; icon?: string; sub?: string }[] };

describe("箱の名前と下の字の高さ (#3307、#3309)", () => {
  it("アイコンを持つ箱が無い時系列図 edge-label.sequence.dragon は、どの箱も名前の基準線が箱の真ん中から5下", () => {
    const drops = textDrops(draw("renderDiagram")(parsed(readFileSync(CATALOG_SEQUENCE, "utf8"))));
    expect([...drops.keys()], "見本の箱").toEqual(["甲", "乙"]);
    expectDrops(drops, CENTERED);
  });

  it("説明の頁の最初の例 start.dragon は、どの箱も名前の基準線が箱の真ん中から5下、下の字の基準線が20下", () => {
    const drops = textDrops(draw("renderDiagram")(parsed(readFileSync(DOCS_START, "utf8"))));
    expect(drops.size, "箱の数").toBe(2);
    for (const [name, d] of drops) expect(d.subs.length, `箱「${name}」に下の字が無い`).toBeGreaterThan(0);
    expectDrops(drops, CENTERED);
  });

  it("アイコンを持つ箱が在る図で下の字を持つ箱は、名前の基準線が12下、下の字の基準線が27下のまま", () => {
    const diagram = smallSequence() as Boxes;
    Object.assign(diagram.boxes[0] as object, { icon: "user", sub: "操作する" });
    Object.assign(diagram.boxes[1] as object, { sub: "受け取る" });
    const drops = textDrops(draw("renderDiagram")(diagram));
    expect(drops.size, "箱の数").toBe(2);
    for (const [name, d] of drops) expect(d.subs.length, `箱「${name}」に下の字が無い`).toBeGreaterThan(0);
    expectDrops(drops, UNDER_ICON);
  });

  it("アイコンが無くても置き場の枠を持つ箱が在る図は、名前と下の字を枠の下の高さに揃える", () => {
    // 置き場の枠はアイコンと同じ名前の上の段に出る。真ん中に寄せると名前が枠に重なる
    const diagram = smallArchitecture() as Boxes;
    Object.assign(diagram.boxes[0] as object, { sub: "受け付ける" });
    const rendered = draw("renderDiagram")(diagram);
    expect(rendered.svg, "運ぶ物を受ける箱に置き場の枠を出す").toContain('class="dg-slot"');
    expect(rendered.svg, "アイコンを描かない").not.toContain('class="dg-ic"');
    const drops = textDrops(rendered);
    expect(drops.get("入口")?.subs.length, "箱「入口」に下の字が無い").toBeGreaterThan(0);
    expectDrops(drops, UNDER_ICON);
  });
});
