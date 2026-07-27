import { describe, it, expect } from "vitest";
import { moveActorInDsl, collectActorNames, buildActorSnapshotFromSvg, type ActorSnapshot } from "./cdl-actor-move";

const base = `title: "T"
type: sequence
actors:
  - Client
  - API
  - DB
flow:
  - Client -> API: "req"
`;

const snap = (target: string): ActorSnapshot => ({
  name: target,
  lanes: [
    { name: "Client", laneX: 0, laneY: 28 },
    { name: "API", laneX: 565, laneY: 28 },
    { name: "DB", laneX: 1130, laneY: 28 },
  ],
});

describe("moveActorInDsl", () => {
  it("対象 actor に delta を足した座標を書く", () => {
    const out = moveActorInDsl(base, snap("Client"), 200);
    expect(out).toMatch(/- Client:.*posX: 200/);
  });

  it("移動しない actor にも現在位置を書いて固定する", () => {
    // lane の x は「指定が無い lane を順に並べる」 ロジックで決まるため、
    // 1 つだけ posX を与えると残りが詰め直されて大きく動く (実測 = Client +200 で API -565)。
    // user が最も嫌う「勝手に移動する」 挙動なので、 全 actor に座標を書いて固定する。
    const out = moveActorInDsl(base, snap("Client"), 200);
    expect(out).toMatch(/- API:.*posX: 565/);
    expect(out).toMatch(/- DB:.*posX: 1130/);
  });

  it("対象以外の座標に delta を足さない", () => {
    const out = moveActorInDsl(base, snap("Client"), 200);
    expect(out).not.toMatch(/- API:.*posX: 765/);
    expect(out).toMatch(/- API:.*posY: 28/);
  });

  it("縦位置は動かさない (sequence の縦軸は時系列で構造上動かせない)", () => {
    // lane に posY を書くと row の起点が動いて全 actor がずれ、
    // 同時に lane 高さが footer 位置から再計算されて header と footer が縦に割れる。
    const out = moveActorInDsl(base, snap("Client"), 200);
    expect(out).toMatch(/- Client:.*posY: 28/);
  });

  it("真ん中の actor を動かしても両隣が固定される", () => {
    const out = moveActorInDsl(base, snap("API"), -100);
    expect(out).toMatch(/- Client:.*posX: 0/);
    expect(out).toMatch(/- API:.*posX: 465/);
    expect(out).toMatch(/- DB:.*posX: 1130/);
  });

  it("負方向の移動も書ける", () => {
    const out = moveActorInDsl(base, snap("DB"), -300);
    expect(out).toMatch(/- DB:.*posX: 830/);
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
    const out = moveActorInDsl(src, { name: "Client", lanes: [{ name: "Client", laneX: 10, laneY: 20 }] }, 5);
    expect(out).toContain('bg: "#fff"');
    expect(out).toMatch(/posX: 15/);
  });

  it("snapshot に無い actor は触らない (auto layout のまま残す)", () => {
    const out = moveActorInDsl(base, { name: "Client", lanes: [{ name: "Client", laneX: 0, laneY: 28 }] }, 100);
    expect(out).toMatch(/- Client:.*posX: 100/);
    expect(out).toMatch(/^\s+- API\s*$/m);
  });
});

describe("collectActorNames", () => {
  it("actors block の 3 形式を順に集める", () => {
    const src = `actors:
  - Client
  - API: { posX: 1 }
  - "My Actor": { kind: x }
flow:
  - Client -> API: "req"
`;
    expect(collectActorNames(src)).toEqual(["Client", "API", "My Actor"]);
  });

  it("flow block の矢印を actor として拾わない", () => {
    const src = `actors:
  - Client
flow:
  - Client -> API: "req"
  - API -> DB: "q"
`;
    expect(collectActorNames(src)).toEqual(["Client"]);
  });

  it("actors block が無ければ空", () => {
    expect(collectActorNames('title: "T"\nflow:\n  - A -> B: "x"\n')).toEqual([]);
  });

  it("CRLF でも読める", () => {
    expect(collectActorNames("actors:\r\n  - Client\r\n  - API\r\n")).toEqual(["Client", "API"]);
  });

  it("escaped quote を含む alias を復号する", () => {
    expect(collectActorNames('actors:\n  - "a \\" b": { kind: x }\n')).toEqual(['a " b']);
  });

  it("空行を挟んでも actors block を抜けない", () => {
    expect(collectActorNames("actors:\n  - Client\n\n  - API\nflow:\n")).toEqual(["Client", "API"]);
  });
});

describe("buildActorSnapshotFromSvg", () => {
  /** getBoundingClientRect を返すだけの最小 stub。 */
  const stubSvg = (lanes: Record<string, { x: number; y: number; w: number; h: number }>): SVGSVGElement =>
    ({
      querySelector: (sel: string) => {
        const m = sel.match(/data-cdl-lane="([^"]+)"/);
        const hit = m ? lanes[m[1]!] : undefined;
        if (!hit) return null;
        return { getBoundingClientRect: () => ({ left: hit.x, top: hit.y, width: hit.w, height: hit.h }) };
      },
    }) as unknown as SVGSVGElement;

  const identity = (x: number, y: number): { x: number; y: number } => ({ x, y });
  const slug = (n: string): string => n.toLowerCase();

  it("全 actor の lane を測る", () => {
    const svg = stubSvg({ client: { x: 0, y: 28, w: 340, h: 700 }, api: { x: 565, y: 28, w: 340, h: 700 } });
    const s = buildActorSnapshotFromSvg(svg, "Client", ["Client", "API"], slug, identity);
    expect(s).not.toBeNull();
    expect(s!.name).toBe("Client");
    expect(s!.lanes).toEqual([
      { name: "Client", laneX: 0, laneY: 28 },
      { name: "API", laneX: 565, laneY: 28 },
    ]);
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

  it("サイズ 0 の lane は除く (非表示要素を掴まない)", () => {
    const svg = stubSvg({ client: { x: 0, y: 28, w: 340, h: 700 }, api: { x: 0, y: 0, w: 0, h: 0 } });
    const s = buildActorSnapshotFromSvg(svg, "Client", ["Client", "API"], slug, identity);
    expect(s!.lanes.map((l) => l.name)).toEqual(["Client"]);
  });

  it("client → world 変換を通す", () => {
    const svg = stubSvg({ client: { x: 100, y: 200, w: 340, h: 700 } });
    const s = buildActorSnapshotFromSvg(svg, "Client", ["Client"], slug, (x, y) => ({ x: x / 2, y: y / 2 }));
    expect(s!.lanes[0]).toEqual({ name: "Client", laneX: 50, laneY: 100 });
  });
});
