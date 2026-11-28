/**
 * 場面を選ぶ見た目の選べる図 (`try` の `[shape: scenes]`、#3873) の描き方。
 *
 * 広い幅は時系列図と同じ部品で描く。物は箱 (`dg-st`) にして点線の生存線 (`dg-ll`) を下ろし、やり取りは送り手の色の矢印に
 * 番号の丸と名前を添える。済んだやり取りは矢印を薄く、名前を札を外した灰の字にし、今のやり取り (`data-now`) は番号の丸を塗り、
 * 名前を色の札に入れ、両端の物の箱 (`data-on`) を色の縁と淡い光で示す。狭い幅は物の名前を色の点の付いた札にし、やり取りを
 * 番号の丸と中身と「送り手 → 受け手」の札にして縦に積む。
 * 今のやり取りの印は属性だけで切り替えるので、再生の部品 (`try-scenes-player.ts`) は描き直さずに印を移せる。
 * 置き場所は並べ方 (`kinds/try/layout.ts` の `layoutScenes`) が決め、寸法は値の表 (`look/values.ts` と `look/scenes.ts`) を読む
 */
import { cs } from "../blocks/color/draw";
import { lifeline } from "../blocks/lifeline/draw";
import type { SceneLanePlaced, SceneRowPlaced, ScenesPlaced, SceneText } from "../kinds/try/layout";
import { textBox } from "../layout/measure";
import { labelStyle, type Rect } from "../layout/scene";
import { SCENES_LOOK, SCENES_TYPE } from "../look/scenes";
import { LOOK, type TextStyle, TYPE } from "../look/values";
import { frameShape, partRadius } from "./corner";
import { ALWAYS } from "./ink";
import { arrowHead, type Ctx, cssFont as font, cssMix as mix, esc, r1 } from "./parts";

const S = LOOK.stroke;
const X = LOOK.mix;
const K = SCENES_LOOK.tall.card;

/** 場面の図の見た目の規則。場面の図の SVG にだけ書く */
export const SCENES_CSS = [
  ".dg-scl .dg-halo,.dg-scl .dg-on{display:none}",
  ".dg-scl[data-on] .dg-halo,.dg-scl[data-on] .dg-on{display:inline}",
  `.dg-sc-ln{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round}`,
  `.dg-sc-hd{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-scr:not([data-now]) .dg-sc-ln,.dg-scr:not([data-now]) .dg-sc-hd{opacity:${SCENES_LOOK.past}}`,
  ".dg-sc-gr{fill:var(--bg);stroke:none}",
  `.dg-sc-pill{display:none;fill:${mix(X.cap)};stroke:${mix(X.capEdge, "transparent")}}`,
  ".dg-scr[data-now] .dg-sc-pill{display:inline}",
  ".dg-scr[data-now] .dg-sc-gr{display:none}",
  `.dg-sc-nb{fill:var(--surf);stroke:var(--hair)}`,
  `.dg-scr[data-now] .dg-sc-nb{fill:${mix(X.cap)};stroke:${mix(X.capEdge, "transparent")}}`,
  `.dg-sc-tx{${font(TYPE.labelJa)};fill:var(--mute);fill-opacity:${LOOK.state.pastLabel}}`,
  `.dg-sc-txm{${font(TYPE.label)}}`,
  ".dg-scr[data-now] .dg-sc-tx{fill:var(--ct);fill-opacity:1}",
  `.dg-sc-b circle{fill:${mix(X.badgePast)};stroke:${mix(X.badgePastEdge, "transparent")};stroke-width:${S.hair}}`,
  `.dg-sc-b text{${font(TYPE.badge)};fill:var(--ct)}`,
  ".dg-scr[data-now] .dg-sc-b circle,.dg-scc[data-now] .dg-sc-b circle{fill:var(--c);stroke:none}",
  ".dg-scr[data-now] .dg-sc-b text,.dg-scc[data-now] .dg-sc-b text{fill:var(--on-c)}",
  ".dg-scp rect{fill:var(--surf);stroke:var(--hair)}",
  ".dg-scp circle{fill:var(--c)}",
  `.dg-scp text{${font(SCENES_TYPE.pill)};fill:var(--ink)}`,
  ".dg-sc-card{fill:var(--surf);stroke:var(--hair)}",
  `.dg-scc[data-now] .dg-sc-card{stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-sc-cn{${font(SCENES_TYPE.card)};fill:var(--ink)}`,
  `.dg-sc-cr{${font(SCENES_TYPE.route)};fill:var(--mute)}`,
  `.dg-sca-h{${font(SCENES_TYPE.answerHead)};fill:var(--ct)}`,
  `.dg-sca-w{${font(SCENES_TYPE.answerWhy)};fill:var(--ink)}`,
].join("");

const rectOf = (
  cls: string,
  r: { x: number; y: number; w: number; h: number },
  radius: number,
  extra = "",
): string =>
  `<rect class="${cls}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}" rx="${radius}"${extra}/>`;

/** 字の 1 行を描き、重なりの確かめのために記録する。`boxed` は札の地の上の字 */
function line(
  ctx: Ctx,
  cls: string,
  t: SceneText,
  style: TextStyle,
  anchor: "start" | "middle",
  boxed: boolean,
): string {
  ctx.ink.push({
    text: t.text,
    rect: textBox(t.text, t.x, t.y, style, anchor),
    shown: ALWAYS,
    ...(boxed ? { boxed: true } : {}),
  });
  return `<text class="${cls}" x="${r1(t.x)}" y="${r1(t.y)}"${anchor === "middle" ? ' text-anchor="middle"' : ""}>${esc(t.text)}</text>`;
}

/** 番号の丸。丸と番号の字を 1 つの組にし、番号の字だけを字に持つ */
const badge = (row: SceneRowPlaced): string =>
  `<g class="dg-sc-b dg-popc" data-scene-badge="${row.n}"><circle cx="${r1(row.badge[0])}" cy="${r1(row.badge[1])}" r="${LOOK.badge.r}"/>` +
  `<text x="${r1(row.badge[0])}" y="${r1(row.badge[1] + LOOK.baseline.badge)}" text-anchor="middle">${row.n}</text></g>`;

/** やり取りの組の属性。送り手と受け手と送り手の色を持ち、再生の部品と確かめがこの属性で読む */
const rowAttrs = (row: SceneRowPlaced, cls: string, now: boolean): string =>
  ` class="${cls}" data-scene-row="${esc(row.id)}" data-from="${esc(row.from)}" data-to="${esc(row.to)}" data-color="${row.color}" style="${cs(row.color)}"${now ? " data-now" : ""}`;

/** 広い幅の物。時系列図の箱と同じ地と縁で、今のやり取りの両端の物だけ色の縁と淡い光を出す。名前の札の四角を組の最初の四角にする */
function wideLane(lane: SceneLanePlaced, ctx: Ctx, on: boolean): string {
  const shape = (cls: string, box: Rect, radius: number, extra = ""): string =>
    frameShape(ctx.corner, ` class="${cls}"${extra}`, box, rectOf(cls, box, radius, extra));
  // 淡い光は箱の後ろに敷く時系列図の箱と同じく箱の外にだけ見せるので、光の太さの半分だけ外へ広げた縁に引く
  const out = S.halo / 2;
  const halo = { x: lane.box.x - out, y: lane.box.y - out, w: lane.box.w + out * 2, h: lane.box.h + out * 2 };
  return (
    `<g class="dg-scl" data-scene-lane="${esc(lane.name)}" data-color="${lane.color}" style="${cs(lane.color)}"${on ? " data-on" : ""}>` +
    `${shape("dg-st", lane.box, LOOK.box.radius, ` ${ctx.sh}`)}${shape("dg-halo", halo, LOOK.box.radius + out)}${shape("dg-on", lane.box, LOOK.box.radius)}` +
    `${line(ctx, "dg-sn", lane.label, TYPE.boxName, "middle", true)}</g>`
  );
}

/** 広い幅のやり取り。矢印は送り手の色の線に点を流した形で、名前は済んだら灰の字、今は色の札に入れる。注記は生存線の上の札 */
function wideRow(row: SceneRowPlaced, ctx: Ctx, now: boolean): string {
  const style = labelStyle(row.lines.map((l) => l.text).join(""));
  const cls = style.family === "mono" ? "dg-sc-tx dg-sc-txm" : "dg-sc-tx";
  const texts = row.lines.map((t) => line(ctx, cls, t, style, "middle", true)).join("");
  const radius = partRadius(ctx.corner, LOOK.label.radius);
  if (row.note || !row.arrow)
    return `<g${rowAttrs(row, "dg-scr", now)}>${rectOf("dg-sc-nb", row.box, partRadius(ctx.corner, LOOK.action.radius))}${badge(row)}${texts}</g>`;
  const { x0, x1, y } = row.arrow;
  const d = `M ${r1(x0)} ${r1(y)} L ${r1(x1)} ${r1(y)}`;
  const head = arrowHead([
    [x0, y],
    [x1, y],
  ]);
  return (
    `<g${rowAttrs(row, "dg-scr", now)}>` +
    `<path class="dg-sc-ln" pathLength="1" stroke-dasharray="1 2" d="${d}"/><path class="dg-flow" d="${d}"/><path class="dg-sc-hd" d="${head}"/>` +
    `${rectOf("dg-sc-gr", row.box, radius)}${rectOf("dg-sc-pill", row.box, radius)}${texts}${badge(row)}</g>`
  );
}

/** 狭い幅の物の名前の札。色の点と名前を札に入れ、札の四角を組の最初の四角にする */
function tallLane(lane: SceneLanePlaced, ctx: Ctx): string {
  const dot = lane.dot ?? [lane.box.x, lane.box.y];
  return (
    `<g class="dg-scp" data-scene-lane="${esc(lane.name)}" data-color="${lane.color}" style="${cs(lane.color)}">` +
    `${rectOf("dg-scp-r", lane.box, partRadius(ctx.corner, lane.box.h / 2))}<circle cx="${r1(dot[0])}" cy="${r1(dot[1])}" r="${SCENES_LOOK.tall.pill.dot}"/>` +
    `${line(ctx, "dg-scp-t", lane.label, SCENES_TYPE.pill, "start", true)}</g>`
  );
}

/** 狭い幅のやり取りの札。左に番号の丸、右に中身の行と「送り手 → 受け手」の行を書く */
function tallRow(row: SceneRowPlaced, ctx: Ctx, now: boolean): string {
  const texts = row.lines
    .map((t) => line(ctx, "dg-sc-cn", t, SCENES_TYPE.card, "start", true))
    .join("");
  const route = row.route ? line(ctx, "dg-sc-cr", row.route, SCENES_TYPE.route, "start", true) : "";
  return `<g${rowAttrs(row, "dg-scc", now)}>${rectOf("dg-sc-card", row.box, partRadius(ctx.corner, K.radius))}${badge(row)}${texts}${route}</g>`;
}

/** 書き出しの止め絵の答え。答えの一文を答えの色で、理由を地の字で、図の左の余白から書く */
function answerOf(placed: ScenesPlaced, ctx: Ctx): string {
  const answer = placed.answer;
  if (!answer) return "";
  const head = answer.head
    .map((t) => line(ctx, "dg-sca-h", t, SCENES_TYPE.answerHead, "start", false))
    .join("");
  const why = answer.why
    .map((t) => line(ctx, "dg-sca-w", t, SCENES_TYPE.answerWhy, "start", false))
    .join("");
  return `<g class="dg-sca" data-scene-answer-figure style="${cs("green")}">${head}${why}</g>`;
}

/**
 * 場面の図を図の層ごとに描く。`now` は今のやり取りの番号 (0 から数える)。渡さなければ最後のやり取りを今のやり取りにする (書き出しの止め絵)。
 * 生存線を地の層に、物を箱の層に、やり取りと答えを上の層に置く
 */
export function drawScenes(
  placed: ScenesPlaced,
  ctx: Ctx,
  now = placed.rows.length - 1,
): { base: string; lit: string; node: string; top: string; css: string } {
  const current = placed.rows[now];
  const lit = new Set(current ? [current.from, current.to] : []);
  if (placed.arrangement === "tall")
    return {
      base: "",
      lit: "",
      node: placed.lanes.map((lane) => tallLane(lane, ctx)).join(""),
      top:
        placed.rows.map((row, k) => tallRow(row, ctx, k === now)).join("") + answerOf(placed, ctx),
      css: SCENES_CSS,
    };
  const life = placed.life;
  return {
    base: life ? placed.lanes.map((lane) => lifeline(lane.cx, life.y1, life.y2)).join("") : "",
    lit: "",
    node: placed.lanes.map((lane) => wideLane(lane, ctx, lit.has(lane.name))).join(""),
    top: placed.rows.map((row, k) => wideRow(row, ctx, k === now)).join("") + answerOf(placed, ctx),
    css: SCENES_CSS,
  };
}
