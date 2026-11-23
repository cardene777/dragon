/**
 * `overlap-notice.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { runCli } from "./export-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";

const OAUTH = join(process.cwd(), "packages/dragon/examples/oauth.json");

// 件の中で書き出しの命令を子の process で起こすと、混んだ機械で 1 件 10 秒の上限を超えうる (#3816)。
// file を読み込む段で起こし、命令の後に書き出しの置き場に在る file を読む。件はその結果を読む
const EXPORTED = await atLoad("重ならない図を HTML に書き出す命令を起こす", async () => {
  const out = mkdtempSync(join(tmpdir(), "dragon-overlap-"));
  const ran = await runCli(["export", OAUTH, "--format", "html", "--out", out]);
  return { ran, written: readdirSync(out) };
});

describe("字の重なりを知らせる (#3178)", () => {

  it(
    "export-quiet-without-overlaps",
    () => {
      const { ran, written } = EXPORTED.get();
      expect(ran.code, ran.stderr).toBe(0);
      expect(written).toContain("oauth.html");
      expect(ran.stderr, "重ならない図で標準エラーに何か出た").toBe("");
    },
  );
});
