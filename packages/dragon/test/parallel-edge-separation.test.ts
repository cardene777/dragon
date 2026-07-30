import { describe, it, expect } from "vitest";
import { layout, requiredNearClearance } from "@cardenelabs/cdl";
import type { CdlDiagram, LaidDiagram } from "@cardenelabs/cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";
import * as primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";

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
  return typeof o.id === "string" && Array.isArray(o.nodes) && Array.isArray(o.edges) && Array.isArray(o.lanes);
}

const MODS = [
  interactive,
  patterns,
  presets,
  textDsl,
  cookbook,
  animation,
  styles,
  primitives,
  primitivesExtra,
  ethereum,
];

/** cdl の `PATH_NUMBER` と同じ数値表現。 指数表記を受理する。 */
const NUM = String.raw`-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?`;
const RE_BOW = new RegExp(
  `^M\\s*(${NUM})[\\s,]+(${NUM})\\s*Q\\s*(${NUM})[\\s,]+(${NUM})[\\s,]+(${NUM})[\\s,]+(${NUM})\\s*$`,
);
const RE_TOKEN = new RegExp(`([MLQCZ])|(${NUM})`, "g");

/** path を `command + 座標` の列に分解する。 丸めない。 */
function tokenize(d: string): Array<{ cmd: string; nums: number[] }> {
  const out: Array<{ cmd: string; nums: number[] }> = [];
  for (const m of d.matchAll(RE_TOKEN)) {
    if (m[1]) out.push({ cmd: m[1], nums: [] });
    else if (out.length > 0) out[out.length - 1]!.nums.push(Number(m[2]));
  }
  return out;
}

/**
 * 向きを無視した path の key。 A→B と B→A を同じものとして扱う。
 *
 * 丸めない = 丸めると別の path (例 `L 10 0` と `L 10.004 0`) が同一視され、 cdl が分離対象に
 * しない有効な 2 本を「一致」 と誤判定する。 command も key に含める = 座標列だけでは直線と曲線を
 * 区別できない。
 */
function normalizedPath(d: string): string {
  const toks = tokenize(d);
  const fwd = toks.map((t) => `${t.cmd}:${t.nums.join(",")}`).join(" ");
  const rev = [...toks].reverse().map((t) => `${t.cmd}:${t.nums.join(",")}`).join(" ");
  return fwd < rev ? fwd : rev;
}

/** 弓なりにした 1 本 (`M ... Q ...` だけ) の点列。 それ以外は null。 */
function bowPoints(d: string, steps = 400): Array<[number, number]> | null {
  const m = RE_BOW.exec(d);
  if (!m) return null;
  const [x1, y1, cx, cy, x2, y2] = m.slice(1).map(Number) as [number, number, number, number, number, number];
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
  const [x1, y1, , , x2, y2] = m.slice(1).map(Number) as [number, number, number, number, number, number];
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return pts;
}

function distToRect(px: number, py: number, r: { x: number; y: number; w: number; h: number }): number {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}
function minDist(pts: Array<[number, number]>, r: { x: number; y: number; w: number; h: number }): number {
  let best = Infinity;
  for (const [px, py] of pts) best = Math.min(best, distToRect(px, py, r));
  return best;
}

/** catalog 全図を 1 度だけ layout する。 例外は捨てずに集める。 */
function layoutAll(): { laid: Array<{ id: string; laid: LaidDiagram }>; failures: string[]; count: number } {
  const diagrams: CdlDiagram[] = [];
  for (const mod of MODS) for (const [, v] of Object.entries(mod)) if (isCdlDiagram(v)) diagrams.push(v);
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

  it("catalog 全図が layout できる (例外を捨てずに数える)", () => {
    expect(ALL.count, "catalog の図が読めていない").toBeGreaterThan(300);
    expect(ALL.failures, `layout に失敗した図:\n${ALL.failures.join("\n")}`).toHaveLength(0);
    expect(ALL.laid).toHaveLength(ALL.count);
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
              px > n.cx - n.w / 2 + 1 && px < n.cx + n.w / 2 - 1 &&
              py > n.cy - n.h / 2 + 1 && py < n.cy + n.h / 2 - 1
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
          if (after < LABEL_MIN) tight.push(`${id}: ${e.id} ↔ label ${b.id} gap ${after.toFixed(1)}`);
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

  it("弓なりにした 2 本が中点で線幅より広く離れている", () => {
    // 分離幅が線幅 (光っている時 5) より広いこと。 実測は 32 (cdl の PARALLEL_EDGE_BOW)。
    const mid = (pts: Array<[number, number]>) => pts[Math.floor(pts.length / 2)]!;
    const narrow: string[] = [];
    for (const { id, laid } of ALL.laid) {
      const bowed = laid.edges
        .map((e) => ({ id: e.id, pts: bowPoints(e.d) }))
        .filter((x): x is { id: string; pts: Array<[number, number]> } => x.pts !== null);
      if (bowed.length < 2) continue;
      // 同じ端点の組ごとにまとめる (向きは無視する)
      const byEnds = new Map<string, typeof bowed>();
      for (const x of bowed) {
        const a = `${x.pts[0]![0]},${x.pts[0]![1]}`;
        const b = `${x.pts[x.pts.length - 1]![0]},${x.pts[x.pts.length - 1]![1]}`;
        const k = a < b ? `${a}|${b}` : `${b}|${a}`;
        byEnds.set(k, [...(byEnds.get(k) ?? []), x]);
      }
      for (const group of byEnds.values()) {
        if (group.length < 2) continue;
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = mid(group[i]!.pts);
            const b = mid(group[j]!.pts);
            const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
            if (dist <= 5) narrow.push(`${id}: ${group[i]!.id} ↔ ${group[j]!.id} 中点間隔 ${dist.toFixed(1)}`);
          }
        }
      }
    }
    expect(narrow, `中点間隔が線幅以下:\n${narrow.join("\n")}`).toHaveLength(0);
  });
});
