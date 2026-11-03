/**
 * 箱の下の小さな字の描き方 (#3345)。
 *
 * 下の字は箱の 3 段の 1 つで、箱を描く部品 (`render/parts.ts` の `card` と `subLines`) が箱と一緒に描く。
 * このブロックは、段で起きた書き換え (`note`) と、時系列図でない図の箱の中の処理 (`act`) から、
 * 箱ごとの下の字の移り変わりを組む。
 */
import { MOTION } from "../../look/values";
import type { SubChange } from "../box/draw";
import type { DiagramModel } from "../../schema";
import type { Span, Timeline } from "../../timeline";

/**
 * 箱の下の字の移り変わり。書き換えはそのまま残し、構成図の処理はその段の間だけ出して元へ戻す。
 * 止め絵を選んだ図は、その箱で最後に起きたのが処理なら、最後の段で起きることが済んだ時にその処理を出し直して繰り返す前まで残す (#3200)
 */
export function subChanges(diagram: DiagramModel, timeline: Timeline, actionsInBox: boolean): Map<string, SubChange[]> {
  type Raw = { t: number; order: number; box: string; set?: string; act?: string | null };
  const raw: Raw[] = [];
  const { whole } = timeline;
  let order = 0;
  for (const time of timeline.events) {
    const event = diagram.steps[time.step]?.events[time.event];
    if (event?.type === "swap") raw.push({ t: time.at, order: order++, box: event.box, set: event.text });
    if (actionsInBox && event?.type === "action") {
      raw.push({ t: time.at, order: order++, box: event.box, act: event.label });
      const end = (timeline.steps[time.step] as Span).end;
      if (!whole || end <= whole.start) raw.push({ t: end, order: order++, box: event.box, act: null });
    }
  }
  raw.sort((a, b) => a.t - b.t || a.order - b.order);
  const out = new Map<string, SubChange[]>();
  for (const box of diagram.boxes) {
    let base: [string, string] = [box.sub ?? "", "dg-ss"];
    let acting: string | undefined;
    let shown = base.join("|");
    const list: SubChange[] = [];
    const changes = raw.filter((r) => r.box === box.id);
    const latest = [...changes].reverse().find((r) => r.set !== undefined || typeof r.act === "string");
    if (whole && typeof latest?.act === "string") changes.push({ t: whole.start, order: order++, box: box.id, act: latest.act });
    for (const change of changes) {
      // 書き換えは、出ている処理の字も置き換える
      if (change.set !== undefined) {
        base = [change.set, "dg-ss-ok"];
        acting = undefined;
      }
      if (change.act !== undefined) acting = change.act ?? undefined;
      const now: [string, string] = acting !== undefined ? [acting, "dg-ss-act"] : base;
      if (now.join("|") === shown) continue;
      shown = now.join("|");
      list.push([change.t, now[0], now[1]]);
    }
    // すぐ次の字に替わる字は読めないので出さない
    const kept = list.filter((change, k) => {
      const next = list[k + 1];
      return next === undefined || next[0] - change[0] >= MOTION.minShow;
    });
    out.set(box.id, kept);
  }
  return out;
}
