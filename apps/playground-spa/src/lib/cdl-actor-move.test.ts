import { describe, it, expect } from "vitest";
import { moveActorInDsl, clampDx, buildActorSnapshotFromSvg, MIN_LANE_GAP, type ActorSnapshot } from "./cdl-actor-move";
import { extractAllActorNames } from "./canvas-pivot-interaction";

const base = `title: "T"
type: sequence
actors:
  - Client
  - API
  - DB
flow:
  - Client -> API: "req"
`;

/** 実測値に近い 3 lane (幅 340、 間隔 565)。 */
const snap = (target: string): ActorSnapshot => ({
  name: target,
  lanes: [
    { name: "Client", laneX: 0, laneY: 28, laneW: 340 },
    { name: "API", laneX: 565, laneY: 28, laneW: 340 },
    { name: "DB", laneX: 1130, laneY: 28, laneW: 340 },
  ],
});

describe("moveActorInDsl", () => {
  it("対象 actor に delta を足した座標を書く", () => {
    // 重なり防止の clamp にかからない範囲 (Client 右端 340 / API 左端 565 で上限 185)
    expect(moveActorInDsl(base, snap("Client"), 100)).toMatch(/- Client:.*posX: 100/);
  });

  it("移動しない actor にも現在位置を書いて固定する", () => {
    // lane の x は「指定が無い lane を順に並べる」 ロジックで決まるため、
    // 1 つだけ posX を与えると残りが詰め直されて大きく動く (実測 = Client +200 で API -597)。
    const out = moveActorInDsl(base, snap("Client"), 100);
    expect(out).toMatch(/- API:.*posX: 565/);
    expect(out).toMatch(/- DB:.*posX: 1130/);
  });

  it("対象以外の座標に delta を足さない", () => {
    const out = moveActorInDsl(base, snap("Client"), 100);
    expect(out).not.toMatch(/- API:.*posX: 665/);
    expect(out).toMatch(/- API:.*posY: 28/);
  });

  it("縦位置は動かさない (sequence の縦軸は時系列で構造上動かせない)", () => {
    expect(moveActorInDsl(base, snap("Client"), 100)).toMatch(/- Client:.*posY: 28/);
  });

  it("真ん中の actor を動かしても両隣が固定される", () => {
    const out = moveActorInDsl(base, snap("API"), -100);
    expect(out).toMatch(/- Client:.*posX: 0/);
    expect(out).toMatch(/- API:.*posX: 465/);
    expect(out).toMatch(/- DB:.*posX: 1130/);
  });

  it("delta 0 でも全 actor に座標が書かれる (以降の並べ直しを止める)", () => {
    const out = moveActorInDsl(base, snap("Client"), 0);
    for (const [name, x] of [["Client", 0], ["API", 565], ["DB", 1130]] as const) {
      expect(out).toMatch(new RegExp(`- ${name}:.*posX: ${x}`));
    }
  });

  it("既存の他 field (bg 等) を壊さない", () => {
    const src = `actors:
  - Client: { bg: "#fff" }
  - API
`;
    const s: ActorSnapshot = { name: "Client", lanes: [{ name: "Client", laneX: 10, laneY: 20, laneW: 340 }] };
    const out = moveActorInDsl(src, s, 5);
    expect(out).toContain('bg: "#fff"');
    expect(out).toMatch(/posX: 15/);
  });

  it("snapshot に無い actor は触らない (auto layout のまま残す)", () => {
    const s: ActorSnapshot = { name: "Client", lanes: [{ name: "Client", laneX: 0, laneY: 28, laneW: 340 }] };
    const out = moveActorInDsl(base, s, 100);
    expect(out).toMatch(/- Client:.*posX: 100/);
    expect(out).toMatch(/^\s+- API\s*$/m);
  });

  it("escaped quote を含む alias にも座標を書ける", () => {
    // `extractAllActorNames` が認識する alias を `updateActorPosition` が取りこぼすと、
    // 掴んだ actor だけ座標が書かれず、 未 pin の唯一の lane として layoutLanes の
    // cursorX = 0 に落ちる = 掴んだ actor が左端にワープする。
    const src = 'actors:\n  - "a \\" b": { kind: x }\n  - API\n';
    const s2: ActorSnapshot = {
      name: 'a " b',
      lanes: [
        { name: 'a " b', laneX: 0, laneY: 28, laneW: 340 },
        { name: "API", laneX: 565, laneY: 28, laneW: 340 },
      ],
    };
    const out = moveActorInDsl(src, s2, 100);
    expect(out).toMatch(/- "a \\" b": \{[^}]*posX: 100/);
    expect(out).toMatch(/- API:.*posX: 565/);
  });

  it("CRLF の DSL で行末が混在しない", () => {
    // 書き換えた行だけ `\r` が落ちると CRLF buffer に LF 行が混ざる。
    const src = "actors:\r\n  - Client\r\n  - API\r\n";
    const s: ActorSnapshot = {
      name: "Client",
      lanes: [
        { name: "Client", laneX: 0, laneY: 28, laneW: 340 },
        { name: "API", laneX: 565, laneY: 28, laneW: 340 },
      ],
    };
    const out = moveActorInDsl(src, s, 100);
    expect(out.match(/(?<!\r)\n/)).toBeNull();
  });
});

describe("clampDx (重なり防止)", () => {
  it("隣に重なる手前で止める", () => {
    // Client 右端 340、 API 左端 565 = 隙間 225。 gap 40 を残すので 185 が上限。
    expect(clampDx(snap("Client"), 1000)).toBe(565 - MIN_LANE_GAP - 340);
  });

  it("重ならない範囲の移動はそのまま通す", () => {
    expect(clampDx(snap("Client"), 100)).toBe(100);
  });

  it("左方向も隣の右端 + gap で止める", () => {
    // DB 左端 1130、 API 右端 905 = 隙間 225。 -185 が下限。
    expect(clampDx(snap("DB"), -1000)).toBe(905 + MIN_LANE_GAP - 1130);
  });

  it("左端の actor は左方向に制限されない", () => {
    expect(clampDx(snap("Client"), -5000)).toBe(-5000);
  });

  it("右端の actor は右方向に制限されない", () => {
    expect(clampDx(snap("DB"), 5000)).toBe(5000);
  });

  it("真ん中の actor は両方向に制限される", () => {
    expect(clampDx(snap("API"), 5000)).toBe(1130 - MIN_LANE_GAP - 340 - 565);
    expect(clampDx(snap("API"), -5000)).toBe(340 + MIN_LANE_GAP - 565);
  });

  it("MIN_LANE_GAP は 40 以上 (定数書換で assertion が追随しないよう literal で固定)", () => {
    // 期待値を定数から組み立てる assertion だけだと、 40 → 0 の書換が素通りする。
    expect(MIN_LANE_GAP).toBeGreaterThanOrEqual(40);
  });

  it("既に間隔が足りない隣に対して drag の向きが反転しない", () => {
    // 限界値に下限が無いと、 右に引いたのに左へ動く (実測 = dx +5 で -30)。
    const near: ActorSnapshot = {
      name: "Client",
      lanes: [
        { name: "Client", laneX: 0, laneY: 28, laneW: 340 },
        { name: "API", laneX: 350, laneY: 28, laneW: 340 },
      ],
    };
    for (const dx of [5, 5000]) expect(clampDx(near, dx)).toBeGreaterThanOrEqual(0);
    for (const dx of [-5, -5000]) expect(clampDx(near, dx)).toBeLessThanOrEqual(0);
  });

  it("clamp 量が元の delta を超えない / 向きを変えない", () => {
    const cases: Array<Array<[string, number, number]>> = [
      [["A", 0, 340], ["B", 350, 340]],
      [["A", 0, 340], ["B", 200, 340]],
      [["A", 0, 340], ["B", 1000, 340]],
    ];
    for (const lanes of cases) {
      const sn: ActorSnapshot = { name: "A", lanes: lanes.map(([name, x, w]) => ({ name, laneX: x, laneY: 28, laneW: w })) };
      for (const dx of [-5000, -100, -5, 5, 100, 5000]) {
        const r = clampDx(sn, dx);
        expect(Math.abs(r)).toBeLessThanOrEqual(Math.abs(dx));
        expect(r === 0 || Math.sign(r) === Math.sign(dx)).toBe(true);
      }
    }
  });

  it("既に重なっている隣に向かっては動かさない (離れる方向は通す)", () => {
    // drag 経路では到達しないが、 手書き posX や本 PR 以前の DSL では起こりうる。
    const overlap: ActorSnapshot = {
      name: "Client",
      lanes: [
        { name: "Client", laneX: 0, laneY: 28, laneW: 340 },
        { name: "Server", laneX: 200, laneY: 28, laneW: 340 },
      ],
    };
    expect(clampDx(overlap, 100)).toBe(0);
    expect(clampDx(overlap, -100)).toBe(-100);
  });

  it("1 本しか無ければ制限しない", () => {
    const s: ActorSnapshot = { name: "Client", lanes: [{ name: "Client", laneX: 0, laneY: 28, laneW: 340 }] };
    expect(clampDx(s, 9999)).toBe(9999);
  });

  it("moveActorInDsl も clamp 後の値を書く", () => {
    // 重なる位置に置くと cdl の衝突解決が掴んでいない actor を縦に逃がす。
    const out = moveActorInDsl(base, snap("Client"), 1000);
    expect(out).toMatch(new RegExp(`- Client:.*posX: ${565 - MIN_LANE_GAP - 340}`));
  });
});

describe("extractAllActorNames (hit-test と snapshot で共有)", () => {
  it("actors block の 3 形式を順に集める", () => {
    const src = `actors:
  - Client
  - API: { posX: 1 }
  - "My Actor": { kind: x }
flow:
  - Client -> API: "req"
`;
    expect(extractAllActorNames(src)).toEqual(["Client", "API", "My Actor"]);
  });

  it("flow block の矢印を actor として拾わない", () => {
    const src = `actors:
  - Client
flow:
  - Client -> API: "req"
`;
    expect(extractAllActorNames(src)).toEqual(["Client"]);
  });

  it("CRLF でも読める", () => {
    expect(extractAllActorNames("actors:\r\n  - Client\r\n  - API\r\n")).toEqual(["Client", "API"]);
  });

  it("escaped quote を含む alias を復号する", () => {
    expect(extractAllActorNames('actors:\n  - "a \\" b": { kind: x }\n')).toEqual(['a " b']);
  });

  it("actors block が無ければ空", () => {
    expect(extractAllActorNames('title: "T"\nflow:\n  - A -> B: "x"\n')).toEqual([]);
  });
});

describe("buildActorSnapshotFromSvg", () => {
  type Lane = { x: number; y: number; w: number; h: number; attrs?: boolean };

  /** lane の `<g>` を模した stub。 `attrs: false` で属性欠落 (bbox fallback) を再現する。 */
  const stubSvg = (lanes: Record<string, Lane>): SVGSVGElement =>
    ({
      querySelector: (sel: string) => {
        // 実 querySelector と同じく、 属性値の quote が閉じていない selector は SyntaxError。
        // escape せず生の名前を埋めると `[data-cdl-lane="a " b"]` になってここで落ちる。
        if (!/^\[data-cdl-lane="(?:[^"\\]|\\.)*"\]$/.test(sel.trim())) {
          throw new DOMException(`invalid selector: ${sel}`, "SyntaxError");
        }
        const m = sel.match(/data-cdl-lane="((?:[^"\\]|\\.)*)"/);
        const key = m ? m[1]!.replace(/\\(.)/g, "$1") : "";
        const hit = lanes[key];
        if (!hit) return null;
        return {
          getAttribute: (k: string) => {
            if (hit.attrs === false) return null;
            if (k === "data-cdl-lane-x") return String(hit.x);
            if (k === "data-cdl-lane-y") return String(hit.y);
            if (k === "data-cdl-lane-w") return String(hit.w);
            return null;
          },
          // 実 SVG では `contain: true` の lane で枠線 (strokeWidth 1.5) が bbox を
          // 左右 0.75px ずつ広げる。 属性を読まず bbox に頼ると drag ごとにずれるため、
          // stub でも属性値と bbox をずらして違いを検出できるようにする。
          getBoundingClientRect: () => {
            // 非表示要素 (w/h = 0) には枠線が乗らない
            const pad = hit.w > 0 && hit.h > 0 ? 0.75 : 0;
            return {
              left: hit.x - pad, top: hit.y - pad,
              right: hit.x + hit.w + pad, bottom: hit.y + hit.h + pad,
              width: hit.w + pad * 2, height: hit.h + pad * 2,
            };
          },
        };
      },
    }) as unknown as SVGSVGElement;

  const identity = (x: number, y: number): { x: number; y: number } => ({ x, y });
  const slug = (n: string): string => n.toLowerCase();

  it("lane 属性から座標を読む (bbox 実測に頼らない)", () => {
    // bbox は枠線分だけ広がるので、 属性値と 1px ずれる値を返す stub にしておく。
    const svg = stubSvg({ client: { x: 0, y: 28, w: 340, h: 700 }, api: { x: 565, y: 28, w: 340, h: 700 } });
    const s = buildActorSnapshotFromSvg(svg, "Client", ["Client", "API"], slug, identity);
    expect(s!.lanes).toEqual([
      { name: "Client", laneX: 0, laneY: 28, laneW: 340 },
      { name: "API", laneX: 565, laneY: 28, laneW: 340 },
    ]);
  });

  it("属性が無ければ bbox 実測に落ちる (枠線分ずれるが座標は得られる)", () => {
    const svg = stubSvg({ client: { x: 10, y: 20, w: 300, h: 700, attrs: false } });
    const s = buildActorSnapshotFromSvg(svg, "Client", ["Client"], slug, identity);
    expect(s!.lanes[0]).toEqual({ name: "Client", laneX: 9.25, laneY: 19.25, laneW: 301.5 });
  });

  it("drag 対象の lane が無ければ null (drag を起動しない)", () => {
    const svg = stubSvg({ api: { x: 565, y: 28, w: 340, h: 700 } });
    expect(buildActorSnapshotFromSvg(svg, "Client", ["Client", "API"], slug, identity)).toBeNull();
  });

  it("lane が見つからない actor は除く (auto layout のまま残す)", () => {
    const svg = stubSvg({ client: { x: 0, y: 28, w: 340, h: 700 } });
    const s = buildActorSnapshotFromSvg(svg, "Client", ["Client", "API"], slug, identity);
    expect(s!.lanes.map((l) => l.name)).toEqual(["Client"]);
  });

  it("サイズ 0 の lane は除く (bbox fallback 経路)", () => {
    const svg = stubSvg({
      client: { x: 0, y: 28, w: 340, h: 700 },
      api: { x: 0, y: 0, w: 0, h: 0, attrs: false },
    });
    const s = buildActorSnapshotFromSvg(svg, "Client", ["Client", "API"], slug, identity);
    expect(s!.lanes.map((l) => l.name)).toEqual(["Client"]);
  });

  it('alias に " を含んでも例外を投げない', () => {
    // selector に生の値を埋めると `[data-cdl-lane="a " b"]` になり querySelector が SyntaxError。
    // mousedown handler ごと落ちるので、 escape するか諦めて null を返す必要がある。
    const svg = stubSvg({ 'a " b': { x: 5, y: 6, w: 340, h: 700 } });
    expect(() => buildActorSnapshotFromSvg(svg, 'a " b', ['a " b'], (n) => n, identity)).not.toThrow();
  });

  it("client → world 変換は bbox fallback 経路でのみ通す", () => {
    const svg = stubSvg({ client: { x: 100, y: 200, w: 340, h: 700, attrs: false } });
    const s = buildActorSnapshotFromSvg(svg, "Client", ["Client"], slug, (x, y) => ({ x: x / 2, y: y / 2 }));
    expect(s!.lanes[0]!.laneX).toBeCloseTo(49.625, 3);
    expect(s!.lanes[0]!.laneW).toBeCloseTo(170.75, 3);
  });
});
