/**
 * `interactive-diagram.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { exampleJson, type Json } from "./diagram-support";
import { cliRunCount, formatOf } from "./export-support";
import { exportInThread, warmThread } from "./export-thread";
import { draw } from "./render-support";
import { txBlock } from "./try-support";
import "../src/kind-use/architecture";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";
import "../src/kind-use/tree";
import "../src/kind-use/try";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

interface Source {
  kind?: string;
  title?: string;
  blocks?: Record<string, Json[]>;
  steps?: { title?: string; events?: { type?: string }[] }[];
}

// 描いて thread で PNG に書き出すと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。file を読み込む段で済ませ、件はその結果を読む。
// 書き出しは jsdom の外の thread で、thread で 1 つの Chromium を借りて回す。命令の引数の扱いは書き出しの検査 (`export.test.ts`) が確かめる (#3602)
const EXPORTED = await atLoad("試す図を描いて PNG に書き出す", async () => {
  // thread を作り Chromium を起こす段を先に済ませる (#3602)
  await warmThread();
  const source = txBlock() as Source;
  // 書き出しと印刷は、書き手が書いた段を全て描き、最後の段 (書き換える) は食い違いの印を出す
  const rendered = draw("renderDiagram")(source, { still: true });
  // 書き出しが書き出しの命令を起こした回数を数える (#3602)
  const runsAtStart = cliRunCount();
  const out = join(mkdtempSync(join(tmpdir(), "dragon-try-")), "out");
  const files = await exportInThread(exampleJson("tx-block.json"), { outDir: out, name: "tx-block", formats: ["png"] });
  const file = join(out, "tx-block.png");
  return { source, rendered, files, file, written: existsSync(file) ? readFileSync(file) : Buffer.alloc(0), cliRuns: cliRunCount() - runsAtStart };
});

describe("試す図の書き出し (#3337)", () => {
  it(
    "interactive-export-draws-author-steps",
    () => {
      const json = join(EXAMPLES, "tx-block.json");
      expect(existsSync(json), "tx-block.json が無い").toBe(true);
      const { source, rendered, files, file, written } = EXPORTED.get();
      expect(rendered.timeline.steps.length, "書き出しで描く段の数が書き手の段の数と違う").toBe(
        source.steps?.length,
      );
      expect((source.steps?.length ?? 0) > 1, "見本に書き手の例の段が無い").toBe(true);
      expect(rendered.svg, "書き手の例の書き換える段の食い違いの印 (≠) が描かれない").toContain(
        "≠",
      );
      expect(rendered.svg, "書き出す図に入力の欄が入る").not.toMatch(/<input|<button|<form/u);

      expect(files.png, "書き出した PNG の path").toBe(file);
      expect(formatOf(written), `${file} が png として書かれていない`).toBe("png");
    },
  );

  // 書き出しの命令を子の Node のプロセスで起こすと、その中で Chromium も起こし、混んだ機械で 1 件の上限 (10 秒) を超えた (#3602)
  it("interactive-export-spawns-no-cli", () => {
    expect(EXPORTED.get().cliRuns, "試す図の書き出しが書き出しの命令を起こした回数").toBe(0);
  });
});
