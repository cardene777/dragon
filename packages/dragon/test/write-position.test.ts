/**
 * 画面で見えている座標を DSL 本文に書き戻せることの検証。
 *
 * 見るのは 3 つ。 4 通りの書き方それぞれで元の形を保ったまま位置だけ変わるか、
 * 書き戻した本文が読み直せるか、 対象以外の行を触らないか。
 *
 * 「書けた」 だけでは足りない。 書いた本文を parse し直して、 狙った座標として読めることを
 * 確かめる (本文の見た目が正しくても記法として通らなければ意味がない)。
 */
import { describe, it, expect } from "vitest";
import { writeActorPosition } from "../src/write-position";
import { parseTextDslV05 } from "../src/v05";

/** 書き戻した本文を読み直して、 対象の座標を返す。 */
function posOf(src: string, name: string): { posX?: number; posY?: number; kind?: string } {
  const r = parseTextDslV05(src);
  if (!r.ok) {
    throw new Error(`書き戻した本文が読めない:\n${r.errors.map((e) => `L${e.line} ${e.message}`).join("\n")}`);
  }
  const a = r.doc.actors.find((x) => x.name === name);
  if (!a) throw new Error(`actor が消えた: ${name}`);
  return { posX: a.posX, posY: a.posY, kind: a.kind };
}

const wrap = (actors: string): string => `title: "t"
type: flow
actors:
${actors}
flow:
  - Web -> API: "a"
`;

describe("位置の書き戻し = 4 通りの書き方", () => {
  it("種類だけの短い形は `@x,y` を足す", () => {
    const src = wrap("  - Web: service\n  - API: service");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("  - API: service @300,200");
    expect(posOf(out, "API")).toMatchObject({ posX: 300, posY: 200, kind: "service" });
  });

  it("既に `@x,y` があれば差し替える (二重に足さない)", () => {
    const src = wrap("  - Web: service\n  - API: service @10,20");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("@300,200");
    expect(out).not.toContain("@10,20");
    expect(posOf(out, "API")).toMatchObject({ posX: 300, posY: 200 });
  });

  it("名前だけの行は値を書ける形にしてから足す", () => {
    const src = wrap("  - Web: service\n  - API");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("  - API: @300,200");
    expect(posOf(out, "API")).toMatchObject({ posX: 300, posY: 200 });
  });

  it("縦に並べた形は `位置:` の行を足す", () => {
    const src = wrap('  - Web: service\n  - API:\n      kind: service\n      補足: "x"');
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("      位置: 300,200");
    // 既にある項目を消さない
    expect(out).toContain("      kind: service");
    expect(out).toContain('      補足: "x"');
    expect(posOf(out, "API")).toMatchObject({ posX: 300, posY: 200, kind: "service" });
  });

  it("縦に並べた形に `位置:` があれば値だけ差し替える", () => {
    const src = wrap("  - Web: service\n  - API:\n      kind: service\n      位置: 10,20");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("      位置: 300,200");
    expect(out).not.toContain("位置: 10,20");
    expect(posOf(out, "API")).toMatchObject({ posX: 300, posY: 200 });
  });

  it("相対で書いてあっても座標に置き換わる", () => {
    const src = wrap("  - Web: service\n  - API:\n      kind: service\n      位置: Web の右 200");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("      位置: 300,200");
    expect(out).not.toContain("Web の右");
    expect(posOf(out, "API")).toMatchObject({ posX: 300, posY: 200 });
  });

  it("中括弧の形は中の posX / posY を差し替える", () => {
    const src = wrap("  - Web: service\n  - API: { kind: service, posX: 10, posY: 20 }");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("posX: 300");
    expect(out).toContain("posY: 200");
    expect(out).toContain("kind: service");
    expect(posOf(out, "API")).toMatchObject({ posX: 300, posY: 200, kind: "service" });
  });

  it("中括弧の入れ子の中の posX は触らない", () => {
    const src = wrap("  - Web: service\n  - API: { kind: service, nodes: { header: { posX: 5, posY: 6 } } }");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("posX: 5");
    expect(out).toContain("posX: 300");
  });
});

describe("位置の書き戻し = 触ってよい範囲", () => {
  it("他の登場人物の行を変えない", () => {
    const src = wrap("  - Web: service @1,2\n  - API: service");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("  - Web: service @1,2");
  });

  it("同じ名前で始まる別人を巻き込まない", () => {
    // 前方一致で探すと、 先に現れる `APIGateway` を掴む。 探す名前より先に置いて確かめる
    const src = wrap("  - Web: service\n  - APIGateway: service\n  - API: service");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("  - APIGateway: service\n");
    expect(out).toContain("  - API: service @300,200");
  });

  it("名前の一部が一致する別人を掴まない (末尾側)", () => {
    const src = wrap("  - Web: service\n  - PublicAPI: service\n  - API: service");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain("  - PublicAPI: service\n");
    expect(out).toContain("  - API: service @300,200");
  });

  it("引用符付きの名前も書ける", () => {
    const src = wrap('  - Web: service\n  - "決済 基盤": service');
    const out = writeActorPosition(src, "決済 基盤", 300, 200)!;
    expect(out).toContain('  - "決済 基盤": service @300,200');
    expect(posOf(out, "決済 基盤")).toMatchObject({ posX: 300, posY: 200 });
  });

  it("補足に含まれる `@` を座標と取り違えない", () => {
    const src = wrap('  - Web: service\n  - API: service "@1,2 の話"');
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).toContain('"@1,2 の話"');
    expect(out).toContain("@300,200");
  });

  it("居ない名前を渡したら null を返す", () => {
    const src = wrap("  - Web: service\n  - API: service");
    expect(writeActorPosition(src, "いない人", 300, 200)).toBeNull();
  });

  it("数でない座標は書き込まない", () => {
    const src = wrap("  - Web: service\n  - API: service");
    expect(writeActorPosition(src, "API", Number.NaN, 200)).toBeNull();
    expect(writeActorPosition(src, "API", 300, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("小数は整数に丸める (座標の端数は描画で滲む)", () => {
    const src = wrap("  - Web: service\n  - API: service");
    const out = writeActorPosition(src, "API", 300.4, 199.6)!;
    expect(out).toContain("@300,200");
  });

  it("改行が CRLF の本文でも混ぜない", () => {
    const src = wrap("  - Web: service\n  - API:\n      kind: service").replace(/\n/g, "\r\n");
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out).not.toMatch(/[^\r]\n/);
    expect(out).toContain("位置: 300,200");
  });

  it("末尾に改行が無くても行が繋がらない", () => {
    const src = 'title: "t"\ntype: flow\nactors:\n  - Web: service\n  - API:\n      kind: service';
    const out = writeActorPosition(src, "API", 300, 200)!;
    expect(out.split("\n").filter((l) => l.includes("位置")).length).toBe(1);
    expect(out).toMatch(/kind: service\n\s+位置: 300,200$/);
  });
});
