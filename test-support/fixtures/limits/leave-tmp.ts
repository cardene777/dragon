/**
 * 見本の検査が一時フォルダを作って消さずに終わる道具 (#3587)。一時フォルダの検査が、実行の終わりに消えるかを確かめる。
 *
 * 作ったフォルダの path は、環境変数 `FIXTURE_TMP_OUT` が名指す file に書く。上限で止めた回は標準出力が届くとは限らないため。
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function leaveTmp(): void {
  const made = mkdtempSync(join(tmpdir(), "dragon-fixture-"));
  writeFileSync(join(made, "left.txt"), "消さずに終わる");
  const out = process.env.FIXTURE_TMP_OUT;
  if (out) writeFileSync(out, made);
}
