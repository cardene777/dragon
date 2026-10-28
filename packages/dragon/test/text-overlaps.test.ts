/**
 * 字の重なりをエンジンが自分で見つける (#3175)。
 *
 * エンジンは字の幅を同梱の字の幅の表で測り、字を描く所で字の四角と見えている時間を一緒に記録する。
 * 描いた結果の `overlaps` は、段ごとの止め絵の時刻に同時に見えている字どうしの重なりを、重なる 2 つの字と段の番号で持つ。
 *
 * 置き場所の計算はもう字を重ねないので、重なる図は置き場所を書き換えて作り、描く所 (`renderLayout`) へ直に渡す。
 * 描く所が記録した字を数えるので、箱の名前のように描く所が位置を決める字も対象に入っていることを、ここで確かめる。
 */
import { describe, expect, it } from "vitest";
import { renderDiagram, renderLayout } from "../src/render/svg";
import type { Diagram } from "../src/schema";

type Overlap = { step: number; texts: [string, string] };

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

const pairs = (list: Overlap[] | undefined): string[] => (list ?? []).map((o) => `${o.step}:${[...o.texts].sort().join("|")}`).sort();

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
    Object.assign(check, { x: back.x, y: back.y });
    const crossed = renderLayout(rendered.diagram, layout, rendered.timeline);
    expect(pairs(crossed.overlaps)).toEqual(["1:確かめる|返す"]);
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
});
