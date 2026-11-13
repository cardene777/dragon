/**
 * 書き手が持つ色付きの SVG を、印のブロックの定義の行に変える (#3633)。命令 `dragon icon <file.svg>` だけが読み、描く束には入れない。
 *
 * 定義はデータだけにするので、SVG の中の 1 色で塗った形だけを `paint` の行に変え、元の表示の枠 (`viewBox`) を `view` の行に残す。
 * 変えるのは `path` と `rect` と `circle` と `ellipse` と `polygon` と `polyline` で、`g` の塗りの色と塗り方の決まりは中の形が継ぐ。
 * 1 色で塗っていない形 (グラデーション、模様、埋め込んだ画像、切り抜き、字) と、変形 (`transform`) と線 (`stroke`) を持つ要素は、
 * 色や形を勝手に変えずに断り、どの要素かを名指す。`title` と `desc` と `metadata` は描かないので読み飛ばし、`defs` の中の形は描かれないので変えない
 */
import { PAINT_COLOR, PAINT_PATH_MAX } from "./blocks/icon/paint";
import { isUserPath, type UserPaint } from "./user-blocks";

/** 変えられなかった理由。`element` は断った要素の名前、`value` は変えられなかった値 */
export type SvgIconRefusal =
  | { reason: "not-svg" }
  | { reason: "no-view" }
  | { reason: "empty" }
  | { reason: "unsupported"; element: string }
  | { reason: "transform"; element: string }
  | { reason: "stroke"; element: string }
  | { reason: "color"; element: string; value: string }
  | { reason: "path"; element: string };

export type SvgIcon = { ok: true; view: [number, number, number, number]; paints: UserPaint[] } | { ok: false; refusal: SvgIconRefusal };

/** 読み飛ばす要素。描かない説明の要素で、中身も読まない */
const SKIPPED = new Set(["title", "desc", "metadata"]);
/** 中の形を継いで読む要素 */
const GROUPS = new Set(["svg", "g", "defs"]);
/** 塗った形に変える要素 */
const SHAPES = new Set(["path", "rect", "circle", "ellipse", "polygon", "polyline"]);
/** 塗りの色の名前のうち、16 進の色に直せる物 */
const NAMED: Readonly<Record<string, string>> = { black: "#000000", white: "#FFFFFF" };

interface Tag {
  name: string;
  attrs: Record<string, string>;
  close: boolean;
  empty: boolean;
}

/** SVG の字を要素の頭と尻の並びにする。注釈と処理の命令と文書の型の宣言と字は読まない */
function tagsOf(text: string): Tag[] {
  const tags: Tag[] = [];
  const body = text.replace(/<!--[\s\S]*?-->/gu, "").replace(/<\?[\s\S]*?\?>/gu, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/gu, "").replace(/<!DOCTYPE[^>]*>/giu, "");
  for (const m of body.matchAll(/<(\/?)([A-Za-z][\w:.-]*)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/gu)) {
    const attrs: Record<string, string> = {};
    for (const a of (m[3] ?? "").matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu)) attrs[a[1] ?? ""] = a[2] ?? a[3] ?? "";
    tags.push({ name: m[2] ?? "", attrs, close: m[1] === "/", empty: m[4] === "/" });
  }
  return tags;
}

/** 属性か `style` に書いた性質 `key` の値 */
function propOf(attrs: Record<string, string>, key: string): string | undefined {
  const styled = new RegExp(`(?:^|;)\\s*${key}\\s*:\\s*([^;]+)`, "u").exec(attrs.style ?? "");
  return (styled?.[1] ?? attrs[key])?.trim();
}

/** 数を短く書く。小数 3 桁まで */
const num = (v: number): string => String(Math.round(v * 1000) / 1000);

/** 属性 `key` の数。無ければ `fallback` */
const numOf = (attrs: Record<string, string>, key: string, fallback = 0): number => {
  const v = Number.parseFloat(attrs[key] ?? "");
  return Number.isFinite(v) ? v : fallback;
};

/** 要素の形を path の字にする */
function shapePath(name: string, a: Record<string, string>): string | undefined {
  if (name === "path") return a.d;
  if (name === "rect") {
    const [x, y, w, h] = [numOf(a, "x"), numOf(a, "y"), numOf(a, "width"), numOf(a, "height")];
    const rx = Math.min(numOf(a, "rx", numOf(a, "ry")), w / 2);
    const ry = Math.min(numOf(a, "ry", rx), h / 2);
    if (rx <= 0 || ry <= 0) return `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}z`;
    const arc = (dx: number, dy: number): string => `a${num(rx)} ${num(ry)} 0 0 1 ${num(dx)} ${num(dy)}`;
    return `M${num(x + rx)} ${num(y)}h${num(w - 2 * rx)}${arc(rx, ry)}v${num(h - 2 * ry)}${arc(-rx, ry)}h${num(-(w - 2 * rx))}${arc(-rx, -ry)}v${num(-(h - 2 * ry))}${arc(rx, -ry)}z`;
  }
  if (name === "circle" || name === "ellipse") {
    const [cx, cy] = [numOf(a, "cx"), numOf(a, "cy")];
    const rx = name === "circle" ? numOf(a, "r") : numOf(a, "rx");
    const ry = name === "circle" ? rx : numOf(a, "ry");
    const arc = (dx: number): string => `a${num(rx)} ${num(ry)} 0 1 0 ${num(dx)} 0`;
    return `M${num(cx - rx)} ${num(cy)}${arc(2 * rx)}${arc(-2 * rx)}z`;
  }
  const points = (a.points ?? "").trim().split(/[\s,]+/u).map(Number);
  if (points.length < 4 || points.some((v) => !Number.isFinite(v))) return undefined;
  const pairs = Array.from({ length: Math.floor(points.length / 2) }, (_, i) => `${num(points[i * 2] ?? 0)} ${num(points[i * 2 + 1] ?? 0)}`);
  return `M${pairs.join("L")}z`;
}

/** 塗りの色を `#` と 16 進の色にする。直せない色は `undefined` */
function hexOf(value: string): string | undefined {
  if (PAINT_COLOR.test(value)) return value;
  const named = NAMED[value.toLowerCase()];
  if (named) return named;
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/u.exec(value);
  if (!rgb) return undefined;
  return `#${[rgb[1], rgb[2], rgb[3]].map((c) => Math.min(255, Number(c)).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** 線を持つか。`stroke` が無いか `none` か、太さが 0 なら持たない */
const stroked = (a: Record<string, string>, inherited: boolean): boolean => {
  const stroke = propOf(a, "stroke");
  const width = propOf(a, "stroke-width");
  const has = stroke === undefined ? inherited : stroke !== "none";
  return has && (width === undefined || Number.parseFloat(width) !== 0);
};

/** 書き手が持つ SVG の字を、色付きの絵柄の表示の枠と形の並びにする */
export function svgIcon(text: string): SvgIcon {
  const refuse = (refusal: SvgIconRefusal): SvgIcon => ({ ok: false, refusal });
  const tags = tagsOf(text);
  const root = tags.find((t) => !t.close && t.name === "svg");
  if (!root) return refuse({ reason: "not-svg" });
  const box = (root.attrs.viewBox ?? "").trim().split(/[\s,]+/u).map(Number);
  const view: [number, number, number, number] | undefined =
    box.length === 4 && box.every(Number.isFinite) ? [box[0] ?? 0, box[1] ?? 0, box[2] ?? 0, box[3] ?? 0] : root.attrs.width && root.attrs.height ? [0, 0, numOf(root.attrs, "width"), numOf(root.attrs, "height")] : undefined;
  if (!view || !(view[2] > 0) || !(view[3] > 0)) return refuse({ reason: "no-view" });

  /** 包む要素から継ぐ塗りの色と塗り方の決まりと線 */
  const stack: { fill: string | undefined; rule: string | undefined; stroke: boolean; name: string }[] = [];
  const paints: UserPaint[] = [];
  let skip = 0;
  for (const tag of tags.slice(tags.indexOf(root))) {
    if (tag.close) {
      if (skip > 0) skip -= 1;
      else stack.pop();
      continue;
    }
    if (skip > 0 || SKIPPED.has(tag.name)) {
      if (!tag.empty) skip += 1;
      continue;
    }
    const parent = stack.at(-1) ?? { fill: undefined, rule: undefined, stroke: false, name: "" };
    const { name, attrs } = tag;
    if (!GROUPS.has(name) && !SHAPES.has(name)) return refuse({ reason: "unsupported", element: name });
    if (attrs.transform !== undefined && name !== "svg") return refuse({ reason: "transform", element: name });
    const fill = propOf(attrs, "fill") ?? parent.fill;
    const rule = propOf(attrs, "fill-rule") ?? parent.rule;
    const stroke = stroked(attrs, parent.stroke);
    // 定義の置き場 (`defs`) の中の形は、使う要素 (`use`) を受けないので描かれない。中の 1 色でない塗りは上で断る
    const hidden = stack.some((s) => s.name === "defs");
    if (!tag.empty) stack.push({ fill, rule, stroke, name });
    if (!SHAPES.has(name) || hidden) continue;
    if (stroke) return refuse({ reason: "stroke", element: name });
    if (fill === "none") continue;
    const color = hexOf(fill ?? "#000000");
    if (color === undefined) return refuse({ reason: "color", element: name, value: fill ?? "" });
    const path = shapePath(name, attrs)?.trim();
    if (path === undefined || !isUserPath(path, PAINT_PATH_MAX)) return refuse({ reason: "path", element: name });
    paints.push({ color, ...(rule === "evenodd" ? { rule: "evenodd" as const } : {}), path });
  }
  if (paints.length === 0) return refuse({ reason: "empty" });
  return { ok: true, view, paints };
}

/** ブロックの名前の頭の `+` の後の字を、file の名前から作る。英小文字と数字と `-` にし、英小文字で始める */
export function iconNameOf(file: string): string {
  const base = (file.split(/[\\/]/u).at(-1) ?? "").replace(/\.svg$/iu, "").toLowerCase();
  const slug = base.replace(/[^a-z0-9-]+/gu, "-").replace(/-+/gu, "-").replace(/^-|-$/gu, "");
  return `+${/^[a-z]/u.test(slug) ? slug : `icon-${slug || "x"}`}`;
}

/** 色付きの絵柄の定義の行。`blocks 1` から `end` まで */
export function iconDefinition(name: string, icon: { view: readonly number[]; paints: readonly UserPaint[] }): string {
  const lines = ["blocks 1", `block ${name}`, "  base icon", `  view ${icon.view.map(num).join(" ")}`];
  for (const p of icon.paints) lines.push(`  paint ${p.color}${p.rule ? ` ${p.rule}` : ""} "${p.path}"`);
  lines.push("end");
  return lines.join("\n");
}
