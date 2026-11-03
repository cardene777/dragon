/**
 * 線の描き方 (#3345)。
 *
 * 先に点線で道を見せ、その段で色の線を引き、流れる点で向きを見せる。済んだ線は薄く残す。
 * 道の形と曲がり角の丸め (`pathOf`) と矢じり (`arrowHead`) は、状態遷移図の通らない道と同じ下請けを使う。
 */
import type { SceneEdge } from "../../layout/scene";
import { EASE } from "../../look/values";
import { ALWAYS } from "../../render/ink";
import type { Frame } from "../../render/motion";
import { arrowHead, type Ctx, cs, pathOf } from "../../render/parts";
import type { EdgeTime } from "../../timeline";

/**
 * 線。点線で道を見せておき、その段で色の線を引いて、段の終わりまで流れる点で向きを見せる。
 * 済んだ段は薄く残し、最後の段の後に通った道を全て濃くし直す。
 * `past` を立てると (状態遷移図、#3171)、段が終わった後は色の線を消して灰の実線に替え、最後の段まで残す。
 * `since` を渡すと (木の図の後から現れる箱へ向かう線、#3240)、点線の道をその時刻から出す。
 */
export function edge(e: SceneEdge, time: EdgeTime, ctx: Ctx, past = false, since = 0): { base: string; lit: string } {
  const { m } = ctx;
  // 点線の道は `since` から最後まで見えている。`since` が 0 なら初めから見えている
  ctx.traces.push({ from: e.from, to: e.to, points: e.points, shown: since > 0 ? [[since, Number.POSITIVE_INFINITY]] : ALWAYS });
  const d = pathOf(e.points);
  const head = arrowHead(e.points);
  const { start: a, drawn: b, end } = time;
  const tail: Frame[] = past
    ? [
        [end, { opacity: 1 }, EASE.inOut],
        [end + 0.4, { opacity: 0 }],
        [m.total, { opacity: 0 }],
      ]
    : [
        [end, { opacity: 1 }, EASE.inOut],
        [end + 0.4, { opacity: 0.45 }],
        [ctx.end + 0.3, { opacity: 0.45 }, EASE.inOut],
        [ctx.end + 1, { opacity: 0.95 }],
        [m.last, { opacity: 0.95 }, EASE.inOut],
        [m.total, { opacity: 0 }],
      ];
  const line = m.kf([
    [0, { opacity: 0, "stroke-dashoffset": 1 }],
    [a, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
    [a + 0.05, { opacity: 1 }],
    [b, { "stroke-dashoffset": 0 }],
    [m.last, { "stroke-dashoffset": 0 }],
    [m.total, { "stroke-dashoffset": 1 }],
    ...tail,
  ]);
  const hk = m.kf([[0, { opacity: 0 }], [b - 0.05, { opacity: 0 }], [b, { opacity: 1 }], ...tail]);
  const run = -(end - b) * 26;
  const flow = m.kf([
    [0, { opacity: 0, "stroke-dashoffset": 0 }],
    [b, { opacity: 0, "stroke-dashoffset": 0 }],
    [b + 0.25, { opacity: 0.9 }],
    [end - 0.1, { opacity: 0.9 }, EASE.inOut],
    [end + 0.2, { opacity: 0, "stroke-dashoffset": run }],
    [m.total, { opacity: 0, "stroke-dashoffset": run }],
  ]);
  const grey = past ? m.kf([[0, { opacity: 0 }], [end, { opacity: 0 }, EASE.inOut], [end + 0.4, { opacity: 1 }], [m.last, { opacity: 1 }, EASE.inOut], [m.total, { opacity: 0 }]]) : "";
  const path = `<path class="dg-e" d="${d}"/><path class="dg-eh" d="${head}"/>`;
  return {
    base: `${since > 0 ? `<g class="dg-a" style="${m.vis(since)}">${path}</g>` : path}${past ? `<path class="dg-e-past dg-a" d="${d}" style="${grey}"/><path class="dg-eh-past dg-a" d="${head}" style="${grey}"/>` : ""}`,
    lit: `<g style="${cs(e.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${d}" style="${line}"/><path class="dg-eh-on dg-a" d="${head}" style="${hk}"/><path class="dg-flow dg-a" d="${d}" style="${flow}"/></g>`,
  };
}
