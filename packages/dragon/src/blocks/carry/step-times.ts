/**
 * 札が線を引き始める時に出て、その段の終わりに消える時刻の直し (#3656)。
 *
 * 走った線が光ったまま後の段にも残る図の種類 (回り続ける図 #3623、表どうしの関係の図 #3618) は、札を残さないためにこの 1 つの処理を使う。
 * 束ねる道具は file ごとに塊へ分けるので、最初に読む塊に入る運ぶ物の時刻 (`timing.ts`) と分け、使う種類の塊にだけ入れる
 */
import type { DiagramModel } from "../../schema";
import type { Timeline } from "../../timeline";

/**
 * 図の種類を問わず組んだ時刻の表 (`buildTimeline`) を受け取り、札の見えている間を直す。
 * 札は線を引き始める時に出て (走り出しを待たない)、その段の終わりに消える。段の終わりより後に着く札は、着いた時に消える
 */
export function stepCarriers(_diagram: DiagramModel, t: Timeline): Timeline {
  return {
    ...t,
    carriers: t.carriers.map((c) => {
      const span = t.steps[c.step];
      return { ...c, start: c.depart, end: Math.max(c.arrive, span?.end ?? c.end) };
    }),
  };
}
