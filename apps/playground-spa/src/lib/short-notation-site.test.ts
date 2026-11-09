/**
 * 短い記法を見本帳で使う (#3438)。
 *
 * 編集画面は、箱を宣言しない記法に 1 字違いの似た名前の箱が出た時、図を描いたまま、記法の誤りの文と同じ知らせの欄に知らせを出す。
 * 知らせは読む処理が返す物で、図を描くのを待たずに出る。
 * 使い方の頁は、5 分で動かすの節の次に、宣言と段を省いた短い書き方の例を載せる。
 *
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { SECTIONS } from "../docs/content";
import { type Lang } from "../text";
import { app } from "./playground-support";

/** 1 行目が図の種類の語だけで、宣言と段の行を持たない記法か */
const isShortForm = (source: string): boolean => {
  const [head = "", ...rest] = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("//"));
  return ["sequence", "architecture", "state"].includes(head) && rest.every((row) => !/^(box|group|end|step|say)(\s|$)/u.test(row));
};

describe("短い記法を見本帳で使う (#3438)", () => {

  describe("使い方の頁の短い書き方 (#3438)", () => {
    it("docs-short-example-parses", () => {
      const sections = SECTIONS as readonly string[];
      expect(sections.indexOf("short"), "使い方の頁の、5 分で動かすの節の次に短い書き方の節 (short) が無い").toBe(sections.indexOf("start") + 1);
      for (const lang of ["ja", "en"] as const satisfies readonly Lang[]) {
        const path = join(app, `src/docs/examples/short${lang === "en" ? ".en" : ""}.dragon`);
        expect(existsSync(path), `${lang} の短い書き方の節の例の file (${path}) が無い`).toBe(true);
        if (!existsSync(path)) continue;
        const text = readFileSync(path, "utf8");
        expect(isShortForm(text), `${lang} の短い書き方の節の例が、図の種類の語だけの 1 行目と線の行だけの書き方でない`).toBe(true);
        const parsed = parseNotation(text, { lang });
        expect(parsed.ok, `${lang} の短い書き方の節の例が読めない`).toBe(true);
        if (!parsed.ok) continue;
        expect(parsed.diagram.steps.length, `${lang} の短い書き方の節の例が線 2 本以上の図でない`).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
