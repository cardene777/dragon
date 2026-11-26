/**
 * `follow-zoom.test.ts` の重い仕事を、1 回の実行の準備の段で済ませる (#3871、`test-support/prepare-setup.ts`)。
 *
 * 見本の置き場の直下の全ての記法の見本と、課題の 3 つの図を、幅 360 と 390 の枠で寄って追う形に描き、
 * 窓の中身を動かす動き (窓を切り抜く四角の中の最初の `g.dg-a`) の keyframes から、窓の倍率の最小を読む。
 * 窓は keyframes の点の間を寄るので、倍率の最小は点のどれかに在る。
 * 見せ方を選ぶ `chooseView` がその幅で `follow` を返さない見本は、寄って追う窓を持たないので読まない。
 * 窓の中身を動かす動きを見つけられない絵は、読めたことにせず名前を挙げて落とす。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import "./all-kinds";
import { ISSUE_CASES } from "./follow-zoom-cases";
import { DEFAULT_PALETTE } from "../src/look/values";
import { parseNotation } from "../src/parser";
import { followSvg, renderDiagram } from "../src/render/draw";
import { chooseView } from "../src/view";
import type { NotationLang } from "../src/words";

/** 見本の置き場 */
const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 窓を置く枠の幅 */
export const WIDTHS: readonly number[] = [360, 390];

/** 1 つの図を 1 つの幅で描いた時の、窓の倍率の最小 */
export interface Zoomed {
  /** 見本の file の名前か、課題の図の名前 */
  name: string;
  width: number;
  kind: string;
  /** 窓の中身の倍率の最小 */
  least: number;
}

/** 寄って追う形の絵 `svg` の、窓の中身を動かす動きの倍率の全て */
export function cameraScales(svg: string, name: string): number[] {
  const camera =
    /<g clip-path="url\(#dg-vp-[^"]*\)"><rect class="dg-vp-bg"[^>]*\/><g class="dg-a" style="animation-name:([\w-]+)/u.exec(
      svg,
    );
  if (!camera) throw new Error(`${name} の絵に窓の中身を動かす動きが無い`);
  const body = new RegExp(`@keyframes ${camera[1]}\\{((?:[^{}]*\\{[^{}]*\\})*)\\}`, "u").exec(svg);
  if (!body) throw new Error(`${name} の絵に窓の動き (${camera[1]}) の keyframes が無い`);
  const scales = [...(body[1] as string).matchAll(/scale\(([\d.]+)\)/gu)].map((m) => Number(m[1]));
  if (scales.length === 0) throw new Error(`${name} の窓の動きに倍率が無い`);
  return scales;
}

/** 記法 `text` を幅 `width` の枠で寄って追う形に描いた時の倍率の最小。寄って追う形にならない時は `undefined` */
function zoomOf(name: string, text: string, lang: NotationLang, width: number): Zoomed | undefined {
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`${name} を読めない`);
  const rendered = renderDiagram(parsed.diagram, { lang, width });
  if (chooseView(rendered, width).mode !== "follow") return undefined;
  const svg = followSvg(
    rendered.diagram,
    rendered.layout,
    rendered.timeline,
    DEFAULT_PALETTE,
    "light",
    { width, lang },
  );
  return {
    name,
    width,
    kind: rendered.layout.kind,
    least: Math.min(...cameraScales(svg, `${name} (幅 ${width})`)),
  };
}

export default function prepare() {
  const files = readdirSync(EXAMPLES)
    .filter((file) => file.endsWith(".dragon"))
    .sort();
  const zoomed: Zoomed[] = [];
  for (const width of WIDTHS) {
    for (const [name, text] of ISSUE_CASES) {
      const z = zoomOf(name, text, "ja", width);
      if (z) zoomed.push(z);
    }
    for (const file of files) {
      const z = zoomOf(
        file,
        readFileSync(join(EXAMPLES, file), "utf8"),
        file.endsWith(".en.dragon") ? "en" : "ja",
        width,
      );
      if (z) zoomed.push(z);
    }
  }
  return { zoomed, files: files.length };
}
