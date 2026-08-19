/**
 * 箱ごとに縦列を作る図種で、名前が 1 度しか描かれないことの検査 (#1241)。
 *
 * **組み立て結果ではなく描いた絵で見る**。 縦列に見出しを渡すかどうかは組み立ての内部の話で、
 * 読む人に届くのは描いた絵。 `er` の宣言を「この図種は縦列の見出しを描かない」 として
 * 置いていた誤りは、組み立て結果だけを見たことから生まれた。
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

/** 描いた絵に出る文字を、出る順に並べる */
function 見える文字(d: CdlDiagram): string[] {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);
  return [...svg.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter((t) => t.length > 0);
}

const 記法 = (type: string) =>
  `title: "T"\ntype: ${type}\n\nactors:\n  - Alpha\n  - Beta\nflow:\n  - Alpha -> Beta: "x"\n\n` +
  `animation:\n  - step: "s1" 1s\n    focus: [Alpha]\n    body: "b"\n`;

describe("箱の名前を 1 度しか描かない (#1241)", () => {
  for (const type of ["er", "state"]) {
    it(`${type} で 1 度`, () => {
      const 出た = 見える文字(textDslToDiagram(記法(type)));
      expect(出た.filter((t) => t === "Alpha"), `${type} で名前が重複している`).toHaveLength(1);
      expect(出た.filter((t) => t === "Beta"), `${type} で名前が重複している`).toHaveLength(1);
    });
  }

  it("名前そのものは消えていない", () => {
    expect(見える文字(textDslToDiagram(記法("er")))).toContain("Alpha");
  });

  it("swimlane では 2 度出るまま変わらない (陰性対照)", () => {
    // 縦列そのものが「誰の担当か」 を読ませる図。 見出しと箱の題で 2 度出るのが正しい。
    // 全図種で外していたらここが落ちる
    const 出た = 見える文字(textDslToDiagram(記法("swimlane")));
    expect(出た.filter((t) => t === "Alpha")).toHaveLength(2);
  });
});
