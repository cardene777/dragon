/**
 * `overview-all-kinds.test.ts` の重い仕事を、1 回の実行の準備の段で済ませる (#3852、`test-support/prepare-setup.ts`)。
 *
 * 見本の置き場の直下の全ての見本を、並べ方に幅を渡さない形と、幅 760、390、320、280 を渡した形の 5 通りに並べ、
 * 全体図の部品の数 (並べ方の `regions` と `boxes` と、種類の部品の組の `overview` が挙げる部品の合計) を数える。
 * 寄って追う形にならない見本は、見せ方を選ぶ `chooseView` が枠の幅 1 でも `fixed` を返す見本で、全体図を持たないので数えない。
 * 外す種類を手で並べず、再生の部品と書き出しが読む決まりと同じ決まりから引く。
 *
 * 絵は数えない。全体図の絵を描く部品 (寄って追う形の SVG を描く部品と再生の部品) もブラウザも読まず、並べ方の結果だけで数える。
 * 並べる処理は止めて見せる形の SVG も描くが、数えるのは並べ方と `overview` の結果だけ。
 *
 * 検知できることを確かめるため、chart の `overview` を空の組に差し替えた時の数も返す。
 * 登録した部品の組は書き換えず、数える関数に空の組を返す `overview` を渡して数える。並べて走る別の準備の仕事に差し替えが漏れないため。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import "./built-globals";
import "../src/kinds/all";
import { planPage } from "../src/export/page";
import type { KindParts } from "../src/kinds/parts";
import { partsOf } from "../src/kinds/registry";
import type { Layout } from "../src/layout/scene";
import { parseNotation } from "../src/parser";
import { renderDiagram } from "../src/render/draw";
import { chooseView } from "../src/view";
import type { NotationLang } from "../src/words";

/** 見本の置き場 */
const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 並べ方に渡す枠の幅。`null` は幅を渡さない形 */
export const WIDTHS: readonly (number | null)[] = [null, 760, 390, 320, 280];

/** 1 つの見本を数えた結果 */
export interface Counted {
  /** 見本の file の名前 */
  file: string;
  /** 並べ方の種類の名前 */
  kind: string;
  /** 寄って追う形にならない見本か。真の時は数えない */
  never: boolean;
  /** `WIDTHS` の順の、全体図の部品の数。数えない見本は空 */
  counts: number[];
}

/** 種類の `overview` を受け、並べ方 `layout` の全体図の部品の数を返す */
function partsCount(layout: Layout, overview: KindParts["overview"]): number {
  return layout.regions.length + layout.boxes.length + (overview?.(layout as never) ?? []).length;
}

/** 見本の file を読んだ原本と言葉 */
function read(file: string): { diagram: unknown; lang: NotationLang } {
  const lang: NotationLang = file.endsWith(".en.dragon") ? "en" : "ja";
  const parsed = parseNotation(readFileSync(join(EXAMPLES, file), "utf8"), { lang });
  if (!parsed.ok) throw new Error(`${file} を読めない`);
  return { diagram: parsed.diagram, lang };
}

const EMPTY_OVERVIEW: KindParts["overview"] = () => [];

export default async function prepare() {
  const files = readdirSync(EXAMPLES)
    .filter((file) => file.endsWith(".dragon"))
    .sort();
  const entries: Counted[] = [];
  const planted: Counted[] = [];
  for (const file of files) {
    const { diagram, lang } = read(file);
    const first = renderDiagram(diagram, { lang });
    const kind = first.layout.kind as string;
    if (chooseView(first, 1).mode === "fixed") {
      entries.push({ file, kind, never: true, counts: [] });
      continue;
    }
    const layouts = WIDTHS.map((width) => (width === null ? first.layout : renderDiagram(diagram, { lang, width }).layout));
    const overview = partsOf(kind, lang)?.overview;
    entries.push({ file, kind, never: false, counts: layouts.map((layout) => partsCount(layout, overview)) });
    if (kind === "chart") planted.push({ file, kind, never: false, counts: layouts.map((layout) => partsCount(layout, EMPTY_OVERVIEW)) });
  }
  // 書き出しが幅 760 で pipe の見本を描く時の、寄って追う絵の有無と、書き出しが選ぶ見せ方 (`exportDiagram` と同じく `chooseView` で選ぶ)
  const swap = read("swap.dragon");
  const plan = planPage(swap.diagram, { lang: swap.lang, width: 760 });
  return {
    widths: WIDTHS,
    entries,
    planted,
    exportPipe: { followSvg: plan.followSvg !== undefined, view: chooseView(plan.rendered, plan.width).mode },
  };
}
