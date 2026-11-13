// @vitest-environment jsdom
/**
 * 図の線を手描きのペンの線で描く (#3643)。
 *
 * 描く時の指定 `line` に `pen` を渡すと、絵柄と字と図の地の枠を除く形 (箱の縁、線、矢印、段の番号の輪、commit の印、小さな札、枝の帯、囲み) を、
 * ゆるく揺れる 1 本の `path` で描く。線の端と折れ目と尖った角は元の位置に残し、揺れは線の形から決めるので、同じ図は何度描いても同じ形になる。
 * 線の描き方は色味と同じく描く時に選び、記法には書かない。選ばない時と `ruler` の時は今の定規の線で描く (step 2 で本人が選んだ)。
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { runCli } from "./export-support";
import { draw, type Player, type Rendered, type RenderOptions } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const EXAMPLE_DIRS = ["packages/dragon/examples", "packages/dragon/blocks/examples"].map((dir) => join(ROOT, dir));
const RECORDED = join(ROOT, "packages/dragon/test/fixtures/layout-breaks.json");

type Lang = "ja" | "en";
type Line = NonNullable<RenderOptions["line"]>;
type Point = [number, number];
type Break = Record<string, unknown>;

/** 絵柄の線の class。手描きの線でも揺らさない */
const GLYPHS = ["dg-gl", "dg-try-ng", "dg-env-in", "dg-done-ck", "dg-tree-cg", "dg-tm-pgl", "dg-tm-pcg", "dg-lb-glyph"];
/** 図の地の枠の class。図の紙にあたる面なので揺らさない */
const PAPER = ["dg-bg"];
/** 手描きの線では `path` に描き替える形の要素 */
const SHAPES = ["rect", "circle", "ellipse", "line", "polygon", "polyline"];
/** 形を描かず、切り抜きや模様の定義だけを持つ置き場 */
const DEFINITIONS = "defs, clipPath, mask, pattern, symbol, marker";

/** 記法の file を読む。読めなければ file を名指して落とす */
function readFile(file: string): { diagram: unknown; kind: string; lang: Lang } {
  const lang: Lang = file.endsWith(".en.dragon") ? "en" : "ja";
  const read = dragon.parseNotation(readFileSync(file, "utf8"), { lang });
  expect(read.ok, `${relative(ROOT, file)} を読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? { diagram: read.diagram, kind: read.diagram.kind, lang } : { diagram: {}, kind: "", lang };
}

/** 記法の図の種類の語。注釈と空の行を除いた最初の行の頭の語 */
const kindWord = (text: string): string =>
  text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "" && !line.startsWith("//"))
    ?.split(/\s/u)[0] ?? "";

interface Sample {
  file: string;
  diagram: unknown;
  lang: Lang;
  palette?: string;
}

/** 図の種類ごとに 1 つ選んだ日本語の見本。見本の置き場の名前の順で最初の物を選ぶ */
function samples(): Sample[] {
  const byKind = new Map<string, string>();
  for (const name of readdirSync(EXAMPLES).filter((f) => f.endsWith(".dragon") && !f.endsWith(".en.dragon")).sort()) {
    const word = kindWord(readFileSync(join(EXAMPLES, name), "utf8"));
    if (!byKind.has(word)) byKind.set(word, join(EXAMPLES, name));
  }
  const picked = [...byKind.values()].map((file) => {
    const read = readFile(file);
    return { file: relative(ROOT, file), diagram: read.diagram, lang: read.lang };
  });
  // 角を落とす色味 (arcade) では、箱と図の枠を path で描く。その path も揺らす
  const login = readFile(join(EXAMPLES, "login-check.dragon"));
  return [...picked, { file: "packages/dragon/examples/login-check.dragon (arcade)", diagram: login.diagram, lang: "ja", palette: "arcade" }];
}

/** 見本を線の描き方 `line` で描く。`line` を渡さない時は指定を書かずに描く */
function render(sample: { diagram: unknown; lang: Lang; palette?: string }, line?: Line): Rendered {
  return draw("renderDiagram")(sample.diagram, { lang: sample.lang, ...(sample.palette ? { palette: sample.palette } : {}), ...(line ? { line } : {}) });
}

const svgDoc = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");
const classed = (e: Element, names: readonly string[]): boolean => names.some((name) => e.classList.contains(name));

/** 描いた形と線。定義の置き場の中と、絵柄と図の地の枠を除き、描いた順に並べる */
function drawn(svg: string): Element[] {
  return [...svgDoc(svg).querySelectorAll([...SHAPES, "path"].join(","))].filter((e) => !e.closest(DEFINITIONS) && !classed(e, GLYPHS) && !classed(e, PAPER));
}

/** 絵柄の線。定義の置き場の中を除く */
function glyphs(svg: string): string[] {
  return [...svgDoc(svg).querySelectorAll("*")].filter((e) => !e.closest(DEFINITIONS) && classed(e, GLYPHS)).map((e) => e.outerHTML);
}

/** path の `d` を区切りごとに読む。各命令の終わりの点を順に並べ、曲線と弧を持つ区切りはまっすぐでない印を付ける */
function subpaths(d: string): { points: Point[]; closed: boolean; straight: boolean }[] {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gu) ?? [];
  const out: { points: Point[]; closed: boolean; straight: boolean }[] = [];
  let i = 0;
  let cmd = "";
  let cur: Point = [0, 0];
  let start: Point = [0, 0];
  const num = (): number => Number(tokens[i++]);
  const skip = (n: number): void => {
    i += n;
  };
  const last = (): { points: Point[]; closed: boolean; straight: boolean } => {
    const sub = out[out.length - 1];
    if (sub) return sub;
    const made = { points: [cur], closed: false, straight: true };
    out.push(made);
    return made;
  };
  while (i < tokens.length) {
    const token = tokens[i] ?? "";
    if (/^[A-Za-z]$/u.test(token)) {
      cmd = token;
      i++;
    }
    const rel = cmd === cmd.toLowerCase();
    const at = (x: number, y: number): Point => (rel ? [cur[0] + x, cur[1] + y] : [x, y]);
    const to = (p: Point, curved: boolean): void => {
      const sub = last();
      sub.points.push(p);
      if (curved) sub.straight = false;
      cur = p;
    };
    switch (cmd.toUpperCase()) {
      case "M": {
        const p = at(num(), num());
        out.push({ points: [p], closed: false, straight: true });
        cur = p;
        start = p;
        cmd = rel ? "l" : "L";
        break;
      }
      case "L":
        to(at(num(), num()), false);
        break;
      case "H": {
        const x = num();
        to([rel ? cur[0] + x : x, cur[1]], false);
        break;
      }
      case "V": {
        const y = num();
        to([cur[0], rel ? cur[1] + y : y], false);
        break;
      }
      case "C":
        skip(4);
        to(at(num(), num()), true);
        break;
      case "S":
      case "Q":
        skip(2);
        to(at(num(), num()), true);
        break;
      case "T":
        to(at(num(), num()), true);
        break;
      case "A":
        skip(5);
        to(at(num(), num()), true);
        break;
      case "Z":
        last().closed = true;
        cur = start;
        break;
      default:
        i++;
    }
  }
  return out;
}

const distance = (a: Point, b: Point): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const polyLength = (points: Point[], closed: boolean): number =>
  points.reduce((sum, p, i) => sum + (i === 0 ? 0 : distance(points[i - 1] as Point, p)), 0) + (closed && points.length > 1 ? distance(points[points.length - 1] as Point, points[0] as Point) : 0);
const num = (e: Element, name: string): number => Number(e.getAttribute(name) ?? "0");
const pointsOf = (e: Element): Point[] =>
  (e.getAttribute("points") ?? "")
    .trim()
    .split(/[\s,]+/u)
    .map(Number)
    .reduce<Point[]>((acc, v, i, all) => (i % 2 === 0 ? [...acc, [v, all[i + 1] ?? 0]] : acc), []);

/** 形の縁の長さ。曲線は終わりの点を結んだ長さで近づける */
function outlineLength(e: Element): number {
  switch (e.tagName) {
    case "rect":
      return 2 * (num(e, "width") + num(e, "height"));
    case "circle":
      return 2 * Math.PI * num(e, "r");
    case "ellipse":
      return Math.PI * (num(e, "rx") + num(e, "ry"));
    case "line":
      return distance([num(e, "x1"), num(e, "y1")], [num(e, "x2"), num(e, "y2")]);
    case "polygon":
      return polyLength(pointsOf(e), true);
    case "polyline":
      return polyLength(pointsOf(e), false);
    default:
      return subpaths(e.getAttribute("d") ?? "").reduce((sum, sub) => sum + polyLength(sub.points, sub.closed), 0);
  }
}

/** 形の縁の区切りごとの点。path は各命令の終わりの点、ほかの形は角と端の点 (輪は点を持たない) */
function outlineOf(e: Element): { points: Point[]; closed: boolean }[] {
  switch (e.tagName) {
    case "line":
      return [{ points: [[num(e, "x1"), num(e, "y1")], [num(e, "x2"), num(e, "y2")]], closed: false }];
    case "polygon":
      return [{ points: pointsOf(e), closed: true }];
    case "polyline":
      return [{ points: pointsOf(e), closed: false }];
    case "rect": {
      const [x, y, w, h] = [num(e, "x"), num(e, "y"), num(e, "width"), num(e, "height")];
      return [{ points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], closed: true }];
    }
    case "path":
      return subpaths(e.getAttribute("d") ?? "");
    default:
      return [];
  }
}

/**
 * 揺らしても元の位置に残る点 (線の端と折れ目と尖った角)。`index` は形の縁の何番目の区切りか。
 * 曲線と弧を持つ区切りと、角を丸めた四角と輪は、尖った角を持たないので数えない
 */
function keptPoints(e: Element): { index: number; points: Point[]; open: boolean }[] {
  if (e.tagName === "rect" && (num(e, "rx") > 0 || num(e, "ry") > 0)) return [];
  if (e.tagName === "path")
    return subpaths(e.getAttribute("d") ?? "").flatMap((sub, index) => (sub.straight && sub.points.length > 1 ? [{ index, points: sub.points, open: !sub.closed }] : []));
  return outlineOf(e).map((sub, index) => ({ index, points: sub.points, open: !sub.closed }));
}

interface Drawn extends Sample {
  ruler: Rendered;
  pen: Rendered;
  rulerShapes: Element[];
  penShapes: Element[];
}

/** 図の種類ごとの見本を定規の線と手描きの線で 1 度ずつ描いた物。件ごとに描き直すと 1 件の上限 (10 秒) に近づく */
let cache: Drawn[] = [];
const drawnSamples = (): Drawn[] => cache;

describe("手描きの線で描く (#3643)", () => {
  // 見本を読んで描くのは件の外の前処理で 1 度だけ済ませる
  beforeAll(() => {
    cache = samples().map((sample) => {
      const ruler = render(sample);
      const pen = render(sample, "pen");
      return { ...sample, ruler, pen, rulerShapes: drawn(ruler.svg), penShapes: drawn(pen.svg) };
    });
  });

  it("pen-line-wobbles-shapes", () => {
    const cases = drawnSamples();
    // 走査の空振りを避ける。図の種類は 15 を超える
    expect(cases.length, "図の種類ごとの見本の数").toBeGreaterThan(15);
    const left: string[] = [];
    const straight: string[] = [];
    for (const { file, rulerShapes: ruler, penShapes: pen } of cases) {
      expect(ruler.length, `${file} に描いた形が無い`).toBeGreaterThan(0);
      expect(pen.length, `${file} を手描きの線で描いた形の数が、定規の線で描いた形の数と違う`).toBe(ruler.length);
      for (const e of pen) if (SHAPES.includes(e.tagName)) left.push(`${file} の ${e.tagName}.${e.getAttribute("class") ?? ""}`);
      ruler.forEach((before, i) => {
        if (outlineLength(before) <= 12) return;
        const after = pen[i];
        const d = after?.getAttribute("d") ?? "";
        const same = before.tagName === "path" && d === before.getAttribute("d");
        if (after?.tagName !== "path" || !/C/u.test(d) || same) straight.push(`${file} の ${i} 番目の ${before.tagName}.${before.getAttribute("class") ?? ""}`);
      });
    }
    expect(left, "手描きの線で描いても path にならずに残った形").toEqual([]);
    expect(straight, "手描きの線で描いても揺れていない形").toEqual([]);
  });

  it("pen-line-keeps-layout-and-text", () => {
    const texts = (svg: string): string[] => [...svgDoc(svg).querySelectorAll("text")].map((t) => t.outerHTML);
    for (const { file, ruler, pen } of drawnSamples()) {
      expect(pen.layout, `${file} を手描きの線で描いた図の形`).toEqual(ruler.layout);
      const words = texts(ruler.svg);
      expect(words.length, `${file} に字が無い`).toBeGreaterThan(0);
      expect(texts(pen.svg), `${file} を手描きの線で描いた図の字`).toEqual(words);
    }
  });

  it("pen-line-is-deterministic", () => {
    for (const sample of drawnSamples()) expect(render(sample, "pen").svg, `${sample.file} を手描きの線で 2 回描いた図`).toBe(sample.pen.svg);
  });

  it("pen-line-keeps-ends-and-corners", () => {
    const moved: string[] = [];
    let checked = 0;
    for (const { file, rulerShapes: ruler, penShapes: pen } of drawnSamples()) {
      ruler.forEach((before, i) => {
        const after = pen[i] ? outlineOf(pen[i]) : [];
        const anchors = after.flatMap((sub) => sub.points);
        const name = `${file} の ${i} 番目の ${before.tagName}.${before.getAttribute("class") ?? ""}`;
        for (const kept of keptPoints(before)) {
          checked += kept.points.length;
          for (const p of kept.points) if (!anchors.some((a) => distance(a, p) < 0.05)) moved.push(`${name} の点 ${p.join(",")}`);
          if (!kept.open) continue;
          // 開いた線は、同じ番目の区切りの始めと終わりが元の端に在る
          const sub = after[kept.index]?.points ?? [];
          const [first, end] = [sub[0], sub[sub.length - 1]];
          const [a, b] = [kept.points[0] as Point, kept.points[kept.points.length - 1] as Point];
          if (!first || distance(first, a) >= 0.05) moved.push(`${name} の始めの端 ${a.join(",")}`);
          if (!end || distance(end, b) >= 0.05) moved.push(`${name} の終わりの端 ${b.join(",")}`);
        }
      });
    }
    expect(checked, "確かめた端と角の数").toBeGreaterThan(50);
    expect(moved, "手描きの線で元の位置から動いた端と角").toEqual([]);
  });

  it("pen-line-leaves-glyphs", () => {
    let seen = 0;
    for (const { file, ruler, pen } of drawnSamples()) {
      const before = glyphs(ruler.svg);
      seen += before.length;
      expect(glyphs(pen.svg), `${file} を手描きの線で描いた絵柄`).toEqual(before);
    }
    expect(seen, "見本に絵柄が無い").toBeGreaterThan(0);
  });
});

/** 崩れの検査の入口。線の描き方を受ける */
function checker(): (text: string, options: { lang: Lang; line?: Line }) => Break[] {
  const found = (dragon as unknown as { checkLayoutText?: (text: string, options: { lang: Lang; line?: Line }) => Break[] }).checkLayoutText;
  expect(found, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
  return found ?? (() => []);
}

/** `dir` の下の `.dragon` の file */
const dragonFiles = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith(".dragon") && statSync(join(dir, name)).isFile())
        .map((name) => join(dir, name))
    : [];

describe("手描きの線の崩れ (#3643)", () => {
  it("pen-line-parts-have-no-breaks", () => {
    const check = checker();
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const files = readdirSync(blocks).flatMap((name) => dragonFiles(join(blocks, name, "gallery")));
    // 走査の空振りを避ける。見本帳の図はブロックごとに日本語と英語の 2 枚ずつある
    expect(files.length, "部品の図を数えられない").toBeGreaterThan(20);
    const broken = files.flatMap((file) => check(readFileSync(file, "utf8"), { lang: file.includes(".en.") ? "en" : "ja", line: "pen" }).map((b) => `${relative(ROOT, file)}: ${JSON.stringify(b)}`));
    expect(broken, "手描きの線で描いた部品の図の崩れ").toEqual([]);
  });

  it("pen-line-examples-add-no-breaks", () => {
    const check = checker();
    const recorded = JSON.parse(readFileSync(RECORDED, "utf8")) as Record<string, Break[]>;
    const files = EXAMPLE_DIRS.flatMap(dragonFiles).sort();
    // 走査の空振りを避ける。見本は 2 つの置き場に 1 つ以上ずつある
    expect(files.length, "見本を数えられない").toBeGreaterThan(EXAMPLE_DIRS.length);
    const key = (b: Break): string => JSON.stringify(b);
    const grown = files.flatMap((file) => {
      const name = relative(ROOT, file);
      const known = new Set((recorded[name] ?? []).map(key));
      return check(readFileSync(file, "utf8"), { lang: file.includes(".en.") ? "en" : "ja", line: "pen" })
        .filter((b) => !known.has(key(b)))
        .map((b) => `${name}: ${key(b)}`);
    });
    expect(grown, "手描きの線で描くと一覧に無い崩れが見本に出る").toEqual([]);
  });
});

describe("手描きの線を選ぶ所 (#3643)", () => {
  const placed: Player[] = [];
  afterEach(() => {
    for (const player of placed.splice(0)) player.destroy();
    document.body.innerHTML = "";
  });

  /** 見本の JSON の原本 */
  const diagramOf = (name: string): Record<string, unknown> => JSON.parse(readFileSync(join(EXAMPLES, name), "utf8")) as Record<string, unknown>;

  it("player-draws-pen-line", () => {
    for (const view of ["fixed", "follow"] as const) {
      const host = document.createElement("div");
      document.body.appendChild(host);
      const player = draw("mountDiagram")(host, { ...diagramOf("ccip.json"), view }, { line: "pen", pausedAt: 0 });
      placed.push(player);
      const figure = host.querySelector('svg[data-dragon="figure"]');
      expect(figure?.getAttribute("data-view"), `${view} で置いた図の見せ方`).toBe(view);
      const boxes = [...(figure?.querySelectorAll(".dg-st") ?? [])];
      expect(boxes.length, `${view} で置いた図に箱が無い`).toBeGreaterThan(0);
      const ruled = boxes.filter((box) => box.tagName.toLowerCase() !== "path" || !/C/u.test(box.getAttribute("d") ?? "")).map((box) => box.tagName.toLowerCase());
      expect(ruled, `${view} で置いた図で手描きの線にならない箱`).toEqual([]);
    }
  });

  it("cli-export-draws-pen-line", async () => {
    const out = join(mkdtempSync(join(tmpdir(), "dragon-pen-")), "out");
    const ran = await runCli(["export", join(EXAMPLES, "oauth.json"), "--out", out, "--format", "html", "--line", "pen"]);
    expect(ran.code, `--line pen で書き出せない: ${ran.stderr}`).toBe(0);
    const written = existsSync(out) ? readdirSync(out).filter((file) => file.endsWith(".html")) : [];
    expect(written, "--line pen で HTML を書き出さない").toHaveLength(1);
    const html = readFileSync(join(out, written[0] ?? ""), "utf8");
    // 書き出した頁は、図を差し込む関数に描く時の指定を渡して描く
    const options = /DragonPlayer\.mountDiagram\([^;]*,(\{[^{}]*\})\);<\/script>/u.exec(html)?.[1];
    expect(options, "書き出した HTML に図を差し込む呼び出しが無い").toBeDefined();
    expect((JSON.parse(options ?? "{}") as { line?: string }).line, "書き出した HTML の図の線の描き方").toBe("pen");
  });

  it("cli-refuses-unknown-line", async () => {
    const out = join(mkdtempSync(join(tmpdir(), "dragon-pen-")), "out");
    const ran = await runCli(["export", join(EXAMPLES, "oauth.json"), "--out", out, "--format", "html", "--line", "crayon"]);
    expect(ran.code, "--line crayon の終わり方").toBe(2);
    for (const word of ["--line", "crayon", "ruler", "pen"]) expect(ran.stderr, `--line crayon の断りの文に ${word} が無い`).toContain(word);
    expect(existsSync(out) ? readdirSync(out) : [], "--line crayon で書いた file").toEqual([]);
  });
});

/** `text` の中で、`head` で始まる行。無ければ空 */
const lineOf = (text: string, head: string): string => text.split("\n").find((line) => line.startsWith(head)) ?? "";

describe("線の描き方を挙げる文書 (#3643)", () => {
  it("readme-lists-line-option", () => {
    const rows = [
      { where: "README.md の --line の行", line: lineOf(readFileSync(join(ROOT, "packages/dragon/README.md"), "utf8"), "| `--line <name>`") },
      { where: "README.ja.md の --line の行", line: lineOf(readFileSync(join(ROOT, "packages/dragon/README.ja.md"), "utf8"), "| `--line <名前>`") },
    ];
    for (const { where, line } of rows) {
      expect(line, `${where} が無い`).not.toBe("");
      for (const value of ["ruler", "pen"]) expect(line, `${where} が ${value} を挙げない`).toContain(`\`${value}\``);
    }
  });

  it("changelog-lists-pen-line", () => {
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) expect(changelogEntry(join(ROOT, file), 3643), `${file} の #3643 の項を持つ節に --line が無い`).toContain("`--line`");
  });
});
