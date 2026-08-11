/**
 * 薄い文字が明暗どちらでも同じくらい読めることの検証 (#1116)。
 *
 * 以前は明るい側だけ `.pen` の値 (`#8a857a`) のまま残り、 白地に対する対比が 3.67 しか
 * なかった。 暗い側は #1112 で `#77716a` から `#a8a199` へ持ち上げてあり 5.46 ある。
 * 同じ役割の文字が明暗で倍近く開いていた。
 *
 * ## 変数の値ではなく描かれた文字を測る
 *
 * `--d-text-muted` の値だけを見ると「変数は直したが参照側に届いていない」 形を通す。
 * 実際に描かれた要素の色と、 その要素が乗っている地を辿って測る。
 *
 * ## 測る対象が 0 件なら落とす
 *
 * 選択の仕方が実装とずれると、 何も確かめずに通る。 各画面で 1 件以上取れることを
 * 先に見る。
 */
import { test, expect } from "@playwright/test";

/** sRGB → 相対輝度 (WCAG)。 */
function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

const 対比 = (a: number[], b: number[]): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
};

/**
 * その画面で `--d-text-muted` が実際に当たっている文字を集め、 地との対比を返す。
 *
 * 地は透けている親を遡って辿る。 半透明の地は「透けている」 とみなして更に遡る
 * (合成せずに扱うと実際より明るい / 暗い地で測ることになる)。
 */
async function 薄い文字の対比(page: import("@playwright/test").Page): Promise<
  { 文: string; 色: number[]; 地: number[] }[]
> {
  return await page.evaluate(() => {
    const 数値 = (s: string): number[] | null => {
      const m = s.match(/[\d.]+/g);
      return m && m.length >= 3 ? m.slice(0, 3).map(Number) : null;
    };
    const 薄 = getComputedStyle(document.documentElement).getPropertyValue("--d-text-muted").trim();
    // 変数を解決した実 rgb を得る (hex のままでは computed color と比べられない)
    const probe = document.createElement("span");
    probe.style.color = 薄;
    document.body.appendChild(probe);
    const 薄rgb = getComputedStyle(probe).color;
    probe.remove();
    const 目標 = 数値(薄rgb);
    if (!目標) return [];

    const out: { 文: string; 色: number[]; 地: number[] }[] = [];
    for (const e of document.querySelectorAll("*")) {
      const 直 = [...e.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent?.trim())
        .map((n) => n.textContent!.trim())
        .join("");
      if (!直) continue;
      const c = getComputedStyle(e);
      const box = e.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      if (c.visibility === "hidden" || c.display === "none" || Number(c.opacity) < 0.15) continue;
      const 色 = 数値(c.color);
      if (!色 || 色.some((v, i) => v !== 目標[i])) continue;

      let 地: number[] | null = null;
      let n: Element | null = e;
      while (n && n !== document.documentElement) {
        const v = getComputedStyle(n).backgroundColor;
        const a = v.match(/[\d.]+/g);
        // 不透明な地だけを採る。 半透明は透けているので更に遡る
        if (a && (a.length < 4 || Number(a[3]) > 0.9)) {
          地 = a.slice(0, 3).map(Number);
          break;
        }
        n = n.parentElement;
      }
      if (!地) 地 = 数値(getComputedStyle(document.documentElement).backgroundColor);
      if (!地) continue;
      out.push({ 文: 直.slice(0, 24), 色, 地 });
    }
    return out;
  });
}

async function 開く(
  page: import("@playwright/test").Page,
  path: string,
   暗い: boolean,
): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate((d) => {
    document.documentElement.classList.toggle("dark", d);
  }, 暗い);
  await page.waitForTimeout(1200);
}

/** 薄い文字が出る画面。 `/catalog/presets` は一覧の識別子と注記、 `/contribute` は経路表示。 */
const 画面 = ["/catalog/presets", "/contribute", "/docs"] as const;

for (const 暗い of [false, true]) {
  const 名 = 暗い ? "暗い" : "明るい";
  test(`${名}画面で薄い文字が地の上で読める`, async ({ page }) => {
    for (const path of 画面) {
      await 開く(page, path, 暗い);
      const 件 = await 薄い文字の対比(page);
      expect(件.length, `${path} で薄い文字を 1 つも測れていない (選択子が実装とずれた)`).toBeGreaterThan(0);
      for (const { 文, 色, 地 } of 件) {
        const v = 対比(色, 地);
        expect(
          v,
          `${名}画面 ${path} の「${文}」 が地に溶ける (文字 ${色} / 地 ${地} / 対比 ${v.toFixed(2)})`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
}

test("薄い文字の読みやすさが明暗で揃っている", async ({ page }) => {
  // 本 Issue の中身。 片側だけを直しても落ちないと、 同じ非対称がまた作られる。
  //
  // **地が明暗で違うので色そのものは比べられない**。 地に対する対比で比べる。
  const 測る = async (暗い: boolean): Promise<number> => {
    await 開く(page, "/catalog/presets", 暗い);
    const 件 = await 薄い文字の対比(page);
    expect(件.length, `${暗い ? "暗い" : "明るい"}側で薄い文字を測れていない`).toBeGreaterThan(0);
    // 面の上に乗るものが多数派なので中央値を採る (端の 1 件に引きずられない)
    const v = 件.map(({ 色, 地 }) => 対比(色, 地)).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)]!;
  };
  const 明 = await 測る(false);
  const 暗 = await 測る(true);
  expect(
    Math.abs(明 - 暗),
    `薄い文字の読みやすさが明暗で開いている (明 ${明.toFixed(2)} / 暗 ${暗.toFixed(2)})`,
  ).toBeLessThanOrEqual(1.5);
});
