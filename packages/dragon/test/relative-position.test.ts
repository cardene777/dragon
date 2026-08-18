/**
 * 位置を相対で書けることの検証。
 *
 * 見るのは 3 つ。 書いた通りに読めるか (parse)、 基準の実座標から正しい側に置かれるか
 * (解決)、 解けない書き方を行番号付きで知らせるか (誤り)。
 *
 * 座標は cdl の配置計算に依存するため、 固定値との一致では書かない。 「基準より右にある」
 * 「間隔が指定通り」 のように関係で書く。 cdl 側の既定値が変わっても、 記法の意味が
 * 壊れた時にだけ落ちるようにする。
 */
import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";
import { parseTextDslV05 } from "../src/v05";
import {
  parseRelativePos,
  resolveRelativePos,
  orderByDependency,
  RELATIVE_GAP_DEFAULT,
} from "../src/relative-pos";

/** 図を配置計算して、 表示名ごとの中心と大きさを返す。 */
function boxesOf(src: string): Map<string, { cx: number; cy: number; w: number; h: number }> {
  const laid = layout(textDslToDiagram(src));
  const out = new Map<string, { x0: number; y0: number; x1: number; y1: number }>();
  for (const n of laid.nodes) {
    if (!n.title) continue;
    const b = out.get(n.title);
    const x0 = n.cx - n.w / 2;
    const y0 = n.cy - n.h / 2;
    const x1 = n.cx + n.w / 2;
    const y1 = n.cy + n.h / 2;
    if (b) {
      b.x0 = Math.min(b.x0, x0);
      b.y0 = Math.min(b.y0, y0);
      b.x1 = Math.max(b.x1, x1);
      b.y1 = Math.max(b.y1, y1);
    } else {
      out.set(n.title, { x0, y0, x1, y1 });
    }
  }
  const res = new Map<string, { cx: number; cy: number; w: number; h: number }>();
  for (const [k, b] of out) {
    res.set(k, { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, w: b.x1 - b.x0, h: b.y1 - b.y0 });
  }
  return res;
}

const src = (apiPos: string): string => `title: "t"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: ${apiPos}
  - DB: database
flow:
  - Web -> API: "a"
  - API -> DB: "b"
`;

describe("位置の相対指定 = 書いた値の読み取り", () => {
  it("`Web の右` を相手と向きに分解する", () => {
    expect(parseRelativePos("Web の右")).toEqual({ anchor: "Web", dir: "right" });
  });

  it("間隔を書けば持つ", () => {
    expect(parseRelativePos("Web の下 200")).toEqual({ anchor: "Web", dir: "below", gap: 200 });
  });

  it("間隔は空白なしでも読む", () => {
    expect(parseRelativePos("Web の下200")).toEqual({ anchor: "Web", dir: "below", gap: 200 });
  });

  it("4 つの向きを全て読む", () => {
    expect(parseRelativePos("A の右")?.dir).toBe("right");
    expect(parseRelativePos("A の左")?.dir).toBe("left");
    expect(parseRelativePos("A の上")?.dir).toBe("above");
    expect(parseRelativePos("A の下")?.dir).toBe("below");
  });

  it("英語でも書ける", () => {
    expect(parseRelativePos("Web right 120")).toEqual({ anchor: "Web", dir: "right", gap: 120 });
    expect(parseRelativePos("Web above")).toEqual({ anchor: "Web", dir: "above" });
  });

  it("名前が `の右` で終わっても、 末尾の向きを先に取る", () => {
    expect(parseRelativePos("Aの右 の左")).toEqual({ anchor: "Aの右", dir: "left" });
  });

  it("名前に空白を含んでも読む", () => {
    expect(parseRelativePos("決済 基盤 の右")).toEqual({ anchor: "決済 基盤", dir: "right" });
  });

  it("座標の形は相対として読まない", () => {
    expect(parseRelativePos("300,200")).toBeNull();
  });

  it("向きが無ければ読まない", () => {
    expect(parseRelativePos("Web")).toBeNull();
    expect(parseRelativePos("")).toBeNull();
  });

  it("間隔が数でなければ相対として読まない", () => {
    // 読めた形だけを通す。 読めない分は呼ぶ側が誤りとして知らせる
    expect(parseRelativePos("Web の右 abc")).toBeNull();
  });
});

describe("位置の相対指定 = 座標への変換", () => {
  const anchor = { cx: 100, cy: 100, w: 40, h: 20 };
  const target = { w: 60, h: 30 };

  it("右は縁と縁の間が間隔になる", () => {
    const p = resolveRelativePos({ anchor: "a", dir: "right", gap: 10 }, anchor, target);
    // 100 + 20 (相手の半分) + 10 (間隔) + 30 (自分の半分)
    expect(p.posX).toBe(160);
    expect(p.posY).toBe(100);
  });

  it("左は右の反対側に同じ距離", () => {
    const r = resolveRelativePos({ anchor: "a", dir: "right", gap: 10 }, anchor, target);
    const l = resolveRelativePos({ anchor: "a", dir: "left", gap: 10 }, anchor, target);
    expect(anchor.cx - l.posX).toBe(r.posX - anchor.cx);
  });

  it("下は縦にずれて横は揃う", () => {
    const p = resolveRelativePos({ anchor: "a", dir: "below", gap: 10 }, anchor, target);
    expect(p.posX).toBe(anchor.cx);
    expect(p.posY).toBe(100 + 10 + 10 + 15);
  });

  it("上は下の反対側に同じ距離", () => {
    const u = resolveRelativePos({ anchor: "a", dir: "above", gap: 10 }, anchor, target);
    const d = resolveRelativePos({ anchor: "a", dir: "below", gap: 10 }, anchor, target);
    expect(anchor.cy - u.posY).toBe(d.posY - anchor.cy);
  });

  it("間隔を書かなければ既定値を使う", () => {
    const p = resolveRelativePos({ anchor: "a", dir: "right" }, anchor, target);
    const q = resolveRelativePos({ anchor: "a", dir: "right", gap: RELATIVE_GAP_DEFAULT }, anchor, target);
    expect(p.posX).toBe(q.posX);
  });
});

describe("位置の相対指定 = 解く順番", () => {
  it("基準を先に置く", () => {
    const { order } = orderByDependency([
      { name: "A", rel: { anchor: "B", dir: "right" } },
      { name: "B" },
    ]);
    expect(order.indexOf("B")).toBeLessThan(order.indexOf("A"));
  });

  it("連鎖は奥から順に並ぶ", () => {
    const { order } = orderByDependency([
      { name: "C", rel: { anchor: "B", dir: "right" } },
      { name: "B", rel: { anchor: "A", dir: "right" } },
      { name: "A" },
    ]);
    expect(order).toEqual(["A", "B", "C"]);
  });

  it("輪になっている分を外す", () => {
    const { order, cyclic } = orderByDependency([
      { name: "A", rel: { anchor: "B", dir: "right" } },
      { name: "B", rel: { anchor: "A", dir: "left" } },
    ]);
    expect(cyclic.sort()).toEqual(["A", "B"]);
    expect(order).toEqual([]);
  });

  it("輪の手前は解けるので残す", () => {
    const { order, cyclic } = orderByDependency([
      { name: "X", rel: { anchor: "A", dir: "right" } },
      { name: "A", rel: { anchor: "B", dir: "right" } },
      { name: "B", rel: { anchor: "A", dir: "left" } },
    ]);
    expect(cyclic.sort()).toEqual(["A", "B"]);
    expect(order).toEqual(["X"]);
  });

  it("相対で書かれていない分も全て並ぶ", () => {
    const { order } = orderByDependency([{ name: "A" }, { name: "B" }, { name: "C" }]);
    expect(order.sort()).toEqual(["A", "B", "C"]);
  });
});

describe("位置の相対指定 = 図に反映される", () => {
  it("`Web の右` は Web より右に置かれる", () => {
    const b = boxesOf(src("Web の右"));
    expect(b.get("API")!.cx).toBeGreaterThan(b.get("Web")!.cx);
  });

  it("`Web の左` は Web より左に置かれる", () => {
    const b = boxesOf(src("Web の左"));
    expect(b.get("API")!.cx).toBeLessThan(b.get("Web")!.cx);
  });

  it("`Web の下` は Web より下に置かれる", () => {
    const b = boxesOf(src("Web の下"));
    expect(b.get("API")!.cy).toBeGreaterThan(b.get("Web")!.cy);
  });

  it("`Web の上` は Web より上に置かれる", () => {
    const b = boxesOf(src("Web の上"));
    expect(b.get("API")!.cy).toBeLessThan(b.get("Web")!.cy);
  });

  it("書いた間隔がそのまま縁と縁の距離になる", () => {
    const b = boxesOf(src("Web の右 200"));
    const web = b.get("Web")!;
    const api = b.get("API")!;
    const gap = api.cx - api.w / 2 - (web.cx + web.w / 2);
    expect(gap).toBeCloseTo(200, 0);
  });

  it("間隔を広げた分だけ離れる", () => {
    const near = boxesOf(src("Web の右 100"));
    const far = boxesOf(src("Web の右 300"));
    const d = (b: ReturnType<typeof boxesOf>): number => b.get("API")!.cx - b.get("Web")!.cx;
    expect(d(far) - d(near)).toBeCloseTo(200, 0);
  });

  it("横に並べた時は縦位置が基準と揃う", () => {
    const b = boxesOf(src("Web の右 150"));
    expect(b.get("API")!.cy).toBeCloseTo(b.get("Web")!.cy, 0);
  });

  it("縦に並べた時は横位置が基準と揃う", () => {
    const b = boxesOf(src("Web の下 150"));
    expect(b.get("API")!.cx).toBeCloseTo(b.get("Web")!.cx, 0);
  });

  it("座標で書いた時と同じ経路を通る = 解決後の座標を直接書いても同じ位置", () => {
    const rel = boxesOf(src("Web の右 200"));
    const api = rel.get("API")!;
    // 相対で決まった中心をそのまま座標として書き直す
    const abs = boxesOf(src(`${Math.round(api.cx)},${Math.round(api.cy)}`));
    expect(abs.get("API")!.cx).toBeCloseTo(api.cx, 0);
    expect(abs.get("API")!.cy).toBeCloseTo(api.cy, 0);
  });

  it("基準が連鎖しても順に置かれる", () => {
    const laid = boxesOf(`title: "t"
type: flow
actors:
  - A: service
  - B:
      kind: service
      位置: A の右 100
  - C:
      kind: service
      位置: B の右 100
flow:
  - A -> B: "x"
  - B -> C: "y"
`);
    expect(laid.get("B")!.cx).toBeGreaterThan(laid.get("A")!.cx);
    expect(laid.get("C")!.cx).toBeGreaterThan(laid.get("B")!.cx);
  });

  it("書いた順が逆でも基準から先に解ける", () => {
    const laid = boxesOf(`title: "t"
type: flow
actors:
  - C:
      kind: service
      位置: B の右 100
  - B:
      kind: service
      位置: A の右 100
  - A: service
flow:
  - A -> B: "x"
  - B -> C: "y"
`);
    expect(laid.get("B")!.cx).toBeGreaterThan(laid.get("A")!.cx);
    expect(laid.get("C")!.cx).toBeGreaterThan(laid.get("B")!.cx);
  });

  /**
   * 全図種で同じ間隔になるか。
   *
   * 座標を書いた時に中心がどこに来るかは図種で違う。 順序図は縦列の左端が動くので、
   * 中心を狙って書くと縦列の幅の半分だけずれる (実測 = 200 と書いて 370 空いた)。
   * 置いてから測り直す経路が無いとこの図種だけ落ちる。
   */
  // `mind` は #1177 で `mind-map` 種別 (図全体を 1 箱で描く) に寄せたため外した。 登場人物ごとの
  // 箱が無く、 相対の位置を測る相手が居ない = `pie` / `gantt` / `journey` と同じ扱いになる
  const TYPES = ["sequence", "flow", "state", "er", "class", "topology", "c4"] as const;
  for (const type of TYPES) {
    it(`${type}: 書いた間隔がそのまま空く`, () => {
      const b = boxesOf(`title: "t"
type: ${type}
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の右 200
  - DB: database
flow:
  - Web -> API: "a"
  - API -> DB: "b"
`);
      const web = b.get("Web")!;
      const api = b.get("API")!;
      expect(web, `${type}: Web の箱が測れない`).toBeDefined();
      expect(api, `${type}: API の箱が測れない`).toBeDefined();
      const gap = api.cx - api.w / 2 - (web.cx + web.w / 2);
      expect(gap, `${type} の間隔`).toBeCloseTo(200, 0);
      expect(api.cy, `${type} の縦位置`).toBeCloseTo(web.cy, 0);
    });
  }

  it("相対を使わない図は座標を持たない (既存の自動配置を変えない)", () => {
    const plain = `title: "t"
type: flow
actors:
  - Web: service
  - API: service
flow:
  - Web -> API: "a"
`;
    const d = textDslToDiagram(plain);
    expect(d.nodes.every((n) => n.posX === undefined && n.posY === undefined)).toBe(true);
  });
});

describe("位置の相対指定 = 効かなかった時", () => {
  /**
   * 順序図の縦位置は動かせない。 縦列は横に並ぶものなので、 下に置く指定に意味がない。
   *
   * そのまま座標を書き込むと基準の真上に重なった図が出る (実測 = Web x[100,240] の位置に
   * API が重なった)。 効かなかったと分かった時は書かなかった時と同じ配置に戻す。
   */
  const seqDown = `title: "t"
type: sequence
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の下 140
  - DB: database
flow:
  - Web -> API: "a"
  - API -> DB: "b"
`;
  const seqAuto = `title: "t"
type: sequence
actors:
  - Web: service
  - API: service
  - DB: database
flow:
  - Web -> API: "a"
  - API -> DB: "b"
`;

  it("効かない指定は自動配置に戻す (基準に重ねない)", () => {
    const b = boxesOf(seqDown);
    const auto = boxesOf(seqAuto);
    expect(b.get("API")!.cx).toBeCloseTo(auto.get("API")!.cx, 0);
    expect(b.get("API")!.cy).toBeCloseTo(auto.get("API")!.cy, 0);
  });

  it("戻した時に基準と重ならない", () => {
    const b = boxesOf(seqDown);
    const web = b.get("Web")!;
    const api = b.get("API")!;
    const overlapX = Math.abs(api.cx - web.cx) < (api.w + web.w) / 2;
    const overlapY = Math.abs(api.cy - web.cy) < (api.h + web.h) / 2;
    expect(overlapX && overlapY, "API が Web に重なっている").toBe(false);
  });

  it("効かなかったことを行番号付きで知らせる", () => {
    const notices: CompileNotice[] = [];
    textDslToDiagram(seqDown, { onNotice: (n) => notices.push(n) });
    expect(notices).toHaveLength(1);
    expect(notices[0]!.kind).toBe("relative-position-ignored");
    expect(notices[0]!.actor).toBe("API");
    expect(notices[0]!.line).toBeGreaterThan(0);
    // 何が効かなかったかを、 書いた言葉に近い形で返す
    expect(notices[0]!.message).toContain("Web");
    expect(notices[0]!.message).toContain("下");
    expect(notices[0]!.hint).toContain("位置: 300,200");
  });

  it("効いた指定では知らせを出さない", () => {
    const notices: CompileNotice[] = [];
    textDslToDiagram(src("Web の右 200"), { onNotice: (n) => notices.push(n) });
    expect(notices).toEqual([]);
  });

  it("知らせを受け取らなくても図は出る", () => {
    expect(() => textDslToDiagram(seqDown)).not.toThrow();
  });
});

describe("位置の相対指定 = 解けない書き方", () => {
  const parse = (apiPos: string) => parseTextDslV05(src(apiPos));

  it("相手が居なければ行番号付きで知らせる", () => {
    const r = parse("いない人 の右");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.message.includes("見つかりません"));
    expect(e).toBeDefined();
    expect(e!.line).toBeGreaterThan(0);
    // 何を書けばよいか分かるよう、 書かれている名前を並べる
    expect(e!.hint).toContain("Web");
  });

  it("自分を基準にしたら知らせる", () => {
    const r = parse("API の右");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((x) => x.message.includes("自分自身"))).toBe(true);
  });

  it("互いを指し合ったら知らせる", () => {
    const r = parseTextDslV05(`title: "t"
type: flow
actors:
  - A:
      kind: service
      位置: B の右
  - B:
      kind: service
      位置: A の右
flow:
  - A -> B: "x"
`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((x) => x.message.includes("互いを指しています"))).toBe(true);
  });

  it("どちらの形でもない値は黙って捨てず知らせる", () => {
    const r = parse("まんなかへん");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.message.includes("読めません"));
    expect(e).toBeDefined();
    // 両方の書き方を出して、 どちらかに直せるようにする
    expect(e!.hint).toContain("300,200");
    expect(e!.hint).toContain("の右");
  });

  it("向きの綴りを誤った時も知らせる", () => {
    const r = parse("Web の右 abc");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((x) => x.message.includes("読めません"))).toBe(true);
  });

  it("座標を書いた時は相対の指定を残さない", () => {
    const r = parseTextDslV05(`title: "t"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の右
      位置: 300,200
flow:
  - Web -> API: "a"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const api = r.doc.actors.find((a) => a.name === "API")!;
    expect(api.posRel).toBeUndefined();
    expect(api.posX).toBe(300);
    expect(api.posY).toBe(200);
  });

  it("相対を書いた時は前に書いた座標を残さない", () => {
    const r = parseTextDslV05(`title: "t"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: 300,200
      位置: Web の右
flow:
  - Web -> API: "a"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const api = r.doc.actors.find((a) => a.name === "API")!;
    expect(api.posX).toBeUndefined();
    expect(api.posRel).toEqual({ anchor: "Web", dir: "right" });
  });
});

describe("間隔として受け付ける数", () => {
  const src = (gap: string): string => `title: "t"
type: flow
actors:
  - Web: service
  - API:
      kind: service
      位置: Web の右 ${gap}
flow:
  - Web -> API: "a"
`;

  it("小数と指数表記を受け付ける", () => {
    // 整数だけに絞ると、 有効な数を書いたのに「読めません」 と返る (実測)
    for (const gap of ["200", "1.5", "1e2", "2E+2", ".5"]) {
      const r = parseTextDslV05(src(gap));
      const detail = r.ok ? "" : r.errors.map((e) => e.message).join(" / ");
      expect(r.ok, `${gap} が通らない: ${detail}`).toBe(true);
    }
  });

  it("負の数は指数表記でも拒否する", () => {
    for (const gap of ["-200", "-1.5", "-1e2"]) {
      const r = parseTextDslV05(src(gap));
      expect(r.ok, `${gap} が通ってしまう`).toBe(false);
      if (r.ok) continue;
      expect(r.errors.some((e) => e.message.includes("負の数"))).toBe(true);
    }
  });

  it("公開関数に負の値を直接渡しても向きが裏返らない", () => {
    const anchor = { cx: 100, cy: 100, w: 40, h: 20 };
    const target = { w: 60, h: 30 };
    const p = resolveRelativePos({ anchor: "a", dir: "right", gap: -1000 }, anchor, target);
    expect(p.posX).toBeGreaterThan(anchor.cx);
  });
});
