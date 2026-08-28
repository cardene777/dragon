import { describe, it, expect } from "vitest";
import { textDslToDiagram, jsonToDiagram, parseTextDslV05 } from "../src/index";
import { EDGE_REVEALS, EDGE_REVEAL_DEFAULT } from "@cardenelabs/cdl";

/**
 * 矢印をいつ出すかを記法から書く (#1470)。
 *
 * 描き手 (`cdl#582`) は「段が名指しする矢印は、その段が来るまで描かない」 を既定にし、
 * `edgeReveal` で切り替えられるようにした。 記法から書けないと、既定を外したい図が書けない。
 *
 * **書いた語がそのまま図に載ることを見る**。 効き方 (どの段で出るか) は描き手の責務で、
 * `cdl` 側の `edge-reveal.test.tsx` が見る。
 */

const 記法 = (追加: string) =>
  `title: "t"
type: topology
${追加}
actors:
  - A
  - B

flow:
  - A -> B: "つなぐ"
`;

describe("矢印をいつ出すか (#1470)", () => {
  it("書いた語が図に載る", () => {
    expect(textDslToDiagram(記法("reveal: all\n")).edgeReveal).toBe("all");
  });

  it("既定を明示的に書いた形も載る", () => {
    // 既定と同じ語を書いた時に落ちると、書いた人が既定を確かめられない
    expect(textDslToDiagram(記法("reveal: phase\n")).edgeReveal).toBe("phase");
  });

  it("書かなければ欄ごと付かない", () => {
    // 陰性対照。 これが無いと「常に載せる」 実装でも上が通り、既定を描き手側で決められなくなる
    expect(textDslToDiagram(記法("")).edgeReveal).toBeUndefined();
  });

  it("読める語すべてが渡る", () => {
    // 手で並べると、描画側が語を増やした時に書けないままになる
    let 測れた = 0;
    for (const 語 of EDGE_REVEALS) {
      expect(textDslToDiagram(記法(`reveal: ${語}\n`)).edgeReveal, `${語} が渡っていない`).toBe(語);
      測れた += 1;
    }
    expect(測れた, "語を 1 つも測れていない (検査が空振りしている)").toBe(EDGE_REVEALS.length);
  });

  it("読めない語を黙って捨てない", () => {
    const r = parseTextDslV05(記法("reveal: nope\n")) as {
      errors?: Array<{ message: string; hint?: string }>;
    };
    const 文 = (r.errors ?? []).map((e) => `${e.message} ${e.hint ?? ""}`).join(" / ");
    expect(文).toContain("reveal が読めません");
    expect(文, "使える語を案内していない").toContain(EDGE_REVEAL_DEFAULT);
  });

  it("JSON からも同じ値が渡る (書き方で変わらない)", () => {
    const d = jsonToDiagram({
      title: "t",
      type: "topology",
      reveal: "all",
      actors: [{ name: "A" }, { name: "B" }],
      flow: [{ from: "A", to: "B", label: "つなぐ" }],
    });
    expect(d.edgeReveal).toBe("all");
  });
});
