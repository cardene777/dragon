/**
 * sequence / solidity preset の actor が「行を描く kind + rows」 を宣言した時、 header node に
 * その kind が載り、 行が枠内に収まる高さになることを固定する (#387)。
 *
 * これらの preset は header を `kind: card` / `h: 72` 固定で作る。 v0.5 の inline option は
 * `rows` だけを header に copy していたため、 行を描かない card に rows が付いて画面から消えて
 * いた。 cdl 側の Axis 67 (`rows-not-rendered`) がこの状態を error として検知する。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { visualValidate, layout, requiredRowsHeight, requiredRowsWidth } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

const src = (actorLine: string): string => `
title: "t"
type: sequence

actors:
  - Client: { kind: actor }
  - ${actorLine}

flow:
  - Client -> DB: "write"
`;

const nodeById = (d: CdlDiagram, id: string) => d.nodes.find((n) => n.id === id);

describe("行を描く kind を宣言した sequence actor (#387)", () => {
  it("header に kind が載る", () => {
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: ["count: 1"] }`));
    expect(nodeById(d, "db-header")?.kind).toBe("storage");
  });

  it("rows も header に載る", () => {
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: ["count: 1"] }`));
    expect(nodeById(d, "db-header")?.rows).toEqual(["count: 1"]);
  });

  it("cdl が要求する高さ以上になる", () => {
    const rows = ["a: 1", "b: 2", "c: 3"];
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: ["a: 1", "b: 2", "c: 3"] }`));
    const n = nodeById(d, "db-header")!;
    expect(n.h).toBeGreaterThanOrEqual(requiredRowsHeight("storage", rows.length)!);
  });

  it("長い行でも cdl が要求する幅以上になる", () => {
    // preset は header を w=140 固定で作る。 行が長いと横に溢れるので広げる。
    const long = ["averylongkeyname: averylongvaluehere"];
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: ["averylongkeyname: averylongvaluehere"] }`));
    const n = nodeById(d, "db-header")!;
    expect(n.w).toBeGreaterThanOrEqual(requiredRowsWidth(long));
  });

  it("短い行でも幅が足りなければ広げる", () => {
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: ["count: 1"] }`));
    const n = nodeById(d, "db-header")!;
    expect(n.w).toBeGreaterThanOrEqual(requiredRowsWidth(["count: 1"]));
  });

  it("GenericNode 側の kind でも同じように載る", () => {
    const d = textDslToDiagram(src(`DB: { kind: database, rows: ["count: 1"] }`));
    const n = nodeById(d, "db-header")!;
    expect(n.kind).toBe("database");
    expect(n.h).toBeGreaterThanOrEqual(requiredRowsHeight("database", 1)!);
  });

  it("Axis 67 が発火しない", () => {
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: ["count: 1"] }`));
    expect(visualValidate(d).counts["rows-not-rendered"]).toBe(0);
  });
});

describe("行を宣言しない sequence actor は従来どおり (#387)", () => {
  it("rows が無ければ kind を載せない (header の見た目を変えない)", () => {
    // header は lifeline 上端の名札で、 kind ごとに見た目を変えると読み方が変わる。
    // 行を出す意図が明示された時だけ切り替える。
    const d = textDslToDiagram(src(`DB: { kind: storage }`));
    const n = nodeById(d, "db-header")!;
    // 入力は `storage` なので、 `rows.length > 0` の条件を外すと header が `storage` に
    // 変わる = この assertion で捕まえられる。
    expect(n.kind).toBe("card");
  });

  it("行を描かない kind に rows を書いた場合は載せない", () => {
    // `actor` は行を描かない。 header の既定も `card` なので、 `rendersRows` の判定を
    // 外すと header が `actor` に変わる = この test で捕まえられる (`card` を入力に使うと
    // card → card の代入になり、 判定を外しても通ってしまう)。
    //
    // rows は消えたまま残るが、 この状態は Axis 67 が error として報告する = 黙って消さない。
    const d = textDslToDiagram(src(`DB: { kind: actor, rows: ["count: 1"] }`));
    const n = nodeById(d, "db-header")!;
    expect(n.kind).toBe("card");
    // 本経路を通ると行に合わせて幅が広がる。 preset の固定幅のままであることで、
    // 通っていないと分かる。
    expect(n.w!).toBeLessThan(requiredRowsWidth(["count: 1"]));
    expect(visualValidate(d).counts["rows-not-rendered"]).toBe(1);
  });

  it("rows が空配列なら切り替えない", () => {
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: [] }`));
    expect(nodeById(d, "db-header")?.kind).toBe("card");
  });
});

describe("preset 種別ごとの適用範囲 (#387)", () => {
  it("solidity preset でも header に載る", () => {
    const d = textDslToDiagram(`
title: "t"
type: solidity

actors:
  - Caller: { kind: eoa }
  - Vault: { kind: storage, rows: ["balance: 100"] }

flow:
  - Caller -> Vault: "deposit()"
`);
    const n = nodeById(d, "vault-header")!;
    expect(n.kind).toBe("storage");
    expect(n.rows).toEqual(["balance: 100"]);
    expect(n.h).toBeGreaterThanOrEqual(requiredRowsHeight("storage", 1)!);
  });

  it("非 seq preset は header を作らないので対象外", () => {
    // flow preset は actor 名 slug がそのまま node id になり、 header/footer の対を持たない。
    // rows は node に直接載るので、 本経路の切り替えは要らない。
    const d = textDslToDiagram(`
title: "t"
type: flow

actors:
  - A: { kind: storage, rows: ["x: 1"] }
  - B: { kind: card }

flow:
  - A -> B: "go"
`);
    expect(nodeById(d, "a-header")).toBeUndefined();
    const n = nodeById(d, "a")!;
    expect(n.rows).toEqual(["x: 1"]);
    // 本経路を通ると w / h が上書きされる。 通っていないことを寸法で固定する
    // (`isSeqLike &&` を外した regression をここで捕まえる)。
    expect(n.w).toBeUndefined();
    expect(n.h).toBeUndefined();
    // cdl 側の自動寸法が効き、 行は枠内に収まる。 経路の判別は上の raw w / h で足りる
    // (本経路は必ず両方を set するため)。 ここは寸法が破綻していないことだけを見る。
    const laid = layout(d).nodes.find((x) => x.id === "a")!;
    expect(laid.h).toBeGreaterThanOrEqual(requiredRowsHeight("storage", 1)!);
    expect(laid.w).toBeGreaterThanOrEqual(requiredRowsWidth(["x: 1"]));
    expect(visualValidate(d).counts["rows-not-rendered"]).toBe(0);
  });
});
