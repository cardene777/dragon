/**
 * 放射図の見本で、名前と補足が箱に収まることの確認 (#1332)。
 *
 * 名前と補足を 1 つの文字列に連結して渡していた間、描画側は 1 行の経路を通って箱幅を超え、
 * 末尾が `…` で切られていた (実測 = 箱 120px に対し文字 163px)。 分けて渡すと 2 行に積まれ、
 * 同じ箱幅で収まる。
 *
 * 組み立て側の検査 (`packages/dragon/test/mind-tree-subtitle.test.ts`) は「別々の欄に入る」
 * ことしか見ない。 **箱に収まるかは描いてみないと分からない** ため、画面で測る。
 *
 * 期待する文字は見本の記法から導く。 書き写すと見本を直した時に片方だけ古くなる。
 */
import { test, expect, type Page } from "@playwright/test";

import { sourceYaml__mindMap } from "../src/topics/catalog/charts.cdl";
import { 一覧の行 } from "./catalog-item-pick";

/** 切り詰めに使われる字 (`@cardenelabs/cdl` の `幅で切る`) */
const 省略 = "…";

/** 見本の記法から `actors:` の並びを取り出す */
function 箱を読む(記法: string): Array<{ 名前: string; 補足: string }> {
  const 行 = 記法.split("\n");
  const 始め = 行.findIndex((x) => x.trimEnd() === "actors:");
  if (始め < 0) return [];
  const 出: Array<{ 名前: string; 補足: string }> = [];
  for (const x of 行.slice(始め + 1)) {
    // 次の最上位の項目 (`states:` 等) に当たったら終わり
    if (x.trim() !== "" && !x.startsWith(" ")) break;
    const m = /^ {2}- ([^:]+): "([^"]*)"\s*$/u.exec(x);
    // 2 つとも必須の群。 一致した以上必ず取れる
    const 名前 = m?.[1];
    const 補足 = m?.[2];
    if (名前 !== undefined && 補足 !== undefined) 出.push({ 名前: 名前.trim(), 補足 });
  }
  return 出;
}

/** 見本の記法から値の名前と数を取り出す (`states:` の初期値と `tween:` の行き先) */
function 値を読む(記法: string, 欄: "初期" | "行き先"): Map<string, string> {
  const 出 = new Map<string, string>();
  for (const x of 記法.split("\n")) {
    if (欄 === "行き先") {
      const m = /^\s+(\w+):\s*[\d.]+\s*->\s*([\d.]+)\s*$/u.exec(x);
      const k = m?.[1];
      const v = m?.[2];
      if (k !== undefined && v !== undefined) 出.set(k, v);
    } else {
      const m = /^ {2}(\w+):\s*([\d.]+)\s*$/u.exec(x);
      const k = m?.[1];
      const v = m?.[2];
      if (k !== undefined && v !== undefined) 出.set(k, v);
    }
  }
  return 出;
}

/** 補足の書き方 (`{total} ms 短縮`) に値を入れる */
function 補足を組む(書き方: string, 値: Map<string, string>): string {
  return 書き方.replace(/\{(\w+)\}/gu, (全体, 名) => 値.get(String(名)) ?? 全体);
}

const 箱 = 箱を読む(sourceYaml__mindMap);

/**
 * 枝の数。 記法の先頭の箱が中心で、残りが枝になる (`type: mind` の並べ方)。
 *
 * 待ち条件に使うので、記法から導く。 数を書くと見本を直した時に片方だけ古くなる。
 */
const 枝の数 = Math.max(0, 箱.length - 1);
const 初期値 = 値を読む(sourceYaml__mindMap, "初期");
const 行き先 = 値を読む(sourceYaml__mindMap, "行き先");

type 測り結果 = {
  段: string;
  枝数: number;
  名前数: number;
  題: string[];
  文字: Array<{ 内容: string; はみ出し: number; 箱あり: boolean }>;
};

/**
 * 放射図の文字を測る。
 *
 * 文字の箱は「その文字の中心を含む中で最も小さい四角」 とする。 中心の箱を持つ文字は
 * その箱で測られ、線の上に乗る枝の名前は図の枠で測られる。 前者は「箱に収まるか」、
 * 後者は「図から出ていないか」 を見ることになる。
 *
 * **図の題は役 (`figure-title`) で外す** (#2733)。 題も箱の中に描かれるため、混ぜると
 * 記法から導いた文字と 1 件ずれる。 外した題は別に返し、消えていないことを呼ぶ側が見る。
 *
 * 描き終わったかは **枝の線の数と名前の数** で見る (#2733)。 枝はかつて箱を持っており、
 * 箱の数が記法と揃うのを待っていたが、今は線の上に名前を置く形になり箱を持たない。
 *
 * 線だけでは足りない。 線は名前より先に引かれるため、線が 4 本揃った時点ではまだ名前が
 * 1 つも出ていないことがある (実測 = 中心の 2 文字しか測れず、切り詰めの検査が空振りした)。
 *
 * 名前は補足 (`mind-node-subtitle`) を除いた文字で数える。 この数は名前と補足を分けても
 * 1 つに繋げても記法の箱の数に等しいので、「期待どおりになるまで待つ」 にはならない。
 */
async function 測る(page: Page): Promise<測り結果> {
  return page.evaluate(() => {
    const 段 = document.querySelector(".cdl-phase-chip")?.textContent?.replace(/\s+/gu, " ").trim() ?? "";
    const svg = document.querySelector('main.catalog-preview svg[role="img"]');
    if (!svg) return { 段, 枝数: 0, 名前数: 0, 題: [], 文字: [] };
    const 枠 = (el: Element) => el.getBoundingClientRect();
    const 枝数 = svg.querySelectorAll('path[data-cdl-role="mind-edge"]').length;
    const 字ら = Array.from(svg.querySelectorAll("text"));
    const 読む = (t: Element) => (t.textContent ?? "").trim();
    const 題 = 字ら.filter((t) => t.getAttribute("data-cdl-role") === "figure-title").map(読む);
    const 文字ら = 字ら.filter((t) => t.getAttribute("data-cdl-role") !== "figure-title");
    const 名前数 = 文字ら.filter((t) => t.getAttribute("data-cdl-role") !== "mind-node-subtitle").length;
    const 四角ら = Array.from(svg.querySelectorAll("rect")).map((r) => 枠(r));
    const 出 = 文字ら.map((t) => {
      const tb = 枠(t);
      const cx = tb.left + tb.width / 2;
      const cy = tb.top + tb.height / 2;
      let 選 = -1;
      四角ら.forEach((b, i) => {
        if (cx < b.left || cx > b.right || cy < b.top || cy > b.bottom) return;
        const 今 = 四角ら[選];
        if (選 < 0 || !今 || b.width * b.height < 今.width * 今.height) 選 = i;
      });
      const b = 四角ら[選];
      if (選 < 0 || !b) return { 内容: t.textContent ?? "", はみ出し: 0, 箱あり: false };
      const はみ出し = Math.max(0, b.left - tb.left, tb.right - b.right);
      return { 内容: t.textContent ?? "", はみ出し: Math.round(はみ出し * 10) / 10, 箱あり: true };
    });
    return { 段, 枝数, 名前数, 題, 文字: 出 };
  });
}

/** カタログのマインドマップを開く */
async function 開く(page: Page): Promise<void> {
  await page.goto("catalog/charts", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await 一覧の行(page, "マインドマップ", false).click();
  await page.waitForTimeout(500);
}

/**
 * その段の絵が落ち着くまで待って、落ち着いた時の測りを返す。
 *
 * 待つ条件に **期待する文字を入れない**。 入れると「期待どおりになるまで待つ」 になり、
 * 直っていない時は待ち受けで力尽きて、切り詰めやはみ出しの検査が 1 度も走らない。
 * 待つのは 4 つだけ。 段の札が合うこと、読みが 2 回続けて同じになること (動きが止まったこと)、
 * 枝の線が記法の枝の数だけ引かれたこと、名前が記法の箱の数だけ出たこと。
 * いずれも名前と補足を分けたかどうかとは無関係に成り立つ。
 */
async function 落ち着くまで待つ(page: Page, 段名: string): Promise<測り結果> {
  let 直前 = "";
  let 落着: 測り結果 | null = null;
  await expect
    .poll(
      async () => {
        const 今 = await 測る(page);
        const 鍵 = JSON.stringify(今.文字.map((x) => x.内容));
        const 同じ = 鍵 === 直前;
        直前 = 鍵;
        if (今.段.includes(段名) && 同じ && 今.枝数 === 枝の数 && 今.名前数 === 箱.length) {
          落着 = 今;
          return true;
        }
        return false;
      },
      { timeout: 30000, intervals: [250] },
    )
    .toBe(true);
  expect(落着, `段「${段名}」 で絵が落ち着かなかった`).not.toBeNull();
  return 落着!;
}

/** 見本の記法から段の名前を順に取り出す */
function 段を読む(記法: string): string[] {
  return 記法
    .split("\n")
    .map((x) => /^\s+- step: "([^"]+)"/u.exec(x)?.[1])
    .filter((x): x is string => !!x);
}

const 段の並び = 段を読む(sourceYaml__mindMap);

function 期待する文字(値: Map<string, string>): string[] {
  return 箱.flatMap((x) => [x.名前, 補足を組む(x.補足, 値)]);
}

test.describe("放射図の名前と補足が箱に収まる (#1332)", () => {
  test("見本の記法から箱と値と段を読めている", () => {
    // 以降の検査は記法から導いた期待値で判定する。 読めていないと空振りする
    expect(箱.length, "見本の記法から箱を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(初期値.size, "見本の記法から初期値を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(行き先.size, "見本の記法から動いた後の値を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(段の並び.length, "見本の記法から段を 1 つも読めていない (検査が空振りしている)").toBeGreaterThanOrEqual(2);
    for (const x of 箱) {
      expect(補足を組む(x.補足, 初期値), `補足の値が解決できていない: ${x.名前}`).not.toContain("{");
      expect(補足を組む(x.補足, 行き先), `補足の値が解決できていない: ${x.名前}`).not.toContain("{");
    }
  });

  for (const [番, 値, 見出し] of [
    [0, 初期値, "値が動く前"],
    [1, 行き先, "値が動いた後"],
  ] as const) {
    test(`${見出し} — 名前と補足がそのまま出る`, async ({ page }) => {
      await 開く(page);
      const 段 = 段の並び[番];
      // 上の `toBeGreaterThanOrEqual(2)` が先に落ちるので、ここへは 2 段以上ある時しか来ない
      expect(段, `段 ${番} を記法から読めていない (検査が空振りしている)`).toBeDefined();
      if (段 === undefined) return;
      const { 文字, 題 } = await 落ち着くまで待つ(page, 段);

      expect(文字.length, "図の文字を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
      // 題を役で外しただけでは「外した」 と「描かれなくなった」 を区別できない (#2728 と同じ形)
      expect(題, "図の題が 1 件だけ出ていない").toEqual(["図を速くする"]);
      expect(
        [...文字.map((x) => x.内容)].sort(),
        "図に出た文字が記法と食い違う (連結されているか、切られている)",
      ).toEqual([...期待する文字(値)].sort());
    });

    test(`${見出し} — 箱に収まる`, async ({ page }) => {
      await 開く(page);
      const 段 = 段の並び[番];
      expect(段, `段 ${番} を記法から読めていない (検査が空振りしている)`).toBeDefined();
      if (段 === undefined) return;
      const { 文字, 枝数, 名前数 } = await 落ち着くまで待つ(page, 段);

      expect(文字.length, "図の文字を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
      expect(枝数, "枝の線を記法の数だけ測れていない (検査が空振りしている)").toBe(枝の数);
      expect(名前数, "名前を記法の箱の数だけ測れていない (検査が空振りしている)").toBe(箱.length);
      expect(
        文字.filter((x) => x.箱あり).length,
        "どの文字も四角に収まっていない (検査が空振りしている)",
      ).toBe(文字.length);
      expect(
        文字.filter((x) => x.内容.includes(省略)).map((x) => x.内容),
        "切り詰められた文字がある",
      ).toEqual([]);
      // はみ出しは切り詰めと **同じ検査に置く**。 描画側は入りきらない文字を `…` で切って
      // から描くため、切り詰めを見る限りはみ出しは起きない (連結に戻す変異を当てた実測でも
      // 切り詰めだけが落ち、はみ出しは 0 件だった)。 2 つを分ける入力は組み立て側からは
      // 作れないので、別の検査として並べると落ちようのない検査が 1 件増えるだけになる。
      // ここに残すのは、描画側が「枠を超えない」 保証をやめた時に気付くため。
      expect(
        文字.filter((x) => x.はみ出し > 0.5).map((x) => `${x.内容} (${x.はみ出し}px)`),
        "箱からはみ出した文字がある",
      ).toEqual([]);
    });

  }
});
