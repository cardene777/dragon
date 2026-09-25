import { expect, test, type Page } from "@playwright/test";

import { 画面の経路, 経路を広げる, 値を入れる節 } from "./app-routes";
import { 開いた状態ごとに } from "./phone-openers";
import { CATEGORIES } from "../src/lib/catalog";
import { PRESETS } from "../src/lib/presets";

/*
 * 携帯の幅で、画面の枠組みの字が読める大きさに届いているかを見る (#2547)。
 *
 * ## 下限は在るのに、画面の字には課されていなかった
 *
 * `src/lib/readable-scale.ts` の `READABLE_MIN_PX` は「画面上でこれを下回ると本文として
 * 読めない」 として 10px を置いている。 ところがこの下限を課す検査は図の中の字だけを見ており
 * (`phone-diagram-legibility.spec.ts`)、**枠組みの字には 1 本も無かった**。
 * 明日 8px の札を足しても何も落ちない状態だった。
 *
 * 測った時点で下限を割る字は 0 件 (12 道筋で実測)。 直す対象が無いので字の大きさは
 * 1 つも変えていない。 **25 種が下限ちょうどの 10px に乗っている** ので、1px でも下げた
 * 瞬間にここが落ちる。
 *
 * ## 図の中は外す
 *
 * `phone-diagram-legibility.spec.ts` が別の下限 (箱が枠から出る図に譲る 8px) で見ている。
 * 二重に課すと、どちらが本当の基準か判らなくなる。
 */

const 携帯 = { width: 390, height: 844 };

/**
 * 画面の字の下限 (px)。
 *
 * `src/lib/readable-scale.ts` の `READABLE_MIN_PX` と同じ値を **書き写す**。
 * `import` すると実装側の値を変えた時に期待値も一緒に動いて何も落ちなくなる
 * (`phone-diagram-legibility.spec.ts` が同じ判断をしている)。
 */
const 下限 = 10;

/** 経路の欄に入れる値。 画面ごとに出る字が違うので全件に広げる */
const 欄の値: Record<string, readonly string[]> = {
  ":slug": CATEGORIES.map((c) => c.slug),
  ":id": PRESETS.map((p) => p.slug),
  ":filename": ["diagram.yaml"],
  "*": ["does-not-exist"],
};

/** 開発時にしか繋がらない経路。 build 済の画面には route が無いので開けない */
const 開かない経路 = new Set(["/__render"]);

const 対象の経路 = 画面の経路().filter((p) => !開かない経路.has(p));
const 画面 = 対象の経路.flatMap((p) => 経路を広げる(p, 欄の値));

/** 経路は base 相対で書くため、トップだけ空文字になる (#1438) */
const 画面名 = (path: string): string => path || "トップ";

type 字 = { 字: string; 大きさ: number; class: string };

/**
 * 出ている要素のうち、**自分が直に字を持つもの** の大きさを集める。
 *
 * 親まで数えると、子の字を親の指定で二重に数えることになる (親の `font-size` は子が
 * 上書きしていることが多く、親の値で判定すると実際に出ている大きさと食い違う)。
 */
async function 字を集める(page: Page): Promise<字[]> {
  return page.evaluate(() => {
    const 出る = (el: Element): boolean => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        cs.display !== "none" &&
        cs.visibility !== "hidden" &&
        cs.opacity !== "0" &&
        r.width > 0 &&
        r.height > 0
      );
    };
    const 出: { 字: string; 大きさ: number; class: string }[] = [];
    for (const el of document.querySelectorAll("body *")) {
      // 図の中は別の検査が別の下限で見る
      if (el.closest("svg") !== null) continue;
      if (!出る(el)) continue;
      const 自分の字 = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent ?? "").trim())
        .join("")
        .trim();
      if (自分の字.length === 0) continue;
      出.push({
        字: 自分の字.slice(0, 24),
        大きさ: Math.round(parseFloat(getComputedStyle(el).fontSize) * 100) / 100,
        class: String(el.className).slice(0, 34),
      });
    }
    return 出;
  });
}

test("測る画面を実装から読めている (空振り検知)", () => {
  expect(対象の経路.length, "main.tsx から経路を 1 つも読めていない").toBeGreaterThan(0);
  expect(画面.length, "広げた先の画面が 0 件").toBeGreaterThan(対象の経路.length);
  expect(
    値を入れる節(対象の経路).sort(),
    "経路に出る欄と、入れる値の表がずれている (表を直す)",
  ).toEqual(Object.keys(欄の値).sort());
});

for (const 道 of 画面) {
  test(`${画面名(道)} の字が ${下限}px を下回らない`, async ({ page }) => {
    await page.setViewportSize(携帯);
    await page.goto(道);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);

    const 閉じた状態 = await 字を集める(page);
    const 開いた状態 = await 開いた状態ごとに(page, () => 字を集める(page));
    const 全部 = [...閉じた状態, ...開いた状態.flatMap((x) => x.値)];

    // 空振り防止 = 集め方が壊れて 0 件になった回を「下回りなし」 と読まない
    expect(全部.length, `${画面名(道)} で字を 1 つも拾えていない`).toBeGreaterThan(5);
    // 帯はどの画面にも出るので、開いた状態が 1 件も無いのは押せていないということ
    expect(
      開いた状態.map((x) => x.名),
      `${画面名(道)} で開く口を 1 つも開けていない (判定が空振りしている)`,
    ).toContain("帯の折りたたみ");

    const 小さい = 全部.filter((x) => x.大きさ < 下限);
    const 並び = [...new Set(小さい.map((x) => `${x.大きさ}px .${x.class}「${x.字}」`))].join(" / ");
    expect(小さい.length, `${下限}px を下回る字: ${並び}`).toBe(0);
  });
}

test("下限ちょうどの字が在る (検査に効き目があることの確認)", async ({ page }) => {
  /*
   * 下回る字が 0 件なのは、**全部が下限より十分大きい** からかもしれないし、
   * **ぎりぎりで止まっている** からかもしれない。 前者なら検査はしばらく何も守らない。
   *
   * 実測では編集画面の見本の並びの見出しが 25 種、下限ちょうどの 10px に乗っている。
   * ここが動いたら、この検査の効き目が変わったということ。
   */
  await page.setViewportSize(携帯);
  await page.goto("editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  const 開いた状態 = await 開いた状態ごとに(page, () => 字を集める(page));
  const 全部 = 開いた状態.flatMap((x) => x.値);
  const ちょうど = 全部.filter((x) => x.大きさ === 下限);

  expect(
    ちょうど.length,
    `下限ちょうどの字が 1 つも無い (全部が十分大きいなら、この検査はしばらく何も守らない)`,
  ).toBeGreaterThan(0);
});
