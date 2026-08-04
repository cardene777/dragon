import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import {
  extractPartsFromSrc,
  splitTopLevelFields,
  readTopLevelField,
  appendActorLine,
  placeParts,
  partWorldSize,
  normalizePartScale,
  type OverlayPartParsed,
} from "./overlay-dsl";
import { diagram } from "@cardenelabs/cdl";
import { partRenderSize, partsGridCenters } from "@cardenelabs/dragon";
import type { CatalogItem } from "@/lib/catalog-items";

const catalog: Record<string, unknown> = {
  "parts-achievement": {},
  achievement: {},
  "parts-arc-gauge": {},
  "arc-gauge": {},
};
const item = { id: "parts-achievement", title: "Achievement", diagram: {} as any } as CatalogItem;
const item2 = { id: "parts-arc-gauge", title: "Arc", diagram: {} as any } as CatalogItem;
const partsItems = [item, item2];

describe("extractPartsFromSrc", () => {
  it("parts なし src = 全 line が baseSrc、 parts 空", () => {
    const src = `title: "T"
type: sequence
actors:
  - Client
  - API
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toEqual([]);
    expect(r.baseSrc).toBe(src);
  });

  it("achievement 1 個抽出 = base から除去、 parts に posX/posY 反映", () => {
    const src = `actors:
  - Client
  - achievement1: { kind: achievement, posX: 100, posY: 200 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]).toMatchObject({ id: "achievement1", kind: "achievement", posX: 100, posY: 200, scale: 1 });
    expect(r.baseSrc).not.toContain("achievement1");
    expect(r.baseSrc).toContain("Client");
  });

  it("scale field も抽出 (default 1)", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 0, posY: 0, scale: 2.5 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.scale).toBe(2.5);
  });

  it("scale 省略時 = default 1", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 0, posY: 0 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.scale).toBe(1);
  });

  it("位置を書かなければ座標を持たない (置き場所は後で決まる)", () => {
    // 以前はここで 0 を入れていた。 その結果、 位置を書かないパーツが全て図の左上に
    // 重なって出た。 読む処理は「書いていない」 をそのまま返し、 置く処理が格子に並べる
    const src = `actors:
  - a: { kind: achievement }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.posX).toBeUndefined();
    expect(r.parts[0]!.posY).toBeUndefined();
  });

  it("縦横のどちらか片方だけでは位置にしない", () => {
    // 両方揃って初めて位置になる。 片方だけを採ると、 書いた人から見て
    // 「書いたのに効かない」 状態を作れてしまう
    const src = `actors:
  - a: { kind: achievement, posX: 100 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.posX).toBeUndefined();
    expect(r.parts[0]!.posY).toBeUndefined();
  });

  it("複数 parts 混在 = 全抽出、 base 側は 通常 actor のみ", () => {
    const src = `actors:
  - Client
  - a1: { kind: achievement, posX: 100, posY: 200 }
  - API
  - a2: { kind: arc-gauge, posX: 300, posY: 400 }
  - DB
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(2);
    expect(r.parts[0]!.kind).toBe("achievement");
    expect(r.parts[1]!.kind).toBe("arc-gauge");
    expect(r.baseSrc).toContain("Client");
    expect(r.baseSrc).toContain("API");
    expect(r.baseSrc).toContain("DB");
    expect(r.baseSrc).not.toContain("a1");
    expect(r.baseSrc).not.toContain("a2");
  });

  it("未知 kind (parts でない) は base 残留", () => {
    const src = `actors:
  - a: { kind: unknown-kind, posX: 0, posY: 0 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toEqual([]);
    expect(r.baseSrc).toContain("unknown-kind");
  });

  it("小数 posX/posY / 負値 / 大きな値も parse", () => {
    const src = `actors:
  - a: { kind: achievement, posX: -123.456, posY: 9999.9 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.posX).toBeCloseTo(-123.456);
    expect(r.parts[0]!.posY).toBeCloseTo(9999.9);
  });

  it("field 順序独立 (scale が posX より前でも OK)", () => {
    const src = `actors:
  - a: { scale: 1.5, kind: achievement, posY: 200, posX: 100 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.scale).toBe(1.5);
    expect(r.parts[0]!.posX).toBe(100);
    expect(r.parts[0]!.posY).toBe(200);
  });

  it("bg 等追加 field 混在でも parse", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 100, posY: 200, bg: "#f59e0b" }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.posX).toBe(100);
    expect(r.parts[0]!.posY).toBe(200);
  });

  it("bg を parse して OverlayPartRaw.bg に載せる (CAR-2158 correctness fix)", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 100, posY: 200, bg: "#22c55e" }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.bg).toBe("#22c55e");
  });

  it("bg 未指定なら undefined (色 override なし)", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 100, posY: 200 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.bg).toBeUndefined();
  });

  it("色として読めない bg は書かなかった扱いにする (#1004)", () => {
    // `bg` は SVG の `fill` に直接入る。 図の外を指す値を持ち回ると、 その本文を共有された人の
    // 環境から外部へ要求が飛ぶ。 色でなければ既定の見た目に戻す
    for (const bad of [
      'url(https://example.invalid/x)',
      'URL(https://example.invalid/x)',
      'red; background:url(https://example.invalid/x)',
      'https://example.invalid/x',
      '#ff',
    ]) {
      const src = `actors:
  - a: { kind: achievement, posX: 100, posY: 200, bg: "${bad}" }
`;
      const r = extractPartsFromSrc(src, catalog, partsItems);
      expect(r.parts[0]?.bg, bad).toBeUndefined();
    }
  });

  it("色名で書いた bg は通る (#1004)", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 100, posY: 200, bg: "red" }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]?.bg).toBe("red");
  });

  it("bg が field 先頭でも末尾でも parse (順序独立)", () => {
    const head = `actors:
  - a: { bg: "#ef4444", kind: achievement, posX: 10 }
`;
    const tail = `actors:
  - a: { kind: achievement, posX: 10, bg: "#ef4444" }
`;
    expect(extractPartsFromSrc(head, catalog, partsItems).parts[0]!.bg).toBe("#ef4444");
    expect(extractPartsFromSrc(tail, catalog, partsItems).parts[0]!.bg).toBe("#ef4444");
  });
});
describe("extractPartsFromSrc の行の対応 (#998)", () => {
  it("残した行から元の行番号を引ける", () => {
    const src = ["title: x", "actors:", "  - a: service", "flow:", "  - a -> a: y"].join("\n");
    const r = extractPartsFromSrc(src, {}, []);
    expect(r.lineMap).toEqual([1, 2, 3, 4, 5]);
  });

  it("パーツを落とした分だけ番号が飛ぶ", () => {
    // 落とした行を数えないと、 組み立て側が返す行番号が元の本文とずれる。
    const src = [
      "title: x",
      "actors:",
      "  - g:",
      "      kind: arc-gauge",
      "  - a: service",
      "flow:",
      "  - a -> a: y",
    ].join("\n");
    const r = extractPartsFromSrc(src, { "arc-gauge": {} }, [
      { id: "parts-arc-gauge", diagram: {} } as never,
    ]);
    expect(r.parts.length, "パーツが抜き出されていない").toBe(1);
    expect(r.baseSrc.split("\n").length).toBe(r.lineMap.length);
    // 落とした 2 行の後は元の番号に飛ぶ。
    expect(r.lineMap).toEqual([1, 2, 5, 6, 7]);
  });

  it("パーツでない block は行番号ごと戻す", () => {
    const src = ["title: x", "actors:", "  - a:", "      kind: service", "flow:"].join("\n");
    const r = extractPartsFromSrc(src, {}, []);
    expect(r.lineMap).toEqual([1, 2, 3, 4, 5]);
  });
});




describe("nested brace を含む actor 行 (CAR-2158 CRITICAL regression detector)", () => {
  it("state: { ... } を持つ parts 行を落とさない", () => {
    // `[^}]*` 形の regex は最初の `}` で打ち切られ、 この行全体が非 match になる。
    // その結果 parts が overlay から消え、 drag / resize が保存されなくなる。
    const src = `actors:
  - arc1: { kind: arc-gauge, posX: 100, posY: 200, state: { phase: false } }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.id).toBe("arc1");
    expect(r.parts[0]!.posX).toBe(100);
    expect(r.parts[0]!.posY).toBe(200);
  });


  it("nested brace が複数あっても parse できる", () => {
    const src = `actors:
  - arc1: { kind: arc-gauge, state: { phase: false }, style: { fill: "red" }, posX: 10, posY: 20 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.posX).toBe(10);
    expect(r.parts[0]!.posY).toBe(20);
  });
});

describe("nested map の depth-aware 処理 (CAR-2158 Round 3 CRITICAL detector)", () => {
  it("nested nodes 内の posX を top-level と取り違えない", () => {
    // `nodes: { header: { posX: 50 } }` の posX を top-level として読むと座標が 50 になる。
    const src = `actors:
  - a: { kind: achievement, nodes: { header: { posX: 50, posY: 60 } }, posX: 100, posY: 200 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.posX).toBe(100);
    expect(r.parts[0]!.posY).toBe(200);
  });

  it("nested map の中の kind を top-level kind と取り違えない", () => {
    // top-level は arc-gauge。 nested の achievement を拾うと別 parts として解決される。
    const src = `actors:
  - a: { kind: arc-gauge, nodes: { inner: { kind: achievement } }, posX: 10 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.kind).toBe("arc-gauge");
  });



});

describe("quote / escape 処理 (CAR-2158 Round 4 CRITICAL detector)", () => {
  it("escaped quote を含む値で field 分割が壊れない", () => {
    // `\"` を quote 終端と誤認すると、 以降の `,` を field 区切りとして拾い
    // posX の抽出と書き出しが壊れる (二重書き出しになる)。
    const src = `actors:
  - a: { kind: achievement, label: "x \\" y, posX: 9", posX: 100, posY: 200 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.posX).toBe(100);
  });



  it("quoted alias に空白 / 記号を含んでも parse できる", () => {
    const src = `actors:
  - "a, b { c }": { kind: achievement, posX: 7, posY: 8 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.id).toBe("a, b { c }");
    expect(r.parts[0]!.posX).toBe(7);
    expect(r.parts[0]!.posY).toBe(8);
  });
});



describe("appendActorLine (CAR-2158 Round 7 = CdlEditor から移設して test 可能にした)", () => {
  it("actors block の末尾に挿入する", () => {
    const src = "actors:\n  - a: { kind: achievement }\nflow:\n  - a -> a\n";
    expect(appendActorLine(src, "  - b: { kind: achievement }")).toBe(
      "actors:\n  - a: { kind: achievement }\n  - b: { kind: achievement }\nflow:\n  - a -> a\n",
    );
  });

  it("末尾改行なしの DSL で行を連結しない", () => {
    // separator 保持方式に変えた際、 挿入位置が buffer 末尾を越える場合に
    // `splice(idx, 0, newLine, sep)` だと直前の行と newLine が改行なしで繋がっていた。
    const src = "actors:\n  - a: { kind: achievement }";
    expect(appendActorLine(src, "  - b: { kind: achievement }")).toBe(
      "actors:\n  - a: { kind: achievement }\n  - b: { kind: achievement }",
    );
  });

  it("actors のみ (改行なし) でも連結しない", () => {
    expect(appendActorLine("actors:", "  - a: { kind: achievement }")).toBe("actors:\n  - a: { kind: achievement }");
  });

  it("CRLF の DSL では CRLF で挿入する", () => {
    const src = "actors:\r\n  - a: { kind: achievement }\r\nflow:\r\n";
    const out = appendActorLine(src, "  - b: { kind: achievement }");
    expect(out).toBe("actors:\r\n  - a: { kind: achievement }\r\n  - b: { kind: achievement }\r\nflow:\r\n");
    // LF 単独が混ざらない
    expect(out!.match(/(?<!\r)\n/)).toBeNull();
  });

  it("actors block と次 block の間の空行を残したまま挿入する", () => {
    const src = "actors:\n  - a: { kind: achievement }\n\nflow:\n";
    expect(appendActorLine(src, "  - b: { kind: achievement }")).toBe(
      "actors:\n  - a: { kind: achievement }\n  - b: { kind: achievement }\n\nflow:\n",
    );
  });

  it("改行混在の DSL で末尾に足す時、 直前行の改行コードに合わせる", () => {
    // 先頭 LF / 直前 CRLF。 buffer 先頭の separator を見ると挿入位置と無関係な
    // LF を拾い、 混在をさらに進めてしまう。
    const src = "actors:\n  - a: { kind: achievement }\r\n  - b: { kind: achievement }";
    const out = appendActorLine(src, "  - c: { kind: achievement }")!;
    expect(out).toBe("actors:\n  - a: { kind: achievement }\r\n  - b: { kind: achievement }\r\n  - c: { kind: achievement }");
  });

  it("actors block が無ければ null", () => {
    expect(appendActorLine("flow:\n  - a -> b\n", "  - x: {}")).toBeNull();
  });

});

describe("パーツの置き場所 (placeParts)", () => {
  /** どのパーツも 100x100 とみなす。 中心と左上の変換だけを見たいので大きさは固定する */
  const size = (): { w: number; h: number } => ({ w: 100, h: 100 });
  /** 図枠と箱が同じ (余白なし) とみなす。 余白の効き方は parity test 側で見る */
  const box = (): { w: number; h: number; left: number; top: number } => ({
    w: 100,
    h: 100,
    left: 0,
    top: 0,
  });
  const boxes = new Map([["Web", { cx: 500, cy: 300, w: 200, h: 100 }]]);
  const part = (over: Partial<OverlayPartParsed>): OverlayPartParsed => ({
    id: "p",
    kind: "achievement",
    item,
    scale: 1,
    rotate: 0,
    ...over,
  });

  it("座標で書いた中心を、 画面に置く左上に直す", () => {
    const [p] = placeParts([part({ id: "a", posX: 300, posY: 200 })], boxes, size, 1, undefined, box);
    expect(p).toMatchObject({ posX: 250, posY: 150 });
  });

  it("相対で書いた分を基準の縁から離して置く", () => {
    const [p] = placeParts([part({ id: "a", posRel: { anchor: "Web", dir: "right", gap: 50 } })], boxes, size, 1, undefined, box);
    // 中心 = 500 + 100 (相手の半分) + 50 (間隔) + 50 (自分の半分) = 700、 左上はその半分手前
    expect(p!.posX).toBe(650);
    expect(p!.posY).toBe(250);
  });

  it("パーツを基準にしたパーツも置ける", () => {
    const placed = placeParts([
        part({ id: "a", posX: 300, posY: 200 }),
        part({ id: "b", posRel: { anchor: "a", dir: "right", gap: 100 } }),
      ], boxes, size, 1, undefined, box);
    // a の中心 300 から、 縁 50 + 間隔 100 + 自分の半分 50 = 中心 500、 左上 450
    expect(placed[1]!.posX).toBe(450);
  });

  it("基準が連鎖しても書いた順に依らず解ける", () => {
    const placed = placeParts([
        part({ id: "c", posRel: { anchor: "b", dir: "right", gap: 100 } }),
        part({ id: "b", posRel: { anchor: "a", dir: "right", gap: 100 } }),
        part({ id: "a", posX: 300, posY: 200 }),
      ], boxes, size, 1, undefined, box);
    const byId = new Map(placed.map((p) => [p.id, p]));
    expect(byId.get("b")!.posX).toBeGreaterThan(byId.get("a")!.posX);
    expect(byId.get("c")!.posX).toBeGreaterThan(byId.get("b")!.posX);
  });

  it("居ない相手を基準にした分は格子に落とす (図から消さない)", () => {
    const [p] = placeParts([part({ id: "a", posRel: { anchor: "いない人", dir: "right" } })], boxes, size, 1, undefined, box);
    expect(p!.posX).toBeGreaterThanOrEqual(0);
    expect(p!.posY).toBeGreaterThanOrEqual(0);
  });

  it("位置を書かない分だけで格子の番号を数える", () => {
    // 座標を書いた分を数えると、 1 個座標を書いただけで残りの並びがずれる
    const withFixed = placeParts([part({ id: "fixed", posX: 0, posY: 0 }), part({ id: "auto1" }), part({ id: "auto2" })], boxes, size, 1, undefined, box);
    const onlyAuto = placeParts([part({ id: "auto1" }), part({ id: "auto2" })], boxes, size, 1, undefined, box);
    expect(withFixed[1]!.posX).toBe(onlyAuto[0]!.posX);
    expect(withFixed[2]!.posX).toBe(onlyAuto[1]!.posX);
  });

  it("位置を書かない分は箱として重ならない", () => {
    // 座標が違うだけでは足りない。 送り幅が実寸より狭いと、 座標は違っても箱が重なる
    // (実測 = 380 前提で送って実寸 800 のパーツが 300 重なった)
    const placed = placeParts([part({ id: "a" }), part({ id: "b" }), part({ id: "c" }), part({ id: "d" })], boxes, size, 1, undefined, box);
    const rects = placed.map((p) => ({ x0: p.posX, y0: p.posY, x1: p.posX + 100, y1: p.posY + 100 }));
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i]!;
        const b = rects[j]!;
        const overlap = a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
        expect(overlap, `${placed[i]!.id} と ${placed[j]!.id} が重なる`).toBe(false);
      }
    }
  });

  it("実寸が大きいパーツでも重ならない (送り幅を実寸から出す)", () => {
    const big = (): { w: number; h: number } => ({ w: 800, h: 600 });
    const placed = placeParts([part({ id: "a" }), part({ id: "b" })], boxes, big, 1);
    expect(placed[1]!.posX - placed[0]!.posX).toBeGreaterThanOrEqual(800);
  });

  it("格子も中心から左上に直す (書いた位置と意味を揃える)", () => {
    // 自動配置だけ中心値を左上として返すと、 同じ数字が経路によって別の場所を指す。
    // 格子の中心を組み立て側の規則から取り、 それを座標で書いた時と一致するか見る
    const cell = partsGridCenters(1, [{ id: "a", w: 100, h: 100 }]).get("a")!;
    const [auto] = placeParts([part({ id: "a" })], boxes, size, 1, undefined, box);
    const [written] = placeParts([part({ id: "a", posX: cell.cx, posY: cell.cy })], boxes, size, 1, undefined, box);
    expect({ posX: auto!.posX, posY: auto!.posY }).toEqual({ posX: written!.posX, posY: written!.posY });
  });
});

describe("縦に並べて書いたパーツ (block ごと扱う)", () => {
  const vertical = `title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      色: "#f59e0b"
      位置: 300,200
flow:
  - Web -> Web: "a"
`;

  it("block の残り行を前の登場人物に付けない", () => {
    // `kind:` を見た時点で 2 行だけ落とすと、 `色:` と `位置:` が base 側に残り、
    // 1 つ前の `- Web: service` の続きとして読まれる (実測 = Web が色と位置を持った)
    const r = extractPartsFromSrc(vertical, catalog, partsItems);
    expect(r.baseSrc).not.toContain("#f59e0b");
    expect(r.baseSrc).not.toContain("位置: 300,200");
    expect(r.baseSrc).toContain("- Web: service");
  });

  it("縦に並べた形の座標を読む", () => {
    const r = extractPartsFromSrc(vertical, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]).toMatchObject({ id: "実績", kind: "achievement", posX: 300, posY: 200 });
  });

  it("縦に並べた形の相対指定を読む", () => {
    const src = `actors:
  - Web: service
  - 実績:
      kind: achievement
      位置: Web の右 200
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.posRel).toEqual({ anchor: "Web", dir: "right", gap: 200 });
  });

  it("短い形の `@x,y` を読む", () => {
    const src = `actors:
  - Web: service
  - 時計: achievement @400,500
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]).toMatchObject({ id: "時計", posX: 400, posY: 500 });
  });

  it("パーツでない block は行を 1 つも落とさない", () => {
    const src = `actors:
  - Web:
      kind: service
      補足: "x"
flow:
  - Web -> Web: "a"
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toEqual([]);
    expect(r.baseSrc).toBe(src);
  });
});

describe("縦に並べた block の項目の順番", () => {
  it("kind が先頭でなくてもパーツと分かる", () => {
    // 項目の順番は書く人の自由。 位置で決め打ちすると、 順番を変えただけで
    // パーツと認識されず図の中に空の箱が出る
    const src = `actors:
  - Web: service
  - 実績:
      色: "#f59e0b"
      位置: 300,200
      kind: achievement
flow:
  - Web -> Web: "a"
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]).toMatchObject({ id: "実績", kind: "achievement", posX: 300, posY: 200 });
    expect(r.baseSrc).not.toContain("実績");
  });
});

describe("パーツの実寸", () => {
  const partOf = (w: number, h: number, scale = 1): OverlayPartParsed => ({
    id: "p",
    kind: "k",
    scale,
    rotate: 0,
    item: {
      id: "p",
      title: "p",
      diagram: diagram("p", { topic: "p" })
        .lane("l", { width: w })
        .node("box", { lane: "l", stack: 0, kind: "card", title: "p", w, h })
        .build(),
    } as CatalogItem,
  });

  it("大きさは画面が渡す (CSS の既定値は保険、 #937)", async () => {
    const css = await readFile(new URL("../styles/editor.css", import.meta.url), "utf8");
    expect(css).toContain("var(--cdl-svg-w,");
    expect(css).toContain("var(--cdl-svg-h,");
  });

  it("大きさを決める CSS は図の svg だけに掛かる (#937)", async () => {
    // `svg` 全体に掛けると、 パーツの中で使う読み取り widget の内部 svg にも効いて
    // 中身が本来の縦横比で描かれない (実測 = 340x60 の内部 svg が 700x700 になった)
    const css = await readFile(new URL("../styles/editor.css", import.meta.url), "utf8");
    expect(css).toContain(".v4-editor-svg-wrap svg[data-cdl-stage]");
  });

  it("見本の図枠を実寸として使う (#937)", () => {
    // 箱の外接矩形ではなく図枠。 SVG は図枠を基準に収めるので、 箱の値を渡すと縮む
    const part = partOf(400, 300);
    expect(partWorldSize(part)).toEqual(partRenderSize(part.item.diagram));
  });

  it("箱を持たないパーツでも潰れない (#937)", () => {
    // 実体が操作パネルの部品 (`readouts`) のパーツは `w: 1, h: 1` のダミー箱を持つ。
    // 箱だけを見ると 1x1 になり、その値で描くと潰れる
    // (実測 = 2026-08-02 の試みで 17 件が 1px になった)。
    //
    // 図枠を渡せば潰れないが、この 17 件は図の中に描く部品を持たないため、潰れないだけで
    // 図には出ない (`partDrawsInDiagram`、#1017)
    const noBox: OverlayPartParsed = {
      id: "p",
      kind: "p",
      scale: 1,
      rotate: 0,
      item: {
        id: "p",
        title: "p",
        diagram: diagram("p", { topic: "p" })
          .lane("l", { width: 300 })
          .node("_h", { lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1 })
          .build(),
      } as CatalogItem,
    };
    const size = partWorldSize(noBox);
    expect(size.w, "潰れている").toBeGreaterThan(10);
    expect(size.h, "潰れている").toBeGreaterThan(10);
  });

  it("拡大率を掛ける", () => {
    const one = partWorldSize(partOf(400, 300, 1));
    const two = partWorldSize(partOf(400, 300, 2));
    expect(two.w).toBe(one.w * 2);
    expect(two.h).toBe(one.h * 2);
  });

  it("数でない拡大率は 1 として扱う (大きさを 0 にしない)", () => {
    const base = partWorldSize(partOf(400, 300, 1));
    expect(partWorldSize(partOf(400, 300, Number.NaN))).toEqual(base);
    expect(partWorldSize(partOf(400, 300, 0))).toEqual(base);
  });

  it("読んだ時点で拡大率を直す (置き場所と描画で食い違わせない、 #937)", () => {
    // 直さずに持ち回ると、 置き場所は `partWorldSize` が 1 に直した大きさを占めるのに、
    // 画面は生の値で `scale()` を書くため消える / 反転する
    const src = `actors:
  - zero: { kind: achievement, posX: 0, posY: 0, scale: 0 }
  - minus: { kind: achievement, posX: 0, posY: 0, scale: -2 }
`;
    const got = extractPartsFromSrc(src, catalog, partsItems);
    expect(got.parts.length, "パーツが読めていない").toBe(2);
    for (const p of got.parts) {
      expect(p.scale, `拡大率が直っていない (${p.id})`).toBe(1);
    }
  });

  it("拡大率を直す規則は 1 つ (normalizePartScale)", () => {
    expect(normalizePartScale(2)).toBe(2);
    expect(normalizePartScale(0)).toBe(1);
    expect(normalizePartScale(-2)).toBe(1);
    expect(normalizePartScale(Number.NaN)).toBe(1);
    expect(normalizePartScale(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("パーツの置き場所が決まらなかった時の知らせ", () => {
  const size = (): { w: number; h: number } => ({ w: 100, h: 100 });
  const box = (): { w: number; h: number; left: number; top: number } => ({
    w: 100,
    h: 100,
    left: 0,
    top: 0,
  });
  const boxes = new Map([["Web", { cx: 500, cy: 300, w: 200, h: 100 }]]);
  const part = (over: Partial<OverlayPartParsed>): OverlayPartParsed => ({
    id: "p", kind: "achievement", item, scale: 1, rotate: 0, ...over,
  });

  it("基準が見つからない分を知らせる", () => {
    const seen: string[] = [];
    placeParts(
      [part({ id: "a", posRel: { anchor: "いない人", dir: "right" } })],
      boxes,
      size,
      1,
      (n) => seen.push(`${n.reason}:${n.part}:${n.anchor}`),
      box,
    );
    expect(seen).toEqual(["missing:a:いない人"]);
  });

  it("互いを指している分を知らせる", () => {
    const seen: string[] = [];
    placeParts(
      [
        part({ id: "a", posRel: { anchor: "b", dir: "right" } }),
        part({ id: "b", posRel: { anchor: "a", dir: "left" } }),
      ],
      boxes,
      size,
      1,
      (n) => seen.push(`${n.reason}:${n.part}`),
      box,
    );
    expect(seen.sort()).toEqual(["cyclic:a", "cyclic:b"]);
  });

  it("解けた分では知らせない", () => {
    const seen: string[] = [];
    placeParts(
      [part({ id: "a", posRel: { anchor: "Web", dir: "right" } })],
      boxes,
      size,
      1,
      (n) => seen.push(n.message),
      box,
    );
    expect(seen).toEqual([]);
  });

  it("知らせを受け取らなくても格子に落ちる", () => {
    const [p] = placeParts([part({ id: "a", posRel: { anchor: "いない人", dir: "right" } })], boxes, size, 1, undefined, box);
    expect(Number.isFinite(p!.posX)).toBe(true);
  });
});

describe("パーツを抜き出す範囲", () => {
  it("`actors:` の外の行はパーツにしない", () => {
    // 全文を走ると、 別の項目の下に並ぶ行まで図から消える (実測)
    const src = `title: "t"
type: flow
notes:
  - fake: achievement
actors:
  - Web: service
  - 実績: achievement
flow:
  - Web -> Web: "a"
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts.map((p) => p.id)).toEqual(["実績"]);
    expect(r.baseSrc).toContain("  - fake: achievement");
  });

  it("`種類:` でもパーツと分かる (項目名は日本語でもよい)", () => {
    const src = `actors:
  - Web: service
  - 実績:
      種類: achievement
      位置: 300,200
flow:
  - Web -> Web: "a"
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]).toMatchObject({ id: "実績", kind: "achievement", posX: 300, posY: 200 });
    expect(r.baseSrc).not.toContain("実績");
  });

  it("引用符付きの種類も読む", () => {
    const src = `actors:
  - Web: service
  - 実績:
      kind: "achievement"
flow:
  - Web -> Web: "a"
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts.map((p) => p.kind)).toEqual(["achievement"]);
  });

  it("`actors:` の後の別項目に戻ったら抜き出しを止める", () => {
    const src = `actors:
  - 実績: achievement
flow:
  - 別: achievement
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts.map((p) => p.id)).toEqual(["実績"]);
    expect(r.baseSrc).toContain("  - 別: achievement");
  });
});
