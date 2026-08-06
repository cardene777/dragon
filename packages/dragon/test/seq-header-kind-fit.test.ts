/**
 * 名札に載せる種類を「名前が箱に収まる時だけ」 に絞る検証 (#1061)。
 *
 * `#975` が「書いた種類を名札に載せる」 を入れ、 `#1058` が「書かなかった時は載せない」 を
 * 直した。 残っていたのは **書いた時にはみ出す** 側で、 名札は小型の箱 (`h: 72`) なのに
 * 描画側は `actor` / `function` / `storage` / `event` の名前を固定位置に置くため、 名前が箱の
 * 下端をまたいでいた (実測 = actor 21.6 / function 21.6 / storage 13.6 / event 24.2 world px)。
 *
 * ここでは組み立ての結果 (どの種類が名札に残るか) を見る。 **表の値が実際の描画と合っているか**
 * は `apps/playground-spa/tests/node-label-fit.spec.ts` が実 render で両側 (その高さで収まる /
 * 1 低いとはみ出す) を測る。 組み立てだけを見ると、 表の値が実装から乖離しても気付けない。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

const 図 = (actors: string, type = "sequence"): CdlDiagram =>
  textDslToDiagram(`
title: "t"
type: ${type}

actors:
${actors}

flow:
  - A -> B: "x"
`);

const kindOf = (d: CdlDiagram, id: string): string | undefined =>
  d.nodes.find((n) => n.id === id)?.kind;
const hOf = (d: CdlDiagram, id: string): number | undefined => d.nodes.find((n) => n.id === id)?.h;

/** 名札の高さ (72) では名前が箱からはみ出す 4 種と、 収まるのに要る高さ。 */
const 収まらない種別 = [
  { kind: "actor", 要る高さ: 95 },
  { kind: "function", 要る高さ: 94 },
  { kind: "storage", 要る高さ: 86 },
  { kind: "event", 要る高さ: 96 },
] as const;

describe("名札に載せる種類 (#1061)", () => {
  describe.each(収まらない種別)("$kind", ({ kind, 要る高さ }) => {
    it("既定の高さ (72) では card に落ちる", () => {
      const d =図(`  - A\n  - B: ${kind}`);
      expect(hOf(d, "b-header"), "名札の高さが 72 から動いている").toBe(72);
      expect(kindOf(d, "b-header")).toBe("card");
    });

    it("下端の名札も一緒に落ちる", () => {
      // 上下で形が違うと、 同じ登場人物が別物に見える。
      const d =図(`  - A\n  - B: ${kind}`);
      expect(kindOf(d, "b-footer")).toBe("card");
    });

    it("収まる高さを書けば載る", () => {
      const d =図(`  - A\n  - B:\n      kind: ${kind}\n      大きさ: 300,${要る高さ}`);
      expect(hOf(d, "b-header"), "書いた高さが名札に届いていない").toBe(要る高さ);
      expect(kindOf(d, "b-header")).toBe(kind);
      expect(kindOf(d, "b-footer")).toBe(kind);
    });

    it("1 低いと落ちる", () => {
      // 表の値そのものを見る。 「収まる高さを書けば載る」 だけだと、 表を小さくする方向の
      // 誤り (はみ出す高さで載せてしまう) が通り抜ける。
      const d =図(`  - A\n  - B:\n      kind: ${kind}\n      大きさ: 300,${要る高さ - 1}`);
      expect(hOf(d, "b-header")).toBe(要る高さ - 1);
      expect(kindOf(d, "b-header")).toBe("card");
    });
  });

  it("収まる種類は触らない", () => {
    // 落とす対象は「名前を箱の高さに関係なく固定の位置に置く」 4 種だけ。 汎用の種別は
    // 名札の高さでも名前が箱に収まる (実測 = `database` / `service` とも下端との差 0)。
    const d =図(`  - A: database\n  - B: service`);
    expect(kindOf(d, "a-header")).toBe("database");
    expect(kindOf(d, "b-header")).toBe("service");
  });

  it("`shape-` の種別は対象外", () => {
    // これらは名前を箱ではなく自分の絵に対して置く (実測 = `shape-code-block` は箱が 30 でも
    // 絵は 180 で描かれ、 名前は絵の中にある)。 箱を基準に測る判定を当てると、 Solidity の図が
    // 一律 `card` になって `#975` の読み替え (`contract` → `shape-smart-contract`) が消える。
    const d =図(`  - A: contract\n  - B: eoa`);
    expect(kindOf(d, "a-header")).toBe("shape-smart-contract");
    expect(kindOf(d, "b-header")).toBe("shape-wallet");
  });

  it("行を書いた名札は種類が残る", () => {
    // 行を書くと `requiredRowsHeight` で高さが上がり、 名前が収まる。
    const d =図(`  - A\n  - B: { kind: storage, rows: ["count: 1"] }`);
    expect(hOf(d, "b-header")!, "行の分だけ高さが上がっていない").toBeGreaterThanOrEqual(206);
    expect(kindOf(d, "b-header")).toBe("storage");
  });

  it("高さが足りなくても行を書いた名札は落とさない", () => {
    // `card` は行を描かない。 落とすと書いた行が画面から消える (`#387` と同じ壊れ方)。
    // 行が枠からはみ出すことは cdl 側の軸が別に報告する。
    //
    // 高さは `nodes` override で書く。 `大きさ:` は下端に届かず、 揃えが下端の 72 に戻して
    // しまうため「高さが足りない」 状態を作れない。
    const d =図(
      `  - A\n  - B: { kind: storage, rows: ["count: 1"], nodes: { header: { posX: 10, posY: 20, posW: 200, posH: 50 } } }`,
    );
    const header = d.nodes.find((n) => n.id === "b-header");
    expect(header?.posH, "書いた高さが名札に届いていない").toBe(50);
    expect(kindOf(d, "b-header")).toBe("storage");
    expect(kindOf(d, "b-footer"), "行を持つ組の下端まで落ちている").toBe("storage");
  });

  it("上端だけ高さを書いても上下で形を揃える", () => {
    // `nodes` override は「その名札だけを指定の大きさにする」 指定なので、 上端 (120) は
    // 収まり下端 (72) は収まらない。 1 つずつ判定すると同じ登場人物が上下で別の形になる。
    const d =図(
      `  - A\n  - B: { kind: actor, nodes: { header: { posX: 10, posY: 20, posW: 200, posH: 120 } } }`,
    );
    expect(d.nodes.find((n) => n.id === "b-header")?.posH).toBe(120);
    expect(kindOf(d, "b-header")).toBe("card");
    expect(kindOf(d, "b-footer")).toBe("card");
  });

  it("揃えで高さが上がった図では他の名札の種類も残る", () => {
    // 名札の高さは全本で揃える。 1 本が行を持つと全体が上がるので、 同じ図の `event` も収まる。
    // 判定を揃えの後に置いていないと、 ここが `card` に落ちる。
    const d =図(`  - A: { kind: storage, rows: ["count: 1"] }\n  - B: event`);
    expect(hOf(d, "b-header")!).toBeGreaterThanOrEqual(206);
    expect(kindOf(d, "b-header")).toBe("event");
    expect(kindOf(d, "a-header")).toBe("storage");
  });

  it("solidity の図でも同じに落ちる", () => {
    const d =図(`  - A\n  - B: storage`, "solidity");
    expect(kindOf(d, "b-header")).toBe("card");
  });

  it("名札を持たない図には効かない", () => {
    // `type: flow` は 1 登場人物 = 1 箱で、 名札の対を持たない。 箱は種別の既定の大きさで
    // 描かれるので、 落とす理由が無い。
    const d =図(`  - A: actor\n  - B: event`, "flow");
    expect(kindOf(d, "a")).toBe("actor");
    expect(kindOf(d, "b")).toBe("event");
  });
});
