import { describe, expect, it, vi } from "vitest";

import { PRESET_TYPES } from "../src/v05/parser";
import { textDslToDiagram } from "../src";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

/**
 * 記法が受ける型すべてに、 エディタの見本がある (#1154)。
 *
 * エディタは記法を編集する画面なので、 **catalog に何を足してもここには増えない**。 型を足した
 * のに見本を置き忘れると、 書けるのに誰も気付かない状態になる。
 *
 * 実際 `solidity` は型がありながら見本が無く、 12 種のうち 1 種だけ触れない状態が続いていた。
 */

/** 記法の `type:` を 1 行目から取り出す。 */
function 型を読む(code: string): string | null {
  const m = code.match(/^type:\s*([a-z0-9-]+)\s*$/mu);
  return m ? m[1]! : null;
}

describe("記法の型に見本がある (#1154)", () => {
  it("見本の無い型が無い", () => {
    const 使用 = new Set(EDITOR_SAMPLES.map((s) => 型を読む(s.code)).filter(Boolean));
    const 無い = [...PRESET_TYPES].filter((t) => !使用.has(t)).sort();
    expect(無い, `見本の無い型がある (editor-samples.ts に足す): ${無い.join(", ")}`).toEqual([]);
  });

  it("見本の型はすべて記法が受ける", () => {
    // 綴りを間違えた見本は画面で初めて落ちる。 ここで捕まえる
    const 未知 = EDITOR_SAMPLES.map((s) => 型を読む(s.code))
      .filter((t): t is string => t !== null)
      .filter((t) => !(PRESET_TYPES as ReadonlySet<string>).has(t));
    expect(未知, `記法が受けない型の見本がある: ${未知.join(", ")}`).toEqual([]);
  });
});

/**
 * 値で描く 3 型 (`pie` / `bar` / `line`) の反例。
 *
 * 3 型は入力の形が同じで組立ても 1 つにまとめてあるので、 反例も揃えて見る。
 */
describe("値で描く型の反例 (#1154)", () => {
  const 値の型 = ["pie", "bar", "line"] as const;
  const 記法 = (t: string, actors: string, flow = "") =>
    `title: "確認"\ntype: ${t}\n\nactors:\n${actors}\n${flow}`;

  it.each(値の型)("%s = 読めない値は載せず、 読めた分だけ描く", (t) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const d = textDslToDiagram(記法(t, `  - A: "10"\n  - B: "四割"\n`));
    // **黙って 0 にしない**。 0 にすると、 その項目だけ欠けた図が「正しい図」 として出る
    expect(d.nodes[0]?.chartData).toEqual([{ label: "A", value: 10 }]);
    expect(warn, "読めなかったことを伝えていない").toHaveBeenCalled();
    warn.mockRestore();
  });

  it.each(値の型)("%s = 項目が 1 つでも描ける", (t) => {
    const d = textDslToDiagram(記法(t, `  - A: "10"\n`));
    expect(d.nodes[0]?.chartData).toEqual([{ label: "A", value: 10 }]);
  });

  it.each(値の型)("%s = 矢印は描けないので捨てて伝える", (t) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const d = textDslToDiagram(記法(t, `  - A: "10"\n  - B: "20"\n`, `\nflow:\n  - A -> B: "x"\n`));
    expect(d.edges ?? [], "矢印を描いている").toEqual([]);
    expect(warn, "捨てたことを伝えていない").toHaveBeenCalled();
    warn.mockRestore();
  });

  it("型ごとに描画側の種別が変わる", () => {
    const 種別 = (t: string) => textDslToDiagram(記法(t, `  - A: "10"\n`)).nodes[0]?.kind;
    expect(種別("pie")).toBe("chart-pie");
    expect(種別("bar")).toBe("chart-bar");
    expect(種別("line")).toBe("chart-line");
  });
});
