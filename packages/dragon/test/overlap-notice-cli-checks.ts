/**
 * `overlap-notice.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./export-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";

const OAUTH = join(process.cwd(), "packages/dragon/examples/oauth.json");

describe("字の重なりを知らせる (#3178)", () => {

  it(
    "export-quiet-without-overlaps",
    async () => {
      const out = mkdtempSync(join(tmpdir(), "dragon-overlap-"));
      const ran = await runCli(["export", OAUTH, "--format", "html", "--out", out]);
      expect(ran.code, ran.stderr).toBe(0);
      expect(readdirSync(out)).toContain("oauth.html");
      expect(ran.stderr, "重ならない図で標準エラーに何か出た").toBe("");
    },
  );
});
