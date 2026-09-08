/**
 * 記法に書いた前の時点の値が、絵に出るところまで届くかの検査 (#1711)。
 *
 * ## なぜ組み立てだけでは足りないか
 *
 * 記法が前の値を受け取り、組み立てが描画側へ渡すところまでは
 * `packages/dragon/test/value-chart-3kinds.test.ts` が見る。 それでも **絵には出て
 * いなかった** = 描画側の数値の図を描く関数が、渡された値を 1 度も読んでいなかった。
 *
 * 渡ったことと描かれたことは別なので、描いた結果を読む。
 *
 * ## 見本と同じ書き方で確かめる
 *
 * 見本 (`editor-samples.ts` の `stat`) は `{ value, previous }` の形で書く。 同じ形を
 * ここでも使う = 見本が使わない書き方だけを通していると、見本が壊れても落ちない。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

const 記法 = (項目: string) => `title: "今月の解約率"
type: stat

actors:
${項目}
`;

const 描く = (項目: string): string => {
  const d = textDslToDiagram(記法(項目));
  return renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);
};

/** 前の時点の役割を持つ字を拾う */
const 前の字 = (svg: string): string[] =>
  [...svg.matchAll(/<text[^>]*data-cdl-role="chart-stat-previous"[^>]*>([^<]*)<\/text>/g)].map(
    (m) => m[1] ?? "",
  );

describe("記法に書いた前の時点の値が絵に出る (#1711)", () => {
  it("書いた前の値が字として出る", () => {
    const svg = 描く(`  - 解約率: { value: "24", previous: "38" }`);
    expect(svg, "図を 1 つも描けていない (検査が空振りしている)").toContain("chart-stat-value");
    expect(前の字(svg)).toEqual(["前 38"]);
  });

  it("書かない図では 1 つも出ない (陰性対照)", () => {
    // 差がゼロであるべき入力。 「常に出す」 実装だとここが落ちる
    const svg = 描く(`  - 解約率: "24"`);
    expect(svg, "図を 1 つも描けていない (検査が空振りしている)").toContain("chart-stat-value");
    expect(前の字(svg), "書いていないのに出た").toEqual([]);
  });

  it("日本語の項目名で書いても出る", () => {
    // 記法は 3 通りの書き方を受ける。 1 つだけ配線されている形を捕まえる
    const svg = 描く(`  - 解約率: { 値: "24", 前の値: "38" }`);
    expect(前の字(svg)).toEqual(["前 38"]);
  });

  it("前が 0 の件でも出る", () => {
    // `0` を「書いていない」 と同じに扱うと、前が 0 だった件だけ黙って消える
    const svg = 描く(`  - 新規: { value: "12", previous: "0" }`);
    expect(前の字(svg)).toEqual(["前 0"]);
  });
});
