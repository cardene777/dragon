import { describe, it, expect } from "vitest";
import { layout, requiredNearClearance } from "@cardenelabs/cdl";
import type { CdlDiagram, LaidDiagram } from "@cardenelabs/cdl";
import { 全図, カタログの群の名 } from "./support/responsive-accepted";
import { 実在する群 } from "./support/catalog-groups";

/**
 * #941 = 同じ 2 点を結ぶ edge が複数あるとき、 座標が完全に一致して 1 本に見える問題の guard。
 *
 * cdl 側で「途中だけ弓なりにして分ける」 経路を入れた (端点は動かせない = 起点の集約と矢頭の
 * 着地の規約がある)。 衝突判定は曲線を弦に落として見るため **validator では分離を確認できない**。
 * 実際に描かれる曲線を刻んで測る。
 *
 * 判定は cdl 側の契約に合わせる。
 *   - node = 縁より内側 (1 world の余裕) に入らない
 *   - label = 「弦の時点で既に近い label は対象外、 曲げて新たに近づけない」。 絶対距離を要求すると、
 *     label が path の上に乗る通常の配置 (cdl が正しく分離する形) で落ちる
 */
function isCdlDiagram(v: unknown): v is CdlDiagram {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    Array.isArray(o.lanes)
  );
}

/** cdl の `PATH_NUMBER` と同じ数値表現。 指数表記を受理する。 */
const NUM = String.raw`-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?`;
const RE_BOW = new RegExp(
  `^M\\s*(${NUM})[\\s,]+(${NUM})\\s*Q\\s*(${NUM})[\\s,]+(${NUM})[\\s,]+(${NUM})[\\s,]+(${NUM})\\s*$`,
);
const RE_TOKEN = new RegExp(`([MLQCZ])|(${NUM})`, "g");

type Pt = [number, number];
/** 1 区間 = 命令 + 制御点 + 終点。 */
type Seg = { cmd: string; ctrls: Pt[]; end: Pt };

/** path を「始点 + 区間の列」 に分解する。 丸めない。 */
function parsePath(d: string): { start: Pt; segs: Seg[] } | null {
  const toks: Array<{ cmd: string; nums: number[] }> = [];
  for (const m of d.matchAll(RE_TOKEN)) {
    if (m[1]) toks.push({ cmd: m[1], nums: [] });
    else if (toks.length > 0) toks[toks.length - 1]!.nums.push(Number(m[2]));
  }
  if (toks.length === 0 || toks[0]!.cmd !== "M" || toks[0]!.nums.length < 2) return null;
  const start: Pt = [toks[0]!.nums[0]!, toks[0]!.nums[1]!];
  const segs: Seg[] = [];
  for (const t of toks.slice(1)) {
    const pairs: Pt[] = [];
    for (let i = 0; i + 1 < t.nums.length; i += 2) pairs.push([t.nums[i]!, t.nums[i + 1]!]);
    if (pairs.length === 0) continue; // Z 等
    segs.push({ cmd: t.cmd, ctrls: pairs.slice(0, -1), end: pairs[pairs.length - 1]! });
  }
  return { start, segs };
}

const fmt = (p: Pt) => `${p[0]},${p[1]}`;

/**
 * 向きを無視した path の key。 A→B と B→A を同じものとして扱う。
 *
 * 丸めない = 丸めると別の path (例 `L 10 0` と `L 10.004 0`) が同一視され、 cdl が分離対象に
 * しない有効な 2 本を「一致」 と誤判定する。 命令も key に含める = 座標列だけでは直線と曲線を
 * 区別できない。
 *
 * 逆向きは **幾何として** 反転する = 区間の並びを逆にし、 区間内の制御点も逆にして、 終点を
 * 1 つ前の点にする。 token 列をそのまま反転すると `M 0 0 Q 5 5 10 0` と `M 10 0 Q 5 5 0 0` が
 * 別の key になる (同じ曲線なのに一致と判定できない)。
 */
function normalizedPath(d: string): string {
  const parsed = parsePath(d);
  if (!parsed) return d.replace(/\s+/g, " ").trim();
  const { start, segs } = parsed;
  const fwd = [
    fmt(start),
    ...segs.map((sg) => `${sg.cmd}(${sg.ctrls.map(fmt).join(";")})->${fmt(sg.end)}`),
  ].join(" ");
  const pts: Pt[] = [start, ...segs.map((sg) => sg.end)];
  const revSegs: string[] = [];
  for (let i = segs.length - 1; i >= 0; i--) {
    const sg = segs[i]!;
    revSegs.push(`${sg.cmd}(${[...sg.ctrls].reverse().map(fmt).join(";")})->${fmt(pts[i]!)}`);
  }
  const rev = [fmt(pts[pts.length - 1]!), ...revSegs].join(" ");
  return fwd < rev ? fwd : rev;
}

/** 弓なりにした 1 本 (`M ... Q ...` だけ) の点列。 それ以外は null。 */
function bowPoints(d: string, steps = 400): Array<[number, number]> | null {
  const m = RE_BOW.exec(d);
  if (!m) return null;
  const [x1, y1, cx, cy, x2, y2] = m.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([u * u * x1 + 2 * t * u * cx + t * t * x2, u * u * y1 + 2 * t * u * cy + t * t * y2]);
  }
  return pts;
}

/** 弓なりの弦 (両端を結ぶ直線) の点列。 label の初期距離を測るのに使う。 */
function chordPoints(d: string, steps = 400): Array<[number, number]> | null {
  const m = RE_BOW.exec(d);
  if (!m) return null;
  const [x1, y1, , , x2, y2] = m.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return pts;
}

function distToRect(
  px: number,
  py: number,
  r: { x: number; y: number; w: number; h: number },
): number {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}
function minDist(
  pts: Array<[number, number]>,
  r: { x: number; y: number; w: number; h: number },
): number {
  let best = Infinity;
  for (const [px, py] of pts) best = Math.min(best, distToRect(px, py, r));
  return best;
}

/** catalog 全図を 1 度だけ layout する。 例外は捨てずに集める。 */
function layoutAll(): {
  laid: Array<{ id: string; laid: LaidDiagram }>;
  failures: string[];
  count: number;
} {
  const diagrams: CdlDiagram[] = [];
  for (const v of 全図) if (isCdlDiagram(v)) diagrams.push(v);
  const laid: Array<{ id: string; laid: LaidDiagram }> = [];
  const failures: string[] = [];
  for (const d of diagrams) {
    try {
      laid.push({ id: d.id, laid: layout(d) });
    } catch (e) {
      failures.push(`${d.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { laid, failures, count: diagrams.length };
}

const ALL = layoutAll();

/** 分離が起きているはずの edge。 図が増えて分離が増えるのは許容し、 この 6 本の欠落だけを見る。 */
const KNOWN_BOWED = [
  "interactive-oauth-flow::client-consent",
  "interactive-oauth-flow::consent-client",
  "interactive-oauth-flow::code-exchange",
  "interactive-oauth-flow::token-issue",
  "pattern-call-rw::read",
  "pattern-call-rw::write",
];

describe("#941 同じ 2 点を結ぶ edge が重ならない", () => {
  const LABEL_MIN = requiredNearClearance("edge-label", "edge-path");

  it("走査した群が dir の実体と 1 件も違わない (#2314)", () => {
    /*
     * 群を手で並べていた頃は `charts` `parts` `parts-in-box` `parts-motion` が抜けており、
     * 584 図のうち 176 図 (30%) を 1 度も見ていなかった。 走査に変えただけでは走査の
     * 書き方を間違えた時に気付けないので、別の経路 (`readdirSync`) と突き合わせる。
     */
    expect(カタログの群の名(), `dir にある群 ${実在する群().length} 件と突き合わせた`).toEqual(
      実在する群(),
    );
  });

  it("catalog 全図が layout できる (例外を捨てずに数える)", () => {
    expect(ALL.count, "catalog の図が読めていない").toBeGreaterThan(300);
    expect(ALL.failures, `layout に失敗した図:\n${ALL.failures.join("\n")}`).toHaveLength(0);
    expect(ALL.laid).toHaveLength(ALL.count);
  });

  it("向きの正規化が幾何として正しい (helper を直接叩く)", () => {
    // token 列をそのまま反転すると `M 0 0 Q 5 5 10 0` と `M 10 0 Q 5 5 0 0` が別の key になる
    // (同じ曲線なのに一致と判定できない)。 区間の並びと区間内の制御点を反転する形で固定する。
    const same: Array<[string, string]> = [
      ["M 0 0 Q 5 5 10 0", "M 10 0 Q 5 5 0 0"],
      ["M 0 0 L 10 0", "M 10 0 L 0 0"],
      ["M 0 0 L 5 0 L 10 0", "M 10 0 L 5 0 L 0 0"],
      ["M 1e-7 0 L 400 0", "M 400 0 L 1e-7 0"],
    ];
    for (const [a, b] of same) {
      expect(normalizedPath(a), `${a} と ${b} が同一にならない`).toBe(normalizedPath(b));
    }
    const diff: Array<[string, string]> = [
      // 丸めると同一視されてしまう組
      ["M 0 0 L 10 0", "M 10.004 0 L 0.004 0"],
      // 制御点の向きが逆 = 別の曲線
      ["M 0 0 Q 5 5 10 0", "M 0 0 Q 5 -5 10 0"],
      // 命令が違う = 直線と曲線
      ["M 0 0 L 10 0", "M 0 0 Q 5 0 10 0"],
    ];
    for (const [a, b] of diff) {
      expect(normalizedPath(a), `${a} と ${b} が同一視される`).not.toBe(normalizedPath(b));
    }
  });

  it("向きを無視して world 座標が一致する path が 1 組も無い", () => {
    const dup: string[] = [];
    for (const { id, laid } of ALL.laid) {
      const byPath = new Map<string, string[]>();
      for (const e of laid.edges) {
        const k = normalizedPath(e.d);
        byPath.set(k, [...(byPath.get(k) ?? []), e.id]);
      }
      for (const [, ids] of byPath) if (ids.length >= 2) dup.push(`${id}: ${ids.join(" = ")}`);
    }
    expect(dup, `座標が一致する path:\n${dup.join("\n")}`).toHaveLength(0);
  });

  it("弓なりにした曲線が node の内側に入らない", () => {
    const inside = new Set<string>();
    for (const { id, laid } of ALL.laid) {
      for (const e of laid.edges) {
        const pts = bowPoints(e.d);
        if (!pts) continue;
        for (const [px, py] of pts) {
          for (const n of laid.nodes) {
            // 端点は縁に着くので、 縁より 1 world 内側に入ったかを見る (cdl の余裕と同値)
            if (
              px > n.cx - n.w / 2 + 1 &&
              px < n.cx + n.w / 2 - 1 &&
              py > n.cy - n.h / 2 + 1 &&
              py < n.cy + n.h / 2 - 1
            ) {
              inside.add(`${id}: ${e.id} が node ${n.id} の内側`);
            }
          }
        }
      }
    }
    expect([...inside], `node を貫通:\n${[...inside].join("\n")}`).toHaveLength(0);
  });

  it(`弓なりにしたことで label に新たに近づいていない (spec ${LABEL_MIN})`, () => {
    // 絶対距離を要求してはいけない。 label は path の上に白い pill として乗るのが通常の配置で、
    // 弦の時点で既に矩形の中を通っていることがある (cdl はその場合も正しく分離する)。
    // cdl の契約と同じく「弦の時点で既に近い label は対象外、 曲げて新たに近づけない」 で見る。
    const tight: string[] = [];
    for (const { id, laid } of ALL.laid) {
      const labels = laid.bboxes.filter((b) => b.kind === "edge-label");
      for (const e of laid.edges) {
        const pts = bowPoints(e.d);
        const chord = chordPoints(e.d);
        if (!pts || !chord) continue;
        for (const b of labels) {
          if (minDist(chord, b) < LABEL_MIN) continue; // 弦の時点で既に近い = 対象外
          const after = minDist(pts, b);
          if (after < LABEL_MIN)
            tight.push(`${id}: ${e.id} ↔ label ${b.id} gap ${after.toFixed(1)}`);
        }
      }
    }
    expect(tight, `曲げて label に近づいた:\n${tight.join("\n")}`).toHaveLength(0);
  });

  it("分離が実在する (guard が空振りしていない)", () => {
    // 上の 3 件は「悪いものが無い」 形の assert なので、 分離が 1 件も起きていなくても通る。
    // 既知の 6 本が分離されていることを別に固定する。 図が増えて分離が増えるのは許容する。
    const bowed = new Set<string>();
    for (const { id, laid } of ALL.laid) {
      for (const e of laid.edges) if (bowPoints(e.d)) bowed.add(`${id}::${e.id}`);
    }
    const missing = KNOWN_BOWED.filter((k) => !bowed.has(k));
    expect(missing, `分離されていない:\n${missing.join("\n")}`).toHaveLength(0);
  });

  it("同じ 2 点を結ぶ線が中点で線幅より広く離れている", () => {
    // 分離幅が線幅 (光っている時 5) より広いこと。 実測は 32 (cdl の PARALLEL_EDGE_BOW)。
    //
    // 弓なりだけを対象にしてはいけない。 3 本群では中央 1 本が直線のまま残るため、 弓なりだけで
    // 群を作ると中央と両隣の間隔を検査しない (中央を中心線の近くへ動かす変異が通ってしまう)。
    const mid = (pts: Array<[number, number]>) => pts[Math.floor(pts.length / 2)]!;
    /** 弓なり / 直線 1 本のどちらでも中点と端点を返す。 折れ線は対象外。 */
    const simpleMid = (d: string): { ends: string; mid: Array<[number, number]> } | null => {
      const bow = bowPoints(d);
      if (bow) {
        const a = fmt(bow[0]!);
        const b = fmt(bow[bow.length - 1]!);
        return { ends: a < b ? `${a}|${b}` : `${b}|${a}`, mid: bow };
      }
      const parsed = parsePath(d);
      if (!parsed || parsed.segs.length !== 1 || parsed.segs[0]!.cmd !== "L") return null;
      const p0 = parsed.start;
      const p1 = parsed.segs[0]!.end;
      const a = fmt(p0);
      const b = fmt(p1);
      return {
        ends: a < b ? `${a}|${b}` : `${b}|${a}`,
        mid: [[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2]],
      };
    };
    const narrow: string[] = [];
    for (const { id, laid } of ALL.laid) {
      const byEnds = new Map<string, Array<{ id: string; mid: Array<[number, number]> }>>();
      for (const e of laid.edges) {
        const s = simpleMid(e.d);
        if (!s) continue;
        byEnds.set(s.ends, [...(byEnds.get(s.ends) ?? []), { id: e.id, mid: s.mid }]);
      }
      for (const group of byEnds.values()) {
        if (group.length < 2) continue;
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = mid(group[i]!.mid);
            const b = mid(group[j]!.mid);
            const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
            if (dist <= 5)
              narrow.push(`${id}: ${group[i]!.id} ↔ ${group[j]!.id} 中点間隔 ${dist.toFixed(1)}`);
          }
        }
      }
    }
    expect(narrow, `中点間隔が線幅以下:\n${narrow.join("\n")}`).toHaveLength(0);
  });
});
