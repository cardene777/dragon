/**
 * 図表の記法が図の題を 1 度しか描かないことの検査 (#1249)。
 *
 * 図表は箱を 1 つしか作らず、その箱が既に図の題を持つ。 そこへ縦列の見出しにも同じ題を
 * 渡していたため、**同じ字が縦に 2 つ並んで** いた。
 *
 * **組み立て結果ではなく描いた絵で見る**。 縦列に見出しを渡すかどうかは組み立ての内部の話で、
 * 読む人に届くのは描いた絵。 `packages/dragon` 側の検査が `lanes[].label` を見るのに対し、
 * ここは実際に出る文字を数える。
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

/** 描いた絵に出る文字を、出る順に並べる。 属性や識別子は数えない */
function 見える文字(d: CdlDiagram): string[] {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);
  // `([^<>]+)` は必須の群。 取れない形は regex と噛み合っていないので捨てる
  return [...svg.matchAll(/>([^<>]+)</g)]
    .flatMap((m) => (m[1] === undefined ? [] : [m[1].trim()]))
    .filter((t) => t.length > 0);
}

const 題 = "経路別の流入";

/**
 * 段の題を必ず書く。
 *
 * 段を書かないと組み立てが段を 1 つ作り、その題に図の題を入れる = 図の題が縦列の見出しとは
 * 別の理由でもう 1 度出る。 それを数えると本 file が見たい差と混ざる (実測で判明)。
 */
const 記法 = (type: string) =>
  `title: "${題}"\ntype: ${type}\n\nactors:\n  - 検索: "420"\n  - SNS: "310"\n\n` +
  `animation:\n  - step: "先月" 0.9s\n    body: "検索が最も多い。"\n`;

describe("図表は図の題を 1 度しか描かない (#1249)", () => {
  for (const type of ["pie", "bar", "line", "funnel", "tree", "journey", "quadrant", "mind", "gantt"]) {
    it(`${type} で 1 度`, () => {
      const 出た = 見える文字(textDslToDiagram(記法(type)));
      expect(出た.filter((t) => t === 題), `${type} で題が重複している`).toHaveLength(1);
    });
  }

  it("題そのものは消えていない", () => {
    // 「1 度」 は 0 度でも満たせない書き方にしてあるが、意図を検査でも残す
    expect(見える文字(textDslToDiagram(記法("pie")))).toContain(題);
  });

  it("題の他に出る文字が減っていない", () => {
    // 帯を外した拍子に中身まで落ちていないことを見る
    const 出た = 見える文字(textDslToDiagram(記法("pie")));
    expect(出た, "値の名前が消えている").toContain("検索");
    expect(出た, "値の名前が消えている").toContain("SNS");
  });
});

describe("箱ごとに分かれる図種は従来どおり (陰性対照)", () => {
  it("topology では題が 2 度出るまま変わらない", () => {
    // 図表以外まで外していたらここが落ちる。 この図種は箱が複数あり、見出しが列の役目を示す
    //
    // **この 2 度は本 file の対象ではない**。 `topology` は縦列の見出しに図の題を渡すため
    // 見出しと表題で 2 度出るが、箱が複数あるので見出しには列を示す役目がある。
    // 図表 (箱が 1 つ) とは事情が違うので触らない。 値を固定して、意図せず変わったら気付く
    const src = `title: "${題}"\ntype: topology\n\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n\n` +
      `animation:\n  - step: "先月" 0.9s\n    body: "つながり。"\n`;
    expect(見える文字(textDslToDiagram(src)).filter((t) => t === 題)).toHaveLength(2);
  });
});
