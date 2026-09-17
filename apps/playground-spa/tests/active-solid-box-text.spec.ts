/**
 * 段で光らせた墨のベタの箱の字が読めること (#2137)。
 *
 * `service` の箱は描画部品が **墨のベタに紙の色の字で抜く** 見せ方 (`data-cdl-look="solid"`) で描く。
 * 光らせた箱は `cdl-theme.css` が地を橙の面に替える (#1143) が、その規則は墨のベタの箱の地も
 * 替え、字は紙の色のまま残していた。 **面と字がほぼ同じ色になり、題も説明も消えていた**
 * (カタログの 9 枚。 C4 の見本を段の途中で撮って見つけた)。
 *
 * 光った箱の字を測る `editor-phase-chrome.spec.ts` は既定の見せ方の箱 (`card`) だけを開いており、
 * 墨のベタの箱を 1 度も測っていなかった。
 *
 * ## 何を見るか
 *
 * | 箱 | 見ること |
 * |---|---|
 * | 光った墨のベタ | 題と面の対比 4.61 以上 / 説明と面の対比 4.5 以上 |
 * | 光っていない墨のベタ | 題と面の対比 4.61 以上、面が光った箱の面と違う (光らせる規則が漏れていない) |
 *
 * **明暗の両方で見る**。 光った面の色 (`--d-accent-face`) は明で白、暗で焦げ茶と向きが逆で、
 * 片方だけ見ていると気付けない。
 */
import { test, expect, type Page } from "@playwright/test";

/**
 * 墨のベタの箱を 4 つ並べ、1 段目で A と B、2 段目で B と C を光らせる。
 *
 * **どの瞬間にも光った箱と光っていない箱の両方がある** = B はどちらの段でも光り、D はどちらの段でも
 * 光らない。 段が進む途中で測っても対象が消えない。
 */
const 記法 = `title: "墨のベタの箱を光らせる"
type: flow
reveal: all

actors:
  - A: { kind: service, subtitle: "受け付ける" }
  - B: { kind: service, subtitle: "組み立てる" }
  - C: { kind: service, subtitle: "書き込む" }
  - D: { kind: service, subtitle: "知らせる" }

flow:
  - A -> B: "渡す"
  - B -> C: "書く"
  - C -> D: "知らせる"

animation:
  - step: "1 受ける" 1.2s
    focus: [A, B]
  - step: "2 書く" 1.2s
    focus: [B, C]
`;

/** 共有 URL の形。 `CdlEditor` の `decodeShare` と対になる */
function 共有(src: string): string {
  return `#s=${Buffer.from(unescape(encodeURIComponent(src)), "binary").toString("base64")}`;
}

async function 開く(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`editor${共有(記法)}`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector(".v4-editor-stage svg", { timeout: 30000 });
  // 光った箱と光っていない箱の両方が出るまで待つ
  await page.waitForFunction(
    () => {
      const 箱 = [...document.querySelectorAll('[data-cdl-active]')].filter(
        (g) => g.querySelector('[data-cdl-role="node-body"][data-cdl-look="solid"]') !== null,
      );
      return (
        箱.some((g) => g.getAttribute("data-cdl-active") === "true") &&
        箱.some((g) => g.getAttribute("data-cdl-active") === "false")
      );
    },
    undefined,
    { timeout: 20000 },
  );
}

type 色 = { 面: string; 題: string; 説明: string };

/** 光った箱と光っていない箱を 1 つずつ選び、面と字の色を読む */
async function 測る(page: Page): Promise<{ 光った: 色 | null; 光らない: 色 | null }> {
  return await page.evaluate(() => {
    const 読む = (active: string) => {
      const g = [...document.querySelectorAll(`[data-cdl-active="${active}"]`)].find(
        (e) =>
          e.querySelector('[data-cdl-role="node-body"][data-cdl-look="solid"]') !== null &&
          e.querySelector('[data-cdl-role="node-label"]') !== null,
      );
      const body = g?.querySelector('[data-cdl-role="node-body"][data-cdl-look="solid"]');
      // 面は箱の形そのもの (`rect`)。 包む `g` の塗りは子へ届く前に上書きされることがある
      const 形 = body?.querySelector(":scope > rect");
      const 題 = body?.querySelector('[data-cdl-role="node-label"]');
      const 説明 = [...(body?.querySelectorAll("text") ?? [])].find(
        (t) => !t.hasAttribute("data-cdl-role") && (t.textContent ?? "").length > 0,
      );
      if (!形 || !題 || !説明) return null;
      return {
        面: getComputedStyle(形).fill,
        題: getComputedStyle(題).fill,
        説明: getComputedStyle(説明).fill,
      };
    };
    return { 光った: 読む("true"), 光らない: 読む("false") };
  });
}

/** WCAG の対比比。 `rgb(...)` の形だけを受ける */
function 対比(a: string, b: string): number {
  const L = (c: string): number => {
    const m = /rgba?\(([^)]+)\)/u.exec(c);
    if (m === null) throw new Error(`色を読めない: ${c}`);
    const [r, g, bb] = (m[1] ?? "").split(",").map((v) => Number(v.trim()) / 255);
    const 直線 = (v: number): number => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * 直線(r!) + 0.7152 * 直線(g!) + 0.0722 * 直線(bb!);
  };
  const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

test.describe("段で光らせた墨のベタの箱の字 (#2137)", () => {
  for (const 明暗 of ["light", "dark"] as const) {
    test(`光った箱の字が面の上で読める (${明暗})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 明暗 });
      await 開く(page);
      const { 光った } = await 測る(page);
      expect(光った, "光った墨のベタの箱を測れていない").not.toBeNull();
      // 閾値は `editor-phase-chrome.spec.ts` が光った箱の文字に課しているものと同じ 4.61
      expect(対比(光った!.面, 光った!.題), `題が面に沈む (面 ${光った!.面} / 題 ${光った!.題})`).toBeGreaterThanOrEqual(4.61);
      expect(対比(光った!.面, 光った!.説明), `説明が面に沈む (面 ${光った!.面} / 説明 ${光った!.説明})`).toBeGreaterThanOrEqual(4.5);
    });

    test(`光っていない箱は墨のベタのまま (${明暗})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 明暗 });
      await 開く(page);
      const { 光った, 光らない } = await 測る(page);
      expect(光らない, "光っていない墨のベタの箱を測れていない").not.toBeNull();
      expect(対比(光らない!.面, 光らない!.題), "光っていない箱の題が面に沈む").toBeGreaterThanOrEqual(4.61);
      expect(光らない!.面, "光らせる面の色が光っていない箱に漏れている").not.toBe(光った!.面);
    });
  }
});
