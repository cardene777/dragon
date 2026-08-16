/**
 * parts に静止した部品を残さない (#1164)。
 *
 * `parts` は「使い回す完成した部品」 で、 動くことに意味がある物 (トグル / 再生 / 進捗 /
 * 電波 / 信号) が 15 件静止したまま並んでいた。 同 file の規約「各 parts は 1 phase 化」 は
 * 動かないという意味ではなく、 動く 65 件はいずれも 1 phase の中で値を動かしている。
 *
 * 形を見せるための見本 (`primitives` 等) は対象外。 あちらは静止していてよい。
 */
import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

type Part = { name: string; diagram: CdlDiagram };

const ALL: Part[] = Object.entries(PartsMod as Record<string, unknown>)
  .filter(([, v]) => {
    if (!v || typeof v !== "object") return false;
    const d = v as Partial<CdlDiagram>;
    return typeof d.id === "string" && Array.isArray(d.nodes) && Array.isArray(d.phases);
  })
  .map(([name, v]) => ({ name, diagram: v as CdlDiagram }));

/** その図が段の中で値を動かすか */
const movesValues = (d: CdlDiagram): boolean =>
  d.phases.some((p) => (p.tweens?.length ?? 0) > 0 || (p.sets?.length ?? 0) > 0);

/** 注目先が段ごとに変わるか (値を動かさない図の逃げ道) */
const focusChanges = (d: CdlDiagram): boolean => {
  const key = (a: readonly string[] = []) => [...new Set(a)].sort().join(",");
  return new Set(d.phases.map((p) => key(p.activate))).size > 1;
};

describe("parts に静止した部品を残さない (#1164)", () => {
  it("対象が全件そろっている", () => {
    // 名前を打ち間違えると以下が素通りする
    expect(ALL.length).toBeGreaterThanOrEqual(80);
  });

  it("全ての parts が段の中で値を動かす", () => {
    const still = ALL.filter((p) => !movesValues(p.diagram)).map((p) => p.name);
    expect(still, `値が動かない部品: ${still.join(", ")}`).toEqual([]);
  });

  it("完全に静止した部品が 1 件も無い", () => {
    // 値も注目先も変わらない = 開いても静止画と区別が付かない
    const dead = ALL.filter((p) => !movesValues(p.diagram) && !focusChanges(p.diagram)).map((p) => p.name);
    expect(dead).toEqual([]);
  });

  it("動くことに意味がある部品が実際に動く", () => {
    // 静止していた 15 件のうち、 止まっていると意味が壊れるもの。
    // 名前で名指しして、 後から誰かが動きを外した時に落ちるようにする
    const 名指し = [
      "partsToggleSwitch",
      "partsPlayButton",
      "partsProgressDots",
      "partsWifiSignal",
      "partsTrafficLightStack",
      "partsAlarmClock",
      "partsRatingStars",
      "partsSearchBar",
      "partsMessageBubble",
      "partsStateIndicator",
    ];
    const byName = new Map(ALL.map((p) => [p.name, p.diagram]));
    const 見つからない = 名指し.filter((n) => !byName.has(n));
    expect(見つからない, `名前が変わった: ${見つからない.join(", ")}`).toEqual([]);

    const 止まっている = 名指し.filter((n) => !movesValues(byName.get(n)!));
    expect(止まっている).toEqual([]);
  });

  it("段は 1 つのままにする (parts の規約、 既存の 2 段以上は据え置き)", () => {
    // #1164 で動きを足した 15 件が段を増やしていないことを見る。
    // 既存の bind pattern demo は元から複数段なので対象外
    const 今回の対象 = [
      "partsAchievement", "partsAlarmClock", "partsBookmark", "partsLocationPin",
      "partsMessageBubble", "partsPlayButton", "partsProgressDots", "partsRatingStars",
      "partsSearchBar", "partsStateIndicator", "partsToggleSwitch", "partsTrafficLightStack",
      "partsUserAvatar", "partsWeatherIcon", "partsWifiSignal",
    ];
    const byName = new Map(ALL.map((p) => [p.name, p.diagram]));
    const 増えた = 今回の対象.filter((n) => (byName.get(n)?.phases.length ?? 0) !== 1);
    expect(増えた).toEqual([]);
  });
});
