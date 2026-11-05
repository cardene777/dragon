/**
 * 書き出しの既定のコマの数 (#3115)。使い方の文の既定のとおり、mp4 は 1 秒 30 コマ、GIF は 1 秒 10 コマで撮る。
 *
 * 既定のコマの数で実際に撮ると、一番小さい図でも 20 秒かかり、1 件の上限 (10 秒、#3381) に収まらない。
 * 撮る部品 (`film`) を代わりの物に替え、書き出しが既定のコマの数を撮る部品へ渡すことを確かめる。
 * 渡したコマの数のとおりに撮って書くことは、`export.test.ts` の `export-frame-counts-follow-rates` が 1 秒 2 コマで確かめる。
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { film } from "../src/export/capture";
import { exportDiagram } from "../src/export/index";
import { renderDiagram } from "../src/render/svg";
import { smallArchitecture } from "./diagram-support";

vi.mock("../src/export/capture", async (original) => {
  const real = await original<typeof import("../src/export/capture")>();
  return {
    ...real,
    launch: vi.fn(() => Promise.resolve({ close: () => Promise.resolve() })),
    stage: vi.fn(() => Promise.resolve({})),
    film: vi.fn(() => Promise.resolve({ frames: 0 })),
  };
});

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-defaults-"));

describe("書き出しのコマと形 (#3115)", () => {
  it("export-default-frame-rates", async () => {
    const diagram = smallArchitecture();
    const { total } = renderDiagram(diagram).timeline;
    await exportDiagram(diagram, { outDir: scratch(), formats: ["mp4", "gif"] });
    await exportDiagram(diagram, { outDir: scratch(), formats: ["gif"] });
    const [both, gifOnly] = vi.mocked(film).mock.calls.map(([, plan]) => plan);
    expect(both, "mp4 と GIF を撮る部品を呼んでいない").toBeDefined();
    expect(both?.total, "撮る長さが図の 1 周の長さでない").toBe(total);
    expect(both?.fps, "mp4 の既定のコマの数 (1 秒)").toBe(30);
    // GIF は mp4 のコマを 3 つに 1 つ使う = 1 秒 10 コマ
    expect(both?.gifEvery, "mp4 と撮る時の GIF のコマの間引き").toBe(3);
    expect(gifOnly?.fps, "GIF だけの既定のコマの数 (1 秒)").toBe(10);
    expect(gifOnly?.gifEvery, "GIF だけを撮る時の間引き").toBe(1);
  });
});
