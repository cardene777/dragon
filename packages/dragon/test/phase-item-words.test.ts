import { describe, it, expect } from "vitest";

import { PHASE_ITEM_WORDS } from "../src/v05/parser";
import { PHASE_BODY_KEYS, PHASE_BODY_CANONICAL } from "../src/keywords";
import { textDslToDiagram, jsonToDiagram } from "../src/index";

/**
 * 段の項目の一覧と、実際に受理される項目が一致することの検証 (#1330)。
 *
 * 一覧 (`PHASE_ITEM_WORDS`) は 3 箇所で使われる。
 *
 * | 使い先 | 何に使うか |
 * |---|---|
 * | `parsePhase` の入口 | 一覧にない語を各分岐へ到達させない |
 * | 誤りの案内 | 「使える項目 = ...」 の列挙 |
 * | 見本の検査 | 値の名前と重なっていないかを見る |
 *
 * **入口の判定だけでは一覧の誤りを捕まえられない**。 一覧から語を落とすとその項目が
 * 使えなくなるが、入口を外しても各分岐が同じ結果を返すため挙動が変わらない
 * (実測で入口を外して 0 件 FAIL)。 一覧の各語が実際に受理されることを直接見る。
 */

/** その項目を段に書いた記法。 項目ごとに書き方が違う */
const 段に書く: Readonly<Record<string, string>> = {
  focus: "    focus: [A, B]",
  badge: '    badge: "印"',
  body: '    body: "説明文"',
  description: '    description: "説明文"',
  tween: "    tween:\n      v: 0 -> 1",
  set: "    set:\n      v: 1",
  draw: "    draw: line",
};

/** 図種は `draw:` の語に合わせる。 それ以外は `flow` でよい */
const 図種 = (項目: string): string => (項目 === "draw" ? "line" : "flow");

const 記法 = (項目: string): string =>
  [
    'title: "t"',
    `type: ${図種(項目)}`,
    "",
    "actors:",
    "  - A",
    "  - B",
    "",
    ...(図種(項目) === "flow" ? ["flow:", '  - A -> B: "x"', ""] : []),
    "states:",
    "  v: 0",
    "",
    "animation:",
    '  - step: "s" 1.0s',
    段に書く[項目] ?? "",
    "",
  ].join("\n");

describe("段の項目の一覧 (#1330)", () => {
  it("一覧が空でない (検査が空振りしていない)", () => {
    expect(PHASE_ITEM_WORDS.length).toBeGreaterThan(0);
  });

  it("一覧の全ての項目に書き方の見本がある", () => {
    // 見本が無い項目は下の検査が飛ばされる。 一覧に語を足したらここも足す
    const 無い = PHASE_ITEM_WORDS.filter((w) => 段に書く[w] === undefined);
    expect(無い, "書き方の見本が無い項目がある").toEqual([]);
  });

  it("一覧の項目はすべて受理される", () => {
    // **一覧に語を足して分岐を足し忘れると落ちる**。 入口の判定を通った後、どの分岐にも
    // 当たらず「段の項目名が読めません」 になる
    for (const 語 of PHASE_ITEM_WORDS) {
      expect(() => textDslToDiagram(記法(語)), `段の項目 "${語}" が受理されない`).not.toThrow();
    }
  });

  it("一覧にない項目は受理されない", () => {
    // 陰性対照。 上の検査だけだと、何でも受理する実装でも通る
    expect(() => textDslToDiagram(記法("focus").replace("    focus:", "    foo:"))).toThrow(
      /段の項目名が読めません/u,
    );
  });
});

/**
 * 段の説明の語が 2 形で揃っている (#2621)。
 *
 * 記法は `body:` でも `description:` でも受けるのに、JSON は `"body"` しか受けず
 * `"description"` を書くと組み上げが落ちていた。 受ける語の一覧 (`ACCEPTED_KEYS.phase` と
 * `PHASE_ITEM_WORDS`) を突き合わせる検査は #1968 で入っていたが、対象の層を手で挙げており
 * 段の層が抜けていた (`dsl-unknown-keys-1968.test.ts` で足した)。
 *
 * ここでは **語ごとに実際に組み上げて、同じ説明になること** を見る。 一覧が揃っていても
 * 写す先が片方だけ `body` を読んでいれば値が届かない = 一覧の一致では捕まらない。
 */
describe("段の説明の語が 2 形で揃っている (#2621)", () => {
  const 記法で組む = (語: string): string =>
    [
      'title: "t"',
      "type: flow",
      "",
      "actors:",
      "  - A",
      "  - B",
      "",
      "flow:",
      '  - A -> B: "x"',
      "",
      "animation:",
      '  - step: "s" 1.0s',
      `    ${語}: "同じ説明"`,
      "",
    ].join("\n");

  const JSONで組む = (語: string): Record<string, unknown> => ({
      title: "t",
      type: "flow",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "x" }],
    animation: [{ step: "s", duration: 1, [語]: "同じ説明" }],
  });

  it("受ける語が 2 語以上ある (検査が空振りしていない)", () => {
    expect(PHASE_BODY_KEYS.length).toBeGreaterThan(1);
  });

  it("どちらの語でも記法が同じ説明になる", () => {
    for (const 語 of PHASE_BODY_KEYS) {
      const d = textDslToDiagram(記法で組む(語));
      expect(d.phases[0]?.body, `記法の "${語}" が説明にならない`).toBe("同じ説明");
    }
  });

  it("どちらの語でも JSON が同じ説明になる", () => {
    for (const 語 of PHASE_BODY_KEYS) {
      const d = jsonToDiagram(JSONで組む(語));
      expect(d.phases[0]?.body, `JSON の "${語}" が説明にならない`).toBe("同じ説明");
    }
  });

  it("両方書いた段は正の語が効く", () => {
    // どちらが効くかを実装を読まずに判断できるようにする。 表の先頭が正の語
    const 別名 = PHASE_BODY_KEYS.filter((k) => k !== PHASE_BODY_CANONICAL);
    expect(別名.length, "別名が無い (検査が空振りしている)").toBeGreaterThan(0);
    const j = {
      title: "t",
      type: "flow",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "x" }],
      animation: [
        {
          step: "s",
          duration: 1,
          [PHASE_BODY_CANONICAL]: "正の語",
          ...Object.fromEntries(別名.map((k) => [k, "別名"])),
        },
      ],
    };
    expect(jsonToDiagram(j).phases[0]?.body).toBe("正の語");
  });
});
