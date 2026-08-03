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

/** `src()` から組み立てる短縮形。 */
const d0 = (actorLine: string) => textDslToDiagram(src(actorLine));

describe("行を宣言しなくても kind は載る (#975)", () => {
  it("rows が無くても kind を載せる", () => {
    // #387 では「行を出す意図が明示された時だけ切り替える」 としていたが、 **書いたとおりに
    // ならない方が読み手を惑わせる** ため #975 で常に載せる形にした。 名札の高さは揃えるので
    // 縦線の始まる位置はばらけない。
    const d = textDslToDiagram(src(`DB: { kind: storage }`));
    expect(nodeById(d, "db-header")?.kind).toBe("storage");
  });

  it("行を描かない kind でも載せる", () => {
    const d = textDslToDiagram(src(`DB: { kind: actor, rows: ["count: 1"] }`));
    const n = nodeById(d, "db-header")!;
    expect(n.kind).toBe("actor");
    // 行を描かない kind なので幅は広げない。 行が出ないことは Axis 67 が報告する。
    expect(n.w!).toBeLessThan(requiredRowsWidth(["count: 1"]));
    expect(visualValidate(d).counts["rows-not-rendered"]).toBe(1);
  });

  it("rows が空配列でも kind は載る", () => {
    expect(nodeById(d0(`DB: { kind: storage, rows: [] }`), "db-header")?.kind).toBe("storage");
  });

  it("下端の名札も同じ kind にする", () => {
    // 上下で形が違うと、 同じ登場人物が別物に見える。
    const d = textDslToDiagram(src(`DB: { kind: storage }`));
    expect(nodeById(d, "db-footer")?.kind).toBe("storage");
  });

  it("下端に行は出さない", () => {
    // 同じ行が 2 度出ると読み手が混乱する。
    const d = textDslToDiagram(src(`DB: { kind: storage, rows: ["count: 1"] }`));
    expect(nodeById(d, "db-footer")?.rows).toBeUndefined();
  });

  it("描画側に無い語は意味の近い形に読み替える", () => {
    // 記法の kind は描画の kind より広い。 そのまま渡すと大きさを引けずに描画が落ちる
    // (実測 = solidity の golden 4 件が `Cannot read properties of undefined`)。
    // 一律 card にすると Solidity の図だけ「書いたとおりの形」 にならないので読み替える。
    expect(nodeById(d0(`DB: { kind: eoa }`), "db-header")?.kind).toBe("shape-wallet");
    expect(nodeById(d0(`DB: { kind: contract }`), "db-header")?.kind).toBe("shape-smart-contract");
    expect(nodeById(d0(`DB: { kind: multisig }`), "db-header")?.kind).toBe("signer");
  });

  it("読み取れない語は記法側の既定になる", () => {
    // 未知の語は記法の parse が既定 (`actor`) に落とす。 描画側に無い語がそのまま来ることは
    // ないが、 来た時のために `drawableKind` が `undefined` を返す形も残してある。
    expect(nodeById(d0(`DB: { kind: 知らない語 }`), "db-header")?.kind).toBe("actor");
  });

  it("`posH` を書いた名札は揃えの対象から外す", () => {
    // `posH` は「自動計算を使わずこの値にする」 指定。 揃える処理が黙って変えてはいけない。
    const d = textDslToDiagram(`
title: "t"
type: sequence

actors:
  - A: { kind: actor }
  - DB: { kind: storage, 行: ["count: 1"], nodes: { header: { posX: 10, posY: 20, posW: 200, posH: 50 } } }

flow:
  - A -> DB: "x"
`);
    expect(nodeById(d, "db-header")?.posH).toBe(50);
  });

  it("名前が `Header` で終わる登場人物の目印を巻き込まない", () => {
    // 名札の id は `{laneId}-header` の構造。 末尾の一致だけで見ると、 登場人物名が
    // `Auth Header` の時に step の目印 `s0-auth-header` を拾い、 見えない 2px の箱を
    // 名札の高さまで広げてしまう (#883 と同根)。
    const d = textDslToDiagram(`
title: "t"
type: sequence

actors:
  - "Auth Header": { kind: actor }
  - DB: { kind: storage, 行: ["count: 1"] }

flow:
  - "Auth Header" -> DB: "x"
`);
    const anchors = d.nodes.filter((n) => /^s\d+-/.test(n.id));
    expect(anchors.length, "step の目印が無い").toBeGreaterThan(0);
    for (const a of anchors) {
      expect(a.h, `${a.id} が広げられている`).toBeLessThanOrEqual(2);
    }
  });

  it("`posH` を書いても他の名札は動かない", () => {
    // 「その名札だけを指定の大きさにし、 他には影響させない」 という指定 (`types.ts` の
    // `nodes` override)。 揃える処理が値を候補に入れると、 無関係な名札まで引きずられる
    // (実測 = `posH: 400` を 1 つ書くと他が 72 → 400 になった)。
    const withPos = textDslToDiagram(`
title: "t"
type: sequence

actors:
  - A: { kind: actor }
  - B: { kind: actor, nodes: { header: { posX: 10, posY: 20, posW: 200, posH: 400 } } }

flow:
  - A -> B: "x"
`);
    const plain = textDslToDiagram(`
title: "t"
type: sequence

actors:
  - A: { kind: actor }
  - B: { kind: actor }

flow:
  - A -> B: "x"
`);
    const hOf = (d: CdlDiagram, id: string) => nodeById(d, id)?.h;
    for (const id of ["a-header", "a-footer", "b-footer"]) {
      expect(hOf(withPos, id), `${id} が引きずられている`).toBe(hOf(plain, id));
    }
    expect(nodeById(withPos, "b-header")?.posH).toBe(400);
  });

  it("名札が伸びた分だけ縦線が伸び、 中心もその分だけ動く", () => {
    // 揃える処理が片方だけ動かすと、 名札が縦線からはみ出す。 揃える前と後を実 layout で
    // 比べて、 差分の関係を直接見る。
    const dsl = (rows: string): string => `
title: "t"
type: sequence

actors:
  - A: { kind: actor }
  - DB: { kind: storage${rows} }

flow:
  - A -> DB: "x"
`;
    // inline map では `rows:` の綴りが要る (`行:` は縦書きの block でだけ読まれる)。
    const before = layout(textDslToDiagram(dsl(`, rows: ["count: 1"]`)));
    const after = layout(textDslToDiagram(dsl(`, rows: ["count: 1", "sum: 2", "avg: 3", "max: 4"]`)));
    const n = (d: typeof before, id: string) => d.nodes.find((x) => x.id === id)!;
    const lane = (d: typeof before, id: string) => d.lanes.find((l) => l.id === id)!;

    const dTop = n(after, "db-header").h - n(before, "db-header").h;
    const dBottom = n(after, "db-footer").h - n(before, "db-footer").h;
    expect(dTop, "行を増やしても上端が伸びていない").toBeGreaterThan(0);
    // 上端と下端は同じだけ伸びる (揃える処理が片方だけ動かしていない)。
    expect(dBottom, "上端と下端の伸びが違う").toBe(dTop);
    // 縦線は 2 つの伸びの合計だけ伸びる。
    expect(lane(after, "db").height - lane(before, "db").height).toBe(dTop + dBottom);
    // 下端の中心は「上端の伸び + 自分の伸びの半分」 だけ下がる。
    expect(n(after, "db-footer").cy - n(before, "db-footer").cy).toBe(dTop + dBottom / 2);
    // 上端の中心は自分の伸びの半分だけ下がる。
    expect(n(after, "db-header").cy - n(before, "db-header").cy).toBe(dTop / 2);
  });

  it("縦線の高さと下端の位置が名札の高さと整合する", () => {
    // 下端を上端と同じ高さにすると縦線が伸び、 下端の中心はその半分だけ下がる。
    // 揃える処理が片方だけ動かすと、 名札が縦線からはみ出す。
    const d = layout(
      textDslToDiagram(`
title: "t"
type: sequence

actors:
  - A: { kind: actor }
  - DB: { kind: storage, 行: ["count: 1"] }

flow:
  - A -> DB: "x"
`),
    );
    const hs = d.nodes.filter((n) => /-(header|footer)$/.test(n.id)).map((n) => n.h);
    expect(new Set(hs).size, `名札の高さが揃っていない: ${JSON.stringify(hs)}`).toBe(1);
    // 下端は縦線の中に収まる。
    for (const n of d.nodes.filter((x) => x.id.endsWith("-footer"))) {
      const lane = d.lanes.find((l) => l.id === n.lane)!;
      expect(n.cy + n.h / 2, `${n.id} が縦線からはみ出す`).toBeLessThanOrEqual(lane.y + lane.height + 1);
    }
  });

  it("大きさを書いたとおりにする", () => {
    // 名札の大きさはどこにも載っていなかった (実測 = `大きさ: 300,120` を書いても 140x72)。
    const d = textDslToDiagram(`
title: "t"
type: sequence

actors:
  - A: { kind: actor }
  - B:
      kind: service
      大きさ: 300,120

flow:
  - A -> B: "x"
`);
    expect(nodeById(d, "b-header")?.w).toBe(300);
    expect(nodeById(d, "b-footer")?.w).toBe(300);
    // 高さは揃える対象なので、 書いた値は候補として使う。 全名札が同じ高さになる。
    const hs = d.nodes.filter((n) => /-(header|footer)$/.test(n.id)).map((n) => n.h);
    expect(new Set(hs).size).toBe(1);
    expect(hs[0]).toBe(120);
  });

  it("名札の高さを揃える", () => {
    // kind ごとに高さが変わると縦線の始まる位置がばらけ、 「同じ高さから下りる」 読み方が
    // 崩れる (実測 = 行を持つ名札だけ 134px 下にずれた)。
    const d = textDslToDiagram(`
title: "t"
type: sequence

actors:
  - A: { kind: actor }
  - DB: { kind: storage, rows: ["count: 1"] }

flow:
  - A -> DB: "x"
`);
    const hs = d.nodes.filter((n) => /-(header|footer)$/.test(n.id)).map((n) => n.h);
    expect(new Set(hs).size, `高さが揃っていない: ${JSON.stringify(hs)}`).toBe(1);
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
