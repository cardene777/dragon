import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
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
 */
function isCdlDiagram(v: unknown): v is CdlDiagram {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && Array.isArray(o.nodes) && Array.isArray(o.edges) && Array.isArray(o.lanes);
}
const MODS = [interactive, patterns, presets, textDsl, cookbook, animation, styles, primitives, primitivesExtra, ethereum];
function allDiagrams(): CdlDiagram[] {
  const out: CdlDiagram[] = [];
  for (const mod of MODS) for (const [, v] of Object.entries(mod)) if (isCdlDiagram(v)) out.push(v);
  return out;
}
/** path を刻んだ点列。 2 次曲線は実際の曲線を、 それ以外は節点を返す。 */
function samplePath(d: string): Array<[number, number]> {
  const q = /^M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*Q\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)\s*$/.exec(d);
  if (q) {
    const [x1, y1, cx, cy, x2, y2] = q.slice(1).map(Number) as [number, number, number, number, number, number];
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const u = 1 - t;
      pts.push([u * u * x1 + 2 * t * u * cx + t * t * x2, u * u * y1 + 2 * t * u * cy + t * t * y2]);
    }
    return pts;
  }
  const nums = (d.match(/-?[\d.]+/g) ?? []).map(Number);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i]!, nums[i + 1]!]);
  return pts;
}
/** 向きを無視した path の key。 A→B と B→A を同じものとして扱う。 */
function normalizedPath(d: string): string {
  const nums = (d.match(/-?[\d.]+/g) ?? []).map((n) => Number(n).toFixed(2));
  const pairs: string[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pairs.push(`${nums[i]},${nums[i + 1]}`);
  const fwd = pairs.join(" ");
  const rev = [...pairs].reverse().join(" ");
  return fwd < rev ? fwd : rev;
}

describe("#941 同じ 2 点を結ぶ edge が重ならない", () => {
  const diagrams = allDiagrams();

  it("catalog に図が揃っている", () => {
    expect(diagrams.length).toBeGreaterThan(300);
  });

  it("world 座標が完全一致する path が 1 組も無い", () => {
    const dup: string[] = [];
    for (const d of diagrams) {
      let laid;
      try {
        laid = layout(d);
      } catch {
        continue;
      }
      const byPath = new Map<string, string[]>();
      for (const e of laid.edges) {
        const k = normalizedPath(e.d);
        byPath.set(k, [...(byPath.get(k) ?? []), e.id]);
      }
      for (const [, ids] of byPath) {
        if (ids.length >= 2) dup.push(`${d.id}: ${ids.join(" = ")}`);
      }
    }
    expect(dup, `座標が一致する path:\n${dup.join("\n")}`).toHaveLength(0);
  });

  it("弓なりにした曲線が node の内側に入らない", () => {
    const inside: string[] = [];
    for (const d of diagrams) {
      let laid;
      try {
        laid = layout(d);
      } catch {
        continue;
      }
      for (const e of laid.edges) {
        if (!e.d.includes("Q") || e.d.includes("L")) continue; // 弓なりにした 1 本だけを見る
        for (const [px, py] of samplePath(e.d)) {
          for (const n of laid.nodes) {
            // 端点は縁に着くので、 縁より 1 world 内側に入ったかを見る
            if (
              px > n.cx - n.w / 2 + 1 && px < n.cx + n.w / 2 - 1 &&
              py > n.cy - n.h / 2 + 1 && py < n.cy + n.h / 2 - 1
            ) {
              inside.push(`${d.id}: ${e.id} が node ${n.id} の内側`);
            }
          }
        }
      }
    }
    expect([...new Set(inside)], `node を貫通:\n${[...new Set(inside)].join("\n")}`).toHaveLength(0);
  });

  it("弓なりにした曲線が label に近づきすぎない", () => {
    // 曲線は弦より膨らむため、 弦の位置で置いた label に寄る可能性がある。 validator は弦しか
    // 見ないので、 ここで実曲線と label 矩形の距離を測る。
    const MIN = 14; // cdl の edge-label ↔ edge-path 規定
    const tight: string[] = [];
    for (const d of diagrams) {
      let laid;
      try {
        laid = layout(d);
      } catch {
        continue;
      }
      const labels = laid.bboxes.filter((b) => b.kind === "edge-label");
      for (const e of laid.edges) {
        if (!e.d.includes("Q") || e.d.includes("L")) continue;
        const pts = samplePath(e.d);
        for (const b of labels) {
          let best = Infinity;
          for (const [px, py] of pts) {
            const dx = Math.max(b.x - px, 0, px - (b.x + b.w));
            const dy = Math.max(b.y - py, 0, py - (b.y + b.h));
            best = Math.min(best, Math.hypot(dx, dy));
          }
          if (best < MIN) tight.push(`${d.id}: ${e.id} ↔ label ${b.id} gap ${best.toFixed(1)}`);
        }
      }
    }
    expect(tight, `label に近すぎる:\n${tight.join("\n")}`).toHaveLength(0);
  });

  it("実際に分離が起きている図がある (guard が空振りしていない)", () => {
    // 上の 3 件は「悪いものが無い」 形の assert なので、 分離が 1 件も起きていなくても通る。
    // 分離対象が実在することを別に固定する。
    const bowed: string[] = [];
    for (const d of diagrams) {
      let laid;
      try {
        laid = layout(d);
      } catch {
        continue;
      }
      for (const e of laid.edges) {
        if (e.d.includes("Q") && !e.d.includes("L")) bowed.push(`${d.id}::${e.id}`);
      }
    }
    // oauth の 4 本 + call-rw の 2 本
    expect(bowed.length, `弓なりにした曲線: ${bowed.join(", ")}`).toBeGreaterThanOrEqual(6);
    expect(bowed.filter((x) => x.startsWith("interactive-oauth-flow"))).toHaveLength(4);
    expect(bowed.filter((x) => x.startsWith("pattern-call-rw"))).toHaveLength(2);
  });
});
