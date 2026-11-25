/**
 * 場面のブロックの描き方 (#3878)。
 *
 * 場面ごとに、全ての場面に共通の段とその場面だけの段をつないだ図を組み、場面ごとの図を描く。
 * 同じ箱を全ての場面で同じ位置に描くため、箱の位置は場面ごとに並べ直さず、全ての場面の段を見た並べ方から取る。
 * 段で居場所が移る物を持たない種類 (手順の図) は、共通の段と場面の段を場面の順に全てつないだ図を 1 度だけ並べ、
 * 場面ごとにその場面の段の物だけを残して段の番号を付け直す (`union`)。
 * 段で居場所が移る物を持つ種類 (列の図、`carry`) は、場面ごとにその場面の段の後ろへほかの場面の段を足した図を並べ、足した段の物を外す。
 * 並べ方は場面の段を順に辿るので、ほかの場面の段の居場所がその場面に混ざらず、帯の幅と高さは全ての場面の段から決まる。
 *
 * 並べる見せ方では、共通の段の線を灰色、場面の段の線を場面の色で描き、場面が 2 つ以上の時は分かれる所の箱の左に縦の点線を引く。
 * 場面で通らない手順の図の箱は、今回は通らない道の先の箱と同じ点線の縁と薄い字にする。
 * 縦に並べた図 (`svg`) は場面ごとの図を、場面の名前と止まる理由の字と一緒に上から並べ、書き出しと止めて置く図が使う。
 * 再生の部品は場面ごとの図を場面の枠に並べて置く (`scene-player.ts`)。
 * この file は場面を書ける種類の描く部品の組だけが読み、最初に読む量に入れない
 */
import { placeNotes, takeNotes } from "../pop/draw";
import { partsOf } from "../../kinds/registry";
import type { Layout, SceneBox, SceneMark } from "../../layout/scene";
import { type ColorKey, FONT_VARS, LOOK, paletteVars, TYPE } from "../../look/values";
import type { DiagramModel, DiagramScene, Step } from "../../schema";
import type { NotationLang } from "../../words";
import { type DrawOptions, drawLaid, paletteOf, type Rendered, type RenderedScene } from "../../render/draw";
import { cssFont, esc } from "../../render/parts";
import { r1 } from "../../render/round";

const SC = LOOK.scene;

/** 並べた図の段を場面の図の段へ付け替える。場面に無い段は `undefined` */
type StepMap = (step: number) => number | undefined;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** 場面に無い段の物か。段の番号が負の物 (今回は通らない道の名前) は段の外の物で、外さない */
const dropped = (item: unknown, map: StepMap): boolean => isObject(item) && typeof item.step === "number" && item.step >= 0 && map(item.step) === undefined;

/**
 * 並べ方 `value` の、段の番号 (`step`、`until`、`steps`) を持つ物を場面の段へ付け替え、場面に無い段の物を外す。
 * 並びの中の物は並びから外し、欄に置いた物 (札が移る段) は欄ごと外す。段を持たない物 (箱と帯) はそのまま残す
 */
function project<T>(value: T, map: StepMap): T {
  if (Array.isArray(value)) return value.filter((item) => !dropped(item, map)).map((item) => project(item, map)) as T;
  if (!isObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (dropped(v, map)) continue;
    if ((key === "step" || key === "until") && typeof v === "number" && v >= 0) {
      // 後の段で入れ替える名前は、入れ替える段が場面に無ければ最後まで残す
      const mapped = map(v);
      if (mapped !== undefined) out[key] = mapped;
      continue;
    }
    if (key === "steps" && Array.isArray(v) && v.every((n) => typeof n === "number")) {
      out[key] = v.flatMap((n) => {
        const mapped = map(n);
        return mapped === undefined ? [] : [mapped];
      });
      continue;
    }
    out[key] = project(v, map);
  }
  return out as T;
}

/** 場面の最初の段で最初に名指した箱。線は送る側 (始まりの印から出る線は受ける側)、列の図の行は列 */
function forkBox(scene: DiagramScene): string | undefined {
  for (const event of scene.steps[0]?.events ?? []) {
    if (event.type === "edge") return event.from === "start" ? event.to : event.from;
    if ("box" in event && typeof event.box === "string") return event.box;
  }
  return undefined;
}

/**
 * 並べる見せ方の場面の図の印 (#3878)。共通の段の線を灰色、場面の段の線を場面の色にし、場面が 2 つ以上の時 (`forks`) は
 * 分かれる所の箱の左の端から `SC.fork` だけ左に、図の上から下まで縦の点線を引く。手順の図の場面で通らない箱は点線の縁と薄い字にする
 */
function marked(layout: Layout, scene: DiagramScene, common: number, color: ColorKey, forks: boolean): Layout {
  const edges = layout.edges.map((e) => ({ ...e, color: e.step < common ? SC.common : color }));
  const reached = new Set(edges.flatMap((e) => [e.from, e.to]));
  const boxes = layout.kind === "flow" ? layout.boxes.map((b): SceneBox => (reached.has(b.id) ? b : { ...b, off: true })) : layout.boxes;
  const id = forks ? forkBox(scene) : undefined;
  const lanes = (layout as { lanes?: SceneBox[] }).lanes ?? [];
  const box = id === undefined ? undefined : [...layout.boxes, ...lanes].find((b) => b.id === id);
  const fork = box ? { x: Math.max(LOOK.margin / 2, box.x - SC.fork), y1: LOOK.margin / 2, y2: layout.height - LOOK.margin / 2 } : undefined;
  const mark: SceneMark = { color, common, ...(fork ? { fork } : {}) };
  return { ...layout, edges, boxes, scene: mark };
}

/**
 * 場面ごとの並べ方。`carry` の種類は場面ごとに後ろへほかの場面の段を足して並べ、ほかの種類は全ての場面の段をつないで 1 度だけ並べる。
 * どちらも場面の段だけを残し、段の番号を場面の図の段に付け替える
 */
function sceneLayouts(lay: (steps: Step[]) => Layout, common: Step[], own: Step[][], carry: boolean): Layout[] {
  const c = common.length;
  if (carry) return own.map((steps, k) => project(lay([...common, ...steps, ...own.filter((_, j) => j !== k).flat()]), (s) => (s < c + steps.length ? s : undefined)));
  const union = lay([...common, ...own.flat()]);
  let at = c;
  return own.map((steps) => {
    const from = at;
    at += steps.length;
    return project(union, (s) => (s < c ? s : s >= from && s < from + steps.length ? c + s - from : undefined));
  });
}

/**
 * 場面ごとの図を、場面の名前と止まる理由の字と一緒に上から縦に並べた図。場面ごとの SVG は組 (`g`) に替えて、場面の名前の行の下に置く。
 * 場面の名前と止まる理由の字は箱の名前と同じ大きさ以上にし、箱の名前が読める枠では場面の名前と理由も読める
 */
function stackSvg(model: DiagramModel, scenes: RenderedScene[], options: DrawOptions): { svg: string; layout: Layout } {
  const first = scenes[0] as RenderedScene;
  const width = Math.max(...scenes.map((s) => s.layout.width));
  const palette = paletteOf({ ...options, palette: first.palette }, first.theme);
  const nameStyle = TYPE.boxName;
  const reasonStyle = TYPE.noteBody;
  let y = 0;
  const body = scenes
    .map((scene) => {
      const head = `<text class="dg-scene-n" x="${LOOK.margin}" y="${r1(y + SC.head - (SC.head - nameStyle.size) / 2)}">${esc(scene.name)}</text>`;
      const top = y + SC.head;
      const group = scene.svg
        .replace(/^<svg ([^>]*)>/u, (_, attrs: string) => `<g class="${/class="([^"]*)"/u.exec(attrs)?.[1] ?? "dg"}" data-dragon="scene" data-scene="${esc(scene.name)}" transform="translate(0 ${r1(top)})">`)
        .replace(/<\/svg>$/u, "</g>");
      y = top + scene.layout.height;
      const reason = scene.stop === undefined ? "" : `<text class="dg-scene-r" data-dragon="scene-stop" x="${LOOK.margin}" y="${r1(y + SC.reason - (SC.reason - reasonStyle.size) / 2)}">${esc(scene.stop)}</text>`;
      if (scene.stop !== undefined) y += SC.reason;
      y += SC.gap;
      return `${head}${group}${reason}`;
    })
    .join("");
  const height = Math.ceil(y - SC.gap);
  const id = /class="dg dg-([^"\s]+)/u.exec(first.svg)?.[1] ?? "scenes";
  const css = `.dg-sc-${id}{${FONT_VARS};${paletteVars(palette, first.theme)}}.dg-scene-n{${cssFont(nameStyle)};fill:var(--ink)}.dg-scene-r{${cssFont(reasonStyle)};fill:var(--ink2)}`;
  const w = Math.ceil(width);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-sc-${id}" viewBox="0 0 ${w} ${height}" width="${w}" height="${height}" role="img" aria-label="${esc(model.title)}" data-dragon="figure" data-view="fixed" data-scenes="${model.scenes?.show ?? "stack"}">` +
    `<style>${css}</style>${body}</svg>`;
  const layout: Layout = { kind: model.kind, width: w, height, regions: [], boxes: [], lifelines: [], edges: [], labels: [], actions: [], badges: [], paths: [], ends: [] };
  return { svg, layout };
}

/**
 * 場面を書いた図を、場面ごとの図と縦に並べた図に描く (#3878)。`carry` は段で居場所が移る物を持つ種類 (列の図) で、場面ごとに並べ直す。
 * 札で見せる図 (#3877) は、箱の説明を札へ移してから並べ、場面ごとの図の箱に印を置く
 */
export function renderScenes(given: DiagramModel, options: DrawOptions, lang: NotationLang, carry: boolean): Rendered {
  const { scenes, ...rest } = given;
  const list = scenes?.list ?? [];
  const parts = partsOf(given.kind, lang);
  if (!parts || list.length === 0) throw new Error(`${given.kind} cannot draw scenes`);
  const { diagram: plain, notes } = takeNotes(rest);
  const lay = (steps: Step[]): Layout => parts.layout({ ...plain, steps }, lang, options);
  const layouts = sceneLayouts(lay, plain.steps, list.map((s) => s.steps), carry);
  const stack = scenes?.show !== "pick";
  const common = plain.steps.length;
  const drawn = list.map((scene, k): RenderedScene => {
    const model: DiagramModel = { ...plain, steps: [...plain.steps, ...scene.steps] };
    const color: ColorKey = SC.colors[k % SC.colors.length] ?? "blue";
    const laid = layouts[k] as Layout;
    const shown = stack ? marked(laid, scene, common, color, list.length > 1) : laid;
    const placed = placeNotes(notes, shown.boxes);
    const layout = placed.length > 0 ? { ...shown, noteCards: placed } : shown;
    return { ...drawLaid(model, layout, options, lang), name: scene.name, ...(scene.stop !== undefined ? { stop: scene.stop } : {}), color, common };
  });
  const whole = stackSvg(given, drawn, options);
  // 縦に並べた図の段と時刻は、最も段の多い場面の物を持つ。書き出しが段を数える時に、全ての場面の段を数え切るため
  const longest = drawn.reduce((a, b) => (b.diagram.steps.length > a.diagram.steps.length ? b : a));
  const { name: _name, stop: _stop, color: _color, common: _common, ...base } = longest;
  return { ...base, svg: whole.svg, layout: whole.layout, scenes: drawn, sceneShow: scenes?.show ?? "stack" };
}
