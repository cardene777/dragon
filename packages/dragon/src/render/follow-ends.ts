/**
 * 寄って追う窓の線の端の箱 (#3836)。
 *
 * 線の端の箱は、段で引いた線の端に在り、その段で足した物に入らない箱を指す。
 * 考えを広げる地図は段で足した考えの親、量の行き先の図は段で足した帯の出どころの棒と名前、状態遷移図は段で引いた線の両端の状態を挙げる。
 * 幅 390 の窓では、足した物だけに寄せると線の端の箱が窓の端で切れ、足した物がどの箱から伸びたかを読めない。
 *
 * 寄せ直しは、線の端の箱が今の窓に全部入る段では行わない。
 * 切れる段は、番号の丸に近い順に段で動く物と足した物を窓に収まる間だけ囲み、線の端の箱も同じ順に囲める間だけ囲む。
 * 囲めなかった線の端の箱の側へ、囲んだ所を窓に残したまま寄せる。
 * 寄せ直しても線の端の箱が切れる長さの合計が減らない段は、今の窓のままにする。
 *
 * 窓の端で切れる線の端の箱には、名前を全部書いた札を、切れた側の窓の端に窓の枠の内に収めて出す。
 * 箱の一部が窓に映る時は、映る所を窓の地で縁まで覆い、札を箱と同じ高さと影で箱の映っていた所まで伸ばして、札の外に切れた箱の縁と影を覗かせない。
 * 箱が窓の外に在る時は、箱へ向かう線が窓の端を横切る所に札を出し、段の札と箱に重ならない所までずらす。
 * 札は窓が段の所へ寄り終えてから出し、次の段へ動き始めると消して、その段の止め絵でだけ見せる。
 * 札は窓と一緒に動く中身の層の、番号の丸より下に描き、番号の丸と処理の札を覆わない。
 *
 * 段で動く物が窓に収まらずに窓を引いた段 (#3871) は、引いた窓の広さで札を置き、札の組を引いた倍率で戻して窓に映る札の大きさを変えない。
 * その段は、種類が挙げた足した物 (`named`) も窓の端で切れると札を出す。
 */
import { cs } from "../blocks/color/draw";
import type { EndView, FollowEnds } from "../kinds/parts";
import { textWidth } from "../layout/measure";
import { type Layout, type Point, type Rect, unionRect } from "../layout/scene";
import { FOLLOW_ENDS_LOOK } from "../look/follow-ends";
import { type ColorKey, LOOK, TYPE } from "../look/values";
import type { DiagramModel } from "../schema";
import { partRadius } from "./corner";
import { cssFont as font, esc } from "./parts";

/** 線の端の箱。`rect` は窓に入れる所、`paths` はその段で箱へ向かう線の点 */
export interface LineEnd {
  rect: Rect;
  name: string;
  color: ColorKey;
  paths: Point[][];
}

/**
 * 段の線の端の箱と、段で足した物のうち段で動く物に入らない物 (量の行き先の図の行き先の名前)。
 * `blocks` は段の札と箱のほかに、窓の外の箱の札を重ねない物 (量の行き先の図の棒と名前)
 */
export interface StepEnds {
  added: Rect[];
  ends: LineEnd[];
  blocks?: Rect[];
  /** 段で足した物のうち、窓を引いた段 (#3871) で窓の端で切れると名前の札を出す物 */
  named?: LineEnd[];
}

/** 段 `step` で引いた線の両端の箱を線の端の箱に挙げる。状態遷移図と構成図が使う (#3836、#3871) */
export function edgeEnds(layout: Layout, step: number): StepEnds {
  const edges = layout.edges.filter((edge) => edge.step === step);
  const on = (id: string) => edges.filter((edge) => edge.from === id || edge.to === id);
  return {
    added: [],
    ends: layout.boxes.filter((box) => on(box.id).length > 0).map((box) => ({ rect: box, name: box.name, color: box.color, paths: on(box.id).map((edge) => edge.points) })),
  };
}

const E = FOLLOW_ENDS_LOOK;
const T = E.tag;

/** 四角 `r` が窓 `w` から切れる長さ。全部入る時は 0 */
const cutOf = (r: Rect, w: Rect): number => Math.max(0, w.x - r.x, r.x + r.w - (w.x + w.w), w.y - r.y, r.y + r.h - (w.y + w.h));

const meets = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const clip = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** 札の矢の印。`side` は箱が切れた側 */
function chevron(x: number, y: number, side: string): string {
  const d = T.chevron;
  const flat = side === "left" || side === "right";
  const s = side === "left" || side === "up" ? -1 : 1;
  const pts: Point[] = flat
    ? [[x - (s * d) / 2, y - d], [x + (s * d) / 2, y], [x - (s * d) / 2, y + d]]
    : [[x - d, y - (s * d) / 2], [x, y + (s * d) / 2], [x + d, y - (s * d) / 2]];
  return `<path class="dg-tag-arrow" d="M${pts.map((p) => p.join(" ")).join("L")}" style="fill:none;stroke:var(--c);stroke-width:2;stroke-linecap:round;stroke-linejoin:round"/>`;
}

/**
 * 線の端の箱を `list` で挙げる種類の、寄って追う窓の寄せ直しと札。
 * `list` は段ごとの線の端の箱と、段で動く物に入らない足した物を返す
 */
export function followEnds<L extends Layout>(
  list: (layout: L, diagram: DiagramModel, step: number) => StepEnds,
): (layout: L, diagram: DiagramModel, view: EndView) => FollowEnds {
  return (layout, diagram, { vw, vh, strip, top, sh, clamp, moving, corner }) => {
    const memo = new Map<number, StepEnds>();
    const at = (s: number): StepEnds => {
      const hit = memo.get(s);
      if (hit) return hit;
      const made = list(layout, diagram, s);
      memo.set(s, made);
      return made;
    };
    const win = ([x, y]: [number, number]): Rect => ({ x: x - vw / 2, y: y - vh / 2, w: vw, h: vh });
    const fits = (q: Rect, room: number): boolean => q.w + room * 2 <= vw && q.h + room * 2 <= vh;

    /** 段 `s` の窓の真ん中 `c` を、線の端の箱を窓に入れる所へ寄せ直す */
    const aim = (c: [number, number], s: number): [number, number] => {
      const { added, ends } = at(s);
      if (ends.every((e) => cutOf(e.rect, win(c)) <= E.slack)) return c;
      const r = LOOK.badge.r;
      const b = layout.badges.find((x) => x.step === s);
      const disc = b && (!layout.strip || b.y < layout.strip.y) && b.y >= top ? { x: b.x - r, y: b.y - r, w: r * 2, h: r * 2 } : undefined;
      const away = (p: Rect): number => (b ? Math.hypot(Math.max(0, p.x - b.x, b.x - p.x - p.w), Math.max(0, p.y - b.y, b.y - p.y - p.h)) : 0);
      let held = disc;
      for (const p of [...moving(s), ...added].sort((u, w) => away(u) - away(w))) {
        const next = held ? unionRect([held, p]) : p;
        if (fits(next, E.room)) held = next;
      }
      if (!held) return c;
      const left: Rect[] = [];
      for (const e of [...ends].sort((u, w) => away(u.rect) - away(w.rect))) {
        const next = unionRect([held, e.rect]);
        if (fits(next, 0)) held = next;
        else left.push(e.rect);
      }
      const f = held;
      const all = unionRect([f, ...left]);
      // 囲んだ所の周りに空きを取れない時は、空き無しで窓に収める
      const axis = (want: number, lo: number, size: number, span: number, keep: number): number => {
        for (const room of [E.room, 0]) {
          const a = lo + size + room - span / 2;
          const z = lo - room + span / 2;
          if (a <= z) return clip(want, a, z);
        }
        return keep;
      };
      const moved = clamp([axis(all.x + all.w / 2, f.x, f.w, vw, c[0]), axis(all.y + all.h / 2, f.y, f.h, vh, c[1])]);
      // 窓の外に出た箱は箱の大きさまでを数える
      const cut = (q: [number, number]): number => ends.reduce((sum, e) => sum + Math.min(cutOf(e.rect, win(q)), Math.max(e.rect.w, e.rect.h)), 0);
      return cut(moved) < cut(c) - 0.5 ? moved : c;
    };

    /** 窓 `w` の端で切れる線の端の箱 `e` の札。`blocks` は札を重ねない物 */
    const tag = (e: LineEnd, w: Rect, blocks: Rect[]): string => {
      const p = e.rect;
      if (cutOf(p, w) <= E.slack) return "";
      const over = { left: w.x - p.x, right: p.x + p.w - (w.x + w.w), up: w.y - p.y, down: p.y + p.h - (w.y + w.h) };
      const side = (["right", "up", "down"] as const).reduce<keyof typeof over>((a, k) => (over[k] > over[a] ? k : a), "left");
      const flat = side === "left" || side === "right";
      // 窓の上の四角で、箱の窓に映る所
      const seen = meets(p, w);
      const vx = Math.max(p.x, w.x) - w.x;
      const vy = Math.max(p.y, w.y) - w.y;
      const vr = Math.min(p.x + p.w, w.x + w.w) - w.x;
      const vb = Math.min(p.y + p.h, w.y + w.h) - w.y;
      const nameW = textWidth(e.name, TYPE.boxName);
      const inner = T.arrow + nameW;
      // 箱の映っていた所まで札を伸ばして箱と同じ所を覆い、箱へ向かう線が札に着くようにする
      let h = seen ? Math.min(vh - T.inset * 2, Math.max(T.low, flat ? p.h : 0)) : T.h;
      let tw = inner + T.pad * 2;
      if (seen && flat) tw = Math.max(tw, Math.min(vw - T.inset * 2, (side === "left" ? vr : vw - vx) + 1 - T.inset));
      if (seen && !flat) {
        tw = Math.max(tw, Math.min(vw - T.inset * 2, vr - vx + 2));
        h = Math.max(h, Math.min(vh - T.inset * 2, (side === "up" ? vb : vh - vy) + 1 - T.inset));
      }
      // 箱が窓の外に在る時は、箱へ向かう線が窓の端を横切る所に寄せる
      const cross = (): number | undefined => {
        const k = flat ? 0 : 1;
        const o = flat ? 1 : 0;
        const v = side === "left" ? w.x : side === "right" ? w.x + w.w : side === "up" ? w.y : w.y + w.h;
        const near = flat ? p.y + p.h / 2 : p.x + p.w / 2;
        const hits: number[] = [];
        for (const pts of e.paths)
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1] as Point;
            const z = pts[i] as Point;
            if (a[k] === z[k] || (a[k] - v) * (z[k] - v) > 0) continue;
            hits.push(a[o] + ((v - a[k]) / (z[k] - a[k])) * (z[o] - a[o]));
          }
        return hits.sort((u, q) => Math.abs(u - near) - Math.abs(q - near))[0];
      };
      const mid = seen
        ? flat
          ? (vy + vb) / 2
          : (vx + vr) / 2
        : (cross() ?? (flat ? p.y + p.h / 2 : p.x + p.w / 2)) - (flat ? w.y : w.x);
      const along = flat ? h : tw;
      const room = (flat ? vh : vw) - T.inset - along;
      const place = (v: number): number => clip(v - along / 2, T.inset, room);
      const box = (v: number): Rect =>
        flat
          ? { x: side === "left" ? T.inset : vw - T.inset - tw, y: v, w: tw, h }
          : { x: v, y: side === "up" ? T.inset : vh - T.inset - h, w: tw, h };
      const free = (q: Rect): boolean => !blocks.some((k) => k !== p && meets({ ...q, x: q.x + w.x, y: q.y + w.y }, k));
      let pos = place(mid);
      if (!seen)
        for (let k = 0; k <= along / 2; k += T.nudge) {
          const hit = [place(mid - k), place(mid + k)].find((v) => free(box(v)));
          if (hit !== undefined) {
            pos = hit;
            break;
          }
        }
      const q = box(pos);
      const y = q.y + strip;
      const cy = y + h / 2;
      const gx = q.x + (tw - inner) / 2;
      const arrow = side === "right" ? chevron(gx + inner - T.chevron, cy, side) : chevron(gx + T.chevron, cy, side);
      const nameX = side === "right" ? gx + nameW / 2 : gx + T.arrow + nameW / 2;
      const r = partRadius(corner, Math.min(h, tw, T.high) / 2);
      // 札の丸い端と窓の枠の間に残る箱の所を、箱の縁の太さの分まで窓の地で覆う。
      // 札は箱と同じ所を同じ影で覆うので、残りを覆わない。覆うと箱の影が地の縁で途切れて見える。
      // 札が箱の映る所を覆いきらない時は、映る所を全部覆う
      let [x0, y0, x1, y1] = [Math.max(0, vx - 1), Math.max(0, vy - 1), Math.min(vw, vr + 1), Math.min(vh, vb + 1)];
      if (flat ? q.y <= vy && q.y + h >= vb : q.x <= vx && q.x + tw >= vr) {
        if (side === "left") x1 = Math.min(x1, q.x + r);
        else if (side === "right") x0 = Math.max(x0, q.x + tw - r);
        else if (side === "up") y1 = Math.min(y1, q.y + r);
        else y0 = Math.max(y0, q.y + h - r);
      }
      const mask = seen ? `<rect class="dg-tag-mask" x="${x0}" y="${y0 + strip}" width="${x1 - x0}" height="${y1 - y0}" style="fill:var(--bg)"/>` : "";
      return (
        `${mask}<rect class="dg-tag-pill" x="${q.x}" y="${y}" width="${tw}" height="${h}" rx="${r}" ${sh} style="fill:var(--surf);stroke:var(--c);stroke-width:2"/>` +
        `${arrow}<text class="dg-tag-name" x="${nameX}" y="${cy + TYPE.boxName.size * T.baseline}" text-anchor="middle" style="${font(TYPE.boxName)};fill:var(--ink)">${esc(e.name)}</text>`
      );
    };

    return {
      aim,
      boxes: (s) => ({ ends: at(s).ends.map((e) => e.rect), named: (at(s).named ?? []).map((e) => e.rect) }),
      tags: (middles, m, timeline, zooms) =>
        timeline.steps
          .map((span, s) => {
            const k = zooms?.[s] ?? 1;
            const [cx, cy] = middles[s] as [number, number];
            // 引いた窓 (#3871) は、窓の左上を原点に倍率を掛けた窓の上の四角で札を置く。同じ四角は同じ物に写し、札が自分の箱を避けないようにする
            const w: Rect = { x: cx - vw / 2 / k, y: cy - vh / 2 / k, w: vw / k, h: vh / k };
            const seen = new Map<Rect, Rect>();
            const to = (q: Rect): Rect => {
              const hit = seen.get(q) ?? { x: (q.x - w.x) * k, y: (q.y - w.y) * k, w: q.w * k, h: q.h * k };
              seen.set(q, hit);
              return hit;
            };
            const next = timeline.steps[s + 1]?.start ?? timeline.last;
            const blocks = [...layout.labels.filter((l) => l.step === s), ...layout.boxes, ...at(s).added, ...(at(s).blocks ?? [])];
            return [...at(s).ends, ...(k < 1 ? (at(s).named ?? []) : [])]
              .map((e) => {
                const body =
                  k < 1
                    ? tag({ ...e, rect: to(e.rect), paths: e.paths.map((pts) => pts.map(([x, y]): Point => [(x - w.x) * k, (y - w.y) * k])) }, { x: 0, y: 0, w: vw, h: vh }, blocks.map(to))
                    : tag(e, w, blocks);
                // 札は窓と一緒に動く中身の層に入れ、その段の窓の左上へ移す。引いた窓は倍率で戻す
                return body === ""
                  ? ""
                  : `<g class="dg-a dg-tag" data-step="${s}" transform="translate(${w.x} ${w.y - strip})${k < 1 ? ` scale(${1 / k})` : ""}" style="${cs(e.color)};${m.vis(span.start + LOOK.follow.ease, next)}">${body}</g>`;
              })
              .join("");
          })
          .join(""),
    };
  };
}
