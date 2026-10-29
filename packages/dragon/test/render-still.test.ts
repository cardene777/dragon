// @vitest-environment jsdom
/**
 * 止め絵を選んだ図 (#3200)。
 *
 * 描く設定に止め絵 (`still`) を選ぶと、最後の段の止め絵に、全ての段の線の名前と箱の中の処理を最後の段と同じ濃さで出す。
 * 動かさない読者に、流れ全体を 1 枚で読ませるため。状態遷移図の過ぎた段の名前も、薄い灰でなく同じ濃さで出す。
 * 構成図の箱の中の処理は箱の下の 1 行に出すので、1 つの箱に違う段の処理が 2 つ以上在る時は最後の段の処理を出す。
 * 違う段の名前どうしが重なっても置き直さず、描いた結果の重なりの報告 (`overlaps`) に出す。
 *
 * 見える濃さは、描いた SVG の keyframes を最後の段の止め絵の時刻で読んで確かめる (`motion-support.ts`)。
 */
import { describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { motionFrom, tagOpacity } from "./motion-support";
import { draw, type LaidAction, type LaidLabel, type Rendered } from "./render-support";

/** 見本の 10 枚 (英語の写しを除く) */
const EXAMPLES = ["api", "ccip", "intro", "merge", "oauth", "order", "payment", "rebase", "retry", "wallet"] as const;

/** 最後の段と同じ濃さとみなす下限と、消えているとみなす上限 */
const FULL = 0.99;
const GONE = 0.01;

interface Source {
  kind: string;
  steps: { events: { type: string; box?: string; label?: string }[] }[];
}

type Action = LaidAction & { text: string };

const stillOf = (rendered: Rendered): number => rendered.timeline.stills[rendered.timeline.stills.length - 1] ?? Number.NaN;

/** 箱の下の字のうち、字が `text` で class が `cls` の物の、時刻 `t` 秒の見える濃さの最大 */
function subOpacity(rendered: Rendered, cls: string, text: string, t: number): number {
  const motion = motionFrom(rendered);
  return Math.max(0, ...[...motion.doc.querySelectorAll(`text.${cls}`)].filter((el) => el.textContent === text).map((el) => motion.opacity(el, t)));
}

/**
 * 箱の下の 1 行に処理を出す図 (構成図、状態遷移図、枝分かれの図) で、最後の段の止め絵に出る処理。
 * 処理の後に同じ箱の字を書き換える箱は、書き換えた字が 1 行を取るので数えない
 */
function lastActions(source: Source): Map<string, string> {
  const out = new Map<string, string>();
  const rewritten = new Set<string>();
  for (const step of source.steps)
    for (const event of step.events) {
      if (event.type === "action" && event.box && event.label) {
        out.set(event.box, event.label);
        rewritten.delete(event.box);
      }
      if (event.type === "swap" && event.box) rewritten.add(event.box);
    }
  for (const box of rewritten) out.delete(box);
  return out;
}

/** 2 つの段で同じ箱が処理し、最後の段ではその箱が何もしない構成図 */
function twoActionsInBox(): Json {
  const edge = (from: string, to: string): Json => ({ type: "edge", from, to, carry: { kind: "envelope" } });
  return {
    version: 1,
    kind: "architecture",
    title: "1 つの箱が 2 度処理する構成図",
    regions: [{ id: "r", name: "区画" }],
    boxes: [
      { id: "a", name: "入口", region: "r" },
      { id: "b", name: "検査", region: "r" },
      { id: "c", name: "出口", region: "r" },
    ],
    steps: [
      { title: "受け取る", body: "入口から検査へ渡し、検査が受け取る。", events: [edge("a", "b"), { type: "action", box: "b", label: "受け取る" }] },
      { title: "確かめる", body: "検査が中身を確かめて出口へ渡す。", events: [{ type: "action", box: "b", label: "確かめる" }, edge("b", "c")] },
      { title: "戻す", body: "出口から入口へ戻す。", events: [edge("c", "a")] },
    ],
  };
}

describe("止め絵を選んだ図 (#3200)", () => {
  it("render-still-shows-all-labels", () => {
    for (const name of EXAMPLES) {
      const source = exampleJson(`${name}.json`) as unknown as Source;
      const rendered = draw("renderDiagram")(source, { still: true });
      const motion = motionFrom(rendered);
      const t = stillOf(rendered);
      const { layout } = rendered;
      const labels = layout.labels as (LaidLabel & { until?: number })[];
      // 同じ線の同じ名前を後の段が同じ所に置く名前は、後の段の名前が出す
      for (const label of labels.filter((l) => l.until === undefined))
        expect(tagOpacity(motion, "dg-cap", label, t), `${name} の段 ${label.step + 1} の線の名前「${label.text}」が最後の段の止め絵で最後の段と同じ濃さに出ない`).toBeGreaterThan(FULL);
      for (const past of motion.doc.querySelectorAll("g.dg-cap-past"))
        expect(motion.opacity(past, t), `${name} の線の名前「${past.textContent}」が最後の段の止め絵で薄い灰のまま残る`).toBeLessThan(GONE);
      // 時系列図は処理を生存線の上の札に出し、ほかの図は箱の下の 1 行に出す
      for (const action of layout.actions as Action[])
        expect(tagOpacity(motion, "dg-act", action, t), `${name} の段 ${action.step + 1} の処理「${action.text}」が最後の段の止め絵に出ない`).toBeGreaterThan(FULL);
      if (source.kind !== "sequence")
        for (const [box, text] of lastActions(source))
          expect(subOpacity(rendered, "dg-ss-act", text, t), `${name} の箱 ${box} の処理「${text}」が最後の段の止め絵に出ない`).toBeGreaterThan(FULL);
    }
  });

  it("render-still-box-last-action", () => {
    const rendered = draw("renderDiagram")(twoActionsInBox(), { still: true });
    const t = stillOf(rendered);
    expect(subOpacity(rendered, "dg-ss-act", "確かめる", t), "最後の段の止め絵の検査の箱に、後の段の処理「確かめる」が出ない").toBeGreaterThan(FULL);
    expect(subOpacity(rendered, "dg-ss-act", "受け取る", t), "最後の段の止め絵の検査の箱に、前の段の処理「受け取る」が重ねて出る").toBeLessThan(GONE);
  });

  it("render-still-reports-overlaps", () => {
    type Overlap = { kind: string; step: number; texts?: [string, string] };
    const overlapsOf = (rendered: Rendered): Overlap[] => (rendered as Rendered & { overlaps: Overlap[] }).overlaps;
    const rebase = exampleJson("rebase.json");
    const names = draw("renderDiagram")(rebase).layout.labels.map((l) => l.text).sort();
    expect(names, "rebase の線の名前が 2 つでない").toHaveLength(2);
    const pairOf = (o: Overlap): string => [...(o.texts ?? [])].sort().join("|");
    const plain = overlapsOf(draw("renderDiagram")(rebase));
    expect(plain.filter((o) => o.kind === "texts" && pairOf(o) === names.join("|")), "止め絵を選ばない rebase で、違う段の線の名前どうしが重なる").toEqual([]);
    const rendered = draw("renderDiagram")(rebase, { still: true });
    const last = rendered.timeline.steps.length - 1;
    const both = overlapsOf(rendered).filter((o) => o.kind === "texts" && pairOf(o) === names.join("|"));
    expect(
      both.map((o) => o.step),
      `止め絵を選んだ rebase の最後の段で、線の名前「${names.join("」と「")}」の重なりが報告されない`,
    ).toEqual([last]);
  });
});
