import { describe, it, expect } from "vitest";
import {
  extractPartsFromSrc,
  writeOverlayPartToDsl,
  readOverlayPartPos,
  unquoteAlias,
  quoteAlias,
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

describe("writeOverlayPartToDsl", () => {
  it("posX / posY が未書出しの行に新規 append", () => {
    const src = `actors:
  - a: { kind: achievement }
`;
    const r = writeOverlayPartToDsl(src, "a", 100, 200, 1);
    expect(r).toContain("posX: 100");
    expect(r).toContain("posY: 200");
    expect(r).not.toContain("scale:"); // scale=1 は書出さない
  });

  it("既 posX / posY を新値で置換 (重複なし)", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 10, posY: 20 }
`;
    const r = writeOverlayPartToDsl(src, "a", 500, 600, 1);
    expect(r).toContain("posX: 500");
    expect(r).toContain("posY: 600");
    // 元の posX: 10 が残っていないか確認
    expect(r.match(/posX:/g)).toHaveLength(1);
    expect(r.match(/posY:/g)).toHaveLength(1);
  });

  it("scale ≠ 1 で scale field append", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 0, posY: 0 }
`;
    const r = writeOverlayPartToDsl(src, "a", 100, 200, 1.5);
    expect(r).toContain("scale: 1.5");
  });

  it("scale = 1 (default) は書出さない", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 0, posY: 0 }
`;
    const r = writeOverlayPartToDsl(src, "a", 100, 200, 1);
    expect(r).not.toContain("scale:");
  });

  it("scale = 1 で既 scale field を削除 (default に戻す)", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 0, posY: 0, scale: 2 }
`;
    const r = writeOverlayPartToDsl(src, "a", 0, 0, 1);
    expect(r).not.toContain("scale:");
  });

  it("kind / bg 等の追加 field を保持", () => {
    const src = `actors:
  - a: { kind: achievement, bg: "#f59e0b", posX: 10, posY: 20 }
`;
    const r = writeOverlayPartToDsl(src, "a", 100, 200, 1);
    expect(r).toContain("kind: achievement");
    expect(r).toContain('bg: "#f59e0b"');
    expect(r).toContain("posX: 100");
  });

  it("posX を Math.round で int 化", () => {
    const src = `actors:
  - a: { kind: achievement }
`;
    const r = writeOverlayPartToDsl(src, "a", 100.7, 200.3, 1);
    expect(r).toContain("posX: 101"); // Math.round(100.7) = 101
    expect(r).toContain("posY: 200"); // Math.round(200.3) = 200
  });

  it("scale は 3 桁小数保持", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 0, posY: 0 }
`;
    const r = writeOverlayPartToDsl(src, "a", 0, 0, 1.234567);
    expect(r).toContain("scale: 1.235");
  });

  it("対象 alias が src に無い時は不変", () => {
    const src = `actors:
  - a: { kind: achievement }
`;
    const r = writeOverlayPartToDsl(src, "does-not-exist", 100, 200, 1);
    expect(r).toBe(src);
  });

  it("複数 actor 混在で対象 alias のみ更新", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 10, posY: 20 }
  - b: { kind: achievement, posX: 30, posY: 40 }
`;
    const r = writeOverlayPartToDsl(src, "b", 500, 600, 1);
    expect(r).toContain("posX: 10"); // a 不変
    expect(r).toContain("posX: 500"); // b 更新
    expect(r).toMatch(/a:.*posX: 10/);
    expect(r).toMatch(/b:.*posX: 500/);
  });
});

describe("extractPartsFromSrc → writeOverlayPartToDsl round-trip", () => {
  it("extract 後 write で同 field が保持される (posX/Y/scale)", () => {
    const src0 = `actors:
  - a: { kind: achievement, posX: 100, posY: 200 }
`;
    const extracted = extractPartsFromSrc(src0, catalog, partsItems);
    const p = extracted.parts[0]!;
    const src1 = writeOverlayPartToDsl(src0, p.id, p.posX, p.posY, p.scale);
    // src1 も同 posX / posY を持つ
    const extracted2 = extractPartsFromSrc(src1, catalog, partsItems);
    expect(extracted2.parts[0]!.posX).toBe(100);
    expect(extracted2.parts[0]!.posY).toBe(200);
  });

  it("drag simulation = write で posX 更新 → extract で新値取れる", () => {
    let src = `actors:
  - a: { kind: achievement, posX: 100, posY: 200 }
`;
    src = writeOverlayPartToDsl(src, "a", 500, 600, 1);
    src = writeOverlayPartToDsl(src, "a", 700, 800, 1.5);
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts[0]!.posX).toBe(700);
    expect(r.parts[0]!.posY).toBe(800);
    expect(r.parts[0]!.scale).toBe(1.5);
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

  it("nested brace 行に対しても writeOverlayPartToDsl が座標を更新できる", () => {
    const src = `actors:
  - arc1: { kind: arc-gauge, posX: 100, posY: 200, state: { phase: false } }
`;
    const out = writeOverlayPartToDsl(src, "arc1", 500, 600, 1);
    expect(out).not.toBe(src);
    expect(out).toContain("posX: 500");
    expect(out).toContain("posY: 600");
    // nested brace は保持される
    expect(out).toContain("state: { phase: false }");
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

  it("write で nested map 内の posX を削らない (data loss detector)", () => {
    const src = `actors:
  - a: { kind: achievement, nodes: { header: { posX: 50, posY: 60 } }, posX: 100, posY: 200 }
`;
    const out = writeOverlayPartToDsl(src, "a", 300, 400, 1);
    // top-level は更新される
    expect(out).toContain("posX: 300");
    expect(out).toContain("posY: 400");
    // nested の座標はそのまま残る
    expect(out).toContain("header: { posX: 50, posY: 60 }");
  });

  it("write で nested map 自体を落とさない", () => {
    const src = `actors:
  - a: { kind: achievement, nodes: { header: { posX: 50 }, footer: { posX: 70 } }, posX: 1 }
`;
    const out = writeOverlayPartToDsl(src, "a", 10, 20, 1);
    expect(out).toContain("footer: { posX: 70 }");
    expect(out).toContain("kind: achievement");
  });

  it("quoted 値の中の カンマ / brace で field 分割が壊れない", () => {
    const src = `actors:
  - a: { kind: achievement, label: "a, b { c }", posX: 5 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.posX).toBe(5);
    const out = writeOverlayPartToDsl(src, "a", 9, 9, 1);
    expect(out).toContain('label: "a, b { c }"');
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

  it("escaped quote を含む行の write で posX が二重化しない", () => {
    const src = `actors:
  - a: { kind: achievement, label: "x \\" y, posX: 9", posX: 100 }
`;
    const out = writeOverlayPartToDsl(src, "a", 500, 600, 1);
    // 書き出し後の行に posX が 1 つだけ (label 内の文字列は数えない)
    const line = out.split("\n").find((l) => l.includes("- a:")) ?? "";
    const stripped = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    expect((stripped.match(/posX:/g) ?? []).length).toBe(1);
    expect(out).toContain("posX: 500");
  });

  it("quoted alias の extract → write round-trip が壊れない", () => {
    const src = `actors:
  - "my part": { kind: achievement, posX: 10, posY: 20 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.id).toBe("my part");
    const out = writeOverlayPartToDsl(src, "my part", 300, 400, 1);
    expect(out).toContain('- "my part":');
    expect(out).toContain("posX: 300");
    expect(out).toContain("posY: 400");
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

describe("Round 5 regression detector", () => {
  it("quote の外の backslash が field 区切りを飲み込まない", () => {
    // quote 外でも escape を読み飛ばすと `x\,` の `,` を食べて field 分割が壊れ、
    // posX が読めず write で二重化する。
    const src = `actors:
  - a: { kind: achievement, label: x\\, posX: 100, posY: 200 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.posX).toBe(100);
    expect(r.parts[0]!.posY).toBe(200);
    const out = writeOverlayPartToDsl(src, "a", 7, 8, 1);
    const line = out.split("\n").find((l) => l.includes("- a:")) ?? "";
    expect((line.match(/posX:/g) ?? []).length).toBe(1);
  });

  it("escaped quote を含む quoted alias を扱える", () => {
    const src = `actors:
  - "a \\" b": { kind: achievement, posX: 10, posY: 20 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]!.id).toBe('a " b');
    const out = writeOverlayPartToDsl(src, 'a " b', 300, 400, 1);
    expect(out).toContain("posX: 300");
    expect(out).toContain('- "a \\" b":');
  });

  it("CRLF の DSL を write しても改行コードが保たれる", () => {
    const src = 'actors:\r\n  - a: { kind: achievement, posX: 1, posY: 2 }\r\n';
    const out = writeOverlayPartToDsl(src, "a", 50, 60, 1);
    expect(out).toContain("\r\n");
    expect(out).not.toMatch(/[^\r]\n/);
    expect(out).toContain("posX: 50");
  });

  it("nested map を持つ行から base 座標を読んでも top-level が返る", () => {
    // nudge の base 読み取りが naive regex だと nested の posY を掴んで part が飛ぶ。
    // 対象は readOverlayPartPos そのもの。 extractPartsFromSrc 経由で書いていた頃は
    // 後者が既に depth-aware だったため fix 対象を一切踏まず、 naive regex に戻す
    // mutation でも pass する false green だった (CAR-2158 Round 6 MAJOR)。
    const src = `actors:
  - a: { kind: achievement, nodes: { header: { posX: 5, posY: 60 } }, posX: 100, posY: 200 }
`;
    const pos = readOverlayPartPos(src, "a");
    expect(pos).not.toBeNull();
    expect(pos!.posX).toBe(100);
    expect(pos!.posY).toBe(200);
  });
});

describe("Round 6 regression detector", () => {
  describe("readOverlayPartPos (catalog 不要の座標読み取り)", () => {
    it("scale / rotate も top-level から読む", () => {
      const src = "actors:\n  - a: { kind: achievement, posX: 10, posY: 20, scale: 1.5, rotate: 30 }\n";
      expect(readOverlayPartPos(src, "a")).toEqual({ posX: 10, posY: 20, scale: 1.5, rotate: 30 });
    });

    it("field 不在時は既定値 (posX/posY 0、 scale 1、 rotate 0) を返す", () => {
      const src = "actors:\n  - a: { kind: achievement }\n";
      expect(readOverlayPartPos(src, "a")).toEqual({ posX: 0, posY: 0, scale: 1, rotate: 0 });
    });

    it("nested map の scale を top-level と取り違えない", () => {
      const src = "actors:\n  - a: { kind: achievement, nodes: { inner: { scale: 9, rotate: 88 } }, posX: 1, posY: 2 }\n";
      const pos = readOverlayPartPos(src, "a");
      expect(pos!.scale).toBe(1);
      expect(pos!.rotate).toBe(0);
    });

    it("escaped quote を含む quoted alias でも引ける", () => {
      const src = 'actors:\n  - "a \\" b": { kind: achievement, posX: 7, posY: 8 }\n';
      expect(readOverlayPartPos(src, 'a " b')!.posX).toBe(7);
    });

    it("CRLF の DSL でも引ける", () => {
      const src = "actors:\r\n  - a: { kind: achievement, posX: 3, posY: 4 }\r\n";
      expect(readOverlayPartPos(src, "a")!.posY).toBe(4);
    });

    it("未知 alias では null を返す", () => {
      expect(readOverlayPartPos("actors:\n  - a: { kind: achievement }\n", "zzz")).toBeNull();
    });
  });

  describe("unquoteAlias / quoteAlias の往復", () => {
    it("quoteAlias は unquoteAlias の逆になる", () => {
      for (const alias of ['a " b', "plain", "a \\ b", 'q"']) {
        expect(unquoteAlias(quoteAlias(alias))).toBe(alias);
      }
    });

    it("quoteAlias は DSL 上の表記を作る (素の alias を囲むだけでは足りない)", () => {
      expect(quoteAlias('a " b')).toBe('"a \\" b"');
    });
  });

  describe("single-quoted scalar (CRITICAL)", () => {
    it("single quote 内の comma で field を割らない", () => {
      const fields = splitTopLevelFields("kind: achievement, label: 'x,y', posX: 1");
      expect(fields).toEqual(["kind: achievement", "label: 'x,y'", "posX: 1"]);
    });

    it("single quote 内の posX を top-level と誤読しない", () => {
      const src = "actors:\n  - a: { kind: achievement, label: 'p, posX: 999', posX: 1, posY: 2 }\n";
      expect(readOverlayPartPos(src, "a")!.posX).toBe(1);
      expect(extractPartsFromSrc(src, catalog, partsItems).parts[0]!.posX).toBe(1);
    });

    it("write しても single-quoted 値が壊れない", () => {
      const src = "actors:\n  - a: { kind: achievement, label: 'p, posX: 999', posX: 1, posY: 2 }\n";
      const out = writeOverlayPartToDsl(src, "a", 7, 8, 1);
      expect(out).toContain("label: 'p, posX: 999'");
      expect(out).toContain("posX: 7");
      expect(out).toContain("posY: 8");
      // quote が不均衡なまま出力されない
      expect((out.match(/'/g) ?? []).length % 2).toBe(0);
    });

    it("YAML の '' escape を終端と誤認しない", () => {
      const fields = splitTopLevelFields("label: 'it''s, fine', posX: 1");
      expect(fields).toEqual(["label: 'it''s, fine'", "posX: 1"]);
    });

    it("unquoted scalar 中のアポストロフィを quote 開始と誤認しない", () => {
      // `label: It's fine` の `'` を quote 開始と読むと以降の `,` を飲んで posX が消える。
      const fields = splitTopLevelFields("label: It's fine, posX: 1");
      expect(fields).toEqual(["label: It's fine", "posX: 1"]);
      expect(readTopLevelField("label: It's fine, posX: 1", "posX")).toBe("1");
    });
  });

  describe("mixed line ending (MAJOR)", () => {
    it("LF と CRLF が混在する DSL で無関係な行の改行を書き換えない", () => {
      // 複製で追加された行が LF、 元の行が CRLF という状態が実際に起きる。
      const src = "actors:\r\n  - a: { kind: achievement, posX: 1, posY: 2 }\n  - b: { kind: achievement }\r\n";
      const out = writeOverlayPartToDsl(src, "a", 50, 60, 1);
      expect(out).toBe("actors:\r\n  - a: { kind: achievement, posX: 50, posY: 60 }\n  - b: { kind: achievement }\r\n");
    });
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

  it("actors block が無ければ null", () => {
    expect(appendActorLine("flow:\n  - a -> b\n", "  - x: {}")).toBeNull();
  });

  it("挿入後も write / read が成立する (連結していれば座標が読めない)", () => {
    const src = "actors:\n  - a: { kind: achievement, posX: 1, posY: 2 }";
    const out = appendActorLine(src, "  - b: { kind: achievement, posX: 30, posY: 40 }")!;
    expect(readOverlayPartPos(out, "b")).toEqual({ posX: 30, posY: 40, scale: 1, rotate: 0 });
    expect(readOverlayPartPos(out, "a")!.posX).toBe(1);
  });
});
