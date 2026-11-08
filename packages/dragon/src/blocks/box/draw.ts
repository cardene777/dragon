/**
 * 箱の描き方 (#3345)。
 *
 * 箱は地と縁の札に名前と下の小さな字を置き、絵柄を持つ箱は名前の上に絵柄を置く。
 * 動く段は縁に色を付け、外側に淡い光を足す。下の小さな字は起きたこと (`note` と `act`) に合わせて書き換わる。
 * 寄って追う時系列図では、窓の上端に名前と下の字の 2 段にした頭の箱を貼る (#3120)。
 * 配管の図の関係者は、丸の名札 (`avatar`) か Contract の箱 (`cabinet`) で描く (#3398)。
 * 配管の図の値の表 (`look/pipe.ts`) は後から読む塊にあるので、この 2 つは寸法と字の形を呼ぶ側から受け取り、表を読まない。
 */
import type { PipeParty } from "../../kinds/pipe/layout";
import { textWidth } from "../../layout/measure";
import type { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import type { Point, Rect, SceneBox } from "../../layout/scene";
import { LOOK, MOTION, TYPE } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import { ALWAYS, type Ink, type Shown } from "../../render/ink";
import type { Motion } from "../../render/motion";
import { flattenPath } from "../../render/outline";
import { activeKf, type Ctx, esc, r1, rangeKf, write } from "../../render/parts";
import type { Span } from "../../timeline";
import { heldIn } from "../carry/timing";
import { cs } from "../color/draw";
import { type UserBlock, userBoxOf } from "../../user-blocks";
import { drawsIcon, glyph } from "../icon/draw";

/** 箱の名前 (`name`) と下の字 (`sub`) の基準線の、箱の真ん中からの下がり */
export interface BoxTextY {
  name: number;
  sub: number;
}

/**
 * 図の箱の名前と下の字の基準線を、箱の真ん中からどれだけ下げるか (#3307)。
 * 名前の上の段 (アイコンか置き場の枠) を使う箱が 1 つでもある図は、その段の下に名前を置く高さで全ての箱の名前を揃える。
 * 1 つも無い図は名前を箱の真ん中に置く。置き場の枠はアイコンの無い箱にも同じ段に出るので、真ん中に寄せると名前が枠に重なる。
 * 下の字は名前から同じ間を空けて置き、名前を真ん中に上げた図で下の字だけが下の縁に残らないようにする (#3309)
 */
export const boxTextY = (boxes: readonly { icon?: string; slot?: Rect }[]): BoxTextY =>
  boxes.some((b) => drawsIcon(b.icon) || b.slot !== undefined)
    ? { name: LOOK.box.nameY, sub: LOOK.box.subY }
    : { name: LOOK.box.nameMid, sub: LOOK.box.subMid };

/** 箱の下の小さな字の移り変わり。`[時刻, 字, class]` の並びで、最初は元の字。 */
export type SubChange = [number, string, string];

/**
 * 箱の下の小さな字。基準線を `y` に置き、起きたことに合わせて書き換わる。
 * `right` を渡すと、箱の真ん中でなく字の右端を `right` に揃える (列の図の列の右上の字、#3239)
 */
export function subLines(
  box: SceneBox,
  m: Motion,
  changes: SubChange[],
  y: number,
  ink?: Ink[],
  right?: number,
): string {
  const seq: SubChange[] = [[0, box.sub ?? "", "dg-ss"], ...changes];
  return seq
    .map(([t, text, cls], k) => {
      const next = seq[k + 1]?.[0];
      const anim =
        k === 0
          ? next === undefined
            ? ""
            : m.until(next - MOTION.untilFade)
          : next === undefined
            ? m.rise(t)
            : m.rise(t, next - MOTION.untilFade);
      if (text === "") return "";
      const shown: Shown[] = [
        [k === 0 ? 0 : t, next === undefined ? Number.POSITIVE_INFINITY : next - MOTION.untilFade],
      ];
      const style = cls === "dg-ss" ? TYPE.boxSub : TYPE.boxSubStrong;
      const drawn =
        right === undefined
          ? write(ink, cls, box.cx, y, text, style, shown, "middle")
          : write(ink, cls, right - textWidth(text, style), y, text, style, shown);
      return `<g${anim ? ` class="dg-a" style="${anim}"` : ""}>${drawn}</g>`;
    })
    .join("");
}

/**
 * 使う人が足した箱のブロックの形 (#3399)。箱の枠 (`x`、`y`、`w`、`h`) に収め、地と縁と光は今の箱と同じ class で描く。
 * path は 100 四方に描いた形を枠の大きさへ伸ばし、縁の太さは伸ばさない。形を持たない定義は今の箱の形で描く
 */
function userShape(added: UserBlock, cls: string, extra: string, x: number, y: number, w: number, h: number): string | undefined {
  const attrs = ` class="${cls}"${extra}`;
  const points = (list: Point[]): string => `<polygon${attrs} points="${list.map(([px, py]) => `${r1(px)},${r1(py)}`).join(" ")}"/>`;
  if (added.path !== undefined) {
    const { tx, ty, sx, sy } = pathFit(x, y, w, h);
    return `<path${attrs} d="${added.path}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})" vector-effect="non-scaling-stroke"/>`;
  }
  switch (added.shape) {
    case "round":
      return `<rect${attrs} x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h / 2)}"/>`;
    case "circle":
      return `<ellipse${attrs} cx="${r1(x + w / 2)}" cy="${r1(y + h / 2)}" rx="${r1(w / 2)}" ry="${r1(h / 2)}"/>`;
    case "cylinder": {
      const ry = cylinderCap(h);
      return `<path${attrs} d="${cylinderBody(x, y, w, h)} M ${r1(x)} ${r1(y + ry)} A ${r1(w / 2)} ${r1(ry)} 0 0 0 ${r1(x + w)} ${r1(y + ry)}"/>`;
    }
    case "diamond":
      return points(diamondPoints(x, y, w, h));
    case "hexagon":
      return points(hexagonPoints(x, y, w, h));
    default:
      return undefined;
  }
}

/** path の形を箱の枠に収める、移す量と伸ばす割合。100 四方に描いた形を枠の大きさへ伸ばす */
const pathFit = (x: number, y: number, w: number, h: number): { tx: number; ty: number; sx: number; sy: number } => ({ tx: r1(x), ty: r1(y), sx: r1(w / 100), sy: r1(h / 100) });
/** 円柱の上と下の楕円の縦の半径 */
const cylinderCap = (h: number): number => Math.min(h / 6, 10);
/** 円柱の外形。上の楕円の上半分、右の縁、下の楕円の下半分、左の縁を回る。上の楕円の下半分は外形に入らない */
function cylinderBody(x: number, y: number, w: number, h: number): string {
  const ry = cylinderCap(h);
  const rx = w / 2;
  return `M ${r1(x)} ${r1(y + ry)} A ${r1(rx)} ${r1(ry)} 0 0 1 ${r1(x + w)} ${r1(y + ry)} V ${r1(y + h - ry)} A ${r1(rx)} ${r1(ry)} 0 0 1 ${r1(x)} ${r1(y + h - ry)} Z`;
}
const diamondPoints = (x: number, y: number, w: number, h: number): Point[] => [
  [x + w / 2, y],
  [x + w, y + h / 2],
  [x + w / 2, y + h],
  [x, y + h / 2],
];
function hexagonPoints(x: number, y: number, w: number, h: number): Point[] {
  const k = Math.min(h / 2, w / 4);
  return [
    [x + k, y],
    [x + w - k, y],
    [x + w, y + h / 2],
    [x + w - k, y + h],
    [x + k, y + h],
    [x, y + h / 2],
  ];
}

/**
 * 足した箱のブロックの箱が見せる形の輪郭 (#3484)。描く形 (`userShape`) と同じ寸法から作る。
 * 崩れの確かめが、硬貨の枠と字と番号の丸を、箱の四角でなく見えている形と比べるために使う。形を持たない箱は `undefined`
 */
export function boxOutline(box: SceneBox): Point[][] | undefined {
  const added = userBoxOf(box.id);
  if (!added) return undefined;
  const { x, y, w, h } = box;
  if (added.path !== undefined) {
    const { tx, ty, sx, sy } = pathFit(x, y, w, h);
    return flattenPath(added.path).map((ring) => ring.map(([px, py]): Point => [tx + px * sx, ty + py * sy]));
  }
  switch (added.shape) {
    case "round": {
      // SVG の rect は縦の半径を書かないと横の半径と同じにし、横は幅の半分まで、縦は高さの半分までに詰める
      const rx = Math.min(h / 2, w / 2);
      const ry = h / 2;
      return flattenPath(
        `M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry} V ${y + h - ry} A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry} V ${y + ry} A ${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`,
      );
    }
    case "circle":
      return flattenPath(`M ${x} ${y + h / 2} A ${w / 2} ${h / 2} 0 1 1 ${x + w} ${y + h / 2} A ${w / 2} ${h / 2} 0 1 1 ${x} ${y + h / 2} Z`);
    case "cylinder":
      return flattenPath(cylinderBody(x, y, w, h));
    case "diamond":
      return [diamondPoints(x, y, w, h)];
    case "hexagon":
      return [hexagonPoints(x, y, w, h)];
    default:
      return undefined;
  }
}

/** 箱の地と縁。上端 `y` から高さ `h`。動く段 (`act` の間) は縁に色を付け、外側に淡い光を足す。 */
function cardFrame(box: SceneBox, ctx: Ctx, act: string | undefined, y: number, h: number): string {
  const added = userBoxOf(box.id);
  const rect = (cls: string, extra = ""): string =>
    (added ? userShape(added, cls, extra, box.x, y, box.w, h) : undefined) ??
    frameShape(
      ctx.corner,
      ` class="${cls}"${extra}`,
      { x: box.x, y, w: box.w, h },
      `<rect class="${cls}" x="${r1(box.x)}" y="${r1(y)}" width="${r1(box.w)}" height="${h}" rx="${LOOK.box.radius}"${extra}/>`,
    );
  return `${act ? `<g class="dg-a" style="${act}">${rect("dg-halo")}</g>` : ""}${rect("dg-st", ` ${ctx.sh}`)}${act ? `<g class="dg-a" style="${act}">${rect("dg-on")}</g>` : ""}`;
}

/**
 * 箱。動く段は縁に色を付け、外側に淡い光を足す。下の小さな字は起きたことに合わせて書き換わる。
 * `lit` を渡すと、動く段ではなくその間だけ光らせる (状態遷移図の、運ぶ物が乗っている状態)。
 */
export function card(
  box: SceneBox,
  ctx: Ctx,
  on: number[],
  changes: SubChange[],
  lit?: Span[],
): string {
  const { icon, iconRadius, iconScale, iconY } = LOOK.box;
  const inked = ctx.ink.length;
  const subs = subLines(box, ctx.m, changes, box.cy + ctx.boxText.sub, ctx.ink);
  const act = lit
    ? lit.length > 0
      ? rangeKf(
          ctx.m,
          lit.map((s) => [s.start, s.end]),
        )
      : undefined
    : on.length > 0
      ? activeKf(ctx, on)
      : undefined;
  // 置き場を持つ箱は絵柄を左へ寄せ、右に置き場の場所を空ける (#3176)。
  // 点線の枠は運ぶ物が座っている間だけ見せ、空の間は消す。最後の段に空の四角が残ると作りかけに見えるため (#3518)
  const ix = box.iconX ?? box.cx;
  const slot = box.slot
    ? `<g class="dg-a" style="${rangeKf(ctx.m, heldIn(box.slot, ctx.seats))}"><rect class="dg-slot" x="${r1(box.slot.x)}" y="${r1(box.slot.y)}" width="${r1(box.slot.w)}" height="${r1(box.slot.h)}" rx="${partRadius(ctx.corner, LOOK.slot.radius)}"/></g>`
    : "";
  let mark = "";
  if (drawsIcon(box.icon)) {
    const rect = { x: ix - icon / 2, y: box.cy + iconY - icon / 2, w: icon, h: icon };
    ctx.ink.push({
      text: `${box.name} の絵柄`,
      rect,
      shown: ALWAYS,
      boxed: true,
      part: { kind: "icon", box: box.name },
    });
    mark = `<rect class="dg-ic" x="${r1(rect.x)}" y="${r1(rect.y)}" width="${icon}" height="${icon}" rx="${partRadius(ctx.corner, iconRadius)}"/>${glyph(box.icon, ix, box.cy + iconY, iconScale)}`;
  }
  // 足した箱のブロックの箱は、その定義の色の役で描く (#3399)
  const markup =
    `<g style="${cs(userBoxOf(box.id)?.color ?? box.color)}">${cardFrame(box, ctx, act, box.y, box.h)}` +
    `${slot}${mark}${write(ctx.ink, "dg-sn", box.cx, box.cy + ctx.boxText.name, box.name, TYPE.boxName, ALWAYS, "middle")}${subs}</g>`;
  // 箱の中に書いた字 (名前、下の字、絵柄) に箱の名札を付け、崩れの確かめが箱の形の外へはみ出す字を探せるようにする (#3484)
  for (const ink of ctx.ink.slice(inked)) ink.box = box.id;
  return markup;
}

/**
 * 寄って追う時系列図の窓の上端に貼る頭の箱 (#3120)。図の頭の箱と同じ横の位置と縁で、アイコンを外して名前と下の字の 2 段にする。
 * 携帯の幅では窓が低く、図の頭の箱のままでは窓の高さの 3 割を頭の列が取るため。
 */
export function headCard(box: SceneBox, ctx: Ctx, on: number[], changes: SubChange[]): string {
  const { pad, h, nameY, subY } = LOOK.follow.head;
  const subs = subLines(box, ctx.m, changes, pad + subY);
  const act = on.length > 0 ? activeKf(ctx, on) : undefined;
  return `<g style="${cs(box.color)}">${cardFrame(box, ctx, act, pad, h)}<text class="dg-sn" x="${r1(box.cx)}" y="${r1(pad + nameY)}" text-anchor="middle">${esc(box.name)}</text>${subs}</g>`;
}

/** 配管の図の名札を描く時に呼ぶ側が渡す、配管の図の値の表 (#3398) */
export interface PipeLook {
  P: typeof PIPE_LOOK;
  T: typeof PIPE_TYPE;
}

/**
 * 配管の図の丸の名札 (#3398)。送り手と、呼ばれない口座を描く。値の色から呼び出しの色へ移る丸に頭文字を書き、丸の下に名前を書く。
 * その段の出来事に出る者 (`on`) は外に光の輪を出す。`attrs` は部品の印。
 * 名前は他の図の箱の名前と同じ `dg-sn` も持つ。置いた頁は図の名前をこの印で読み、図を縮める下限の字の大きさもこの字で測る
 */
export function avatar(p: PipeParty, on: boolean, ctx: Ctx, shown: Shown[], attrs: string, look: PipeLook, fill: string): string {
  const { P, T } = look;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  return (
    `<g${attrs} class="dg-pp-who${on ? " dg-pp-on" : ""}"><circle class="dg-pp-halo" cx="${r1(cx)}" cy="${r1(cy)}" r="${P.avatar.halo}"/>` +
    `<circle class="dg-pp-avu" fill="${fill}" cx="${r1(cx)}" cy="${r1(cy)}" r="${P.avatar.r}"/>` +
    `<text class="dg-pp-glyph" x="${r1(cx)}" y="${r1(cy + P.avatar.initialY)}" text-anchor="middle">${esc(([...p.name][0] ?? "").toUpperCase())}</text>` +
    `${write(ctx.ink, "dg-sn dg-pp-pname", p.label.x, p.label.base, p.label.text, T.party, shown)}</g>`
  );
}

/**
 * 配管の図の Contract の箱 (#3398)。左に頭文字 (形を書いた関係者はその形) を、右に名前を書く。
 * 一番上の行の箱は大きく、下の行の箱は小さく描く。2 つ以上の槽を持つ箱 (`pool`) は縁に値の色を混ぜる。その段の出来事に出る者 (`on`) は縁を呼び出しの色にする
 */
export function cabinet(p: PipeParty, on: boolean, pool: boolean, ctx: Ctx, shown: Shown[], attrs: string, look: PipeLook): string {
  const { P, T } = look;
  const C = P.cabinet;
  const cy = p.y + p.h / 2;
  const mx = p.x + C.mark;
  const mark = drawsIcon(p.icon)
    ? glyph(p.icon, mx, cy, C.icon, "dg-pp-cgl")
    : `<text class="dg-pp-cabg" x="${r1(mx)}" y="${r1(cy + T.mark.size * 0.35)}" text-anchor="middle">${esc(([...p.name][0] ?? "").toUpperCase())}</text>`;
  return (
    `<g${attrs} class="dg-pp-cab${on ? " dg-pp-on" : ""}${pool ? " dg-pp-pool" : ""}">` +
    frameShape(ctx.corner, ' class="dg-pp-cabr"', p, `<rect class="dg-pp-cabr" x="${r1(p.x)}" y="${r1(p.y)}" width="${r1(p.w)}" height="${r1(p.h)}" rx="${C.radius}"/>`) +
    `${mark}${write(ctx.ink, "dg-sn dg-pp-cabn", p.label.x, p.label.base, p.label.text, T.party, shown)}</g>`
  );
}
