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
import { visualValidate, rowBaselineY } from "@cardenelabs/cdl";
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

  it("最終行が枠内に収まる高さになる", () => {
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: ["a: 1", "b: 2", "c: 3"] }`));
    const n = nodeById(d, "db-header")!;
    const lastBaseline = rowBaselineY("storage", 2)!;
    expect(lastBaseline).toBe(242);
    expect(n.h).toBeGreaterThan(lastBaseline);
  });

  it("GenericNode 側の kind でも同じように載る", () => {
    const d = textDslToDiagram(src(`DB: { kind: database, rows: ["count: 1"] }`));
    const n = nodeById(d, "db-header")!;
    expect(n.kind).toBe("database");
    expect(n.h).toBeGreaterThan(rowBaselineY("database", 0)!);
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
    expect(n.kind).toBe("card");
    expect(n.h).toBe(72);
  });

  it("行を描かない kind に rows を書いた場合は載せない", () => {
    // card は行を描かないので、 kind を載せても rows は消えたまま。 この状態は
    // Axis 67 が error として報告する = 黙って消さない。
    const d = textDslToDiagram(src(`DB: { kind: card, rows: ["count: 1"] }`));
    const n = nodeById(d, "db-header")!;
    expect(n.kind).toBe("card");
    expect(visualValidate(d).counts["rows-not-rendered"]).toBe(1);
  });

  it("rows が空配列なら切り替えない", () => {
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: [] }`));
    expect(nodeById(d, "db-header")?.kind).toBe("card");
  });
});
