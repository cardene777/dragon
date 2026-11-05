/**
 * commit の描き方 (#3164、#3347)。
 *
 * commit の丸は、親から引く線を引き終えた時に弾んで出て、hash と一言を丸の外に添える。
 * どの札からも辿れなくなった commit は、その時に点線の丸を重ねる。
 * 親から引く線は引いた後も残す。線の並びは並べ方が 1 つの並びに出すので、枝分かれの図を描く部品 (`render/git.ts`) が順に読み、線の種類ごとの描き方を引く。
 * この file は枝分かれの図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { GitLink, GitPlaced } from "../../kinds/git/layout";
import { EASE, LOOK, TYPE } from "../../look/values";
import { type Ctx, esc, pathOf, r1, write } from "../../render/parts";
import type { EdgeTime } from "../../timeline";
import { cs } from "../color/draw";

/** 線を引く時刻を引く処理。段と段の中の出来事の番号で引き、描かない線は `undefined` */
export type TimeOf = (step: number, event: number) => EdgeTime | undefined;

/** 線の種類ごとの描き方。線の時刻 `time` に引き始め、描いた線を返す */
export type LinkLine = (link: GitLink, time: EdgeTime, ctx: Ctx) => string;

/** 親から子へ引く線。引き始めてから引き終えるまでに伸ばし、繰り返す前まで残す */
export const parentLine: LinkLine = (l, time, ctx) => {
  const { m } = ctx;
  const d = pathOf(l.points, ctx.corner);
  const kf = m.kf([
    [0, { opacity: 0, "stroke-dashoffset": 1 }],
    [time.start, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
    [time.start + 0.05, { opacity: 1 }],
    [time.drawn, { "stroke-dashoffset": 0 }],
    [m.last, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut],
    [m.total, { opacity: 0, "stroke-dashoffset": 0 }],
  ]);
  return `<g style="${cs(l.color)}"><path class="dg-git-l dg-a" pathLength="1" d="${d}" style="${kf}"/></g>`;
};

/** commit の丸と名札と、丸の外の hash と一言と、辿れなくなった時に重ねる点線の丸 */
export function commitDot(c: GitPlaced, timeOf: TimeOf, ctx: Ctx): string {
  const { m } = ctx;
  const at = timeOf(c.step, c.event)?.drawn ?? 0;
  const ring = { x: c.cx - c.r, y: c.cy - c.r, w: c.r * 2, h: c.r * 2 };
  ctx.ink.push({ text: c.id, rect: ring, shown: [[at, Number.POSITIVE_INFINITY]], boxed: true });
  const lines = (c.text?.lines ?? [])
    .map((line, k) => {
      const hash = k === 0 && c.hash !== undefined;
      const baseline = c.text?.baselines[k] ?? c.cy;
      return write(ctx.ink, hash ? "dg-git-h" : "dg-git-n", c.cx, baseline, line, hash ? TYPE.gitHash : TYPE.gitNote, [[at, Number.POSITIVE_INFINITY]], "middle");
    })
    .join("");
  const id = `<text class="dg-git-id" x="${r1(c.cx)}" y="${r1(c.cy + LOOK.baseline.badge)}" text-anchor="middle">${esc(c.id)}</text>`;
  const node = `<g class="dg-popc dg-a" style="${m.pop(at)}"><circle class="dg-git-c" cx="${r1(c.cx)}" cy="${r1(c.cy)}" r="${c.r}" ${ctx.sh}/>${id}</g>`;
  const text = lines === "" ? "" : `<g class="dg-a" style="${m.vis(at)}">${lines}</g>`;
  const orphanAt = c.orphan === undefined ? undefined : timeOf(c.orphan, c.orphanEvent ?? 0)?.drawn;
  const orphan =
    orphanAt === undefined
      ? ""
      : `<g class="dg-a" data-orphan="${esc(c.id)}" style="${m.vis(orphanAt, m.last, { f: 0.5 })}"><circle class="dg-git-old" cx="${r1(c.cx)}" cy="${r1(c.cy)}" r="${LOOK.git.orphan}"/><text class="dg-git-oldl" x="${r1(c.cx)}" y="${r1(c.cy + LOOK.baseline.badge)}" text-anchor="middle">${esc(c.id)}</text></g>`;
  return `<g data-commit="${esc(c.id)}" style="${cs(c.color)}">${node}${text}${orphan}</g>`;
}
