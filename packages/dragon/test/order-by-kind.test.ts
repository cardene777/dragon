/**
 * `order: 種類` が箱を種別で並べ替える (#1411 / #2655)。
 *
 * 並べ替えを書いた順序図は、箱を種別の優先度で並べ替えてから組み立てへ渡す。
 * #2655 まで これは `solidity` という別の図種が担っていた。
 *
 * | 種別 | 並び |
 * |---|---|
 * | `eoa` / `actor` / `multisig` / `signer` / `wallet` | 0 (左) |
 * | `contract` / `proxy` / `library` / `interface` | 1 |
 * | `storage` | 2 |
 * | `event` | 3 (右) |
 *
 * 書いた順に関わらず「人 → 契約 → 保存 → 出来事」 で並ぶため、契約のやり取りを読む時に
 * 左から右へ流れが揃う。
 *
 * #1466 で順序図は 1 枚の板になり、面ごとの縦列は無くなった。 並びは板の見出しが持つ。
 *
 * ## なぜ検査が要るか
 *
 * この機能は #1411 まで **見本が 1 件も無く、検査も無かった**。 壊れても誰も気付かない。
 *
 * ## 古い綴りも同じ経路を通る
 *
 * `type: solidity` は読み取りの入口で 順序図 + `order: 種類` に読み替わる (#2655)。
 * 書いてある記法を壊さないための経路なので、同じ並びになることを 1 件で固定する。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram } from "../src";

type 図 = {
  lanes?: { id: string }[];
  nodes: { id: string; kind?: string; sequenceData?: { actors: { name: string }[] } }[];
};

const 記法 = (中身: string) => textDslToDiagram(中身) as unknown as 図;
/** 板の見出しに並ぶ面の名前 (小文字にして、旧 縦列 id と同じ読み方にする)。 */
const 並び = (d: 図) => {
  const 板 = d.nodes.find((n) => n.kind === "sequence-board");
  const 面 = 板?.sequenceData?.actors ?? [];
  if (面.length === 0) throw new Error("板の見出しを 1 つも読めていない (検査が空振りしている)");
  return 面.map((a) => a.name.toLowerCase());
};

describe("order: 種類 は種別で縦列を並べ替える (#1411 / #2655)", () => {
  it("書いた順が逆でも 人 → 契約 → 保存 → 出来事 で並ぶ", () => {
    // **わざと逆順で書く**。 順に書くと `sequence` と区別が付かず、並べ替えが働いている
    // ことを確かめられない
    const d = 記法(`title: "t"
type: sequence
order: 種類

actors:
  - Ev: { kind: event }
  - Store: { kind: storage }
  - Token: { kind: contract }
  - User: { kind: eoa }

flow:
  - User -> Token: "call"
`);
    expect(並び(d)).toEqual(["user", "token", "store", "ev"]);
  });

  it("同じ優先度どうしは書いた順を保つ", () => {
    // 並べ替えは優先度だけで決まる。 同じ層の中で入れ替わると、書き手が意図した並びが崩れる
    const d = 記法(`title: "t"
type: sequence
order: 種類

actors:
  - Proxy: { kind: proxy }
  - Impl: { kind: contract }
  - Lib: { kind: library }
  - User: { kind: eoa }

flow:
  - User -> Proxy: "call"
`);
    expect(並び(d)).toEqual(["user", "proxy", "impl", "lib"]);
  });

  it("表に無い種別は一番後ろに回る", () => {
    // 知らない種別を前に出すと、種別を書いた箱の並びに割り込んで意味が崩れる
    const d = 記法(`title: "t"
type: sequence
order: 種類

actors:
  - Unknown: { kind: card }
  - Store: { kind: storage }
  - User: { kind: eoa }

flow:
  - User -> Store: "write"
`);
    expect(並び(d)).toEqual(["user", "store", "unknown"]);
  });

  it("並べ替えを書かなければ並べ替えない (違いを固定する)", () => {
    /*
     * **陰性対照**。 同じ記法から並べ替えの行だけを外すと書いた順のまま並ぶ。
     * これが無いと、並びを決めているのが `order:` だという主張を確かめられない
     * (順序図が常に並べ替える実装に変わっても上の 3 件は通る)。
     */
    const d = 記法(`title: "t"
type: sequence

actors:
  - Ev: { kind: event }
  - Store: { kind: storage }
  - Token: { kind: contract }
  - User: { kind: eoa }

flow:
  - User -> Token: "call"
`);
    expect(並び(d)).toEqual(["ev", "store", "token", "user"]);
  });

  it("古い綴り `type: solidity` も同じ並びになる", () => {
    // 読み替えの経路。 書いてある 23 件の記法を 1 件も直さずに済むことを、ここで固定する
    const d = 記法(`title: "t"
type: solidity

actors:
  - Ev: { kind: event }
  - Store: { kind: storage }
  - Token: { kind: contract }
  - User: { kind: eoa }

flow:
  - User -> Token: "call"
`);
    expect(並び(d)).toEqual(["user", "token", "store", "ev"]);
  });
});
