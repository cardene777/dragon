/**
 * 字の重なりをエンジンが自分で見つける (#3175)。
 *
 * エンジンは字の幅を同梱の字の幅の表で測り、字を描く所で字の四角と見えている時間を一緒に記録する。
 * 描いた結果の `overlaps` は、段ごとの止め絵の時刻に同時に見えている字どうしの重なりを、重なる 2 つの字と段の番号で持つ。
 *
 * 置き場所の計算はもう字を重ねないので、重なる図は置き場所を書き換えて作り、描く所 (`renderLayout`) へ直に渡す。
 * 描く所が記録した字を数えるので、箱の名前のように描く所が位置を決める字も対象に入っていることを、ここで確かめる。
 *
 * 線が札を持たない字 (薄く残す線の名前など) を横切る所も重なりに数え、線の両端の名前で返す。
 * 札に入った字は札の地が線を隠すので、線が横切っても数えない。
 *
 * 箱の絵柄と、着いて留まる運ぶ物も重なりに数える (#3176)。絵柄は `<箱の名前> の絵柄` の名前で返す。
 */
import { describe, expect, it } from "vitest";
import { LOOK } from "../src/look/values";
import { parseNotation } from "../src/parser";
import { renderDiagram, renderLayout } from "../src/render/svg";
import type { Diagram } from "../src/schema";

type Overlap = { kind?: string; step: number; texts?: [string, string]; text?: string; line?: { from: string; to: string } };

const edge = (from: string, to: string, label: string) => ({ type: "edge" as const, from, to, label, carry: { kind: "none" as const } });

/** 1 段目に線 1 本、2 段目に線 2 本を持つ時系列図。線の名前はどれもその段の間だけ見える。 */
function sequence(): Diagram {
  return {
    version: 1,
    kind: "sequence",
    title: "重なりを確かめる図",
    boxes: [
      { id: "a", name: "送る側" },
      { id: "b", name: "受ける側" },
    ],
    steps: [
      { title: "送る", body: "送る側が要求を送る。", events: [edge("a", "b", "送る")] },
      { title: "返す", body: "受ける側が返して確かめる。", events: [edge("b", "a", "返す"), edge("a", "b", "確かめる")] },
    ],
    sequence: { lifelines: ["a", "b"] },
  } as unknown as Diagram;
}

/** 名前と下の字と絵柄を持つ箱を含む構成図。 */
function architecture(): Diagram {
  return {
    version: 1,
    kind: "architecture",
    title: "箱の字を確かめる図",
    boxes: [
      { id: "app", name: "アプリ", sub: "画面を出す", icon: "app" },
      { id: "api", name: "API", sub: "受け付ける", icon: "db" },
    ],
    steps: [{ title: "呼ぶ", body: "アプリが API を呼ぶ。", events: [edge("app", "api", "呼ぶ")] }],
  } as unknown as Diagram;
}

/** 2 つの字の重なりを `段:字|字` の形に並べる */
const pairs = (list: Overlap[] | undefined): string[] => (list ?? []).flatMap((o) => (o.texts ? [`${o.step}:${[...o.texts].sort().join("|")}`] : [])).sort();
/** 線が字を横切る所を `段:字|送る側->受ける側` の形に並べる */
const crossings = (list: Overlap[] | undefined): string[] => (list ?? []).flatMap((o) => (o.kind === "line" && o.text && o.line ? [`${o.step}:${o.text}|${o.line.from}->${o.line.to}`] : [])).sort();

/** 2 段の状態遷移図。1 段目の線の名前は、2 段目には札を外した薄い字で残る。 */
function state(): Diagram {
  const parsed = parseNotation(["state 線と字", "", "box 受付", "box 発送", "", "step 受ける", "  say 受け付ける。", "  start -> 受付: 受け付ける", "", "step 送る", "  say 送る。", "  受付 -> 発送: 送る"].join("\n"));
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
}

/** 2 段目に札 #42 が決済へ着く構成図。決済は絵柄を持つ */
function carrying(): Diagram {
  const parsed = parseNotation(["architecture 札と絵柄", "", "box 店 [icon: app]", "box 決済 [icon: card]", "", "step 頼む", "  say 店が決済に頼む。", "  店 -> 決済: 頼む", "", "step 渡す", "  say 店が番号を渡す。", "  店 -> 決済: 渡す [tag: #42]"].join("\n"));
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
}

describe("字の重なりをエンジンが見つける (#3175)", () => {
  it("overlaps-lists-texts-and-step", () => {
    const rendered = renderDiagram(sequence());
    expect(rendered.overlaps, "描いた結果に重なりの一覧が無い").toEqual([]);

    // 2 段目の 2 つの線の名前を同じ所に重ねる
    const layout = structuredClone(rendered.layout);
    const back = layout.labels.find((l) => l.text === "返す");
    const check = layout.labels.find((l) => l.text === "確かめる");
    expect(back && check, "2 段目の線の名前が見つからない").toBeTruthy();
    if (!back || !check) return;
    // 真ん中を揃える。左端を揃えると、長い方の札が右へはみ出して段の番号の丸にも届く (札が線に寄った #3177 から)
    Object.assign(check, { x: back.x + back.w / 2 - check.w / 2, y: back.y });
    const crossed = renderLayout(rendered.diagram, layout, rendered.timeline);
    expect(pairs(crossed.overlaps)).toEqual(["1:確かめる|返す"]);
  });

  it("overlaps-carry-rects", () => {
    // 重なりは、重なる字ごとに字の四角と段の番号かどうかを持つ。編集画面が図の上で囲む所になる (#3178)
    type Spot = { text: string; rect: { x: number; y: number; w: number; h: number }; badge: boolean };
    const box = (r: { x: number; y: number; w: number; h: number }) => ({ x: r.x, y: r.y, w: r.w, h: r.h });

    const rendered = renderDiagram(sequence());
    const layout = structuredClone(rendered.layout);
    const back = layout.labels.find((l) => l.text === "返す");
    const check = layout.labels.find((l) => l.text === "確かめる");
    expect(back && check, "2 段目の線の名前が見つからない").toBeTruthy();
    if (!back || !check) return;
    Object.assign(check, { x: back.x + back.w / 2 - check.w / 2, y: back.y });
    const [both] = renderLayout(rendered.diagram, layout, rendered.timeline).overlaps.filter((o) => o.kind === "texts");
    const byText = (a: Spot, b: Spot): number => (a.text < b.text ? -1 : 1);
    expect([...(both?.spots ?? [])].sort(byText), "2 つの字の重なりが字の四角を持たない").toEqual(
      [
        { text: "確かめる", rect: box(check), badge: false },
        { text: "返す", rect: box(back), badge: false },
      ].sort(byText),
    );

    // 線が字を横切る所は、横切られる字の四角を 1 つ持つ
    const faint = renderDiagram(state());
    const moved = structuredClone(faint.layout);
    const take = moved.labels.find((l) => l.text === "受け付ける");
    const send = moved.edges.find((e) => e.from === "受付" && e.to === "発送");
    expect(take && send, "名前か線が見つからない").toBeTruthy();
    if (!take || !send) return;
    const [[ax, ay], [bx, by]] = [send.points[0] as [number, number], send.points[send.points.length - 1] as [number, number]];
    Object.assign(take, { x: (ax + bx) / 2 - take.w / 2, y: (ay + by) / 2 - take.h / 2 });
    const [crossed] = renderLayout(faint.diagram, moved, faint.timeline).overlaps.filter((o) => o.kind === "line");
    const spots = crossed?.spots ?? [];
    expect(spots.map((s) => [s.text, s.badge]), "線が横切る字の四角が 1 つ無い").toEqual([["受け付ける", false]]);
    const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
    const r = spots[0]?.rect;
    expect(r !== undefined && r.x <= mx && mx <= r.x + r.w && r.y <= my && my <= r.y + r.h, "横切られる字の四角が線の真ん中を含まない").toBe(true);

    // 段の番号の重なりは、段の番号の字を段の番号として持つ。2 段目の番号を 1 段目の番号の所へ動かして重ねる
    // (同じ線を何度も通る番号は 1 つの丸で入れ替えるので、描いた図には段の番号どうしの重なりが無い、#3184)
    const piled = structuredClone(rendered.layout);
    const [one, two] = [piled.badges.find((b) => b.step === 0), piled.badges.find((b) => b.step === 1)];
    expect(one && two, "段の番号が見つからない").toBeTruthy();
    if (!one || !two) return;
    Object.assign(two, { x: one.x, y: one.y });
    const [pile] = renderLayout(rendered.diagram, piled, rendered.timeline).overlaps.filter((o) => o.spots.every((s) => s.badge));
    expect(pile?.spots.map((s) => [s.text, s.badge]), "重なる段の番号を段の番号として持たない").toEqual([
      ["1", true],
      ["2", true],
    ]);
  });

  it("overlaps-ignore-texts-not-shown-together", () => {
    const rendered = renderDiagram(sequence());
    // 1 段目の名前と 2 段目の名前は別々の段の間だけ見えるので、同じ所に置いても重なりに数えない
    const layout = structuredClone(rendered.layout);
    const send = layout.labels.find((l) => l.text === "送る");
    const back = layout.labels.find((l) => l.text === "返す");
    expect(send && back, "線の名前が見つからない").toBeTruthy();
    if (!send || !back) return;
    Object.assign(back, { x: send.x, y: send.y });
    const moved = renderLayout(rendered.diagram, layout, rendered.timeline);
    expect(moved.overlaps, "描いた結果に重なりの一覧が無い").toEqual([]);
  });

  it("overlaps-ignore-stacked-lines", () => {
    const rendered = renderDiagram(architecture());
    // 箱の名前と下の字は上下に並べた 2 行で、重なりに数えない
    expect(rendered.overlaps, "描いた結果に重なりの一覧が無い").toEqual([]);

    // 線の名前を箱 API の上に被せると、箱の名前と下の字の両方との重なりを数える = 描く所が置く箱の字も記録している
    const layout = structuredClone(rendered.layout);
    const api = layout.boxes.find((b) => b.id === "api");
    const call = layout.labels.find((l) => l.text === "呼ぶ");
    expect(api && call, "箱か線の名前が見つからない").toBeTruthy();
    if (!api || !call) return;
    Object.assign(call, { x: api.x, y: api.y, w: api.w, h: api.h });
    const covered = renderLayout(rendered.diagram, layout, rendered.timeline);
    expect(pairs(covered.overlaps)).toEqual(expect.arrayContaining(["0:API|呼ぶ", "0:受け付ける|呼ぶ"]));
    expect(pairs(covered.overlaps).some((p) => p.includes("API") && p.includes("受け付ける")), "箱の名前と下の字を重なりに数えた").toBe(false);
  });

  it("overlaps-lists-lines-through-text", () => {
    const rendered = renderDiagram(state());
    expect(rendered.overlaps, "描いた結果に重なりの一覧が無い").toEqual([]);

    // 1 段目の名前を 2 段目の線の真ん中に被せる。1 段目の間は札で線を隠し、2 段目に薄い字で残ると線が横切る
    const layout = structuredClone(rendered.layout);
    const take = layout.labels.find((l) => l.text === "受け付ける");
    const send = layout.edges.find((e) => e.from === "受付" && e.to === "発送");
    expect(take && send, "名前か線が見つからない").toBeTruthy();
    if (!take || !send) return;
    const [[ax, ay], [bx, by]] = [send.points[0] as [number, number], send.points[send.points.length - 1] as [number, number]];
    Object.assign(take, { x: (ax + bx) / 2 - take.w / 2, y: (ay + by) / 2 - take.h / 2 });
    const crossed = renderLayout(rendered.diagram, layout, rendered.timeline);
    expect(crossings(crossed.overlaps)).toEqual(["1:受け付ける|受付->発送"]);
  });

  it("overlaps-ignore-lines-under-pills", () => {
    // 1 段目の名前を 2 段目の線の上に置く。1 段目の間は札の地が線を隠すので数えず、2 段目に札を外した字で残ると数える
    const rendered = renderDiagram(state());
    const layout = structuredClone(rendered.layout);
    const take = layout.labels.find((l) => l.text === "受け付ける");
    const send = layout.edges.find((e) => e.from === "受付" && e.to === "発送");
    expect(take && send, "名前か線が見つからない").toBeTruthy();
    if (!take || !send) return;
    const [[ax, ay], [bx, by]] = [send.points[0] as [number, number], send.points[send.points.length - 1] as [number, number]];
    Object.assign(take, { x: (ax + bx) / 2 - take.w / 2, y: (ay + by) / 2 - take.h / 2 });
    const list = crossings(renderLayout(rendered.diagram, layout, rendered.timeline).overlaps);
    expect(list, "札を外した字を横切る線を数えていない").toContain("1:受け付ける|受付->発送");
    expect(list.filter((c) => c.startsWith("0:")), "札の下を通る線を数えた").toEqual([]);

    // 時系列図の名前はいつも札に入っているので、別の線の上に置いても数えない
    const seq = renderDiagram(sequence());
    const moved = structuredClone(seq.layout);
    const back = moved.labels.find((l) => l.text === "返す");
    const first = moved.edges.find((e) => e.step === 0);
    expect(back && first, "時系列図の名前か線が見つからない").toBeTruthy();
    if (!back || !first) return;
    const [x0, y0] = first.points[0] as [number, number];
    Object.assign(back, { x: x0 + 10, y: y0 - back.h / 2 });
    expect(crossings(renderLayout(seq.diagram, moved, seq.timeline).overlaps), "札の下を通る線を数えた").toEqual([]);
  });

  it("overlaps-lists-carrier-over-icon", () => {
    // 運ぶ物は絵柄の横の置き場に留まるので、描いた結果に運ぶ物と絵柄の重なりは無い (#3176)
    const rendered = renderDiagram(carrying());
    expect(pairs(rendered.overlaps).filter((p) => p.includes("の絵柄")), "置き場に留まる運ぶ物を絵柄との重なりに数えた").toEqual([]);

    // 2 段目の札を決済の絵柄の上に留めると、札と絵柄の重なりを、その段の番号で数える
    const layout = structuredClone(rendered.layout);
    const pay = layout.boxes.find((b) => b.id === "決済");
    const tag = layout.edges.find((e) => e.step === 1);
    expect(pay && tag, "決済か札の線が見つからない").toBeTruthy();
    if (!pay || !tag) return;
    const iconX = (pay as { iconX?: number }).iconX ?? pay.cx;
    tag.settle = [iconX, pay.cy + LOOK.box.iconY];
    expect(pairs(renderLayout(rendered.diagram, layout, rendered.timeline).overlaps)).toContain("1:#42|決済 の絵柄");
  });
});
