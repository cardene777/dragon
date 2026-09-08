import { test, expect } from "@playwright/test";

import { 画面の経路 } from "./app-routes";
import { PRESETS } from "../src/lib/presets";

/**
 * どの画面も **開けば出る** ことを、経路の一覧から漏れなく確かめる (#1709)。
 *
 * ## なぜ要るか
 *
 * 編集画面が起動時の例外で 1 つも描かれない状態が続き、そこを見る検査が 21 件
 * 落ちたまま積み上がっていた。 21 件はどれも「要素が 30 秒現れない」 としか言わないので、
 * 読んでも「画面ごと出ていない」 とは判らない。 全件を回すのに 30 分かかるため、
 * 気付く機会も無かった。
 *
 * ここは **画面 1 つにつき 1 件** で、全部で 10 秒ほど。 落ちた時に読めるのは
 * 「この画面が出ていない」 と「画面が投げた例外の本文」 の 2 つで、原因の当たりが付く。
 *
 * ## 経路は実装から導く
 *
 * `main.tsx` の `<Route>` を読む。 手で並べると画面が増えた時に黙って対象から外れる
 * (実測 = 見本が 2 件増えて 30 件が赤のまま積み上がった形と同じ)。
 */

/** 経路の `:欄` に入れる値。 経路に出る欄が増えると下の突き合わせが落ちる */
const 欄の値: Record<string, string> = {
  ":slug": "presets",
  ":id": PRESETS[0]!.slug,
  ":filename": "diagram.yaml",
};

/** 開発時にしか繋がらない経路と、当たらなかった時の受け皿。 開いて確かめる対象ではない */
const 開かない経路 = new Set(["/__render", "*"]);

const 対象の経路 = 画面の経路().filter((p) => !開かない経路.has(p));

test("画面の経路を 1 つ以上読めている (検査の空振り検知)", () => {
  expect(対象の経路.length, "main.tsx から経路を 1 つも読めていない").toBeGreaterThan(0);
  const 使う欄 = new Set(対象の経路.flatMap((p) => p.split("/").filter((x) => x.startsWith(":"))));
  expect(
    [...使う欄].sort(),
    "経路に出る欄と、入れる値の表がずれている (表を直す)",
  ).toEqual(Object.keys(欄の値).sort());
});

for (const 経路 of 対象の経路) {
  const 開く先 = 経路
    .split("/")
    .map((x) => (x.startsWith(":") ? 欄の値[x]! : x))
    .join("/")
    .replace(/^\//u, "");

  test(`${経路} が開ける`, async ({ page }) => {
    const 例外: string[] = [];
    page.on("pageerror", (e) => 例外.push(e.message));
    await page.goto(開く先, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    expect(例外, `画面が例外を投げた:\n${例外.join("\n")}`).toEqual([]);

    // 骨組みだけ出て中身が空の状態も落とす。 例外を出さずに白紙になる形があるため
    const 中身 = (await page.locator("body").innerText()).trim();
    expect(中身.length, "画面に文字が 1 つも出ていない").toBeGreaterThan(0);
  });
}

test("画面が投げた例外はちゃんと拾える (植え込み対照)", async ({ page }) => {
  // 上の 例外 は「0 件」 を期待する。 正しい画面を見ているだけでは、拾い方が実物と
  // 噛み合っているかが判らない。 わざと 1 つ投げさせて、同じ拾い方が見つけることを確かめる。
  const 例外: string[] = [];
  page.on("pageerror", (e) => 例外.push(e.message));
  await page.goto("", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("植えた例外");
    }, 0);
  });
  await page.waitForTimeout(300);
  expect(例外.join("\n"), "例外を投げても拾えない (拾い方が実物と噛み合っていない)").toContain(
    "植えた例外",
  );
});
