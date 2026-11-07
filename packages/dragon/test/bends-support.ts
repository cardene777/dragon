/**
 * 線の曲がりと継ぎ目を確かめる検査が共に使う道具 (#3358)。
 *
 * 線の道筋 (`d`) を折れ目と曲がりの列に読み、曲がる角度を測る。
 * jsdom の `getComputedStyle` は SVG の `stroke-linejoin` を CSS の規則から引かないため、
 * 図の中の `<style>` の規則を読み、形に効いている線の継ぎ目と端を詳しさと順で求める。
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import { draw, type Theme } from "./render-support";

export const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
/** 確かめる見本。英語の見本は日本語の見本と同じ線を、字の言葉だけ替えて描くので外す (#3381) */
export const FILES = readdirSync(EXAMPLES)
  .filter((file) => file.endsWith(".json") && !file.endsWith(".en.json"))
  .sort();
export const THEMES: readonly Theme[] = ["light", "dark"];
/** 角を落とさない色味 */
export const OTHERS = ["clear", "paper", "night"] as const;
/** 角を落とす色味で直角にする曲がりの境 (度)。今の見本の折れ目は全て 90 度、点で区切った曲線の 1 つの曲がりは 28 度以下 */
export const SQUARE_FROM = 45;
/** 線の曲がりを丸める半径 (`LOOK.edge.bend`) */
export const BEND = 12;
/** 位置を 0.1 の位で丸めて描くため、比べる時に許す差 */
export const NEAR = 0.06;

/**
 * 絵柄の線の class。図の中の印 (絵柄、封の折り目、済みの印、木の札の印、時の旗) で、丸い継ぎのまま残す。
 * 入れ子の `<svg>` の中の線も絵柄として扱う
 */
export const GLYPHS = ["dg-gl", "dg-try-ng", "dg-env-in", "dg-done-ck", "dg-tree-cg", "dg-tm-pgl", "dg-tm-pcg"];

export type Point = [number, number];

/** 丸めた曲がり。`from` から `at` へ向かい、`at` を角の点にして `to` で終わる */
export interface Curve {
  from: Point;
  at: Point;
  to: Point;
  turn: number;
}

/** 直線どうしが交わる折れ目 */
export interface Corner {
  at: Point;
  turn: number;
}

export interface Line {
  cls: string;
  curves: Curve[];
  corners: Corner[];
}

/** 2 つの区間の向きの差 (度、0 から 180) */
export function turnOf(a: Point, b: Point, c: Point): number {
  const d = Math.abs(
    ((Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0])) * 180) / Math.PI,
  ) % 360;
  return d > 180 ? 360 - d : d;
}

export const near = (a: Point, b: Point): boolean =>
  Math.abs(a[0] - b[0]) < NEAR && Math.abs(a[1] - b[1]) < NEAR;

/**
 * 線の道筋を読む。絶対の M、L、Q だけで書いた道筋を、丸めた曲がりと、直線どうしが交わる折れ目に分ける。
 * ほかの命令を含む道筋 (角を落とした枠、弧) は線として読まず `undefined` を返す
 */
export function lineOf(d: string): Omit<Line, "cls"> | undefined {
  const tokens = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const points: { p: Point; by: "M" | "L" | "Q" }[] = [];
  const curves: Curve[] = [];
  let cmd = "";
  for (let i = 0; i < tokens.length; ) {
    const token = tokens[i] as string;
    if (/[A-Za-z]/.test(token)) {
      if (!["M", "L", "Q"].includes(token)) return undefined;
      cmd = token;
      i++;
      continue;
    }
    const n = (k: number): number => Number(tokens[i + k]);
    if (cmd === "M" || cmd === "L") {
      points.push({ p: [n(0), n(1)], by: cmd });
      i += 2;
    } else if (cmd === "Q") {
      const from = points[points.length - 1]?.p;
      if (!from) return undefined;
      const at: Point = [n(0), n(1)];
      const to: Point = [n(2), n(3)];
      curves.push({ from, at, to, turn: turnOf(from, at, to) });
      points.push({ p: to, by: "Q" });
      i += 4;
    } else return undefined;
  }
  const corners: Corner[] = [];
  for (let k = 1; k < points.length - 1; k++) {
    type At = { p: Point; by: string };
    const [a, b, c] = [points[k - 1] as At, points[k] as At, points[k + 1] as At];
    if (b.by !== "L" || c.by !== "L" || near(a.p, b.p) || near(b.p, c.p)) continue;
    const turn = turnOf(a.p, b.p, c.p);
    if (turn > 0.5) corners.push({ at: b.p, turn });
  }
  return { curves, corners };
}

/** 描いて読んだ SVG。同じ見本と色味と明暗を、検査ごとに描き直さない */
const figures = new Map<string, Element>();

export function figureOf(file: string, palette: string, theme: Theme): Element {
  const key = `${file} ${palette} ${theme}`;
  const seen = figures.get(key);
  if (seen) return seen;
  const diagram = JSON.parse(readFileSync(join(EXAMPLES, file), "utf8")) as Record<string, unknown>;
  const svg = draw("renderDiagram")(diagram, { palette, theme }).svg;
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  expect(doc.querySelector("parsererror"), `${file} の SVG を読めない`).toBeNull();
  figures.set(key, doc.documentElement);
  return doc.documentElement;
}

/** 絵柄の線か。入れ子の `<svg>` の中の線も絵柄にする */
export function isGlyph(el: Element, root: Element): boolean {
  if (GLYPHS.some((c) => el.classList.contains(c))) return true;
  for (let node = el.parentElement; node && node !== root; node = node.parentElement)
    if (node.localName === "svg") return true;
  return false;
}

/** 図の中の線 (class を持ち、M、L、Q だけで書いた道筋の path)。絵柄は除く */
export function linesOf(root: Element): Line[] {
  const out: Line[] = [];
  for (const el of root.querySelectorAll("path[class]")) {
    if (isGlyph(el, root)) continue;
    const line = lineOf(el.getAttribute("d") ?? "");
    if (line) out.push({ cls: el.getAttribute("class") ?? "", ...line });
  }
  return out;
}

/** 線の class ごとの、描いた順の線 */
export function byClass(lines: Line[]): Map<string, Line[]> {
  const out = new Map<string, Line[]>();
  for (const line of lines) out.set(line.cls, [...(out.get(line.cls) ?? []), line]);
  return out;
}

interface Rule {
  selectors: string[];
  decls: Record<string, string>;
  order: number;
}

/** CSS の文を規則の列に読む。`@keyframes` の塊は飛ばし、`@media` などの塊は中の規則を読む */
export function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  const walk = (text: string): void => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf("{", i);
      if (open < 0) return;
      const prelude = text.slice(i, open).trim();
      let depth = 1;
      let k = open + 1;
      for (; k < text.length && depth > 0; k++) {
        if (text[k] === "{") depth++;
        else if (text[k] === "}") depth--;
      }
      const body = text.slice(open + 1, k - 1);
      if (prelude.startsWith("@")) {
        if (!/^@(?:-[a-z]+-)?keyframes/u.test(prelude)) walk(body);
      } else {
        const decls: Record<string, string> = {};
        for (const part of body.split(";")) {
          const at = part.indexOf(":");
          if (at > 0) decls[part.slice(0, at).trim()] = part.slice(at + 1).trim();
        }
        rules.push({ selectors: prelude.split(",").map((s) => s.trim()), decls, order: rules.length });
      }
      i = k;
    }
  };
  walk(css);
  return rules;
}

/** 選び方の詳しさ。id、class と属性と疑似 class、要素の名前の順に重い */
function specificity(selector: string): number {
  const ids = selector.match(/#[\w-]+/g)?.length ?? 0;
  const classes = selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g)?.length ?? 0;
  const types = selector.replace(/\[[^\]]+\]|[#.:][\w-]+/g, " ").match(/[a-z][\w-]*/gi)?.length ?? 0;
  return ids * 10000 + classes * 100 + types;
}

type StrokeProp = "stroke-linejoin" | "stroke-linecap";

/** 規則の列と線の値の名前ごとに 1 度だけ用意する物。値を持つ選び方と詳しさ、style 属性を読む形、形ごとに求めた値の覚え */
interface StrokeLookup {
  picks: { selector: string; value: string; rank: number }[];
  inline: RegExp;
  seen: WeakMap<Element, string>;
}
const lookups = new WeakMap<Rule[], Map<StrokeProp, StrokeLookup>>();

function lookupOf(rules: Rule[], prop: StrokeProp): StrokeLookup {
  const byProp = lookups.get(rules) ?? new Map<StrokeProp, StrokeLookup>();
  lookups.set(rules, byProp);
  const known = byProp.get(prop);
  if (known) return known;
  const picks = rules.flatMap((rule) => {
    const value = rule.decls[prop];
    return value === undefined ? [] : rule.selectors.map((selector) => ({ selector, value, rank: specificity(selector) * 100000 + rule.order }));
  });
  const made = { picks, inline: new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([a-z-]+)`, "u"), seen: new WeakMap<Element, string>() };
  byProp.set(prop, made);
  return made;
}

/** 1 つの形が自分で持つ値。style 属性、CSS の規則 (詳しさと順で選ぶ)、表示の属性の順に見て、どれも無ければ `undefined` */
function ownStroke(node: Element, prop: StrokeProp, lookup: StrokeLookup): string | undefined {
  const inline = lookup.inline.exec(node.getAttribute("style") ?? "");
  if (inline) return inline[1];
  let best: { value: string; rank: number } | undefined;
  for (const { selector, value, rank } of lookup.picks) {
    let hit = false;
    try {
      hit = node.matches(selector);
    } catch {
      hit = false;
    }
    if (hit && (!best || rank >= best.rank)) best = { value, rank };
  }
  if (best) return best.value;
  // 空の属性は値を持たないとみなし、先祖へ進む
  return node.getAttribute(prop) || undefined;
}

/**
 * 形に効いている線の継ぎ目か端。形とその先祖を近い順に見て、style 属性、CSS の規則 (詳しさと順で選ぶ)、
 * 表示の属性の順に最初に見つかった値を使い、どこにも無ければ初期値 (`miter` と `butt`) にする。
 * 同じ図の形は先祖を分け合うため、形ごとに求めた値を覚え、先祖を何度も照らさない (#3472)。
 * 覚える前は 1 万個ほどの線ごとに先祖を辿って全ての規則を照らし、線の端の検査が混んだ機械で 10 秒の上限を超えた
 */
export function strokeOf(el: Element, prop: StrokeProp, rules: Rule[]): string {
  const lookup = lookupOf(rules, prop);
  const walked: Element[] = [];
  let value: string | undefined;
  for (let node: Element | null = el; node; node = node.parentElement) {
    const known = lookup.seen.get(node);
    if (known !== undefined) {
      value = known;
      break;
    }
    walked.push(node);
    value = ownStroke(node, prop, lookup);
    if (value !== undefined) break;
  }
  // 辿った形は、自分も途中の先祖も値を持たなかったので、見つけた値 (無ければ初期値) が効く
  const result = value ?? (prop === "stroke-linejoin" ? "miter" : "butt");
  for (const node of walked) lookup.seen.set(node, result);
  return result;
}

/** 図の中の `<style>` の規則 */
export const rulesIn = (root: Element): Rule[] =>
  rulesOf([...root.querySelectorAll("style")].map((s) => s.textContent ?? "").join("\n"));

/** 線を引く形 (path、線、折れ線、多角形) */
export const STROKES = "path, line, polyline, polygon";

/**
 * 図の線の形の指紋。class を持つ path の道筋と、効いている継ぎ目と端を描いた順に並べた文の sha256。
 * 角を落とさない色味の線が、線の形を変える前と同じかを比べる (`fixtures/bends-before-arcade.json`)
 */
export function linePrint(root: Element): string {
  const rules = rulesIn(root);
  const rows = [...root.querySelectorAll("path[class]")].map(
    (el) =>
      `${el.getAttribute("class")}\t${el.getAttribute("d")}\t${strokeOf(el, "stroke-linejoin", rules)}\t${strokeOf(el, "stroke-linecap", rules)}`,
  );
  return createHash("sha256").update(rows.join("\n")).digest("hex");
}
