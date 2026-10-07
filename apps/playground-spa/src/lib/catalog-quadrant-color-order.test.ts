import { computeStateValues, layout, type CdlDiagram } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";

import { measureEffortQuadrant } from "@/topics/catalog/charts.cdl";

type 点の色 = "系列 1" | "系列 2" | "沈んだ色";
type 象限 = "左上" | "右上" | "左下" | "右下";

const 並び順の色: readonly 点の色[] = ["系列 1", "系列 1", "系列 2", "系列 2", "沈んだ色"];
const 象限の色: Readonly<Record<象限, 点の色>> = {
  左上: "系列 1",
  右上: "系列 2",
  左下: "系列 2",
  右下: "沈んだ色",
};

function 座標を読む(value: number | string, states: Readonly<Record<string, string>>): number {
  if (typeof value === "number") return value;
  const stateName = /^\{(.+)\}$/u.exec(value)?.[1];
  if (stateName === undefined || states[stateName] === undefined) {
    throw new Error(`四象限の座標 ${value} を状態から読めない`);
  }
  return Number(states[stateName]);
}

function 各段の座標(diagram: CdlDiagram): Array<Array<{ title: string; x: number; y: number }>> {
  const laid = layout(diagram);
  const items = laid.nodes.find((node) => node.quadrantData !== undefined)?.quadrantData?.items;
  if (items === undefined) throw new Error("四象限の点が無い");
  return laid.phases.map((_, phaseIndex) => {
    const states = computeStateValues(laid, phaseIndex, 1);
    return items.map((item) => {
      if (item.at === undefined) throw new Error(`${item.title} の座標が無い`);
      return {
        title: item.title,
        x: 座標を読む(item.at.x, states),
        y: 座標を読む(item.at.y, states),
      };
    });
  });
}

const 象限を読む = ({ x, y }: { x: number; y: number }): 象限 =>
  `${x < 0.5 ? "左" : "右"}${y >= 0.5 ? "上" : "下"}` as 象限;

describe("宅配の四象限の点色 (#2837)", () => {
  it("全ての段で並び順の色が点の位置の象限と一致する", () => {
    const failures = 各段の座標(measureEffortQuadrant).flatMap((points, phaseIndex) =>
      points.flatMap((point, pointIndex) => {
        const quadrant = 象限を読む(point);
        const orderColor = 並び順の色[pointIndex];
        return orderColor === 象限の色[quadrant]
          ? []
          : [`段 ${phaseIndex + 1} ${point.title}: ${quadrant} は ${象限の色[quadrant]}、並び順は ${orderColor}`];
      }),
    );
    expect(failures).toEqual([]);
  });

  it("最初の段は点を重ねず、最後の段まで各点を 0.08 以上動かす", () => {
    const phases = 各段の座標(measureEffortQuadrant);
    const first = phases[0];
    const last = phases.at(-1);
    if (first === undefined || last === undefined) throw new Error("四象限の段が無い");
    expect(new Set(first.map(({ x, y }) => `${x},${y}`)).size).toBe(first.length);
    expect(first.map((point, index) => Math.max(
      Math.abs(point.x - last[index]!.x),
      Math.abs(point.y - last[index]!.y),
    )).every((distance) => distance >= 0.08)).toBe(true);
  });
});
