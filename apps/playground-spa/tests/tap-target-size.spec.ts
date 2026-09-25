import { expect, test, type Page } from "@playwright/test";

/*
 * 携帯の幅で押せる的が 24px 以上あることを見る (#2541)。
 *
 * 指の的の下限は 24×24 (WCAG 2.2 の 2.5.8)。 字だけで置いた行き先は 16-21px にしかならず、
 * 幅 390px の 9 画面で 14 種が下限を割っていた。
 *
 * **押せる的の箱を実物から測る** = class 名の一覧を手で持たない。 手で持つと、新しく足した
 * 行き先がその一覧に入っていない限り永久に見えない。
 */

const 携帯 = { width: 390, height: 844 };
const 下限 = 24;

/** 測る画面。 `main.tsx` の道筋のうち、人が開く 9 つ */
const 画面 = [
  ["", "概要"],
  ["catalog", "カタログの入口"],
  ["catalog/presets", "カタログ (ひな形)"],
  ["catalog/charts", "カタログ (グラフ)"],
  ["editor", "編集画面"],
  ["docs", "使い方"],
  ["preset/flowchart", "ひな形の詳細"],
  ["release-notes", "更新履歴"],
  ["contribute", "参加方法"],
] as const;

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

test.describe("携帯で押せる的の大きさ", () => {
  for (const [道, 名] of 画面) {
    test(`${名} の的が 24px を下回らない`, async ({ page }) => {
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
