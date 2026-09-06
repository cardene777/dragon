import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// @ts-expect-error -- 検査対象は .mjs で型宣言を持たない
import { 記法の群候補 } from "../scripts/design-catalog.mjs";

type CatalogFile = { file: string; text: string };
type Candidate = { group: string; file: string };

describe("記法から組む図を持つ群の候補", () => {
  it("textDslToDiagram を含む file の群だけを返す", () => {
    const files: CatalogFile[] = [
      { file: "charts.cdl.ts", text: "export const chart = textDslToDiagram(sourceYaml__chart);" },
      { file: "presets.cdl.ts", text: 'export const preset = diagram({ id: "preset" });' },
      { file: "README.md", text: "textDslToDiagram" },
    ];

    expect(記法の群候補(files)).toEqual([{ group: "charts", file: "charts.cdl.ts" }]);
  });

  it("実物の catalog を走査して候補を 1 件以上見つける", () => {
    const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
    const catalog = join(repo, "apps/playground-spa/src/topics/catalog");
    const files = readdirSync(catalog)
      .filter((file) => file.endsWith(".cdl.ts"))
      .map((file) => ({ file, text: readFileSync(join(catalog, file), "utf8") }));

    const candidates = 記法の群候補(files) as Candidate[];

    expect(candidates.length, "候補を 1 件も走査できていない (検査が空振りしている)").toBeGreaterThan(0);
    for (const candidate of candidates) {
      const source = files.find((file) => file.file === candidate.file)?.text ?? "";
      expect(source, `${candidate.file} に textDslToDiagram が無い`).toContain("textDslToDiagram");
    }
  });
});
