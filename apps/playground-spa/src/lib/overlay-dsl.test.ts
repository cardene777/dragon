import { describe, it, expect } from "vitest";
import { extractPartsFromSrc, writeOverlayPartToDsl } from "./overlay-dsl";
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

describe("ReDoS 耐性 (CAR-2158 security fix)", () => {
  it("閉じ括弧を欠く長大行でも線形時間で判定を終える", () => {
    // 旧 regex `\{(.+)\}\s*$` は `}` が来ない長い行で指数的探索に陥る形だった。
    // 新 regex は inner を `[^}]*` に固定しているため、 1 pass で不成立が確定する。
    const evil = `  - a: { kind: achievement, ${"posX: 1, ".repeat(4000)}`;
    const src = `actors:\n${evil}\n`;
    const t0 = performance.now();
    const r = extractPartsFromSrc(src, catalog, partsItems);
    const elapsed = performance.now() - t0;
    // parts として認識されない (閉じ括弧なし) + 1 秒以内に終わる
    expect(r.parts.length).toBe(0);
    expect(elapsed).toBeLessThan(1000);
  });

  it("alias に空白混じりの長大文字列が来ても線形時間", () => {
    // 旧 regex の `\S+?` (lazy) は後続 `\s*:\s*` との境界が曖昧でバックトラックした。
    const evil = `  - ${"a ".repeat(4000)}: { kind: achievement }`;
    const src = `actors:\n${evil}\n`;
    const t0 = performance.now();
    const r = extractPartsFromSrc(src, catalog, partsItems);
    const elapsed = performance.now() - t0;
    expect(r.parts.length).toBe(0);
    expect(elapsed).toBeLessThan(1000);
  });

  it("writeOverlayPartToDsl も同 regex を共用して ReDoS 耐性を持つ", () => {
    const evil = `  - a: { ${"x: 1, ".repeat(4000)}`;
    const src = `actors:\n${evil}\n`;
    const t0 = performance.now();
    const out = writeOverlayPartToDsl(src, "a", 10, 20, 1);
    const elapsed = performance.now() - t0;
    // match しないので行はそのまま + 1 秒以内
    expect(out).toBe(src);
    expect(elapsed).toBeLessThan(1000);
  });

  it("正常行の parse は新 regex でも従来通り動く (回帰なし)", () => {
    const src = `actors:
  - "quoted alias": { kind: achievement, posX: 5, posY: 6 }
  - plain: { kind: achievement, posX: 7, posY: 8 }
`;
    const r = extractPartsFromSrc(src, catalog, partsItems);
    expect(r.parts.length).toBe(2);
    expect(r.parts[0]!.id).toBe("quoted alias");
    expect(r.parts[0]!.posX).toBe(5);
    expect(r.parts[1]!.id).toBe("plain");
    expect(r.parts[1]!.posX).toBe(7);
  });
});
