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

/**
 * 描いた絵に出る文字を、出る順に並べる。 属性や識別子は数えない。
 *
 * **見本帳と同じ形で描く** (#2681)。 見本帳は `hideHeader` を渡して engine の頭の帯を
 * 出さない。 帯は図の題を小さな字でもう 1 度出すため、渡さずに数えると 0.96.0 (`cdl#930`)
 * で図が自分の題を描くようになった分と合わせて必ず 2 件になる。
 *
 * 本 file が見たいのは **図の中で同じ字が 2 度出ないか** で、帯は図の外の飾りになる。
 */
function 見える文字(d: CdlDiagram): string[] {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} hideHeader />);
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
    //
    // **名前だけの完全一致では見ない**。 描画エンジン `0.32.0` (cdl#683) から、円の名札の
    // 2 行目は「名前 + 実数」 を 1 つの字にまとめる (割合と実数が違う数になる図)。
    // 名前だけで数えると、名前が出ているのに落ちる。 段の説明文にも名前が出るため、
    // 名前と実数の両方を持つ字だけを名札とみなす。
    const 出た = 見える文字(textDslToDiagram(記法("pie")));
    for (const [名, 実数] of [
      ["検索", "420"],
      ["SNS", "310"],
    ] as const) {
      const 名札 = 出た.filter((t) => t.includes(名) && t.includes(実数));
      expect(名札, `${名} の名札が出ていない`).toHaveLength(1);
    }
  });
});

/** 図が自分で描いた題 (`figure-title`) の文字を並べる */
function 図の題(d: CdlDiagram): string[] {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} hideHeader />);
  return [...svg.matchAll(/<text[^>]*data-cdl-role="figure-title"[^>]*>([^<]*)</g)].flatMap((m) =>
    m[1] === undefined ? [] : [m[1].trim()],
  );
}

describe("箱ごとに分かれる図種は従来どおり (陰性対照)", () => {
  const topology = `title: "${題}"\ntype: topology\n\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n\n` +
    `animation:\n  - step: "先月" 0.9s\n    body: "つながり。"\n`;

  it("topology でも題は 1 度だけ出る", () => {
    // 図表以外まで外していたらここが落ちる
    expect(見える文字(textDslToDiagram(topology)).filter((t) => t === 題)).toHaveLength(1);
  });

  /*
   * **件数だけでは対照にならない** (#2681)。 0.96.0 (`cdl#930`) より前は topology が
   * 縦列の見出しと表題で 2 度出しており、図表の 1 度と件数で区別できていた。 いまは
   * どちらも 1 度なので、件数を数えるだけでは「図表の側を直しすぎた」 を捕まえられない。
   *
   * 出どころで分ける。 図表の 1 度は図が自分で描いた題で、topology の 1 度は縦列の見出しになる。
   */
  it("topology の 1 度は図が描いた題ではない", () => {
    expect(図の題(textDslToDiagram(topology))).toEqual([]);
  });

  it("図表の 1 度は図が描いた題である", () => {
    expect(図の題(textDslToDiagram(記法("pie")))).toEqual([題]);
  });
});
