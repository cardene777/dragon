// @vitest-environment jsdom
/**
 * 運ぶ物の置き場 (#3176)。
 *
 * 構成図と状態遷移図では、運ぶ物を出し入れする箱が絵柄の右に点線の置き場の枠を持ち、運ぶ物は着いた後もそこに留まる。
 * 走り出す前は出る箱の置き場で待つので、段の番号を隠さない。時系列図には箱が無いので、生存線の脇に留まり、脇で待つ。
 * 運ぶ物の位置は描いた動きを時刻で読み、絵柄と枠は SVG の四角で読む。
 */
import { describe, expect, it } from "vitest";
import { parseNotation } from "../src/parser";
import { badgeRect, cardOf, carried, carrierRect, doneRect, overlap, waiting } from "./carrier-support";
import { type Motion, motionOf } from "./motion-support";

const diagram = (lines: string[]): unknown => {
  const parsed = parseNotation(lines.join("\n"));
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
};

/** 店が札を、客が硬貨を、同じ段に決済へ送る構成図。台帳は何も運ばない線だけを受ける */
const ARCH = [
  "architecture 置き場",
  "",
  "box 客 [note: 払う人, icon: user]",
  "box 店 as 店のアプリ [note: 注文を受ける, icon: app]",
  "box 決済 [note: 代金を受け取る, icon: card]",
  "box 台帳 [note: 記録を残す, icon: db]",
  "",
  "step 注文する",
  "  say 客が注文を送る。",
  "  客 -> 店: 注文する",
  "",
  "step 払う",
  "  say 店が番号を付けて決済に回し、客が払う。",
  "  店 -> 決済: 支払いを頼む [tag: #42]",
  "  客 -> 決済: 1200 円 [carry: coin]",
  "",
  "step 記録する",
  "  say 決済が台帳に記録する。",
  "  決済 -> 台帳: 記録する [carry: none]",
];

/** 使い方の頁の状態遷移図の例と同じ形。長い札 #1042 が状態を渡り歩き、出た状態に済んだ印が付く */
const STATE = [
  "state 注文が届くまでの状態",
  "",
  "box 支払い待ち [note: 入金を待つ, color: amber, icon: clock]",
  "box 発送済み [note: 業者が運ぶ, color: violet, icon: truck]",
  "box 配達完了 [note: 受け取られた, color: green, icon: check]",
  "box キャンセル [note: 払った分は返す, color: rose, icon: x]",
  "",
  "支払い待ち -> キャンセル: 取り消す",
  "キャンセル -> finish",
  "",
  "step 注文する",
  "  say 注文を確定すると、支払い待ちから始まる。",
  "  start -> 支払い待ち: 注文を確定 [tag: #1042]",
  "",
  "step 発送する",
  "  say 入金を確かめて品物を送り、発送済みに移る。",
  "  支払い待ち -> 発送済み: 発送 [tag: #1042]",
  "",
  "step 届く",
  "  say 品物が届いて配達完了に移り、注文を閉じる。",
  "  発送済み -> 配達完了: 受け取り [tag: #1042]",
  "  配達完了 -> finish: 注文を閉じる [tag: #1042]",
];

/** 使い方の頁の運ぶ物の例と同じ時系列図。右へ向かう封筒と札と硬貨が在る */
const SEQUENCE = [
  "sequence 運ばれる物を見分ける",
  "",
  "box 客 [note: 払う人, color: slate, icon: user]",
  "box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]",
  "box 決済 [note: 代金を受け取る, color: violet, icon: card]",
  "",
  "step 注文する",
  "  say 客が店のアプリに注文を送る。",
  "  客 -> 店: 注文する",
  "",
  "step 払う",
  "  say 店のアプリが注文の番号を付けて決済に回し、客が代金を払う。",
  "  店 -> 決済: 支払いを頼む [tag: #42]",
  "  客 -> 決済: 1200 円 [carry: coin]",
  "",
  "step 知らせる",
  "  say 決済が、払われたことを店のアプリに知らせる。",
  "  決済 -> 店: 払われた [carry: none]",
];

/** 段の止め絵の時刻に、着いた先で留まっている運ぶ物 */
const resting = (m: Motion) =>
  carried(m).flatMap((c) => {
    const t = m.rendered.timeline.stills[c.step] as number;
    return t >= c.arrive && t < c.end ? [{ c, t }] : [];
  });

const ids = (m: Motion): string[] => m.rendered.layout.boxes.map((b) => b.id);

describe("運ぶ物の置き場 (#3176)", () => {
  it("carrier-rests-beside-icon", () => {
    let checked = 0;
    for (const [name, lines] of [
      ["構成図", ARCH],
      ["状態遷移図", STATE],
    ] as const) {
      const m = motionOf(diagram(lines));
      for (const { c, t } of resting(m)) {
        const card = cardOf(m, c.edge.to);
        if (!card?.icon) continue;
        const r = carrierRect(m, c, t);
        const where = `${name}の段 ${c.step + 1} で ${card.name} に着いた運ぶ物`;
        expect(overlap(r, card.icon), `${where}が絵柄に重なる`).toBe(false);
        expect(r.x, `${where}が絵柄の右に無い`).toBeGreaterThanOrEqual(card.icon.x + card.icon.w);
        expect(r.y + r.h, `${where}が名前に重なる`).toBeLessThanOrEqual(card.nameTop);
        checked++;
      }
    }
    expect(checked, "着いて留まる運ぶ物を 1 つも見ていない").toBeGreaterThanOrEqual(3);
  });

  it("carriers-in-one-box-side-by-side", () => {
    const m = motionOf(diagram(ARCH));
    const both = resting(m).filter(({ c }) => c.step === 1 && c.edge.to === "決済");
    expect(both, "2 段目に決済へ着いて留まる運ぶ物が 2 つ無い").toHaveLength(2);
    const [a, b] = both.map(({ c, t }) => carrierRect(m, c, t));
    if (!a || !b) return;
    expect(overlap(a, b, 2), "札と硬貨が重なる").toBe(false);
    expect(Math.abs(a.y + a.h / 2 - (b.y + b.h / 2)), "札と硬貨が横に並んでいない").toBeLessThanOrEqual(0.5);
  });

  it("slot-frame-only-on-carrier-boxes", () => {
    const m = motionOf(diagram(ARCH));
    for (const id of ["客", "店", "決済"]) {
      const card = cardOf(m, id);
      expect(card?.slot, `運ぶ物を出し入れする ${id} に置き場の枠が無い`).toBeDefined();
      if (!card?.slot || !card.icon) continue;
      expect(card.slot.x, `${id} の置き場の枠が絵柄の右に無い`).toBeGreaterThanOrEqual(card.icon.x + card.icon.w);
      const frame = m.doc.querySelector(`rect.dg-slot[x="${card.slot.x}"]`) as Element;
      expect(m.opacity(frame, 0.05), `${id} の置き場の枠が初めの段から見えない`).toBeGreaterThan(0.5);
    }
    const ledger = cardOf(m, "台帳");
    expect(ledger?.slot, "運ぶ物を出し入れしない台帳に置き場の枠が在る").toBeUndefined();
    if (ledger?.icon) expect(Math.abs(ledger.icon.x + ledger.icon.w / 2 - ledger.cx), "台帳の絵柄が真ん中に無い").toBeLessThanOrEqual(0.5);
  });

  it("slot-clear-of-done-mark", () => {
    const m = motionOf(diagram(STATE));
    let checked = 0;
    for (const id of ["支払い待ち", "発送済み", "配達完了"]) {
      const card = cardOf(m, id);
      expect(card?.slot, `札が着く ${id} に置き場の枠が無い`).toBeDefined();
      const done = doneRect(m, id);
      if (!card?.slot) continue;
      if (done) expect(overlap(card.slot, done, 2), `${id} の置き場の枠が済んだ印に重なる`).toBe(false);
      checked++;
    }
    for (const { c, t } of resting(m)) {
      const slot = cardOf(m, c.edge.to)?.slot;
      if (!slot) continue;
      const r = carrierRect(m, c, t);
      const inside = r.x >= slot.x - 0.5 && r.x + r.w <= slot.x + slot.w + 0.5 && r.y >= slot.y - 0.5 && r.y + r.h <= slot.y + slot.h + 0.5;
      expect(inside, `段 ${c.step + 1} で ${c.edge.to} に着いた札 #1042 が置き場の枠に収まらない`).toBe(true);
      checked++;
    }
    expect(checked, "置き場の枠を 1 つも見ていない").toBeGreaterThanOrEqual(4);
  });

  it("carrier-waits-in-slot-before-departing", () => {
    let checked = 0;
    for (const [name, lines] of [
      ["構成図", ARCH],
      ["状態遷移図", STATE],
    ] as const) {
      const m = motionOf(diagram(lines));
      const boxes = ids(m);
      // 待つ間を持つのは、主役と硬貨のそれぞれ最初の運ぶ物。状態遷移図では始まりの印から出る
      for (const c of carried(m)) {
        const t = waiting(c);
        if (t === undefined) continue;
        const r = carrierRect(m, c, t);
        const where = `${name}の段 ${c.step + 1} で ${c.edge.from} から出る運ぶ物`;
        for (const badge of m.rendered.layout.badges) expect(overlap(r, badgeRect(badge)), `${where}が走り出す前に段 ${badge.step + 1} の番号に重なる`).toBe(false);
        checked++;
        if (!boxes.includes(c.edge.from)) continue;
        const slot = cardOf(m, c.edge.from)?.slot;
        expect(slot, `${where}の置き場の枠が無い`).toBeDefined();
        if (!slot) continue;
        const [x, y] = [r.x + r.w / 2, r.y + r.h / 2];
        expect(x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h, `${where}が出る箱の置き場で待っていない`).toBe(true);
        checked++;
      }
    }
    // 構成図は客から出る封筒の番号と置き場、状態遷移図は始まりの印から出る札の番号を見る
    expect(checked, "走り出す前に待つ運ぶ物を見た数が足りない").toBeGreaterThanOrEqual(3);
  });

  it("sequence-carrier-beside-lifeline", () => {
    const m = motionOf(diagram(SEQUENCE));
    const x = new Map(m.rendered.layout.lifelines.map((l) => [l.id, l.x]));
    let checked = 0;
    for (const c of carried(m)) {
      const [xf = 0, xt = 0] = [x.get(c.edge.from), x.get(c.edge.to)];
      if (xf === xt) continue;
      const dir = Math.sign(xt - xf);
      const [tx, ty] = c.edge.points[c.edge.points.length - 1] as [number, number];
      const tip = { x: dir > 0 ? tx - 9 : tx, y: ty - 5, w: 9, h: 10 };
      const t = m.rendered.timeline.stills[c.step] as number;
      if (t >= c.arrive && t < c.end) {
        const r = carrierRect(m, c, t);
        expect(overlap(r, tip), `段 ${c.step + 1} で ${c.edge.to} に着いた運ぶ物が矢印の先に重なる`).toBe(false);
        expect(dir > 0 ? r.x >= xt : r.x + r.w <= xt, `段 ${c.step + 1} で ${c.edge.to} に着いた運ぶ物が生存線の向こう側に無い`).toBe(true);
        checked++;
      }
      const w = waiting(c);
      if (w !== undefined) {
        const r = carrierRect(m, c, w);
        for (const badge of m.rendered.layout.badges) expect(overlap(r, badgeRect(badge)), `段 ${c.step + 1} で ${c.edge.from} から出る運ぶ物が走り出す前に段 ${badge.step + 1} の番号に重なる`).toBe(false);
        expect(dir > 0 ? r.x + r.w <= xf : r.x >= xf, `段 ${c.step + 1} で ${c.edge.from} から出る運ぶ物が生存線の手前側で待っていない`).toBe(true);
        checked++;
      }
    }
    expect(checked, "時系列図の運ぶ物を 1 つも見ていない").toBeGreaterThanOrEqual(4);
  });

  it("architecture-labels-inside-figure", () => {
    const m = motionOf(diagram(ARCH));
    const { width, height, labels } = m.rendered.layout;
    for (const l of labels) {
      expect(l.x >= 0 && l.y >= 0 && l.x + l.w <= width && l.y + l.h <= height, `線の名前「${l.text}」(${l.x}, ${l.y}, ${l.w}x${l.h}) が図 (${width}x${height}) の外へはみ出す`).toBe(true);
    }
  });
});
