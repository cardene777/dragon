/**
 * 記法だけが持つ種類を書いても図が出る (#1420)。
 *
 * 記法は `contract` / `eoa` のような **描画側に無い種類** を受け付ける
 * (`v05/parser.ts` の `DSL_ONLY_KINDS`)。 図種ごとの役割分け (`solidity` の縦列の並べ替え
 * など) に使うためで、記法としては正しい。
 *
 * ## 何が起きていたか
 *
 * `solidity` と `er` は組み立ての中で別の種類に置き換えていたが、`flow` / `swimlane` /
 * `state` / `topology` は書いた種類をそのまま描画側へ渡していた。
 *
 * 描画側は知らない種類の大きさを引けないため、図の組み立てが落ちる。
 *
 * ```
 * type: flow
 * actors:
 *   - A: { kind: contract }
 * → Cannot read properties of undefined (reading 'h')
 * ```
 *
 * 記法の解析は通り、画面では図が出ない。
 *
 * ## 見本帳は無事だった
 *
 * `lint:notation` は 422 図で 0 件を返していた。 **この組み合わせを書いた見本が 1 つも
 * 無かっただけ** で、守られていたわけではない。 だからここで固定する。
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { layout } from "@cardenelabs/cdl";

import { textDslToDiagram } from "../src";
import type { DslNodeKind } from "../src/types";
import { DSL_ONLY_KINDS, resolveNodeKind } from "../src/v05/parser";

/** 箱の種類を書ける図種。 図全体を 1 箱にする種 (`pie` 等) は箱ごとの種類を持たない */
const 図種 = ["flow", "swimlane", "state", "topology", "sequence", "er", "solidity"] as const;

/**
 * 段の有無で組み立ての経路が分かれる。
 *
 * `flow` / `topology` は段を書かないと `compileFlow` / `compileTopology` を通り、書くと
 * `compileGenericWithAnimate` を通る。 **別の箇所で箱を作る** ので、片方だけ見ると
 * もう片方の読み替え漏れに気付けない (実測 = 段ありの経路だけ読み替えを外しても、
 * 段なしの検査は全て通った)。
 */
const 段 = ["段なし", "段あり"] as const;

const 記法 = (図: string, 種類: string, 段の有無: (typeof 段)[number]): string =>
  `title: "t"
type: ${図}

actors:
  - A: { kind: ${種類} }
  - B: { kind: card }

flow:
  - A -> B: "x"
${
  段の有無 === "段あり"
    ? `
animation:
  - step: "1" 0.9s
    focus: [A]
  - step: "2" 0.9s
    focus: [A, B]
`
    : ""
}`;

describe("記法だけの種類を書いても図が組み立つ (#1420)", () => {
  it("種類の解決結果は記法だけの種類を型でも表す", () => {
    /*
     * `NodeKind` と偽ると、読み替え前の値を描画側へ渡しても型検査が止められない。
     *
     * **この 1 行は実行時に何も見ていない**。 `expectTypeOf` は型の比較で、`vitest run` は
     * 型を落として走らせるため、型が食い違っても実行では落ちない (実測 = 戻り値を
     * `NodeKind` に戻しても 139 件すべて通った)。
     *
     * 落とすのは型検査の側。 `tsconfig.test.json` が `test/**` を含み、
     * `typecheck-ratchet.test.ts` がその件数を天井として見る。 同じ変異で件数が
     * 208 → 209 に増え、天井の検査が落ちることを確かめている。
     */
    expectTypeOf(resolveNodeKind("contract")).toEqualTypeOf<DslNodeKind>();
  });

  it("読み替えの対象が 1 件以上ある", () => {
    // 空振り防止。 一覧が空だと下の検査が 1 度も回らず「全部通った」 と表示される
    expect(DSL_ONLY_KINDS.length, "記法だけの種類が 1 つも無い").toBeGreaterThan(0);
    expect(図種.length, "図種が 1 つも無い").toBeGreaterThan(0);
    expect(段.length, "段の有無が 1 つも無い").toBeGreaterThan(0);
  });

  for (const 種類 of DSL_ONLY_KINDS) {
    for (const 図 of 図種) {
      for (const 段の有無 of 段) {
        it(`${図} × ${種類} (${段の有無}) が組み立つ`, () => {
          const d = textDslToDiagram(記法(図, 種類, 段の有無));
          // 落ちないことが本題。 落ちると「図が出ない」 がそのまま起きる
          expect(() => layout(d)).not.toThrow();
        });
      }
    }
  }

  it("記法だけの種類のまま描画側へ渡らない", () => {
    /*
     * 落ちないだけでは足りない。 読み替えを「同じ値に読み替える」 形にしても落ちない
     * 経路がありうるため、**実際に別の種類へ変わったか** を見る。
     *
     * 描画側の一覧をここに並べない (実物とずれる)。 記法だけの種類に留まっていないことで
     * 見る = 留まっていればそれは読み替えていない。
     */
    const 記法だけ = new Set<string>(DSL_ONLY_KINDS);
    const 残った: string[] = [];
    for (const 種類 of DSL_ONLY_KINDS) {
      const d = textDslToDiagram(記法("flow", 種類, "段なし")) as unknown as {
        nodes: { id: string; kind?: string }[];
      };
      const a = d.nodes.find((n) => n.id === "a");
      expect(a, `${種類} を書いた箱が図に無い`).toBeDefined();
      if (a?.kind !== undefined && 記法だけ.has(a.kind)) 残った.push(`${種類} → ${a.kind}`);
    }
    expect(残った, `記法だけの種類のまま描画側へ渡っている: ${残った.join(", ")}`).toEqual([]);
  });
});

/**
 * 箱を作る経路は 8 つある。 上の表 (図種 × 段の有無) が届かない 3 つをここで補う (#1420)。
 *
 * 変異試験で分かった = 読み替えを 1 箇所ずつ外すと、この 3 箇所だけ 1 件も落ちなかった。
 * **到達する入力は作れる** ので、実装ではなく検査の側が届いていなかった。
 *
 * | 経路 | 届く入力 |
 * |---|---|
 * | `c4` の 3 段割当 | `type: c4` |
 * | 矢印に出てこない登場人物 (`swimlane`) | 矢印が別の名前を指す |
 * | 縦列を書いた図 | `lanes:` を書く |
 */
describe("箱を作る残りの経路でも読み替わる (#1420)", () => {
  const 落ちない = (記法: string): void => {
    expect(() => layout(textDslToDiagram(記法))).not.toThrow();
  };

  for (const 種類 of DSL_ONLY_KINDS) {
    it(`c4 × ${種類} が組み立つ`, () => {
      落ちない(`title: "t"
type: c4

actors:
  - A: { kind: ${種類} }
  - B: { kind: card }

flow:
  - A -> B: "x"
`);
    });

    it(`矢印が 1 つも箱を置かない図 × ${種類} が組み立つ`, () => {
      /*
       * `swimlane` は矢印から箱を作る。 **1 つも置けなかった時だけ** 登場人物を順に置く
       * 別の経路が動く (`compileSwimlane` の `placedNodes.size === 0`)。
       *
       * 矢印が 1 本でも箱を置くとこの経路は通らない = 矢印が別の名前を指すだけでは届かない
       * (実測 = `B -> C` を書くと `A` は図に出ず、経路も通らなかった)。
       * 矢印が誰も指さない形で届かせる。
       */
      落ちない(`title: "t"
type: swimlane

actors:
  - A: { kind: ${種類} }
  - B: { kind: card }

flow:
  - X -> Y: "居ない相手"
`);
    });

    it(`縦列を書いた図 × ${種類} が組み立つ`, () => {
      落ちない(`title: "t"
type: flow

lanes:
  L1: { width: 320 }
  L2: { width: 320 }

actors:
  - A: { kind: ${種類}, lane: L1 }
  - B: { kind: card, lane: L2 }

flow:
  - A -> B: "x"
`);
    });
  }
});
