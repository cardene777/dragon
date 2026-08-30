/**
 * 自分へ戻る矢印 (#1227 → #1462 で契約が反転)。
 *
 * ## 経緯
 *
 * #1227 の時点で描画側は両端が同じ矢印を受けず、`validate` が `self-loop` で落としていた。
 * そのため組み立てに渡す前に外し、行番号付きで知らせていた。
 *
 * **`cdl#560` (0.15.0) が輪として描けるようにした**ので、外す理由が消えた。
 * 4 図の設計は 3 図で使う = 状態の自己遷移 (催促する)、シーケンスの自分宛て (控えを書く)、
 * ER の自己関係 (上司)。
 *
 * ## 3 通りに分かれる
 *
 * | 図種 | 自己参照 | なぜ |
 * |---|---|---|
 * | 書いた矢印を使う 8 種 | **残る** | 描画側が輪として描ける |
 * | `flow` の静止図 | 残らない | 登場人物を書いた順に鎖状に繋ぐ = 書いた矢印を使わない |
 * | 図全体を 1 箱で描く種別 | 残らない | 矢印そのものを作らない。 本数を数えて別に伝える |
 *
 * 陽性 (残る) と陰性 (残らない 2 種) の両側を置く。 陽性だけでは「全部通す」 実装が通り、
 * 陰性だけでは「全部落とす」 実装が通る。
 */
import { describe, it, expect } from "vitest";
import { compile } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/index";

/**
 * 書いた矢印をそのまま使う図種。
 *
 * `flow` は入れない = 静止図では登場人物を書いた順に鎖状に繋ぐため、書いた矢印を使わない
 * (別の検査で見る)。
 *
 * `sequence` / `solidity` も入れない = #1466 で 1 枚の板になり、言づては矢印ではなく板の中の
 * 行になった。 自分宛てが行として残ることは下の describe が板の側で見る。
 */
const 書いた矢印を使う図種 = [
  "swimlane",
  "er",
  "state",
  "topology",
  "class",
  "c4",
] as const;

/** 図全体を 1 箱で描く種別。 矢印は本数を数えて別の知らせで伝える */
const 一箱の図種 = ["pie", "bar", "line", "funnel", "tree", "journey", "quadrant", "mind"] as const;

const 記法 = (type: string, flow: string, actors: string): string =>
  `title: "確認"\ntype: ${type}\n\nactors:\n${actors}\nflow:\n${flow}`;

/** 組み立てた図と、出た知らせを両方返す */
function 組む(type: string, flow: string, actors: string) {
  const 出た: CompileNotice[] = [];
  const d = textDslToDiagram(記法(type, flow, actors), { onNotice: (n) => 出た.push(n) });
  return { d, 出た };
}

const 二人 = `  - A: "a"\n  - B: "b"\n`;
const 値二つ = `  - A: "10"\n  - B: "20"\n`;

describe("書いた矢印を使う図種では輪として残る (#1462)", () => {
  it("6 種すべてで残る", () => {
    let 測れた = 0;
    for (const 型 of 書いた矢印を使う図種) {
      const { d } = 組む(型, `  - A -> A: "自分"\n`, 二人);
      expect(
        d.edges.filter((e) => e.from === e.to).length,
        `${型} で自己参照が消えている`,
      ).toBe(1);
      測れた += 1;
    }
    expect(測れた, "図種を 1 つも測れていない (検査が空振りしている)").toBe(
      書いた矢印を使う図種.length,
    );
  });

  it("順序図系では板の行として残る (#1466)", () => {
    let 測れた = 0;
    for (const 型 of ["sequence", "solidity"]) {
      const { d } = 組む(型, `  - A -> A: "自分"\n`, 二人);
      const 言づて = d.nodes.find((n) => n.kind === "sequence-board")?.sequenceData?.messages ?? [];
      expect(言づて.filter((m) => m.from === m.to).length, `${型} で自分宛てが消えている`).toBe(1);
      測れた += 1;
    }
    expect(測れた, "図種を 1 つも測れていない (検査が空振りしている)").toBe(2);
  });

  it("知らせを出さない (描けるようになったため)", () => {
    // 種別 (`flow-self-loop`) は #1462 で消したので、文面で見る
    for (const 型 of 書いた矢印を使う図種) {
      const { 出た } = 組む(型, `  - A -> A: "自分"\n`, 二人);
      expect(
        出た.filter((n) => n.message.includes("自分へ戻る矢印")),
        `${型} でまだ知らせている`,
      ).toEqual([]);
    }
  });

  it("描画側が受ける (組み立て直しても落ちない)", () => {
    // 記法が通しても描画側が拒めば、画面の直前で図ごと落ちる
    for (const 型 of 書いた矢印を使う図種) {
      const { d } = 組む(型, `  - A -> A: "自分"\n`, 二人);
      expect(() => compile(d), `${型} で描画側が拒んでいる`).not.toThrow();
    }
  });

  it("書いた語がその矢印に載る", () => {
    const { d } = 組む("state", `  - A -> A: "催促"\n`, 二人);
    expect(d.edges.find((e) => e.from === e.to)?.label).toBe("催促");
  });
});

describe("残らない図種 (#1462)", () => {
  it("`type: flow` の静止図は鎖状に組むので残らない", () => {
    // 陰性対照 1。 `compileFlow` は登場人物を書いた順に繋ぐ = 書いた矢印を使わない
    const { d } = 組む("flow", `  - A -> A: "自分"\n`, 二人);
    expect(d.edges.filter((e) => e.from === e.to)).toEqual([]);
  });

  it("`type: flow` でも段を書けば別経路になり残る", () => {
    // 同じ図種で結果が分かれることを記録する = 「flow では残らない」 とだけ覚えると誤る
    const 出た: CompileNotice[] = [];
    const d = textDslToDiagram(
      `${記法("flow", `  - A -> A: "自分"\n`, 二人)}\nanimation:\n  - step: "s" 1s\n    focus: [A]\n`,
      { onNotice: (n) => 出た.push(n) },
    );
    expect(d.edges.some((e) => e.from === e.to), "段を書いた形でも消えている").toBe(true);
  });

  it("図全体を 1 箱で描く種別では残らず、本数を知らせる", () => {
    // 陰性対照 2。 そちらは矢印そのものを作らないので、通しても相手の箱が無い
    let 測れた = 0;
    for (const 型 of 一箱の図種) {
      const { d, 出た } = 組む(型, `  - A -> A: "自分"\n`, 値二つ);
      expect(d.edges.filter((e) => e.from === e.to), `${型} で矢印が残っている`).toEqual([]);
      expect(出た.length, `${型} で何も知らせていない`).toBeGreaterThan(0);
      測れた += 1;
    }
    expect(測れた, "図種を 1 つも測れていない (検査が空振りしている)").toBe(一箱の図種.length);
  });
});

describe("自分へ戻る矢印を書かない図に触らない (#1462)", () => {
  it("普通の矢印はそのまま残る", () => {
    // これが無いと「全ての矢印を落とす」 実装でも上の陰性対照が通る
    for (const 型 of 書いた矢印を使う図種) {
      const { d } = 組む(型, `  - A -> B: "進む"\n`, 二人);
      expect(d.edges.length, `${型} で矢印が消えている`).toBeGreaterThan(0);
    }
  });

  it("自分へ戻る矢印を書かない図では知らせが出ない", () => {
    const { 出た } = 組む("state", `  - A -> B: "進む"\n`, 二人);
    expect(出た.filter((n) => n.message.includes("自分へ戻る矢印"))).toEqual([]);
  });
});
