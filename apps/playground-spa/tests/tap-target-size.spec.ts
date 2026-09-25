import { expect, test, type Page } from "@playwright/test";

import { 画面の経路, 経路を広げる, 値を入れる節 } from "./app-routes";
import { CATEGORIES } from "../src/lib/catalog";
import { PRESETS } from "../src/lib/presets";

/*
 * 携帯の幅で押せる的が 24px 以上あることを見る (#2541)。
 *
 * 指の的の下限は 24×24 (WCAG 2.2 の 2.5.8)。 字だけで置いた行き先は 16-21px にしかならず、
 * 幅 390px の 9 画面で 14 種が下限を割っていた。
 *
 * **押せる的の箱を実物から測る** = class 名の一覧を手で持たない。 手で持つと、新しく足した
 * 行き先がその一覧に入っていない限り永久に見えない。
 *
 * ## 測る画面も実装から導く (#2543)
 *
 * 初めは **手で並べた 9 件の配列** を見ていた。 画面を足した人がそこに 1 行足さない限り
 * その画面は永久に測られず、しかも検査は「全件通った」 と報告するので表に出ない。
 * 的の class を実物から拾っておきながら、画面の側は手で持っていた。
 *
 * `mobile-overflow.spec.ts` と同じく `画面の経路()` から読む。 欄 (`:slug` / `:id` /
 * `:filename`) は分類とひな形の一覧で全件に広げるので、画面が増えても見本が増えても、
 * 追記を忘れて対象から外れることが無い。
 */

const 携帯 = { width: 390, height: 844 };
const 下限 = 24;

/**
 * 経路の欄に入れる値 (#2543)。
 *
 * 分類とひな形は **全件に広げる** = 画面の中身で出る行き先が変わるので、1 つ選ぶと残りが
 * 黙って対象から外れる。
 *
 * `*` は当たらなかった時の受け皿で、router が持つ経路。 検査の側で「存在しない path」 を
 * 思い付きで書かずに、受け皿へ落ちる値を 1 つ渡す。
 */
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

/**
 * test の名前。
 *
 * 経路は base 相対で書くため、トップだけ空文字になる (#1438)。 そのまま出すと名前に穴が空く。
 */
const 画面名 = (path: string): string => path || "トップ";

const 押せるもの = 'a[href], button, input, select, textarea, [role="button"], [role="tab"], summary';

/**
 * その画面が持つ「開く口」。 **全部押してから数える** (#2539 の測定で踏んだ)。
 *
 * 1 つでも押し残すと、開けば届くものが「押せない」 側に混ざる
 * (編集画面の脇の板を押さずに数えて 31 件の偽の落ちを出した)。
 */
const 開く口 = [".v4-nav-menu-btn", '[data-testid="editor-side-toggle"]'];

type 箱 = { 字: string; 幅: number; 高: number; 文の中: boolean };

/**
 * 出ている押せるものを全部測る。
 *
 * `文の中` = 行の高さに縛られる的。 下限の例外で、広げると前後の行と重なる。
 * 判定は **display が `inline` の `a` で、親に他の字がある** こと。 入力欄や押しボタンは
 * 文の中には置かれないので、`inline` でも例外にしない。
 */
async function 測る(page: Page, 選び方: string): Promise<箱[]> {
  return page.evaluate((s) => {
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
    const 文の中か = (el: Element): boolean => {
      if (el.tagName !== "A") return false;
      if (getComputedStyle(el).display !== "inline") return false;
      const 親 = el.parentElement;
      if (!親) return false;
      const 自分の字 = (el.textContent ?? "").trim();
      const 親の字 = (親.textContent ?? "").trim();
      return 親の字.length > 自分の字.length;
    };
    return [...document.querySelectorAll(s)].filter(出る).map((el) => {
      const r = el.getBoundingClientRect();
      const 札 = el.getAttribute("data-testid") ?? el.getAttribute("aria-label");
      const 字 = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 28);
      return {
        字: 札 ?? 字 ?? el.tagName,
        幅: Math.round(r.width * 100) / 100,
        高: Math.round(r.height * 100) / 100,
        文の中: 文の中か(el),
      };
    });
  }, 選び方);
}

async function 開いて測る(page: Page, 道: string): Promise<箱[]> {
  await page.setViewportSize(携帯);
  await page.goto(道);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  let 集めた = await 測る(page, 押せるもの);
  for (const 口 of 開く口) {
    if ((await page.locator(口).count()) === 0) continue;
    await page.locator(口).first().click();
    await page.waitForTimeout(700);
    集めた = [...集めた, ...(await 測る(page, 押せるもの))];
    await page.locator(口).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  return 集めた;
}

test("測る画面を実装から読めている (空振り検知)", () => {
  expect(対象の経路.length, "main.tsx から経路を 1 つも読めていない").toBeGreaterThan(0);
  expect(画面.length, "広げた先の画面が 0 件").toBeGreaterThan(対象の経路.length);
  expect(PRESETS.length, "見本の一覧が空").toBeGreaterThan(0);
  expect(CATEGORIES.length, "分類の一覧が空").toBeGreaterThan(0);
  expect(
    値を入れる節(対象の経路).sort(),
    "経路に出る欄と、入れる値の表がずれている (表を直す)",
  ).toEqual(Object.keys(欄の値).sort());
  // 手で並べていた頃に抜けていた経路。 広げた先に居ることを名指しで押さえる (#2543)
  expect(画面, "図を出す編集画面が対象から外れている").toContain("editor/diagram.yaml");
  expect(画面, "当たらなかった時の受け皿が対象から外れている").toContain("does-not-exist");
});

test.describe("携帯で押せる的の大きさ", () => {
  for (const 道 of 画面) {
    test(`${画面名(道)} の的が 24px を下回らない`, async ({ page }) => {
      const 全部 = await 開いて測る(page, 道);

      // 空振り防止 = 選び方が壊れて 0 件になった回を「下回りなし」 と読まない
      expect(全部.length, "押せるものを 1 つも見ていない").toBeGreaterThan(5);

      const 対象 = 全部.filter((x) => !x.文の中);
      expect(対象.length, "全部が文の中の扱いになっている").toBeGreaterThan(3);

      const 小さい = 対象.filter((x) => x.幅 < 下限 || x.高 < 下限);
      const 並び = 小さい.map((x) => `${x.字} (${x.幅}x${x.高})`).join(" / ");
      expect(小さい.length, `下限 ${下限}px を割る的: ${並び}`).toBe(0);
    });
  }
});

test.describe("広げ方", () => {
  test("余白を足した分を負の余白で戻している", async ({ page }) => {
    /*
     * これが崩れると、押せる範囲を広げた分だけ **まわりの配置が動く**。
     * 実測 (幅 1400px) では、広げた行き先の枠が 4px 上に出て 8px 高くなる一方、
     * 頁の縦の長さも題の位置も 1px も動かなかった。
     */
    await page.setViewportSize({ width: 1400, height: 950 });
    await page.goto("catalog/presets");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const 見た = await page.evaluate(() => {
      const 出 = [];
      for (const el of document.querySelectorAll("a")) {
        const cs = getComputedStyle(el);
        const 上 = parseFloat(cs.paddingTop);
        if (!(上 > 0)) continue;
        // 上下の余白だけを見る (左右に余白を持つ押しボタンは対象外)
        if (parseFloat(cs.paddingBottom) !== 上) continue;
        出.push({
          字: (el.textContent ?? "").trim().slice(0, 20),
          余白: 上,
          上の戻し: parseFloat(cs.marginTop),
          下の戻し: parseFloat(cs.marginBottom),
        });
      }
      return 出;
    });

    const 広げたもの = 見た.filter((x) => x.上の戻し < 0);
    expect(広げたもの.length, "上下の余白を負の余白で戻した行き先が 1 つも無い").toBeGreaterThan(0);
    for (const x of 広げたもの) {
      expect(x.上の戻し, `${x.字} の上の戻しが余白と釣り合っていない`).toBe(-x.余白);
      expect(x.下の戻し, `${x.字} の下の戻しが余白と釣り合っていない`).toBe(-x.余白);
    }
  });

  test("絞り込みの囲みが縦に潰れない", async ({ page }) => {
    /*
     * 一覧の脇は幅 860px 以下で高さ 340px に制限される。 囲みの高さを `height` だけで
     * 指定していた間は flex の縮みが効いて **22px まで潰れ**、中の欄が 20px になっていた。
     */
    await page.setViewportSize(携帯);
    await page.goto("catalog/presets");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);

    const 見た = await page.evaluate(() => {
      const 囲み = document.querySelector(".catalog-search-wrap");
      const 欄 = document.querySelector(".catalog-search");
      if (!囲み || !欄) return null;
      const a = 囲み.getBoundingClientRect();
      const b = 欄.getBoundingClientRect();
      const cs = getComputedStyle(囲み);
      return {
        囲み: Math.round(a.height * 100) / 100,
        欄: Math.round(b.height * 100) / 100,
        枠: parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth),
      };
    });

    expect(見た, "絞り込みが見つからない").not.toBeNull();
    expect(見た?.囲み, "囲みが潰れている").toBeGreaterThanOrEqual(38);
    // 欄は囲みの内側 (枠を除いた分) をすべて占める
    expect(見た ? 見た.囲み - 見た.枠 - 見た.欄 : 1, "欄が囲みの内側を埋めていない").toBeLessThanOrEqual(0.5);
  });
});

test.describe("開く口", () => {
  test("編集画面は開く口を押すと測れる的が増える (対照)", async ({ page }) => {
    /*
     * 開く口を押さずに数えると、**開けば届くものが「押せない」 側に混ざる**。
     * #2541 の測定で、編集画面の脇の板 (幅 390px では `x = -303` に置かれる) を押さずに
     * 数えて 31 件の偽の落ちを出した。
     *
     * 上の 9 件は押した後の数を見るので、押す処理が黙って効かなくなっても気付けない
     * (押せる的が減れば下限を割る的も減り、むしろ通りやすくなる)。 ここで効果を押さえる。
     */
    await page.setViewportSize(携帯);
    await page.goto("editor");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const 押す前 = await 測る(page, 押せるもの);
    const 口 = page.locator('[data-testid="editor-side-toggle"]');
    expect(await 口.count(), "編集画面に脇の板を開く口が無い").toBe(1);

    await 口.click();
    await page.waitForTimeout(700);
    const 押した後 = await 測る(page, 押せるもの);

    expect(
      押した後.length - 押す前.length,
      `押しても測れる的が増えない (前 ${押す前.length} / 後 ${押した後.length})`,
    ).toBeGreaterThan(20);
  });
});

test.describe("例外の扱い", () => {
  test("文の中の行き先は下限の対象から外れる (対照)", async ({ page }) => {
    /*
     * 例外が空振りしていないことを押さえる。 更新履歴の説明文の中には 16px の行き先があり、
     * **これは広げない** = 行の高さに縛られる的で、広げると前後の行と重なる。
     * この 1 件が対象から外れていないと、上の 9 件は成り立たない。
     */
    const 全部 = await 開いて測る(page, "release-notes");
    const 文の中 = 全部.filter((x) => x.文の中);

    expect(文の中.length, "文の中の行き先を 1 つも見ていない (例外が空振りしている)").toBeGreaterThan(
      0,
    );
    expect(
      文の中.some((x) => x.高 < 下限),
      "文の中に下限を割る的が無い (対照が効いていない)",
    ).toBe(true);
  });
});
