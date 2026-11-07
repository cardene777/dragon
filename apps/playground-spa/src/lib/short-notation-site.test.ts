/**
 * 短い記法を見本帳で使う (#3438)。
 *
 * 編集画面は、箱を宣言しない記法に 1 字違いの似た名前の箱が出た時、図を描いたまま、記法の誤りの文と同じ知らせの欄に知らせを出す。
 * 知らせは読む処理が返す物で、図を描くのを待たずに出る。
 * 使い方の頁は、5 分で動かすの節の次に、宣言と段を省いた短い書き方の例を載せる。
 *
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { SECTIONS } from "../docs/content";
import { type Lang, TEXT } from "../text";
import { app, BASE } from "./playground-support";
import { onScreen, site, useSite, WAIT } from "./site-support";

/** 1 字違いの「アプリ」と「アプル」を持つ図。「アプル」は 4 行目の頭に初めて出る */
const SIMILAR = "sequence\n\nブラウザ -> アプリ: GET /login\nアプル -> ブラウザ: 戻す\n";

/** 知らせを持つかもしれない読んだ結果 */
type Noticed = ReturnType<typeof parseNotation> & { notices?: { line: number; column: number; message: string }[] };

/** 1 行目が図の種類の語だけで、宣言と段の行を持たない記法か */
const isShortForm = (source: string): boolean => {
  const [head = "", ...rest] = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("//"));
  return ["sequence", "architecture", "state"].includes(head) && rest.every((row) => !/^(box|group|end|step|say)(\s|$)/u.test(row));
};

describe("短い記法を見本帳で使う (#3438)", () => {
  useSite();

  describe("編集画面の似た名前の知らせ (#3438)", () => {
    it("editor-notices-similar-box-names", async () => {
      const parsed = parseNotation(SIMILAR, { lang: "ja" }) as Noticed;
      const notice = parsed.ok ? parsed.notices?.[0] : undefined;
      expect(notice, "読む処理が似た名前を知らせない").toBeDefined();
      const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1280, height: 900 } });
      await onScreen(page, "editor", "編集画面が出ない");
      await page.locator('[data-playground="editor"]').fill(SIMILAR);
      // 知らせは誤りの文と同じ欄に、行へ移る釦と文の組で出る
      await expect
        .poll(() => page.locator('[data-playground="status"] [data-playground="notice"]').allTextContents(), { ...WAIT, message: "知らせの欄に似た名前の知らせが出ない" })
        .toEqual([`${TEXT.ja.notices.line(notice?.line ?? 0)}${notice?.message}`]);
      // 知らせても図は描く。3 つの箱の名前を描いた図が出る
      await expect
        .poll(() => page.locator('[data-playground="stage"] svg[data-dragon="figure"] text.dg-sn').allTextContents(), { ...WAIT, message: "似た名前を知らせた図を描かない" })
        .toEqual(expect.arrayContaining(["ブラウザ", "アプリ", "アプル"]));
    });
  });

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
