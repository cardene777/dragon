/**
 * 検査の file を読む所 (一番上の段) で落ちる見本の検査 (#3800)。上限の検査が、上限で止まる見本と一緒に起こす。
 * 読む所で落ちた file は、file 自身の状態が `fail` になり、落ちた件を 1 つも持たない。
 * 上限で止める段が、この file の名前を落ちた物として続きの実行へ渡すかを確かめる。
 */
import { it } from "vitest";

it("fixture-never-runs-after-load-failure", () => undefined);

throw new Error("見本はわざと読む所で落ちる");
