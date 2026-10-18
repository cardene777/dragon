/**
 * `order: 種類` が箱を種別で並べ替える (#1411 / #2655)。
 *
 * 並べ替えを書いた順序図は、箱を種別の優先度で並べ替えてから組み立てへ渡す。
 * #2655 まで これは別の図種が担っていた。
 *
 * | 種別 | 並び |
 * |---|---|
 * | `actor` / `signer` | 0 (左) |
 * | `storage` | 1 |
 * | `event` | 2 (右) |
 *
 * 書いた順に関わらず「人 → 保存 → 出来事」 で並ぶため、やり取りを読む時に左から右へ流れが
 * 揃う。 Solidity の図に向けた段 (契約) は #2947 で外した。
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

describe("order: 種類 は種別で縦列を並べ替える (#1411 / #2655)", () => {
  it("書いた順が逆でも 人 → 保存 → 出来事 で並ぶ", () => {
    // **わざと逆順で書く**。 順に書くと `sequence` と区別が付かず、並べ替えが働いている
    // ことを確かめられない
    const d = 記法(`title: "t"
type: sequence
order: 種類

actors:
  - Ev: { kind: event }
  - Store: { kind: storage }
  - User: { kind: actor }

flow:
  - User -> Store: "write"
`);
    expect(並び(d)).toEqual(["user", "store", "ev"]);
  });

  it("同じ優先度どうしは書いた順を保つ", () => {
    // 並べ替えは優先度だけで決まる。 同じ層の中で入れ替わると、書き手が意図した並びが崩れる
    const d = 記法(`title: "t"
type: sequence
order: 種類

actors:
  - Ev: { kind: event }
  - Signer: { kind: signer }
  - User: { kind: actor }

flow:
  - User -> Signer: "call"
`);
    expect(並び(d)).toEqual(["signer", "user", "ev"]);
  });

  it("表に無い種別は一番後ろに回る", () => {
    // 知らない種別を前に出すと、種別を書いた箱の並びに割り込んで意味が崩れる
    const d = 記法(`title: "t"
type: sequence
order: 種類

actors:
  - Unknown: { kind: card }
  - Store: { kind: storage }
  - User: { kind: actor }

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
  - User: { kind: actor }

flow:
  - User -> Store: "write"
`);
    expect(並び(d)).toEqual(["ev", "store", "user"]);
  });
});
