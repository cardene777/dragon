/**
 * canvas-pivot-interaction unit test (iter28、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter28。
 * canvas pivot interaction の pure function を batch verify。
 * - extractAllActorNames (DSL parser)
 * - slugify (compile 側 slug logic と一致)
 * - hitResizeHandle (client 座標 → corner 判定)
 */
import { describe, it, expect } from "vitest";
import {
  extractAllActorNames,
  slugify,
  hitResizeHandle,
  resolveClickPlacement,
  toWorldOrNull,
  clientToSvg,
} from "./canvas-pivot-interaction";

describe("iter28: canvas-pivot-interaction 単体 verify", () => {
  describe("extractAllActorNames", () => {
    it("plain actor list を抽出", () => {
      const src = `title: "t"
type: sequence
actors:
  - Client
  - API
  - DB
flow:
  - Client -> API: "x"
`;
      expect(extractAllActorNames(src)).toEqual(["Client", "API", "DB"]);
    });

    it("actor 名 quoted (含 special chars)", () => {
      const src = `title: "t"
type: sequence
actors:
  - "Client A"
  - "API-01"
flow:
  - X -> Y: "x"
`;
      expect(extractAllActorNames(src)).toEqual(["Client A", "API-01"]);
    });

    it("parts unified syntax (kind: xxx) の alias 抽出", () => {
      const src = `title: "t"
type: sequence
actors:
  - Client
  - alias1: { kind: badge-count }
  - API
flow:
  - X -> Y: "x"
`;
      const names = extractAllActorNames(src);
      expect(names).toContain("Client");
      expect(names).toContain("alias1");
      expect(names).toContain("API");
    });

    it("actors: block なしで空配列", () => {
      const src = `title: "t"
type: sequence
flow:
  - X -> Y: "x"
`;
      expect(extractAllActorNames(src)).toEqual([]);
    });

    it("actors block の後に別 top-level key で終了", () => {
      const src = `title: "t"
type: sequence
actors:
  - A
  - B
flow:
  - X -> Y
animation:
  - step: "x"
`;
      expect(extractAllActorNames(src)).toEqual(["A", "B"]);
    });

    it("空 DSL は空配列", () => {
      expect(extractAllActorNames("")).toEqual([]);
    });
  });

  describe("slugify", () => {
    it("英字 → lowercase", () => {
      expect(slugify("Client")).toBe("client");
      expect(slugify("API")).toBe("api");
    });

    it("空白 / 特殊文字 → hyphen", () => {
      expect(slugify("hello world")).toBe("hello-world");
      expect(slugify("a b c d")).toBe("a-b-c-d");
    });

    it("hiragana / katakana を保持", () => {
      const result = slugify("あいうえお");
      // hiragana range 保持
      expect(result).toMatch(/[ぁ-ん]/);
    });

    it("先頭/末尾 hyphen を除去", () => {
      expect(slugify("---hello---")).toBe("hello");
    });

    it("64 chars で truncate", () => {
      const long = "a".repeat(200);
      expect(slugify(long).length).toBeLessThanOrEqual(64);
    });

    it("空文字 → 'n' fallback", () => {
      expect(slugify("")).toBe("n");
      expect(slugify("!!!")).toBe("n");
    });

    it("同じ入力に対し deterministic", () => {
      const inputs = ["Client", "API-01", "abc def"];
      for (const inp of inputs) {
        expect(slugify(inp)).toBe(slugify(inp));
      }
    });
  });

  describe("hitResizeHandle", () => {
    const rect = { left: 100, top: 100, right: 200, bottom: 200, width: 100, height: 100 } as DOMRect;

    it("nw corner に hit", () => {
      expect(hitResizeHandle(100, 100, rect)).toBe("nw");
    });

    it("ne corner に hit", () => {
      expect(hitResizeHandle(200, 100, rect)).toBe("ne");
    });

    it("sw corner に hit", () => {
      expect(hitResizeHandle(100, 200, rect)).toBe("sw");
    });

    it("se corner に hit", () => {
      expect(hitResizeHandle(200, 200, rect)).toBe("se");
    });

    it("中央では null", () => {
      expect(hitResizeHandle(150, 150, rect)).toBeNull();
    });

    it("矩形外では null", () => {
      expect(hitResizeHandle(500, 500, rect)).toBeNull();
    });
  });

  describe("resolveClickPlacement (#876 parts-only diagram の重複防止)", () => {
    const CENTER = { x: 800, y: 400 };

    it("content が無い (空 diagram) 時は viewport 中央をそのまま使う", () => {
      expect(resolveClickPlacement([], CENTER, 440)).toEqual({ x: 800, y: 400 });
    });

    it("既存 content の下端の下に配置する (中央の図に重ならない)", () => {
      const rects = [{ id: "client-header", minX: 0, maxX: 400, maxY: 600 }];
      const p = resolveClickPlacement(rects, CENTER, 440, 120);
      // y = maxY(600) + partSpanH/2(220) + margin(120)
      expect(p.y).toBe(940);
      // x = viewport 中央 X を content 範囲に clamp (0-400 なので 400)
      expect(p.x).toBe(400);
    });

    it("横は viewport 中央 X が content 範囲内ならそのまま使う", () => {
      const rects = [{ id: "lane", minX: 0, maxX: 1600, maxY: 300 }];
      expect(resolveClickPlacement(rects, CENTER, 200, 120).x).toBe(800);
    });

    it("parts merge 由来 (__ 付き) の rect も content として積む = parts-only で 2 個目が重ならない", () => {
      // parts-only diagram = 描画済 element が parts merge 由来のみ。 これを content から除外すると
      // 「content なし」 と誤判定して viewport 中央 fallback になり 2 個目以降が 1 個目と重なる (#876)。
      const partsOnly = [{ id: "arcgauge1__arc", minX: 600, maxX: 980, maxY: 700 }];
      const p = resolveClickPlacement(partsOnly, CENTER, 440, 120);
      expect(p.y).toBe(1040); // 700 + 220 + 120 = 既存 part の下
      expect(p.y).toBeGreaterThan(700); // 1 個目の下端より下 = 重ならない
    });

    it("part が大きいほど下に置かれる (span に比例した中心 offset)", () => {
      const rects = [{ id: "n", minX: 0, maxX: 400, maxY: 500 }];
      const small = resolveClickPlacement(rects, CENTER, 200, 120).y;
      const large = resolveClickPlacement(rects, CENTER, 880, 120).y;
      expect(large).toBeGreaterThan(small);
    });

    it("非有限値を含む rect は content なし扱いで中央に fallback (NaN 汚染防止)", () => {
      const broken = [{ id: "x", minX: NaN, maxX: NaN, maxY: NaN }];
      expect(resolveClickPlacement(broken, CENTER, 440)).toEqual({ x: 800, y: 400 });
    });
  });

  describe("toWorldOrNull (#876 getScreenCTM null guard)", () => {
    // 最小 SVG mock = getScreenCTM / createSVGPoint / matrixTransform のみ実装。
    const makeSvg = (ctm: { a: number; e: number; f: number } | null): SVGSVGElement => {
      const inv = ctm
        ? { /* inverse 相当 = scale 1/a、 translate -e/-f */ a: 1 / ctm.a, e: -ctm.e / ctm.a, f: -ctm.f / ctm.a }
        : null;
      return {
        getScreenCTM: () => (ctm ? { ...ctm, inverse: () => inv } : null),
        createSVGPoint: () => ({
          x: 0,
          y: 0,
          matrixTransform(m: { a: number; e: number; f: number }) {
            return { x: this.x * m.a + m.e, y: this.y * m.a + m.f };
          },
        }),
      } as unknown as SVGSVGElement;
    };

    it("getScreenCTM が null なら null を返す (raw client 座標を返さない)", () => {
      expect(toWorldOrNull(makeSvg(null), 500, 300)).toBeNull();
    });

    it("getScreenCTM があれば world 座標に変換する", () => {
      // ctm = scale 2 + translate (100, 50) → world = (client - translate) / scale
      const p = toWorldOrNull(makeSvg({ a: 2, e: 100, f: 50 }), 500, 250);
      expect(p).not.toBeNull();
      expect(p!.x).toBeCloseTo(200);
      expect(p!.y).toBeCloseTo(100);
    });

    it("null 返却は clientToSvg の fail-open (raw 座標返し) と区別できる", () => {
      const svg = makeSvg(null);
      // clientToSvg は raw client 座標をそのまま返す仕様 = 変換失敗を検知できない
      expect(clientToSvg(svg, 500, 300)).toEqual({ x: 500, y: 300, scale: 1 });
      // toWorldOrNull は null で失敗を明示する
      expect(toWorldOrNull(svg, 500, 300)).toBeNull();
    });
  });
});
