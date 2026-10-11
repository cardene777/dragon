import { describe, expect, it } from "vitest";

import { compileToCdl } from "../src/compile";
import { jsonToDiagram } from "../src/json-parser";
import { parseTextDslV05 } from "../src/v05";

type 工程の帯 = {
  title: string;
  startLabel: string;
  emphasis?: string;
  milestone?: true;
};

type 工程の図 = {
  ganttToday?: { index: number; label: string };
  ganttTickLabels?: readonly string[];
  ganttBarEnd?: string;
  ganttBarThickness?: string;
  ganttData?: 工程の帯[];
};

const yaml = `title: "T"
type: gantt
ticks: [6月, 7月, 8月, 9月, 10月]
ganttToday: { index: 3.3, label: "今日" }
ganttTickLabels: [6月, 7月, 8月, 9月, 10月]
ganttBarEnd: position
ganttBarThickness: thin

actors:
  - 設計する: { value: "6月", emphasis: primary }
  - 本番: { value: "10月+0.45", startLabel: "10月半ば", milestone: true }
`;

const json = {
  title: "T",
  type: "gantt",
  目盛り: ["6月", "7月", "8月", "9月", "10月"],
  ganttToday: { index: 3.3, label: "今日" },
  ganttTickLabels: ["6月", "7月", "8月", "9月", "10月"],
  ganttBarEnd: "position",
  ganttBarThickness: "thin",
  actors: [
    { name: "設計する", subtitle: "6月", emphasis: "primary" },
    { name: "本番", subtitle: "10月+0.45", startLabel: "10月半ば", milestone: true },
  ],
  flow: [],
};

function yamlを組み立てる(): 工程の図 {
  const parsed = parseTextDslV05(yaml);
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
  return compileToCdl(parsed.doc).nodes[0] as 工程の図;
}

function 欄を確かめる(図: 工程の図): void {
  expect(図.ganttToday).toEqual({ index: 3.3, label: "今日" });
  expect(図.ganttTickLabels).toEqual(["6月", "7月", "8月", "9月", "10月"]);
  expect(図.ganttBarEnd).toBe("position");
  expect(図.ganttBarThickness).toBe("thin");
  expect(図.ganttData?.find((task) => task.title === "設計する")?.emphasis).toBe("primary");
  expect(図.ganttData?.find((task) => task.title === "本番")).toMatchObject({
    startLabel: "10月半ば",
    milestone: true,
  });
}

describe("工程の図の見本用の欄", () => {
  it("文字の記法から CDL の欄へ届く", () => {
    欄を確かめる(yamlを組み立てる());
  });

  it("JSON の記法から CDL の欄へ届く", () => {
    欄を確かめる(jsonToDiagram(json).nodes[0] as 工程の図);
  });

  it("書かなければ既定の描き方を変えない", () => {
    const parsed = parseTextDslV05(`title: "T"\ntype: gantt\nactors:\n  - A: "Q1"\n`);
    if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
    const 図 = compileToCdl(parsed.doc).nodes[0] as 工程の図;
    expect(図).not.toHaveProperty("ganttToday");
    expect(図).not.toHaveProperty("ganttTickLabels");
    expect(図).not.toHaveProperty("ganttBarEnd");
    expect(図).not.toHaveProperty("ganttBarThickness");
    expect(図.ganttData?.[0]).not.toHaveProperty("emphasis");
    expect(図.ganttData?.[0]).not.toHaveProperty("milestone");
  });
});
