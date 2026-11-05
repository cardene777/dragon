/**
 * 検査の file の process が受け取った、続きを回す命令の書き先 (`DRAGON_UNFINISHED_OUT`) を `FIXTURE_OUT` に書く見本の検査 (#3388)。
 * 上限の検査が、書き先を渡した vitest でこの見本を起こし、検査の process が書き先を受け継がないかを確かめる。
 * 検査の process が受け継ぐと、その検査が起こす vitest も受け継ぎ、親の実行の終わっていない file の一覧を上書きする。
 */
import { writeFileSync } from "node:fs";
import { it } from "vitest";

it("fixture-writes-unfinished-out-it-sees", () => {
  writeFileSync(process.env.FIXTURE_OUT ?? "", JSON.stringify({ out: process.env.DRAGON_UNFINISHED_OUT ?? null }));
});
