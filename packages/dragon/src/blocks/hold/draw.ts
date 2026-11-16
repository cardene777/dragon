/**
 * 槽と値の管の描き方 (#3389、#3398)。
 *
 * 残高は持ち主の槽で描く。ガラスの中に、つやと 5 本の目盛りとトークンの名前を描き、水位は量に比例させ、液の色はトークンごとに分ける。
 * 槽の下に 3 桁ごとに区切った大きな数 (今の残高) を書き、変わった段から確定するまで、その下に増えた分か減った分と暫定の語を添える。確定した段は確定の語を添える (#3418)。
 * 暫定の槽は増えた分を斜線で、減った分を点線の枠で示し、前の水位に点線を引く。確定した槽は緑の縁、取り消した槽は桃色の縁で描く。
 * 値の管は、持ち主の槽の横の口どうしを結ぶ折れ線で描く (#3418)。トークンの Contract は箱で描き、管の弁の真上に置いて軸で結ぶ。
 * `move` と `[value]` で流れた分は管に沿った点線と向きの印で描き、流れた段は斜線の液の塊が管を通り抜ける。暫定か確定かは管に残さず、点線か実線かと槽の斜線で示す。
 * 弁は 2 つの三角を向かい合わせた形で、取っ手が開くと管の向きに倒れる。弁と計器と名札は呼び出しの管と値の管の両方が使う。
 * 角を落とす色味 (#3344) では、槽とトークンの箱の右上と左下を落とし、つやと取っ手の角を丸めない。
 * この file は配管の図を描く部品 (`render/pipe.ts`) と配管の図のブロックの描き方だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeFlow, PipeLedger, PipeLevel, PipeParty, PipeState, PipeTank, PipeText } from "../../kinds/pipe/layout";
import { simplifyPath } from "../../layout/pipe-place";
import type { Point, Rect } from "../../layout/scene";
import { FLOW_MOVE, PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import { valveLever } from "../../pipe-valve";
import { EASE, MOTION, type TextStyle } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import type { Frame } from "../../render/motion";
import { type Ctx, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { dashMovers, maskOf, STREAM } from "../return/draw";
import { undoneMark } from "../revert/draw";

const P = PIPE_LOOK;
const T = PIPE_TYPE;

/** 印ごとの色の役。変わっていない物と暫定の物は値の色 */
export const STATE_COLOR = { none: "amber", provisional: "amber", final: "green", rolled: "rose" } as const satisfies Record<PipeState, string>;

/** 図の中の定義の名札。図ごとに分ける */
export const defId = (ctx: Ctx, what: string): string => `dg-p${what}-${ctx.id}`;
/** 槽の内側を切り抜く形の名札 */
const clipId = (ctx: Ctx, t: Pick<PipeTank, "party" | "token">): string => defId(ctx, `c-${`${t.party}-${t.token}`.replace(/[^\w-]/gu, "_")}`);

/**
 * 配管の図の定義。地の点、トークンの液の色ごとの斜線、液の深さの陰、丸の名札の色の移り、槽の内側の切り抜き。
 * 液の色は `--pp-tone<番号>` の変数で、配管の図の規則 (`render/pipe.ts`) が値の色から作る
 */
export function pipeDefs(ctx: Ctx, tanks: readonly PipeTank[]): string {
  const s = P.flow.stripe;
  const hatches = [0, 1, 2]
    .map(
      (k) =>
        `<pattern id="${defId(ctx, `h${k}`)}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
        `<rect class="dg-pp-hb" style="--pp-t:var(--pp-tone${k})" width="${s}" height="${s}"/><line class="dg-pp-hl" style="--pp-t:var(--pp-tone${k})" x1="0" y1="0" x2="0" y2="${s}"/></pattern>`,
    )
    .join("");
  const top = Math.min(...tanks.map((t) => t.y), 0);
  const bottom = Math.max(...tanks.map((t) => t.y + t.h), 1);
  const clips = tanks
    .map((t) => {
      const pad = P.tank.pad;
      const inner = { x: t.x + pad, y: t.y + pad, w: t.w - pad * 2, h: t.h - pad * 2 };
      return `<clipPath id="${clipId(ctx, t)}">${frameShape(ctx.corner, "", inner, `<rect x="${r1(inner.x)}" y="${r1(inner.y)}" width="${r1(inner.w)}" height="${r1(inner.h)}" rx="${P.tank.innerRadius}"/>`)}</clipPath>`;
    })
    .join("");
  return (
    `<pattern id="${defId(ctx, "grid")}" width="${P.grid.step}" height="${P.grid.step}" patternUnits="userSpaceOnUse"><circle class="dg-pp-gdot" cx="${P.grid.dot}" cy="${P.grid.dot}" r="${P.grid.dot}"/></pattern>` +
    hatches +
    `<linearGradient id="${defId(ctx, "deep")}" gradientUnits="userSpaceOnUse" x1="0" y1="${r1(top)}" x2="0" y2="${r1(bottom)}"><stop offset="0" class="dg-pp-d0"/><stop offset="1" class="dg-pp-d1"/></linearGradient>` +
    `<linearGradient id="${defId(ctx, "av")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="dg-pp-a0"/><stop offset="1" class="dg-pp-a1"/></linearGradient>` +
    clips
  );
}

/** 地の点 */
export const grid = (ctx: Ctx, width: number, height: number): string =>
  `<rect class="dg-pp-grid" fill="url(#${defId(ctx, "grid")})" x="0" y="0" width="${r1(width)}" height="${r1(height)}"/>`;

/** 字。並べ方が字の大きさを替えた時 (狭い枠の大きな字) は、その大きさを字に書く */
export function sizedText(ctx: Ctx, cls: string, t: PipeText, style: TextStyle, shown: Shown[]): string {
  const drawn = write(ctx.ink, cls, t.x, t.base, t.text, { ...style, size: t.h }, shown);
  return Math.abs(t.h - style.size) < 0.05 ? drawn : drawn.replace("<text ", `<text style="font-size:${r1(t.h)}px" `);
}

/** 四角 */
const rect = (cls: string, r: Rect, radius: number, extra = ""): string =>
  `<rect class="${cls}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(Math.max(0, r.w))}" height="${r1(Math.max(0, r.h))}" rx="${radius}"${extra}/>`;
/** 箱の形。角を落とす色味では右上と左下を落とした形で描く */
export const frame = (ctx: Ctx, cls: string, r: Rect, radius: number, extra = ""): string => frameShape(ctx.corner, ` class="${cls}"${extra}`, r, rect(cls, r, radius, extra));

/**
 * 槽。ガラスと、中に入れる水 (`inside`) と、液の深さの陰と、つやと目盛りとトークンの名前。
 * `edge` は縁の色 (`final` は確定、`rolled` は取り消し、空は変わらない縁)
 */
export function tank(t: PipeTank, edge: "final" | "rolled" | "", inside: string, ctx: Ctx, shown: Shown[], attrs: string): string {
  const h = t.h;
  const ticks = Array.from({ length: P.tank.tick.count - 1 }, (_, k) => {
    const y = t.y + ((k + 1) * h) / P.tank.tick.count;
    return `<line class="dg-pp-tick" data-pipe-tick="" x1="${r1(t.x + t.w - P.tank.tick.from)}" y1="${r1(y)}" x2="${r1(t.x + t.w - P.tank.tick.to)}" y2="${r1(y)}"/>`;
  }).join("");
  const pad = P.tank.pad;
  return (
    `<g${attrs}${edge ? ` style="${cs(edge === "final" ? "green" : "rose")}"` : ""}>` +
    frame(ctx, `dg-pp-glass${edge ? " dg-pp-glass-on" : ""}`, t, P.tank.radius) +
    inside +
    `<rect class="dg-pp-deep" fill="url(#${defId(ctx, "deep")})" clip-path="url(#${clipId(ctx, t)})" x="${r1(t.x + pad)}" y="${r1(t.y + pad)}" width="${r1(t.w - pad * 2)}" height="${r1(h - pad * 2)}"/>` +
    rect("dg-pp-shine", { x: t.x + P.tank.shine.x, y: t.y + P.tank.shine.y, w: P.tank.shine.w, h: h - P.tank.shine.short }, partRadius(ctx.corner, P.tank.shine.w / 2), ' data-pipe-shine=""') +
    ticks +
    write(ctx.ink, "dg-pp-tok", t.title.x, t.title.base, t.title.text, T.tankTitle, shown) +
    `</g>`
  );
}

/**
 * 水と、槽の下の数と、増えた分か減った分と語。`at` を渡すと、その時刻に水が段の始まりの水位 (`from`) から今の水位へ動く。
 * 暫定で増えた分は斜線の帯が下から伸び、暫定で減った分は液が縮んで点線の枠が残り、ほかは水面がそのまま上下する。
 * 水は切り抜きの下の端より下まで伸ばし、下がる時にも底が空かないようにする
 */
export function level(lv: PipeLevel, t: PipeTank, ctx: Ctx, shown: Shown[], attrs: string, at?: number): string {
  const bottom = t.y + t.h - P.tank.pad;
  const deep = t.h;
  const tone = `--pp-t:var(--pp-tone${t.tone})`;
  const body = (top: number, cls = "dg-pp-liq", extra = ""): string =>
    `<rect class="${cls}" style="${tone}" x="${r1(lv.x)}" y="${r1(top)}" width="${r1(lv.w)}" height="${r1(bottom - top + deep)}"${extra}/>`;
  const now = lv.y;
  const old = lv.base?.y;
  const from = at === undefined ? undefined : lv.from;
  /** 時刻 `at` から `transform` を `a` から `b` へ動かす部品。`oy` は伸び縮みの元の高さ */
  const moving = (markup: string, a: string, b: string, oy: number): string => {
    if (at === undefined) return markup;
    const frames: Frame[] = [
      [0, { transform: a }],
      [at, { transform: a }, EASE.out],
      [at + MOTION.pipe.level, { transform: b }],
      [ctx.m.total, { transform: b }],
    ];
    return `<g class="dg-a" style="transform-origin:${r1(lv.x + lv.w / 2)}px ${r1(oy)}px;${ctx.m.kf(frames)}">${markup}</g>`;
  };
  const parts: string[] = [];
  if (lv.state === "provisional" && old !== undefined && lv.h > (lv.base?.h ?? 0)) {
    const hat = `<rect class="dg-pp-hat" fill="url(#${defId(ctx, `h${t.tone}`)})" x="${r1(lv.x)}" y="${r1(now)}" width="${r1(lv.w)}" height="${r1(old - now + 1)}"/>`;
    parts.push(body(old), from ? moving(hat, "scaleY(0)", "scaleY(1)", old) : hat);
  } else if (lv.state === "provisional" && old !== undefined && lv.h < (lv.base?.h ?? 0)) {
    parts.push(lv.h > 0 ? body(now) : "");
    if (from && from.y < now)
      parts.push(moving(`<rect class="dg-pp-liq" style="${tone}" x="${r1(lv.x)}" y="${r1(from.y)}" width="${r1(lv.w)}" height="${r1(now - from.y + 1)}"/>`, "scaleY(1)", "scaleY(0)", now));
    parts.push(`<rect class="dg-pp-ghost" x="${r1(lv.x)}" y="${r1(old)}" width="${r1(lv.w)}" height="${r1(now - old)}"/>`);
  } else if (from) parts.push(moving(body(now), `translateY(${r1(from.y - now)}px)`, "translateY(0)", now));
  else if (lv.h > 0) parts.push(body(now));
  const water = `<g clip-path="url(#${clipId(ctx, t)})">${parts.join("")}</g>`;
  const marks: string[] = [];
  // 前の水位の印は槽の内側だけに引く (Tracelyth #168)
  if (old !== undefined && lv.state === "provisional")
    marks.push(`<line class="dg-pp-mark" x1="${r1(t.x + P.tank.pad)}" y1="${r1(old)}" x2="${r1(t.x + t.w - P.tank.pad)}" y2="${r1(old)}"/>`);
  if (old !== undefined && lv.state === "rolled") marks.push(undoneMark(t.x + P.tank.pad, t.x + t.w - P.tank.pad, old));
  const sub =
    (lv.delta ? write(ctx.ink, "dg-pp-dlt", lv.delta.x, lv.delta.base, lv.delta.text, T.delta, shown) : "") +
    (lv.tag ? write(ctx.ink, "dg-pp-tagw", lv.tag.x, lv.tag.base, lv.tag.text, T.tag, shown) : "");
  return (
    `<g${attrs} class="dg-pp-lv dg-pp-lv-${lv.state}" style="${cs(STATE_COLOR[lv.state])}">${water}${marks.join("")}` +
    `${sizedText(ctx, "dg-pp-num", lv.text, T.amount, shown)}${sub}</g>`
  );
}

/**
 * 値の管。持ち主の槽の横の口どうしを結ぶ折れ線を、壁 (`dg-pp-pcase`) と空洞 (`dg-pp-pbore`) の 2 本の線で描き、流れる値は空洞の中を通す (Tracelyth #168)。
 * `attrs` は部品の印 (`data-pipe-value` など)
 */
export function valuePipe(points: readonly Point[], attrs = ""): string {
  const d = `M ${points.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(" L ")}`;
  return `<g${attrs}><path class="dg-pp-pcase" d="${d}"/><path class="dg-pp-pbore" d="${d}"/></g>`;
}

/**
 * 弁。2 つの三角を向かい合わせた形。`vertical` は縦に走る管の弁。軸と取っ手は描かず、胴だけを描く (Tracelyth #168)。
 * `open` を渡すとその style の間だけ弁が開いた色になる。`turn`、`under`、`ctx`、`attrs` は取っ手を描いていた時の取り決めとして受け取るが、胴の形には使わない
 */
export function valve(x: number, y: number, vertical: boolean, opened: boolean, _attrs: string, _ctx: Ctx, _turn = "", open = "", _under = false): string {
  const V = P.valve;
  const body = vertical
    ? `M ${r1(x - V.half)} ${r1(y - V.r)} L ${r1(x + V.half)} ${r1(y - V.r)} L ${r1(x)} ${r1(y)} Z M ${r1(x - V.half)} ${r1(y + V.r)} L ${r1(x + V.half)} ${r1(y + V.r)} L ${r1(x)} ${r1(y)} Z`
    : `M ${r1(x - V.r)} ${r1(y - V.half)} L ${r1(x - V.r)} ${r1(y + V.half)} L ${r1(x)} ${r1(y)} Z M ${r1(x + V.r)} ${r1(y - V.half)} L ${r1(x + V.r)} ${r1(y + V.half)} L ${r1(x)} ${r1(y)} Z`;
  return (
    `<g class="dg-pp-vlv"><path class="dg-pp-vbody" d="${body}"/>` +
    (open ? `<path class="dg-pp-vbody dg-pp-vopen dg-a" style="${open}" d="${body}"/>` : opened ? `<path class="dg-pp-vbody dg-pp-vopen" d="${body}"/>` : "") +
    `</g>`
  );
}

/** 取っ手の向き (度)。閉じた取っ手は管と直角、開いた取っ手は管の向き。向きの決め方は弁の形と共に `pipe-valve.ts` が持つ */
export const leverAngle = (vertical: boolean, opened: boolean, under = false): number => valveLever(vertical, opened, under);

/**
 * トークンの箱。名前と、名前の下の小さな字 (`balanceOf`、Tracelyth #175) と、弁から箱へ上る軸。箱の中の値は値の札の描き方 (`write/draw.ts`) が描く。
 * 名前は関係者の名前と同じく `dg-sn` も持つ。`bare` を立てると箱の枠を描かず名前だけを描く (帳簿型の箱、Tracelyth #168)
 */
export function tokenBox(p: PipeParty, on: boolean, valveAt: Point | undefined, ctx: Ctx, shown: Shown[], attrs: string, bare = false): string {
  const cx = p.x + p.w / 2;
  const stem = valveAt ? `<line class="dg-pp-tstem" x1="${r1(cx)}" y1="${r1(valveAt[1] - P.bus.valveUp)}" x2="${r1(cx)}" y2="${r1(p.y + p.h / 2)}"/>` : "";
  const sub = p.sub ? write(ctx.ink, "dg-pp-tsub", p.sub.x, p.sub.base, p.sub.text, T.boxSub, shown) : "";
  return (
    `<g${attrs} class="dg-pp-tokv${on ? " dg-pp-on" : ""}">${stem}${bare ? "" : frame(ctx, "dg-pp-act", p, P.token.radius)}` +
    `${write(ctx.ink, "dg-sn dg-pp-actn", p.label.x, p.label.base, p.label.text, T.party, shown)}${sub}</g>`
  );
}

/** 帳簿型の囲みと、囲みの上の辺から張り出した所を 1 つの輪郭にする (Tracelyth #168)。角は半径 10 で丸める */
export function ledgerOutline(l: PipeLedger): string {
  const e = l.enclosure;
  const t = l.tab;
  // 張り出しが囲みの縁と揃う側は段を作らないので、重なる点と一直線の上の点を除く
  const raw: Point[] = [
    [e.x, e.y + e.h],
    [e.x, e.y],
    [t.x, e.y],
    [t.x, t.y],
    [t.x + t.w, t.y],
    [t.x + t.w, e.y],
    [e.x + e.w, e.y],
    [e.x + e.w, e.y + e.h],
  ];
  const pts = simplifyPath(raw);
  const r = 10;
  const at = (p: Point, q: Point, d: number): Point => {
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const k = Math.min(d, len / 2) / len;
    return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  };
  const parts = pts.map((p, i) => {
    const prev = pts[(i + pts.length - 1) % pts.length] as Point;
    const next = pts[(i + 1) % pts.length] as Point;
    const a = at(p, prev, r);
    const b = at(p, next, r);
    return `${i === 0 ? "M" : "L"} ${r1(a[0])} ${r1(a[1])} Q ${r1(p[0])} ${r1(p[1])} ${r1(b[0])} ${r1(b[1])}`;
  });
  return `${parts.join(" ")} Z`;
}

/** 点の並びの上の、始まりから `d` 進んだ所 */
export function pointAlong(points: readonly Point[], d: number): Point {
  let left = d;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= len || i === points.length - 1) {
      const k = len === 0 ? 0 : Math.min(1, left / len);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    left -= len;
  }
  return points[0] ?? [0, 0];
}

/**
 * 流れた分。流れなかった段は、管の空洞の太さの薄い跡 (`dg-pp-tpast`) で描き、取り消した分は桃色で描く。
 * `at` を渡すと、その時刻に流れの先が管の始まりから終わりへ進み、進んだ所の中を 2 本の筋が流れる (Tracelyth #168)。`attrs` は部品の印。
 * `plan` は流れの先が道の頭から進んだ割合 (0 から 1) の時刻の組。移す額の札と同じ時刻に角を通し、札を流れの先に載せる
 */
export function flow(f: PipeFlow, ctx: Ctx, attrs: string, at?: number, plan?: readonly (readonly [number, number])[]): string {
  const d = `M ${f.points.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(" L ")}`;
  const tone = `--pp-t:var(--pp-tone${f.tone})`;
  const head = `<g${attrs} class="dg-pp-trace dg-pp-trace-${f.state}" style="${tone};${cs(STATE_COLOR[f.state])}">`;
  if (at === undefined) return `${head}<path class="dg-pp-tpast" d="${d}"/></g>`;
  const id = `dg-stream-${++STREAM.n}`;
  const frames: Frame[] = plan
    ? [[0, { "stroke-dashoffset": 1 }], ...plan.map(([t, frac]): Frame => [t, { "stroke-dashoffset": +(1 - frac).toFixed(4) }]), [ctx.m.total, { "stroke-dashoffset": 0 }]]
    : [
        [0, { "stroke-dashoffset": 1 }],
        [at, { "stroke-dashoffset": 1 }, EASE.inOut],
        [Math.min(at + FLOW_MOVE.travel, ctx.m.total), { "stroke-dashoffset": 0 }],
        [ctx.m.total, { "stroke-dashoffset": 0 }],
      ];
  const reveal = ctx.m.kf(frames);
  const g = { m: ctx.m, t0: at, tEnd: Math.min(ctx.m.total, at + 8), w: 1.4 };
  const look = "--k:var(--pp-t);--w:1.4";
  return `${head}${maskOf(id, d, reveal)}<g mask="url(#${id})" style="${look}"><path class="dg-pp-mtrack" d="${d}"/>${dashMovers(d, g)}</g></g>`;
}

/** 点の並びの最後を `cut` だけ手前で止める。矢じりの先と線の端を重ねないため */
export function shortened(points: Point[], cut: number): Point[] {
  const out = points.map((p): Point => [p[0], p[1]]);
  const last = out[out.length - 1] as Point;
  const before = out[out.length - 2] as Point;
  const len = Math.hypot(last[0] - before[0], last[1] - before[1]) || 1;
  out[out.length - 1] = [last[0] - ((last[0] - before[0]) / len) * cut, last[1] - ((last[1] - before[1]) / len) * cut];
  return out;
}
