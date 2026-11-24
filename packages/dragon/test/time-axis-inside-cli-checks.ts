/**
 * `time-axis-inside.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { runCli } from "./export-support";
import "../src/kind-use/time";

const ROOT = process.cwd();

/** 右端の目盛りの節目に、段2で囲みの枠を越える長い状態の字を出す図 */
const TIME_EDGE = join(ROOT, "packages/dragon/test/fixtures/layout/time-edge.dragon");

interface Problem {
  file: string;
  line: number;
  severity: string;
  message: string;
  layout?: { kind: string; step: number; parts: Record<string, unknown>[] };
}

/** file の中で、段`step` (1から数える) を始める`step`の行の番号 */
function stepLine(file: string, step: number): number {
  const lines = readFileSync(file, "utf8").split("\n");
  const at = lines.map((line, i) => ({ line, i })).filter(({ line }) => /^step\b/u.test(line))[step - 1];
  return (at?.i ?? -1) + 1;
}

// 命令は子の Node を起こし、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。file を読み込む段で済ませ、件はその出力を読む
const CHECKED = await atLoad("時間軸の枠に掛かる図を命令で調べる", async () => ({
  json: await runCli(["check", TIME_EDGE, "--layout", "--json", "--lang", "ja"]),
  en: await runCli(["check", TIME_EDGE, "--layout", "--lang", "en"]),
}));

describe("時間軸の部品が囲みの枠に掛かると知らせる (#3527)", () => {
  it("layout-check-finds-time-text-on-panel-edge", () => {
    const { json, en } = CHECKED.get();
    expect(json.code, `崩れだけの図で終わり方0にならない ${json.stderr}`).toBe(0);
    const problems = JSON.parse(json.stdout || "[]") as Problem[];
    const edges = problems.filter((p) => p.layout?.kind === "panel-edge");
    expect(
      edges.map((p) => p.layout),
      "段2の状態の字が時間軸の囲みの枠に掛かることを1件で出さない",
    ).toEqual([{ kind: "panel-edge", step: 2, parts: [{ kind: "text", text: "受け取った資産" }, { kind: "panel", panel: "axis" }] }]);
    const [edge] = edges;
    expect(edge?.severity, "崩れの重さ").toBe("warning");
    expect(edge?.line, "崩れが見え始める段のstepの行").toBe(stepLine(TIME_EDGE, 2));
    expect(edge?.message, "日本語の知らせが段と字と時間軸の囲みを名指さない").toMatch(/^段 ?2: 「受け取った資産」が.*時間軸の囲み/u);
    expect(en.code, en.stderr).toBe(0);
    const line = en.stdout.trimEnd().split("\n").find((l) => l.includes('"受け取った資産"'));
    expect(line, `英語の行が段と字と時間軸の囲みを名指さない\n${en.stdout}`).toMatch(new RegExp(`^${TIME_EDGE.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}:${stepLine(TIME_EDGE, 2)}:1 warning Step 2: .*"受け取った資産".*time axis`, "u"));
  });
});
