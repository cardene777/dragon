/**
 * `type: solidity` が箱の種別で縦列を並べ替える (#1411)。
 *
 * `solidity` は `sequence` の別名ではない。 `compileSolidity` が箱を種別の優先度で並べ替えて
 * から `sequence` の組み立てへ渡す。
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

describe("solidity は種別で縦列を並べ替える (#1411)", () => {
  it("書いた順が逆でも 人 → 契約 → 保存 → 出来事 で並ぶ", () => {
    // **わざと逆順で書く**。 順に書くと `sequence` と区別が付かず、並べ替えが働いている
    // ことを確かめられない
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

  it("同じ優先度どうしは書いた順を保つ", () => {
    // 並べ替えは優先度だけで決まる。 同じ層の中で入れ替わると、書き手が意図した並びが崩れる
    const d = 記法(`title: "t"
type: solidity

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
type: solidity

actors:
  - Unknown: { kind: card }
  - Store: { kind: storage }
  - User: { kind: eoa }

flow:
  - User -> Store: "write"
`);
    expect(並び(d)).toEqual(["user", "store", "unknown"]);
  });

  it("`sequence` は並べ替えない (違いを固定する)", () => {
    /*
     * **陰性対照**。 同じ記法を `sequence` で書くと書いた順のまま並ぶ。
     * これが無いと、並べ替えが `solidity` 固有だという主張を確かめられない
     * (`sequence` 側も並べ替える実装に変わっても上の 3 件は通る)。
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
});
