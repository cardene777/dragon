import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect, type Page } from "@playwright/test";
import { THEMES, type DslTheme } from "@cardenelabs/dragon";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { 記法をURLに載せる } from "./box-and-edge-figure";
import { stopDiagram, withTheme } from "./helpers/fixed-theme-checks";

/**
 * 図に書いた意匠は、サイトの意匠に関わらず同じに描かれる (#2962)。
 *
 * サイトの見た目は意匠ごとの表 (`site-theme.css`) が画面の変数 (`--d-*`) を替えて決める。
 * 図の値の表がその変数を読むと、図とサイトの意匠が違う時に画面の色と字体が図へ漏れる。
 *
 * 確かめるのは 2 つ。
 *
 * 1. `theme: blueprint` を書いた図を `?theme=` の 7 意匠で開き、地・枠・字の色と字体が全部同じ
 * 2. サイトの画面の変数を全部でたらめな値に替えても、図は 1 つも変わらない
 *    (7 意匠の表は今は明暗 2 組の値を写しただけなので、1 だけでは字体の漏れを捕まえられない)
 *
 * 比べるのは舞台の中の全要素の計算後の値。 段が進むと光る箱が替わるので、
 * 光り方が同じ要素どうしだけを比べる (比べた件数は落ちた文に出す)。
 */

const 比べる値 = [
  "fill",
  "stroke",
  "stroke-width",
  "color",
  "background-color",
  "background-image",
  "font-family",
  "font-weight",
  "font-size",
] as const;

type 指紋 = Map<string, string>;

const er = EDITOR_SAMPLES.find((sample) => sample.slug === "er");
if (!er) throw new Error("editor-samples に er の見本が無い");
const 書いた意匠: DslTheme = "blueprint";
const 記法 = withTheme(er.code, 書いた意匠);

/** サイトの表が宣言する画面の変数の名前。 表から導く */
const 画面の変数 = (() => {
  const css = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles/site-theme.css"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");
  return [...new Set([...css.matchAll(/(--d-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!))];
})();

async function 開く(page: Page, サイト: DslTheme): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`editor?theme=${サイト}#s=${記法をURLに載せる(記法)}`);
  await page.reload();
  await page.waitForSelector(`svg[data-cdl-stage][data-cdl-palette="${書いた意匠}"]`, { timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await stopDiagram(page);
}

async function 指紋を取る(page: Page): Promise<指紋> {
  const 行 = await page
    .locator(`svg[data-cdl-stage][data-cdl-palette="${書いた意匠}"]`)
    .evaluate((stage, 名前) => {
      const 道 = (el: Element): string => {
        const 区間: string[] = [];
        for (let n: Element | null = el; n && n !== stage.parentElement; n = n.parentElement) {
          const 親 = n.parentElement;
          const 番 = 親 ? [...親.children].indexOf(n) : 0;
          区間.unshift(`${n.tagName.toLowerCase()}[${番}]`);
        }
        const 光 = el.closest("[data-cdl-active]")?.getAttribute("data-cdl-active") ?? "-";
        return `${区間.join("/")} 光=${光}`;
      };
      return [stage, ...stage.querySelectorAll("*")].map((el) => {
        const style = getComputedStyle(el);
        return [道(el), 名前.map((n) => `${n}=${style.getPropertyValue(n)}`).join(" ; ")] as const;
      });
    }, [...比べる値]);
  return new Map(行);
}

function 食い違い(基準: 指紋, 比べる: 指紋): { 共通: number; ずれ: string[] } {
  const ずれ: string[] = [];
  let 共通 = 0;
  for (const [道, 値] of 基準) {
    const 相手 = 比べる.get(道);
    if (相手 === undefined) continue;
    共通 += 1;
    if (相手 !== 値) ずれ.push(`${道}\n  基準 ${値}\n  比較 ${相手}`);
  }
  return { 共通, ずれ };
}

test.describe("図に書いた意匠はサイトの意匠に依らない (#2962)", () => {
  test.describe.configure({ timeout: 180_000 });

  test(`\`theme: ${書いた意匠}\` の図が \`?theme=\` の 7 意匠で同じに描かれる`, async ({ page }) => {
    await 開く(page, "letterpress");
    const 基準 = await 指紋を取る(page);
    expect(基準.size, "舞台の要素を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(10);

    const 落ちた: string[] = [];
    for (const サイト of THEMES) {
      await 開く(page, サイト);
      const { 共通, ずれ } = 食い違い(基準, await 指紋を取る(page));
      console.log(`サイト ${サイト}: 比べた要素 ${共通} / ${基準.size}、食い違い ${ずれ.length} 件`);
      expect(共通, `${サイト} で比べられた要素が半分に満たない`).toBeGreaterThan(基準.size / 2);
      落ちた.push(...ずれ.slice(0, 5).map((d) => `${サイト}: ${d}`));
    }
    expect(落ちた).toEqual([]);
  });

  test("サイトの画面の変数を全部替えても、図は 1 つも変わらない", async ({ page }) => {
    expect(画面の変数.length, "表から画面の変数を導けていない (検査が空振りしている)").toBeGreaterThan(0);
    await 開く(page, "letterpress");
    const 基準 = await 指紋を取る(page);

    // 色は紫、字体は飾り字、それ以外は読めない値にする = 図がどれか 1 つでも読めば値が変わる
    const 替える = 画面の変数
      .map((名前) => {
        const 値 = /^--d-(display|body|mono)$/.test(名前)
          ? "fantasy"
          : /opacity|^--d-r-|gutter|topbar|tap-pad/.test(名前)
            ? "0.37px"
            : "#ff00ff";
        return `${名前}: ${値} !important;`;
      })
      .join("\n");
    await page.addStyleTag({ content: `html[data-site-theme] {\n${替える}\n}` });
    await page.waitForTimeout(100);
    const 替えた = await 指紋を取る(page);

    const { 共通, ずれ } = 食い違い(基準, 替えた);
    console.log(`画面の変数 ${画面の変数.length} 個を替えた: 比べた要素 ${共通} / ${基準.size}、食い違い ${ずれ.length} 件`);
    expect(共通, "比べた要素が基準と同じ数ではない (止めた段がずれた)").toBe(基準.size);
    expect(ずれ.slice(0, 10)).toEqual([]);
  });

  test("陽性対照: 舞台の外から図の値を替えると食い違いとして出る", async ({ page }) => {
    await 開く(page, "letterpress");
    const 基準 = await 指紋を取る(page);
    await page.addStyleTag({
      content: `svg[data-cdl-stage] [data-cdl-role="node-label"] { font-family: fantasy !important; }`,
    });
    await page.waitForTimeout(100);
    const { ずれ } = 食い違い(基準, await 指紋を取る(page));
    expect(ずれ.length, "字体を替えても食い違いが出ない (比べ方が値を見ていない)").toBeGreaterThan(0);
  });
});
