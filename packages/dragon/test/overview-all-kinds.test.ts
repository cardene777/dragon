/**
 * 全ての図の種類で、寄って追う形の全体図に描く部品が 1 つ以上在る (#3852)。
 *
 * 全体図は、寄って追う形の窓の下か右に出る、図の全体を縮めた小さな図。
 * 全体図の部品は、並べ方の `regions` と `boxes` と、種類の部品の組の `overview` が挙げる部品で、描く所 (`render/draw.ts` の `overview`) はこの 3 つだけを描く。
 * #3849 は全体図が空になる 5 つの種類を直したが、検査は直した見本を手で並べて見るだけで、次に足す種類の空の全体図は取り込まれ得た。
 * ここは種類の一覧を登録表 (`KIND_FOLDERS`) から引き、種類ごとに全ての見本を 5 つの幅で並べた部品の数を見る。
 * 寄って追う形にならない見本 (`chooseView` が枠の幅 1 でも `fixed` を返す見本、pipe など) は全体図を持たないので数えない。
 * 外す種類を手で並べず、再生の部品と書き出しが読む `chooseView` の決まりから引く。
 * 見本を並べる重い仕事は準備の段 (`overview-all-kinds.prepare.ts`) が済ませ、件は数えた結果を読む。
 * 絵を描く部品もブラウザも読まず、並べ方と `overview` の結果だけで数える
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { KIND_FOLDERS } from "../src/kinds/index";
import type prepare from "./overview-all-kinds.prepare";
import type { Counted } from "./overview-all-kinds.prepare";
import { prepared } from "./prepared";

const done = (): Awaited<ReturnType<typeof prepare>> => prepared(import.meta.url);

/** 登録表の図の種類。登録表から引き、手で並べない */
const KINDS = Object.keys(KIND_FOLDERS);

/** 幅の名前。`null` は幅を渡さない形 */
const widthName = (width: number | null): string => (width === null ? "幅を渡さない形" : `幅${width}`);

/** 寄って追う形になり得る見本のうち、全体図の部品が 0 個になる見本と幅 */
function emptyOverviews(entries: readonly Counted[], widths: readonly (number | null)[]): string[] {
  return entries
    .filter((entry) => !entry.never)
    .flatMap((entry) => entry.counts.flatMap((count, i) => (count === 0 ? [`${entry.file} (${widthName(widths[i] ?? null)})`] : [])));
}

describe("全ての図の種類で、寄って追う形の全体図に部品が在る (#3852)", () => {
  for (const kind of KINDS) {
    it(`overview-parts-${kind}`, () => {
      const { widths, entries } = done();
      const mine = entries.filter((entry) => entry.kind === kind);
      expect(emptyOverviews(mine, widths), `${kind} の見本で、全体図の部品が 0 個になる見本と幅`).toEqual([]);
    });
  }

  it("overview-kinds-have-examples", () => {
    const { entries } = done();
    expect(
      KINDS.filter((kind) => !entries.some((entry) => entry.kind === kind)),
      "見本の置き場 (packages/dragon/examples) の直下に見本を 1 件も持たない図の種類",
    ).toEqual([]);
  });

  it("overview-parts-names-the-empty-examples", () => {
    // chart の `overview` を空の組に差し替えて数えた結果。chart の並べ方は地も箱も持たないので、寄って追う形になり得る全ての見本が全ての幅で挙がる
    const { widths, entries, planted } = done();
    const charts = entries.filter((entry) => entry.kind === "chart" && !entry.never).map((entry) => entry.file);
    expect(charts.length, "寄って追う形になり得る chart の見本の数").toBe(16);
    const named = emptyOverviews(planted, widths);
    expect(
      charts.filter((file) => widths.some((width) => !named.includes(`${file} (${widthName(width)})`))),
      "overview を空にしても挙がらない chart の見本",
    ).toEqual([]);
    expect(named.length, "挙がった見本と幅の数").toBe(charts.length * widths.length);
  });

  it("overview-check-reads-layouts-only", () => {
    // 数える仕事は並べ方と overview の結果だけを使い、絵を描く部品とブラウザを読まない
    const dir = join(process.cwd(), "packages/dragon/test");
    const prepareSource = readFileSync(join(dir, "overview-all-kinds.prepare.ts"), "utf8");
    const testSource = readFileSync(join(dir, "overview-all-kinds.test.ts"), "utf8");
    const imports = (source: string): string[] => source.split("\n").filter((line) => /^import\b/u.test(line));
    const drawing = ["drawSvg", "followSvg", "mountDiagram", "playwright", "chromium", "jsdom", "page-wait", "follow-support"];
    expect(
      [...imports(prepareSource), ...imports(testSource)].filter((line) => drawing.some((name) => line.includes(name))),
      "絵を描く部品かブラウザを読む import",
    ).toEqual([]);
    // 書き出しの頁の計画が持つ寄って追う絵の欄 (`plan.followSvg`) を読むのは数えず、絵を描く部品を呼ぶ形だけを探す
    const code = prepareSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gmu, "");
    expect(
      ["drawSvg", "followSvg", "mountDiagram", "launch"].filter((name) => new RegExp(`\\b${name}\\s*\\(`, "u").test(code)),
      "準備の file が呼ぶ、絵を描く部品かブラウザを起こす関数",
    ).toEqual([]);
    expect(testSource.split("\n")[0], "検査の file の環境 (jsdom を使わない)").not.toContain("@vitest-environment");
  });

  it("overview-export-keeps-pipe-fixed", () => {
    // 書き出しは再生の部品と同じ決まり (chooseView) を読み、幅 760 を渡しても pipe を止めた形で書き出す
    const { exportPipe } = done();
    expect(exportPipe, "幅 760 で pipe の見本 swap を書き出す時の、寄って追う絵の有無と見せ方").toEqual({ followSvg: false, view: "fixed" });
  });
});
