/**
 * 手描きの線で描いた図の色 (#3643)。
 *
 * 手描きの線は箱の縁や線を `path` に描き替える。図の CSS には要素の名前で当てる規則 (`.dg-tg rect`) が在り、
 * 描き替えた形にその規則が届かないと、札の塗りが黒くなる (試作で起きた)。
 * 色はブラウザが CSS を当てた後の値で決まるので、Chromium で開いて、定規の線で描いた図と形ごとに比べる。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { beforeAll, describe, expect, it } from "vitest";
import { fileChromium } from "./page-needs";
import { draw, type Rendered, type RenderOptions } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");

type Lang = "ja" | "en";
type Line = NonNullable<RenderOptions["line"]>;

/** 絵柄の線と図の地の枠の class。手描きの線でも描き替えない */
const KEPT = ["dg-gl", "dg-try-ng", "dg-env-in", "dg-done-ck", "dg-tree-cg", "dg-tm-pgl", "dg-tm-pcg", "dg-lb-glyph", "dg-bg"];
/** 形を描く要素 */
const SHAPES = "rect, circle, ellipse, line, polygon, polyline, path";
/** 形を描かず、切り抜きや模様の定義だけを持つ置き場 */
const DEFINITIONS = "defs, clipPath, mask, pattern, symbol, marker";

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
  palette?: string;
}

function readSample(file: string, palette?: string): Sample {
  const read = dragon.parseNotation(readFileSync(file, "utf8"), { lang: "ja" });
  expect(read.ok, `${relative(ROOT, file)} を読めない`).toBe(true);
  return { file: `${relative(ROOT, file)}${palette ? ` (${palette})` : ""}`, diagram: read.ok ? read.diagram : {}, ...(palette ? { palette } : {}) };
}

/** 図の種類ごとに 1 つ選んだ日本語の見本と、角を落とす色味 (arcade) で描くログインの見本 */
function samples(): Sample[] {
  const byKind = new Map<string, string>();
  for (const name of readdirSync(EXAMPLES).filter((f) => f.endsWith(".dragon") && !f.endsWith(".en.dragon")).sort()) {
    const word = kindWord(readFileSync(join(EXAMPLES, name), "utf8"));
    if (!byKind.has(word)) byKind.set(word, join(EXAMPLES, name));
  }
  return [...[...byKind.values()].map((file) => readSample(file)), readSample(join(EXAMPLES, "login-check.dragon"), "arcade")];
}

const render = (sample: Sample, line?: Line): Rendered =>
  draw("renderDiagram")(sample.diagram, { lang: "ja" as Lang, ...(sample.palette ? { palette: sample.palette } : {}), ...(line ? { line } : {}) });

interface Painted {
  tag: string;
  name: string;
  fill: string;
  stroke: string;
  width: string;
  dash: string;
}

interface Drawn {
  file: string;
  ruler: Rendered;
  pen: Rendered;
}

/** 描いた図を全部 1 つの頁に並べて開き、最後の段の止め絵で止めて、図ごとに形の CSS を当てた後の塗りと線を読む */
async function painted(figures: Rendered[]): Promise<Painted[][]> {
  const context = await (await fileChromium()).newContext({ viewport: { width: 1200, height: 900 } });
  try {
    const page = await context.newPage();
    await page.setContent(`<!doctype html><body style="margin:0">${figures.map((f) => `<section>${f.svg}</section>`).join("")}</body>`);
    return await page.evaluate(
      ({ stills, shapes, definitions, kept }) =>
        [...document.querySelectorAll("body > section")].map((section, i) => {
          const figure = section.querySelector("svg");
          figure?.style.setProperty("--at", String(stills[i] ?? 0));
          figure?.style.setProperty("--play", "paused");
          return [...section.querySelectorAll(shapes)]
            .filter((e) => !e.closest(definitions) && !kept.some((name) => e.classList.contains(name)))
            .map((e) => {
              const style = getComputedStyle(e);
              return {
                tag: e.tagName,
                name: e.getAttribute("class") ?? "",
                // `line` は面を持たないので塗りは描かれない。描き替えた `path` の塗りと比べるため、描かれない塗りを `none` に揃える
                fill: e.tagName === "line" ? "none" : style.fill,
                stroke: style.stroke,
                width: style.strokeWidth,
                dash: style.strokeDasharray,
              };
            });
        }),
      { stills: figures.map((f) => f.timeline.stills[f.timeline.stills.length - 1] ?? 0), shapes: SHAPES, definitions: DEFINITIONS, kept: KEPT },
    );
  } finally {
    await context.close();
  }
}

describe("手描きの線の色 (#3643)", () => {
  let cases: Drawn[] = [];
  // 見本を読んで描くのは件の外の前処理で済ませる
  beforeAll(() => {
    cases = samples().map((sample) => ({ file: sample.file, ruler: render(sample), pen: render(sample, "pen") }));
  });

  it("pen-line-keeps-colors", async () => {
    // 走査の空振りを避ける。図の種類は 15 を超える
    expect(cases.length, "図の種類ごとの見本の数").toBeGreaterThan(15);
    // 定規の線と手描きの線の図は、同じ図の名前の class を持ちうるので別の頁で開く
    const rulers = await painted(cases.map((c) => c.ruler));
    const pens = await painted(cases.map((c) => c.pen));
    const differ: string[] = [];
    let compared = 0;
    cases.forEach(({ file }, k) => {
      const ruler = rulers[k] ?? [];
      const pen = pens[k] ?? [];
      expect(ruler.length, `${file} に描いた形が無い`).toBeGreaterThan(0);
      expect(pen.length, `${file} を手描きの線で描いた形の数が、定規の線で描いた形の数と違う`).toBe(ruler.length);
      ruler.forEach((before, i) => {
        const after = pen[i];
        compared++;
        for (const key of ["fill", "stroke", "width", "dash"] as const) {
          if (after?.[key] !== before[key]) differ.push(`${file} の ${i} 番目の ${before.tag}.${before.name} の ${key}: ${before[key]} → ${after?.[key]}`);
        }
      });
    });
    expect(compared, "比べた形の数").toBeGreaterThan(200);
    expect(differ, "手描きの線で描くと塗りか線の色か太さが変わった形").toEqual([]);
  });
});
