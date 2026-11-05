/**
 * 脇道の描き方 (#3163、#3171、#3347)。
 *
 * 通らない道は点線で道と向きだけを見せ、運ぶ物を走らせない。どの段も辿り着かない状態は点線の縁の薄い箱にし、
 * 図の右上の脇道の囲みに入れる。囲みは左上に名前を、その下に添え書きを 1 行ずつ置く。
 * 道の形と曲がり角の丸め (`pathOf`) と矢じり (`arrowHead`) は、線と同じ下請けを使う。
 */
import type { SceneBox, ScenePath, SceneSide } from "../../layout/scene";
import { type ColorKey, type Corner, LOOK, TYPE } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import { ALWAYS, type Ink, type Trace } from "../../render/ink";
import { arrowHead, esc, pathOf, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { drawsIcon, glyph } from "../icon/draw";

/** 状態遷移図の通らない道。点線で道と向きだけを見せ、運ぶ物を走らせない */
export function path(p: ScenePath, color: ColorKey, ink: Ink[], traces: Trace[], corner: Corner): string {
  traces.push({ from: p.from, to: p.to, points: p.points, shown: ALWAYS });
  const sans = p.label?.family === "sans";
  const label = p.label
    ? write(ink, `dg-path-t${sans ? " dg-path-tj" : ""}`, p.label.x + LOOK.label.padX, p.label.y + p.label.h / 2 + LOOK.baseline.label, p.label.text, sans ? TYPE.labelJa : TYPE.label)
    : "";
  return `<g data-path="${esc(`${p.from}->${p.to}`)}" style="${cs(color)}"><path class="dg-path" d="${pathOf(p.points, corner)}"/><path class="dg-path-h" d="${arrowHead(p.points)}"/>${label}</g>`;
}

/** 状態遷移図の脇道の囲み。左上に囲みの名前を、その下に添え書きを 1 行ずつ置く。囲みの角は色味の角の形 (`corner`) で描く */
export function side(s: SceneSide, color: ColorKey, ink: Ink[], corner: Corner): string {
  const { pad } = LOOK.state.side;
  const title = s.y + pad + TYPE.regionName.size;
  const notes = s.notes.map((note, k) => write(ink, "dg-side-n", s.x + pad, title + LOOK.region.line * (k + 1), note, TYPE.regionNote)).join("");
  return (
    `<g style="${cs(color)}">${frameShape(corner, ' class="dg-side"', { x: s.x + 0.5, y: s.y + 0.5, w: s.w - 1, h: s.h - 1 }, `<rect class="dg-side" x="${r1(s.x + 0.5)}" y="${r1(s.y + 0.5)}" width="${r1(s.w - 1)}" height="${r1(s.h - 1)}" rx="${LOOK.region.radius}"/>`)}` +
    `${write(ink, "dg-side-t", s.x + pad, title, s.title, TYPE.regionName)}${notes}</g>`
  );
}

/**
 * 状態遷移図の、どの段も辿り着かない状態。点線の縁の札で、絵柄を左に、名前と下の字を右に並べる (#3171)。光らず、字も書き換わらない。
 * 札の縁と絵柄の角は色味の角の形 (`corner`) で描く
 */
export function ghostCard(box: SceneBox, ink: Ink[], corner: Corner): string {
  const { icon, iconRadius, iconScale, radius } = LOOK.box;
  const G = LOOK.state.ghost;
  const ix = box.x + G.pad + icon / 2;
  const tx = box.x + G.pad + icon + G.gap;
  const mark = drawsIcon(box.icon)
    ? `<rect class="dg-ic" x="${r1(ix - icon / 2)}" y="${r1(box.cy - icon / 2)}" width="${icon}" height="${icon}" rx="${partRadius(corner, iconRadius)}"/>${glyph(box.icon, ix, box.cy, iconScale)}`
    : "";
  const nameY = box.sub ? G.nameY : LOOK.baseline.mark;
  const frame = { x: box.x, y: box.y, w: box.w, h: box.h };
  const sub = box.sub ? write(ink, "dg-ss", tx, box.cy + G.subY, box.sub, TYPE.boxSub, ALWAYS, "start") : "";
  return (
    `<g data-ghost="${esc(box.id)}" style="${cs(box.color)}">${frameShape(corner, ' class="dg-ghost"', frame, `<rect class="dg-ghost" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="${box.h}" rx="${radius}"/>`)}` +
    `${mark}${write(ink, "dg-sn", tx, box.cy + nameY, box.name, TYPE.boxName, ALWAYS, "start")}${sub}</g>`
  );
}
