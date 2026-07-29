import { describe, it, expect } from "vitest";
import {
  extractPartsFromSrc,
  splitTopLevelFields,
  readTopLevelField,
  appendActorLine,
} from "./overlay-dsl";
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

  it("posX/posY 省略時 = default 0", () => {
    const src = `actors:
  - a: { kind: achievement }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.posX).toBe(0);
    expect(r.parts[0]!.posY).toBe(0);
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
  - arc1: { kind: arc-gauge, state: { phase: false }, style: { fill: "red" }, posX: 10 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.posX).toBe(10);
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
  - a: { kind: achievement, label: "x \\" y, posX: 9", posX: 100 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.posX).toBe(100);
  });



  it("quoted alias に空白 / 記号を含んでも parse できる", () => {
    const src = `actors:
  - "a, b { c }": { kind: achievement, posX: 7 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.id).toBe("a, b { c }");
    expect(r.parts[0]!.posX).toBe(7);
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
